"use client"

// منطق مالی MIFA — محاسبات بودجه، اجازه روزانه، پیش‌بینی و نشت پول
import type { Transaction } from "./mifa-hooks"
import { CATEGORIES } from "@/lib/mifa/categories"
import { daysInJalaliMonth, daysLeftInMonth, todayJalali } from "@/lib/mifa/jalali"

export interface MonthStats {
  totalExpense: number
  totalIncome: number
  byCategory: { category: string; amount: number }[]
  spentToday: number
  spentLast7: number
  dayOfMonth: number
  daysInMonth: number
  daysLeft: number
}

export function computeMonthStats(transactions: Transaction[], month: string): MonthStats {
  const now = new Date()
  const { key: todayKey, day: todayDay } = todayJalali()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  let totalExpense = 0
  let totalIncome = 0
  let spentToday = 0
  let spentLast7 = 0
  const catTotals = new Map<string, number>()

  const weekAgo = new Date(todayStart)
  weekAgo.setDate(weekAgo.getDate() - 7)

  for (const t of transactions) {
    const d = new Date(t.date)
    if (t.type === "expense") {
      totalExpense += t.amount
      catTotals.set(t.category, (catTotals.get(t.category) ?? 0) + t.amount)
      if (d >= todayStart) spentToday += t.amount
      if (d >= weekAgo) spentLast7 += t.amount
    } else {
      totalIncome += t.amount
    }
  }

  const byCategory = CATEGORIES.map((c) => ({ category: c.id, amount: catTotals.get(c.id) ?? 0 }))
    .filter((x) => x.amount > 0)
    .sort((a, b) => b.amount - a.amount)

  return {
    totalExpense,
    totalIncome,
    byCategory,
    spentToday,
    spentLast7,
    dayOfMonth: todayKey === month ? todayDay : (todayKey < month ? 0 : 999),
    daysInMonth: daysInJalaliMonth(month),
    daysLeft: daysLeftInMonth(month),
  }
}

export interface BudgetInsight {
  monthly: number
  remaining: number
  spentPct: number
  dailyAllowance: number
  projectedTotal: number
  projectedDiff: number // مثبت = باقی می‌ماند، منفی = کم می‌آورد
  overPace: boolean
  paceDiff: number // چقدر از روال انتظار جلوتریم
}

/** محاسبه وضعیت بودجه با روال خرج تا امروز */
export function computeBudgetInsight(
  monthlyBudget: number,
  stats: MonthStats,
  month: string,
  isCurrentMonth: boolean
): BudgetInsight {
  const remaining = monthlyBudget - stats.totalExpense
  const spentPct = monthlyBudget > 0 ? (stats.totalExpense / monthlyBudget) * 100 : 0

  let dailyAllowance = 0
  let projectedTotal = stats.totalExpense
  let overPace = false
  let paceDiff = 0

  if (isCurrentMonth && stats.dayOfMonth > 0) {
    dailyAllowance = stats.daysLeft > 0 ? Math.max(0, Math.floor(remaining / stats.daysLeft)) : 0
    // روال: اگر همین سرعت ادامه پیدا کند آخر ماه چقدر خرج شده
    projectedTotal = stats.dayOfMonth > 0
      ? Math.round((stats.totalExpense / stats.dayOfMonth) * stats.daysInMonth)
      : stats.totalExpense
    // انتظار: تا امروز باید بر اساس روزِ ماه چقدر خرج شده بود
    const expectedByNow = Math.round((monthlyBudget / stats.daysInMonth) * stats.dayOfMonth)
    paceDiff = stats.totalExpense - expectedByNow
    overPace = paceDiff > 0
  }

  return {
    monthly: monthlyBudget,
    remaining,
    spentPct: Math.min(spentPct, 999),
    dailyAllowance,
    projectedTotal,
    projectedDiff: monthlyBudget - projectedTotal,
    overPace,
    paceDiff,
  }
}

/** نشت پول: بزرگ‌ترین دسته‌ها با مقایسه با ماه قبل */
export interface LeakItem {
  category: string
  amount: number
  pct: number // سهم از کل خرج این ماه
  prevAmount: number | null // ماه قبل؛ null یعنی ماه قبل داده‌ای نبود
  deltaPct: number | null
}

export function computeLeaks(
  current: { category: string; amount: number }[],
  totalExpense: number,
  prevByCategory: { category: string; amount: number }[]
): LeakItem[] {
  const prevMap = new Map(prevByCategory.map((x) => [x.category, x.amount]))
  return current.slice(0, 3).map((x) => {
    const prev = prevMap.get(x.category)
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
