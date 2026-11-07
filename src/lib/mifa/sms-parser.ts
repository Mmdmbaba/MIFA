// پارسر قاعده‌محور پیامک‌های بانکی ایران — بدون هیچ API پولی
// پشتیبانی از الگوهای رایج: خرج کارت، برداشت، خرید، واریز، پرداخت قبض و ...
import { toLatinDigits, stripSeparators } from "./format"
import { autoCategory } from "./categories"
import { toGregorian } from "jalaali-js"
import { monthKey } from "./jalali"

export interface ParsedSms {
  type: "expense" | "income"
  amount: number // تومان
  title: string | null
  category: string
  date: string // ISO
  raw: string
  currencyHint: "toman" | "rial"
}

const INCOME_KEYWORDS = ["واریز", "دریافتی", "سود سپرده", "سود", "افزایش موجودی", "دریافت"]
const SPEND_KEYWORDS = ["خرج کارت", "خرید", "برداشت", "پرداخت", "کارمزد", "کسر", "خرج"]
// فقط کلماتی که «قبل از مبلغ» یعنی خودِ عدد تراکنش نیستند
const SKIP_BEFORE = ["موجودی", "رمز", "شبا", "شماره پیگیری", "خطای", "CVV"]
const CARD_TAIL_RE = /^\*+/ // عددی که بلافاصله بعدش * میاد = رقم کارت ماسک‌شده
const JALALI_DATE_RE = /([0-9۰-۹]{4})\s*[\/\-.]\s*([0-9۰-۹]{1,2})\s*[\/\-.]\s*([0-9۰-۹]{1,2})/

interface AmountMatch {
  value: number
  index: number
  length: number
  contextBefore: string
  after: string
}

/** استخراج همه اعداد احتمالاً مبلغ از یک خط */
function findAmounts(line: string): AmountMatch[] {
  const latin = toLatinDigits(line)
  const re = /[0-9][0-9\u066C\u060C,]\u066C?[0-9]{3}(?:\u066C?[0-9]{3})*/g
  // الگوی بالا: عدد با جداکننده هزارگان؛ سپس اعداد بزرگ بدون جداکننده را هم می‌گیریم
  const matches: AmountMatch[] = []
  const seen = new Set<string>()

  // ۱) اعداد با جداکننده (قوی‌ترین سیگنال)
  for (const m of latin.matchAll(/[0-9]{1,3}(?:[,،\u066C][0-9]{3})+/g)) {
    const clean = stripSeparators(m[0])
    const idx = m.index ?? 0
    matches.push({ value: Number(clean), index: idx, length: m[0].length, contextBefore: latin.slice(Math.max(0, idx - 18), idx), after: latin.slice(idx + m[0].length, idx + m[0].length + 10) })
    seen.add(clean)
  }
  // ۲) اعداد بدون جداکننده با طول ۵+ (احتمال مبلغ)
  for (const m of latin.matchAll(/(?<![0-9])[0-9]{5,}(?![0-9])/g)) {
    const clean = m[0]
    if (!seen.has(clean)) {
      const idx = m.index ?? 0
      matches.push({ value: Number(clean), index: idx, length: clean.length, contextBefore: latin.slice(Math.max(0, idx - 18), idx), after: latin.slice(idx + clean.length, idx + clean.length + 10) })
      seen.add(clean)
    }
  }
  // ۳) اعداد با «مبلغ» جلویشان حتی اگر کوتاه باشند
  for (const m of latin.matchAll(/مبلغ\s*[:=]?\s*([0-9]{3,})/g)) {
    const clean = m[1]
    if (!seen.has(clean)) {
      const idx = (m.index ?? 0) + m[0].indexOf(m[1])
      matches.push({ value: Number(clean), index: idx, length: clean.length, contextBefore: "مبلغ", after: latin.slice(idx + clean.length, idx + clean.length + 10) })
      seen.add(clean)
    }
  }
  return matches.sort((a, b) => a.index - b.index)
}

