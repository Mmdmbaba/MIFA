// منطق مالی MIFA — اسنپ‌شات زنده برنامه، اجازه روزانه، پیش‌بینی و نشت پول
// همه محاسبات سمت کلاینت و بر پایه «دوره مالی» (شروع دلخواه در تقویم جلالی)
import type { Profile, Transaction } from "./types"
import { computePlanCore, type PlanCore } from "./plan"
import {
  currentCycleKey,
  cycleDayOf,
  cycleLabel,
  cycleRange,
  daysLeftInCycle,
  isFirstCycle,
  nominalCycleDays,
  shiftCycleKey,
  dayStart,
} from "./cycle"
import { JALALI_MONTHS, JALALI_WEEKDAYS } from "./jalali"
import { toPersianDigits } from "./format"
import { CATEGORIES } from "./categories"
import { toJalaali } from "jalaali-js"

// ─── حقایق دوره ───

export interface CycleFacts {
  key: string
  startDay: number
  start: Date
  end: Date
  /** طول واقعی دوره (برای دورۀ اولِ ناقص = از onboarding تا لنگر بعدی) */
  daysInCycle: number
  /** روزهای «پول‌دار» دوره — در دورۀ اول از روز onboarding حساب می‌شود */
  activeDays: number
  /** طول دوره کامل استاندارد — مبنای کسری کردن بودجه دورۀ اول */
  nominalDays: number
  /** ضریب بودجه: min(1, activeDays / nominalDays) */
  budgetFactor: number
  /** چندمین روز دوره (مبنا: شروع دوره) */
  dayNum: number
  daysLeft: number
  isCurrent: boolean
  isPast: boolean
  label: string
}

export function cycleFacts(cycleKey: string, startDay: number, onboardedAt?: string): CycleFacts {
  const { start, end } = cycleRange(cycleKey, startDay, onboardedAt)
  const total = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000))
  const cur = currentCycleKey(startDay, onboardedAt)
  const isCurrent = cycleKey === cur
  const isPast = cycleKey < cur

  const first = isFirstCycle(cycleKey, startDay, onboardedAt)
  const obDay = first && onboardedAt ? cycleDayOf(dayStart(new Date(onboardedAt)), cycleKey, startDay, onboardedAt) : null
  const skipped = first && obDay ? obDay - 1 : 0
  const activeDays = Math.max(1, total - skipped)
  const nominalDays = nominalCycleDays(cycleKey, startDay, onboardedAt) || total
  const budgetFactor = Math.min(1, activeDays / Math.max(1, nominalDays))

  const now = new Date()
  const dayNum = isCurrent ? (cycleDayOf(now, cycleKey, startDay, onboardedAt) ?? 1) : isPast ? total : 0
  const daysLeft = isCurrent ? daysLeftInCycle(cycleKey, startDay, onboardedAt) : isPast ? 0 : total

  return {
    key: cycleKey,
    startDay,
    start,
    end,
    daysInCycle: total,
    activeDays,
    nominalDays,
    budgetFactor,
    dayNum,
    daysLeft,
    isCurrent,
    isPast,
    label: cycleLabel(cycleKey, startDay, onboardedAt),
  }
}

// ─── پول دوره ───

export interface CycleMoney {
  /** بودجه آزاد دوره = spendable × ضریب کسری */
  cycleBudget: number
  /** درآمدهای ثبت‌شده داخل دوره (کارهای جانبی و …) */
  incomeExtra: number
  /** خرج داخل دوره — در دورۀ اول فقط از روز onboarding */
  spent: number
  spentToday: number
  dailyAllowance: number
  remainingToday: number
  remainingCycle: number
  spentPct: number
  /** پیش‌بینی: اگر همین روال ادامه پیدا کند */
  projectedSpend: number
  projectedDiff: number // مثبت = آخر دوره اضافه می‌آید
  tone: "safe" | "watch" | "danger"
  toneText: string
}

export function cycleMoney(core: PlanCore, facts: CycleFacts, transactions: Transaction[]): CycleMoney {
  const start = facts.start
  const end = facts.end
  const obFloor = isFirstCycle(facts.key, facts.startDay) && facts.budgetFactor < 1
    ? dayStart(new Date(start))
    : null

  let spent = 0
  let incomeExtra = 0
  for (const t of transactions) {
    const d = new Date(t.date)
    if (d < start || d >= end) continue
    if (obFloor && d < obFloor) continue // قبل از onboarding در دورۀ اول
    if (t.type === "expense") spent += t.amount
    else incomeExtra += t.amount
  }

  const now = new Date()
  const todayFloor = dayStart(now)
  let spentToday = 0
  for (const t of transactions) {
    if (t.type !== "expense") continue
    const d = new Date(t.date)
    if (d >= todayFloor) spentToday += t.amount
  }

  const budget = Math.round(core.spendable * facts.budgetFactor)
  const available = budget + incomeExtra

  const dailyAllowance = facts.isCurrent
    ? Math.floor(Math.max(0, available - spent) / Math.max(1, facts.daysLeft))
    : Math.floor(budget / Math.max(1, facts.daysInCycle))

  const remainingCycle = available - spent
  const spentPct = available > 0 ? Math.min((spent / available) * 100, 999) : spent > 0 ? 999 : 0

  const elapsed = Math.max(1, facts.activeDays - facts.daysLeft)
  const projectedSpend = facts.isCurrent ? Math.round((spent / elapsed) * facts.activeDays) : spent
  const projectedDiff = available - projectedSpend

  let tone: CycleMoney["tone"]
  let toneText: string
  if (projectedDiff >= 0) {
    tone = "safe"
    toneText = projectedDiff > 0
      ? "اگر همین‌طور خرج کنی، آخر دوره پول اضافه می‌آوری"
      : "دقیقاً طبق برنامه جلو می‌ری"
  } else if (projectedDiff + core.savings >= 0) {
    tone = "watch"
    toneText = "روال خرجت دارد بخشی از پس‌انداز را می‌خورد"
  } else {
    tone = "danger"
    toneText = "با این روال آخر دوره کسری می‌ماند — سقف روزانه را جدی بگیر"
  }

  return {
    cycleBudget: budget,
    incomeExtra,
    spent,
    spentToday,
    dailyAllowance,
    remainingToday: dailyAllowance - spentToday,
    remainingCycle,
    spentPct,
    projectedSpend,
    projectedDiff,
    tone,
    toneText,
  }
}

