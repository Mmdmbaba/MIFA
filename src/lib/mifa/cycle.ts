// موتور «دوره مالی» MIFA — ماه مالی کاربر از هر تاریخ جلالی‌ای که بخواد شروع می‌شه
// مثلاً ۱ آذر (حتی اگر در آینده باشد)، روز واریز حقوق، یا هر روز دیگر از تقویم.
//
// قواعد:
//  • دورۀ اول از «تاریخ شروع برنامه» (firstCycleStart) شروع می‌شود و روز قبل از
//    لنگر بعدی تمام می‌شود؛ اگر تاریخ شروع دقیقاً روی لنگر باشد، دورۀ اول کامل است.
//  • اگر تاریخ شروع در آینده باشد، امروز «پیش از شروع برنامه» است — دورهٔ اول
//    نمایش داده می‌شود ولی هنوز فعال نیست (notStarted).
//  • دوره‌های بعدی روی روز لنگر (روز ماهِ تاریخ شروع) تکرار می‌شوند.
//  • اگر firstCycleStart نباشد، مبنای دورۀ اول = روز onboarding (رفتار قدیمی).
//  • کلید دوره مثل "1405-09-01" = تاریخ جلالیِ روز شروع دوره.
//
// همه توابع به‌جای آرگومان‌های پراکنده یک PlanCtx می‌گیرند تا دیگر آرگومانی جا نیفتد.
import { toJalaali, toGregorian, jalaaliMonthLength } from "jalaali-js"
import { JALALI_MONTHS, monthLabel } from "./jalali"
import { toPersianDigits } from "./format"

export interface JDate {
  jy: number
  jm: number
  jd: number
}

/** زمینه برنامه — از پروفایل ساخته می‌شود و به همه توابع دوره پاس داده می‌شود */
export interface PlanCtx {
  /** روز لنگر دوره در تقویم جلالی (۱ تا ۳۱) */
  startDay: number
  /** تاریخ onboarding — مبنای پیش‌فرض (قدیمی) دورۀ اول */
  onboardedAt?: string
  /** تاریخ شروع برنامه، کلید جلالی مثل "1405-09-01" — اولویتش از onboardedAt بیشتر است */
  firstCycleStart?: string
}

/** ساخت ctx از پروفایل (یا هر شیء شبیه پروفایل) */
export function planCtxFrom(
  p?: { cycleAnchorDay?: number; onboardedAt?: string; firstCycleStart?: string } | null
): PlanCtx {
  return {
    startDay: clampDay(1404, 1, Math.round(p?.cycleAnchorDay ?? 1)),
    onboardedAt: p?.onboardedAt,
    firstCycleStart: p?.firstCycleStart,
  }
}

/** روز startDay اگر از طول ماه بیرون بزنه، به آخر ماه گیره می‌کنه */
export function clampDay(jy: number, jm: number, day: number): number {
  return Math.min(Math.max(1, Math.round(day)), jalaaliMonthLength(jy, jm))
}

export function jalaliOf(date: Date): JDate {
  const { jy, jm, jd } = toJalaali(date)
  return { jy, jm, jd }
}

/** ماه قبل/بعد در تقویم جلالی */
export function shiftJalaliMonth(jy: number, jm: number, delta: number): { jy: number; jm: number } {
  const total = jy * 12 + (jm - 1) + delta
  return { jy: Math.floor(total / 12), jm: (total % 12) + 1 }
}

function gregorianOfJ(j: JDate): Date {
  const g = toGregorian(j.jy, j.jm, j.jd)
  return new Date(g.gy, g.gm - 1, g.gd, 0, 0, 0, 0)
}

/** نیمه‌شب محلی یک تاریخ */
export function dayStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function jToTime(j: JDate): number {
  return gregorianOfJ(j).getTime()
}

export function parseCycleKey(key: string): JDate {
  const [jy, jm, jd] = key.split("-").map(Number)
  return { jy, jm, jd }
}

