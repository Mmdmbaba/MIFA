// موتور برنامه MIFA — بیشترین پولی که تا آخر ماه می‌مونه
// income − fixed − savings = پول آزاد خرج کردن؛ از اینجا به بعد همه‌چیز از همین محاسبه می‌شه
import { daysInJalaliMonth, daysLeftInMonth, todayJalali } from "./jalali"

export interface FixedItem {
  id: string
  label: string
  amount: number
  icon: string
  sortOrder?: number
}

export interface PlanProfile {
  name: string
  income: number
  payday: number
  savingsMode: "auto" | "amount" | "percent" | "none"
  savingsAmount: number
  savingsPercent: number
}

export interface Plan {
  income: number
  fixedTotal: number
  savings: number
  flexible: number // پول آزاد ماه
  savingsLabel: string
}

/** پیشنهاد هوشمند پس‌انداز: ~۲۰٪ مازاد درآمد روی خرج ثابت (بین ۰ تا ۳۰٪ درآمد) */
export function autoSavings(income: number, fixedTotal: number): number {
  const surplus = Math.max(0, income - fixedTotal)
  const rec = Math.round(surplus * 0.2)
  const cap = Math.round(income * 0.3)
  return Math.min(rec, cap)
}

/** جمع هزینه‌های ثابت */
export function fixedTotalOf(fixed: { amount: number }[]): number {
  return fixed.reduce((s, f) => s + f.amount, 0)
}

/** ساخت برنامه کامل — حالت auto اینجا با هزینه‌های ثابت واقعی حل می‌شه */
export function buildPlan(profile: PlanProfile, fixed: FixedItem[]): Plan {
  const fixedTotal = fixedTotalOf(fixed)
  let savings: number
  let savingsLabel: string
  switch (profile.savingsMode) {
    case "amount":
      savings = Math.max(0, Math.round(profile.savingsAmount))
      savingsLabel = "پس‌انداز با عدد مشخص"
      break
    case "percent":
      savings = Math.max(0, Math.round((profile.income * profile.savingsPercent) / 100))
      savingsLabel = `پس‌انداز ${profile.savingsPercent}٪ از درآمد`
      break
    case "auto":
      savings = autoSavings(profile.income, fixedTotal)
      savingsLabel = "پس‌انداز پیشنهاد MIFA"
      break
    default:
      savings = 0
      savingsLabel = "فعلاً بدون پس‌انداز"
  }
  const flexible = Math.max(0, profile.income - fixedTotal - savings)
  return { income: profile.income, fixedTotal, savings, flexible, savingsLabel }
}

export type PlanStatusKind = "safe" | "watch" | "danger"

export interface PlanStatus {
  plan: Plan
  spent: number // خرج آزاد تا امروز
  remainingFlexible: number // پول آزاد باقی‌مانده
  spentPct: number // درصد خرج از پول آزاد
  dailyAllowance: number // سقف خرج امروز
  kept: number // پولی که با این روال تا آخر ماه می‌مونه (شامل پس‌انداز)
  projectedFlexibleLeft: number // پیش‌بینی آزادِ آخر ماه با سرعت فعلی
  overFlexible: boolean // خرجت از پول آزاد رد شده؟
  status: PlanStatusKind
  statusText: string
  dayOfMonth: number
  daysInMonth: number
  daysLeft: number
  isCurrentMonth: boolean
  extraIncome: number // درآمد ثبت‌شده اضافه روی حقوق
}

/** وضعیت زنده برنامه برای یک ماه */
export function computePlanStatus(
  profile: PlanProfile,
  fixed: FixedItem[],
  month: string,
  stats: { totalExpense: number; totalIncome: number; dayOfMonth: number }
): PlanStatus {
  const plan = buildPlan(profile, fixed)
  const isCurrentMonth = todayJalali().key === month
  const daysInMonth = daysInJalaliMonth(month)
  const daysLeft = isCurrentMonth ? daysLeftInMonth(month) : daysInMonth
  const dayOfMonth = isCurrentMonth ? stats.dayOfMonth : 0

  const extraIncome = Math.max(0, stats.totalIncome)
  // درآمدِ ماه = حقوق ثابت + درآمدهای ثبت‌شده (مثل کارهای جانبی)
  const monthIncome = plan.income + extraIncome
  const flexibleAll = Math.max(0, monthIncome - plan.fixedTotal - plan.savings)

  const spent = stats.totalExpense
  const remainingFlexible = flexibleAll - spent
  const spentPct = flexibleAll > 0 ? (spent / flexibleAll) * 100 : spent > 0 ? 120 : 0
  const overFlexible = remainingFlexible < 0

  // سقف خرج امروز: پول آزاد باقی‌مانده تقسیم بر روزهای باقی‌مانده (شامل امروز)
  const dailyAllowance = isCurrentMonth
    ? Math.max(0, Math.floor(Math.max(0, remainingFlexible) / Math.max(1, daysLeft)))
    : Math.max(0, Math.floor(flexibleAll / Math.max(1, daysInMonth)))

  // پیش‌بینی با سرعت فعلی
  const projectedSpend = isCurrentMonth && dayOfMonth > 0
    ? Math.round((spent / dayOfMonth) * daysInMonth)
    : spent
  const projectedFlexibleLeft = flexibleAll - projectedSpend

  // پولی که تا آخر ماه می‌مونه = پس‌انداز + مازاد آزاد (یا منفی اگر پس‌انداز خورده بشه)
  const kept = plan.savings + projectedFlexibleLeft

  let status: PlanStatusKind
  let statusText: string
  if (kept >= plan.savings && projectedFlexibleLeft >= 0) {
    status = "safe"
    statusText = projectedFlexibleLeft > 0
      ? "با این روال آخر ماه پول اضافه‌ات می‌مونه"
      : "دقیقاً طبق برنامه جلو می‌ری"
  } else if (kept > 0 && projectedFlexibleLeft < 0) {
    status = "watch"
    statusText = "روال خرجت داره بخشی از پس‌انداز رو می‌خوره"
  } else {
    status = "danger"
    statusText = "با این روال آخر ماه کسری می‌مونه — سقف روزانه رو جدی بگیر"
  }

  return {
    plan: { ...plan, income: monthIncome, flexible: flexibleAll },
    spent,
    remainingFlexible,
    spentPct: Math.min(spentPct, 999),
    dailyAllowance,
    kept,
    projectedFlexibleLeft,
    overFlexible,
    status,
    statusText,
    dayOfMonth,
    daysInMonth,
    daysLeft,
    isCurrentMonth,
    extraIncome,
  }
}