export interface PlanSnapshot extends PlanCore, CycleMoney {
  facts: CycleFacts
  profile: Profile
}

/** اسنپ‌شات کامل برنامه برای یک دوره (پیش‌فرض: دوره جاری) */
export function computeSnapshot(
  profile: Profile,
  transactions: Transaction[],
  cycleOverride?: string
): PlanSnapshot {
  const core = computePlanCore(profile)
  const key = cycleOverride ?? currentCycleKey(profile.cycleAnchorDay, profile.onboardedAt)
  const facts = cycleFacts(key, profile.cycleAnchorDay, profile.onboardedAt)
  const money = cycleMoney(core, facts, transactions)
  return { ...core, ...money, facts, profile }
}

// ─── آماره دوره برای تحلیل ───

export interface CategoryTotal {
  category: string
  amount: number
}

export function cycleByCategory(transactions: Transaction[], facts: CycleFacts): CategoryTotal[] {
  const totals = new Map<string, number>()
  for (const t of transactions) {
    if (t.type !== "expense") continue
    const d = new Date(t.date)
    if (d < facts.start || d >= facts.end) continue
    totals.set(t.category, (totals.get(t.category) ?? 0) + t.amount)
  }
  return CATEGORIES.map((c) => ({ category: c.id, amount: totals.get(c.id) ?? 0 }))
    .filter((x) => x.amount > 0)
    .sort((a, b) => b.amount - a.amount)
}

/** نشت پول: بزرگ‌ترین دسته‌ها با مقایسه با دوره قبل */
export interface LeakItem {
  category: string
  amount: number
  pct: number // سهم از کل خرج این دوره
  prevAmount: number | null // دوره قبل؛ null یعنی داده‌ای نبود
  deltaPct: number | null
}

export function computeLeaks(
  transactions: Transaction[],
  facts: CycleFacts,
  startDay: number,
  onboardedAt?: string
): LeakItem[] {
  const current = cycleByCategory(transactions, facts)
  const totalExpense = current.reduce((s, x) => s + x.amount, 0)
  const prevKey = shiftCycleKey(facts.key, -1, startDay, onboardedAt)
  let prevMap = new Map<string, number>()
  if (prevKey) {
    const prevFacts = cycleFacts(prevKey, startDay, onboardedAt)
    prevMap = new Map(cycleByCategory(transactions, prevFacts).map((x) => [x.category, x.amount]))
  }
  return current.slice(0, 3).map((x) => {
    const prev = prevKey ? prevMap.get(x.category) : undefined
    const prevAmount = prev === undefined ? null : prev
    const deltaPct =
      prevAmount !== null && prevAmount > 0 ? ((x.amount - prevAmount) / prevAmount) * 100 : null
    return {
      category: x.category,
      amount: x.amount,
      pct: totalExpense > 0 ? (x.amount / totalExpense) * 100 : 0,
      prevAmount,
      deltaPct,
    }
  })
}

// ─── گروه‌بندی روزانه برای فهرست تراکنش‌ها ───

export interface DayGroup {
  key: string // "1404-08-17"
  label: string // امروز / دیروز / ۵ آبان
  weekday: string
  expense: number
  income: number
  items: Transaction[]
}

export function groupByDay(transactions: Transaction[]): DayGroup[] {
  const now = new Date()
  const today = dayStart(now)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const groups = new Map<string, DayGroup>()
  for (const t of transactions) {
    const d = dayStart(new Date(t.date))
    const k = dayKey(d)
    let g = groups.get(k)
    if (!g) {
      const j = jalaliDayLabel(d)
      let label: string
      if (d.getTime() === today.getTime()) label = "امروز"
      else if (d.getTime() === yesterday.getTime()) label = "دیروز"
      else label = `${toPersianDigits(j.jd)} ${JALALI_MONTHS[j.jm - 1]}`
      g = { key: k, label, weekday: j.weekday, expense: 0, income: 0, items: [] }
      groups.set(k, g)
    }
    g.items.push(t)
    if (t.type === "expense") g.expense += t.amount
    else g.income += t.amount
  }
  return [...groups.values()].sort((a, b) => (a.key < b.key ? 1 : -1))
}

function dayKey(d: Date): string {
  const j = jalaliDayLabel(d)
  return `${j.jy}-${String(j.jm).padStart(2, "0")}-${String(j.jd).padStart(2, "0")}`
}

function jalaliDayLabel(d: Date) {
  const { jy, jm, jd } = toJalaali(d)
  return { jy, jm, jd, weekday: JALALI_WEEKDAYS[d.getDay() === 6 ? 0 : d.getDay() + 1] ?? "" }
}