export function cycleKeyOfJalali(j: JDate): string {
  return `${j.jy}-${String(j.jm).padStart(2, "0")}-${String(j.jd).padStart(2, "0")}`
}

/** تاریخ شروع دورۀ اول: انتخاب کاربر، وگرنه روز onboarding، وگرنه null */
export function firstCycleStartOf(ctx: PlanCtx): JDate | null {
  if (ctx.firstCycleStart) return parseCycleKey(ctx.firstCycleStart)
  if (ctx.onboardedAt) return jalaliOf(dayStart(new Date(ctx.onboardedAt)))
  return null
}

/** کلید دورۀ اول — یا null اگر برنامه‌ای تعریف نشده */
export function firstCycleKeyOf(ctx: PlanCtx): string | null {
  const fs = firstCycleStartOf(ctx)
  return fs ? cycleKeyOfJalali(fs) : null
}

/** اولین روز لنگر «بعد از» روز j — اگر j قبل از لنگرِ ماهش باشد همان ماه، وگرنه لنگر ماه بعد */
export function nextAnchorAfter(j: JDate, anchor: number): JDate {
  const clamped = clampDay(j.jy, j.jm, anchor)
  if (j.jd < clamped) return { jy: j.jy, jm: j.jm, jd: clamped }
  const n = shiftJalaliMonth(j.jy, j.jm, 1)
  return { jy: n.jy, jm: n.jm, jd: clampDay(n.jy, n.jm, anchor) }
}

/** آیا این کلید، دورۀ اول (از تاریخ شروع برنامه) است؟ */
export function isFirstCycle(key: string, ctx: PlanCtx): boolean {
  const fk = firstCycleKeyOf(ctx)
  return fk !== null && key === fk
}

/** شروع دوره با قاعده استاندارد لنگر (بدون در نظر گرفتن دورۀ اول) */
function cycleStartOfStandard(date: Date, startDay: number): JDate {
  const { jy, jm, jd } = jalaliOf(date)
  if (jd >= clampDay(jy, jm, startDay)) {
    return { jy, jm, jd: clampDay(jy, jm, startDay) }
  }
  const prev = shiftJalaliMonth(jy, jm, -1)
  return { jy: prev.jy, jm: prev.jm, jd: clampDay(prev.jy, prev.jm, startDay) }
}

/**
 * شروع دوره‌ای که این تاریخ داخلش قرار می‌گیره.
 * تاریخ‌های قبل از «تاریخ شروع برنامه» هم به دورۀ اول (آینده) می‌روند —
 * این حالت pre-plan است و cycleFacts با notStarted علامتش می‌زند.
 */
export function cycleStartOf(date: Date, ctx: PlanCtx): JDate {
  const d = dayStart(date)
  const fs = firstCycleStartOf(ctx)
  if (fs) {
    const s1 = nextAnchorAfter(fs, ctx.startDay)
    if (d.getTime() < jToTime(s1)) return fs
  }
  return cycleStartOfStandard(d, ctx.startDay)
}

/** کلید دورهٔ یک تاریخ */
export function cycleKeyOf(date: Date, ctx: PlanCtx): string {
  return cycleKeyOfJalali(cycleStartOf(date, ctx))
}

/** کلید دورهٔ امروز */
export function currentCycleKey(ctx: PlanCtx): string {
  return cycleKeyOf(new Date(), ctx)
}

/** تاریخ شروع (میلادی، نیمه‌شب) */
export function cycleStartDate(key: string): Date {
  return gregorianOfJ(parseCycleKey(key))
}

/** پایان دوره (انحصاری) */
export function cycleEndDate(key: string, ctx: PlanCtx): Date {
  if (isFirstCycle(key, ctx)) {
    const fs = parseCycleKey(key)
    return gregorianOfJ(nextAnchorAfter(fs, ctx.startDay))
  }
  const { jy, jm } = parseCycleKey(key)
  const next = shiftJalaliMonth(jy, jm, 1)
  return gregorianOfJ({ jy: next.jy, jm: next.jm, jd: clampDay(next.jy, next.jm, ctx.startDay) })
}