function isValidTransactionAmount(m: AmountMatch): boolean {
  // شماره کارت/شبا: بلافاصله ستاره یا طول غیرعادی
  if (CARD_TAIL_RE.test(m.after)) return false
  if (m.length >= 12) return false
  const ctx = m.contextBefore
  // کلماتی که قبلشان عدد مال تراکنش نیست (موجودی، رمز و ...)
  if (SKIP_BEFORE.some((k) => ctx.includes(k))) return false
  // علامت صریح «مبلغ» هر کلمه دیگری را مغلوب می‌کند
  if (ctx.includes("مبلغ")) return true
  // بدون مبلغ: فقط مبالغ منطقی
  return m.value >= 5000
}

function detectDate(line: string, fallback: Date): Date {
  const latin = toLatinDigits(line)
  const m = latin.match(JALALI_DATE_RE)
  if (m) {
    const jy = Number(m[1])
    const jm = Number(m[2])
    const jd = Number(m[3])
    try {
      if (jy >= 1300 && jy <= 1500 && jm >= 1 && jm <= 12 && jd >= 1 && jd <= 31) {
        const g = toGregorian(jy, jm, jd)
        // اگر ساعت هم بود اضافه کن؛ در غیر این صورت ظهر همان روز
        return new Date(g.gy, g.gm - 1, g.gd, 12, 0, 0)
      }
    } catch {
      /* نادیده */
    }
  }
  return fallback
}

function extractTitle(line: string, type: "expense" | "income"): string | null {
  // تلاش برای گرفتن نام فروشگاه/شرح بعد از «از» یا «بابت»
  const latin = toLatinDigits(line)
  // بخش موجودی/رمز و اینا اطلاعاتی نیست — قبل از هر چیز دورش می‌ریزیم
  const core = latin.split(/موجودی|رمز|شبا|خطای|شماره پیگیری/)[0]
  const fromMatch = core.match(/(?:از|بابت)\s+([^،,؛;:\d\u066C\-—]{3,40})/)
  if (fromMatch) {
    const t = fromMatch[1].replace(/[\s\-—:]+$/g, "").trim()
    // کلمات عمومی مثل «کارت» عنوان خوبی نیستند
    if (t && !["کارت", "حساب", "شما"].includes(t) && !SKIP_BEFORE.some((k) => t.includes(k))) {
      return t
    }
  }
  const cleaned = core
    .replace(/مبلغ|ریال|تومان|خرید|برداشت|خرج کارت|واریز|پرداخت/g, " ")
    .replace(/[0-9\u066C,،:/.\-—]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  if (cleaned.length >= 3) return cleaned.slice(0, 60)
  return type === "expense" ? "خرج" : "درآمد"
}

/**
 * پارس متن چند پیامک بانکی → لیست تراکنش پیش‌نویس
 * خطوط بدون مبلغ معتبر (مثل پیامک موجودی یا OTP) نادیده گرفته می‌شوند
 */
export function parseSmsText(text: string): ParsedSms[] {
  const now = new Date()
  const lines = text
    .split(/\r?\n|(?=خرج کارت)|(?=واریز)|(?=برداشت)/g)
    .map((l) => l.trim())
    .filter((l) => l.length >= 5)

  const results: ParsedSms[] = []
  const seen = new Set<string>()

  for (const line of lines) {
    const latin = toLatinDigits(line)
    const amounts = findAmounts(line).filter(isValidTransactionAmount)
    if (amounts.length === 0) continue

    const isIncome = INCOME_KEYWORDS.some((k) => latin.includes(k))
    const type: "expense" | "income" = isIncome ? "income" : "expense"

    const hasToman = /تومان/.test(latin)
    const hasRial = /ریال/.test(latin)
    const currencyHint: "toman" | "rial" = hasToman && !hasRial ? "toman" : "rial"
    // پیامک‌های بانکی ایران پیش‌فرض ریال هستند؛ تومان = ÷۱۰
    const rawAmount = amounts[0].value
    const amount = currencyHint === "rial" ? Math.round(rawAmount / 10) : rawAmount
    if (amount <= 0) continue

    const date = detectDate(line, now)
    const title = extractTitle(line, type)
    const category = type === "income" ? "savings" : autoCategory(title ?? "")

    const dedupeKey = `${type}|${amount}|${monthKey(date)}|${date.getDate()}`
    if (seen.has(dedupeKey)) continue
    seen.add(dedupeKey)

    results.push({
      type,
      amount,
      title,
      category,
      date: date.toISOString(),
      raw: line.slice(0, 160),
      currencyHint,
    })
  }

  return results
}