export function cycleRange(key: string, ctx: PlanCtx): { start: Date; end: Date } {
  return { start: cycleStartDate(key), end: cycleEndDate(key, ctx) }
}

/** طول دوره به روز */
export function daysInCycle(key: string, ctx: PlanCtx): number {
  const { start, end } = cycleRange(key, ctx)
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000))
}

/** چندمین روز دوره برای یک تاریخ (۱-مبنا)؛ خارج دوره → null */
export function cycleDayOf(date: Date, key: string, ctx: PlanCtx): number | null {
  const start = cycleStartDate(key)
  const end = cycleEndDate(key, ctx)
  const d = dayStart(date)
  const diff = Math.round((d.getTime() - start.getTime()) / 86_400_000)
  if (diff >= 0 && d.getTime() < end.getTime()) return diff + 1
  return null
}

/** روزهای باقی‌مانده دوره (شامل امروز)؛ دورهٔ آینده/هنوز شروع‌نشده = کل طول، دورهٔ گذشته = ۰ */
export function daysLeftInCycle(key: string, ctx: PlanCtx): number {
  const today = dayStart(new Date())
  const total = daysInCycle(key, ctx)
  const cur = currentCycleKey(ctx)
  if (key === cur) {
    if (today.getTime() < cycleStartDate(key).getTime()) return total // pre-plan
    const day = cycleDayOf(today, key, ctx) ?? 1
    return Math.max(1, total - day + 1)
  }
  return key > cur ? total : 0
}

/**
 * کلید دوره قبل/بعد — اگر از اولین دوره عبور کنیم null برمی‌گردد.
 * دورهٔ قبل از «دومین دوره» دقیقاً دورۀ اول است (نه یک ماه شبح‌وار قبل از آن).
 */
export function shiftCycleKey(key: string, delta: number, ctx: PlanCtx): string | null {
  if (delta === 0) return key
  if (delta > 0) {
    if (isFirstCycle(key, ctx)) {
      const end = cycleEndDate(key, ctx)
      return cycleKeyOf(end, ctx)
    }
    const { jy, jm, jd } = parseCycleKey(key)
    const next = shiftJalaliMonth(jy, jm, delta)
    return cycleKeyOfJalali({ jy: next.jy, jm: next.jm, jd: clampDay(next.jy, next.jm, jd) })
  }
  // دوره قبل
  if (isFirstCycle(key, ctx)) return null
  const fk = firstCycleKeyOf(ctx)
  if (fk) {
    const secondKey = cycleKeyOf(cycleEndDate(fk, ctx), ctx)
    if (key === secondKey) return fk
    if (key < secondKey) return null // محض احتیاط — جایی قبل از دورۀ اول دوره‌ای وجود ندارد
  }
  const { jy, jm, jd } = parseCycleKey(key)
  const prev = shiftJalaliMonth(jy, jm, -1)
  return cycleKeyOfJalali({ jy: prev.jy, jm: prev.jm, jd: clampDay(prev.jy, prev.jm, jd) })
}

/**
 * طول دورهٔ «نامزد» کامل — برای کسری کردن بودجهٔ دورۀ اولِ ناقص.
 * برای دورۀ اول فقط وقتی «ناقص» است (شروع وسط ماه، رفتار قدیمی) مبنای کسری
 * طول دورۀ استانداردِ همان ماهِ شروع است؛ دورۀ اولِ کامل (مثلاً شروع از ۱ آذر
 * یا ۱ اسفند) دقیقاً به طول خودش حساب می‌شود — وگرنه اختلاف طول ماه‌ها
 * (مثلاً اسفند ۲۹ روز در برابر فروردین ۳۱ روز) یک کسری وهمیِ ~۶٪ در بودجه،
 * سقف روزانه و «پس‌انداز این دوره» ایجاد می‌کرد و عددی بی‌ربط نشان می‌داد.
 * برای بقیه دوره‌ها = طول خود دوره.
 */
export function nominalCycleDays(key: string, ctx: PlanCtx): number {
  if (isFirstCycle(key, ctx) && !firstCycleIsFull(ctx)) {
    const fs = parseCycleKey(key)
    const stdKey = cycleKeyOfJalali({ jy: fs.jy, jm: fs.jm, jd: clampDay(fs.jy, fs.jm, ctx.startDay) })
    return daysInCycle(stdKey, ctx)
  }
  return daysInCycle(key, ctx)
}

/** آیا دورۀ اول دقیقاً روی روز لنگر شروع می‌شود (یعنی کامل است)؟ */
export function firstCycleIsFull(ctx: PlanCtx): boolean {
  const fs = firstCycleStartOf(ctx)
  if (!fs) return true
  return fs.jd === clampDay(fs.jy, fs.jm, ctx.startDay)
}

/** عنوان فارسی دوره — «آذر ۱۴۰۵» یا بازه «۱۷ آبان – ۳۰ آبان» */
export function cycleLabel(key: string, ctx: PlanCtx): string {
  const { jy, jm, jd } = parseCycleKey(key)
  const isFullMonth = ctx.startDay <= 1 && jd === 1 && (!isFirstCycle(key, ctx) || firstCycleIsFull(ctx))
  if (isFullMonth) {
    return monthLabel(`${jy}-${String(jm).padStart(2, "0")}`)
  }
  const endDate = new Date(cycleEndDate(key, ctx))
  endDate.setDate(endDate.getDate() - 1)
  const pe = jalaliOf(endDate)
  if (pe.jm === jm) {
    return `${toPersianDigits(jd)}–${toPersianDigits(pe.jd)} ${JALALI_MONTHS[jm - 1]}`
  }
  return `${toPersianDigits(jd)} ${JALALI_MONTHS[jm - 1]} – ${toPersianDigits(pe.jd)} ${JALALI_MONTHS[pe.jm - 1]}`
}

/** عنوان کوتاه برای متن‌های خالی: «آذر ۱۴۰۵» یا «دورهٔ ۱۷ آبان» */
export function cycleLabelShort(key: string, ctx: PlanCtx): string {
  const { jy, jm, jd } = parseCycleKey(key)
  const isFullMonth = ctx.startDay <= 1 && jd === 1 && (!isFirstCycle(key, ctx) || firstCycleIsFull(ctx))
  if (isFullMonth) {
    return monthLabel(`${jy}-${String(jm).padStart(2, "0")}`)
  }
  return `دورهٔ ${toPersianDigits(jd)} ${JALALI_MONTHS[jm - 1]}`
}

/** پیش‌نمایش دورۀ اول برای onboarding/تنظیمات، از تاریخ انتخابی کاربر */
export interface FirstCyclePreview {
  key: string
  start: Date
  end: Date
  days: number
  label: string
  /** روزهای مانده تا شروع (۰ = از همین امروز) */
  startsInDays: number
  notStarted: boolean
}

export function firstCyclePreview(startDay: number, fs: JDate, now: Date = new Date()): FirstCyclePreview {
  const key = cycleKeyOfJalali(fs)
  const start = gregorianOfJ(fs)
  const end = gregorianOfJ(nextAnchorAfter(fs, startDay))
  const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000))
  const label = cycleLabel(key, { startDay, firstCycleStart: key })
  const today = dayStart(now)
  const startsInDays = Math.max(0, Math.round((start.getTime() - today.getTime()) / 86_400_000))
  return { key, start, end, days, label, startsInDays, notStarted: startsInDays > 0 }
}
