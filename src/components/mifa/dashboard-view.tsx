"use client"

// داشبورد MIFA — پولت رو بشناس
import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { CategoryBadge } from "./mifa-icons"
import { DonutChart, DailyBars } from "./mifa-charts"
import type { Transaction } from "./mifa-hooks"
import { useTransactions, useBudget } from "./mifa-hooks"
import { computeMonthStats, computeBudgetInsight } from "./mifa-logic"
import { formatAmount, formatCompact, formatPercent, toPersianDigits } from "@/lib/mifa/format"
import { monthLabel, shiftMonth, todayJalali, jalaliDayOf, fullJalaliDate } from "@/lib/mifa/jalali"
import { getCategory } from "@/lib/mifa/categories"
import { TrendingDown, TrendingUp, Wallet, CalendarClock, AlertTriangle, Sparkles } from "lucide-react"

interface DashboardViewProps {
  month: string
  onSeeAll: () => void
}

export function DashboardView({ month, onSeeAll }: DashboardViewProps) {
  const tx = useTransactions(month)
  const prevMonth = shiftMonth(month, -1)
  const prevTx = useTransactions(prevMonth)
  const budget = useBudget(month)

  const stats = useMemo(() => computeMonthStats(tx.data ?? [], month), [tx.data, month])
  const prevStats = useMemo(() => computeMonthStats(prevTx.data ?? [], prevMonth), [prevTx.data, prevMonth])

  const insight = useMemo(() => {
    if (!budget.data?.monthly) return null
    return computeBudgetInsight(budget.data.monthly, stats, month, true)
  }, [budget.data, stats, month])

  const today = todayJalali()
  const isCurrentMonth = today.key === month

  const dailyBars = useMemo(() => {
    if (!tx.data) return []
    const arr: { day: number; amount: number }[] = []
    for (let d = 1; d <= stats.daysInMonth; d++) {
      arr.push({ day: d, amount: 0 })
    }
    for (const t of tx.data) {
      if (t.type !== "expense") continue
      const day = jalaliDayOf(new Date(t.date), month)
      if (day !== null) arr[day - 1].amount += t.amount
    }
    return arr
  }, [tx.data, month, stats.daysInMonth])

  const recent = useMemo(() => (tx.data ?? []).slice(0, 6), [tx.data])

  if (tx.isLoading || budget.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 rounded-2xl" />
        <div className="grid grid-cols-2 gap-4"><Skeleton className="h-28 rounded-2xl" /><Skeleton className="h-28 rounded-2xl" /></div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    )
  }

  const hasBudget = !!budget.data?.monthly
  const remainingNoBudget = stats.totalIncome - stats.totalExpense

  return (
    <div className="space-y-4 mifa-fade-up">
      {/* ── کارت اصلی: مانده بودجه ── */}
      <Card className="border-none bg-mifa-navy dark:bg-[#2D333F] text-white overflow-hidden relative">
        <div className="absolute inset-0 opacity-[0.10] bg-[url('/brand/mifa-pattern.svg')] bg-repeat" aria-hidden="true" />
        <CardContent className="relative p-6">
          {hasBudget && insight ? (
            <>
              <p className="text-body-sm text-white/70">از بودجه این ماه مونده:</p>
              <div className="mt-2 flex items-baseline gap-2 flex-wrap">
                <span className="numeric text-[40px] leading-none font-extrabold"
                  style={{ color: insight.remaining < 0 ? "#FF2E63" : "#08D9D6" }}>
                  {formatAmount(Math.abs(insight.remaining))}
                </span>
                <span className="text-body text-white/80">تومان</span>
                {insight.remaining < 0 ? (
                  <span className="text-caption text-[#FF5B83] font-semibold">(از بودجه رد شدی!)</span>
                ) : null}
              </div>
              <div className="mt-4">
                <Progress
                  value={Math.min(insight.spentPct, 100)}
                  className="h-2.5 bg-white/15"
                  indicatorStyle={{
                    backgroundColor: insight.spentPct > 100 ? "#FF2E63" : insight.spentPct > 80 ? "#E2AD5D" : "#08D9D6",
                  }}
                />
                <div className="flex justify-between mt-2 text-caption text-white/60 numeric">
                  <span>خرج شده: {formatAmount(stats.totalExpense)}</span>
                  <span>بودجه: {formatAmount(insight.monthly)}</span>
                </div>
              </div>
              {isCurrentMonth && insight.dailyAllowance > 0 ? (
                <div className="mt-5 rounded-xl bg-white/10 px-4 py-3 flex items-center gap-3">
                  <Wallet className="w-5 h-5 text-[#08D9D6] shrink-0" />
                  <p className="text-body-sm">
                    امروز می‌تونی <span className="numeric font-extrabold text-[#08D9D6]">{formatAmount(insight.dailyAllowance)}</span> تومان خرج کنی
                    <span className="text-white/60"> — با این سقف آخر ماه پول می‌مونه</span>
                  </p>
                </div>
              ) : null}
            </>
          ) : (
            <>
              <p className="text-body-sm text-white/70">
                {hasBudget ? "" : "بودجه این ماه هنوز تنظیم نشده — از تب «بودجه» شروع کن"}
              </p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="numeric text-[40px] leading-none font-extrabold"
                  style={{ color: remainingNoBudget >= 0 ? "#08D9D6" : "#FF2E63" }}>
                  {formatAmount(Math.abs(remainingNoBudget))}
                </span>
                <span className="text-body text-white/80">تومان {remainingNoBudget >= 0 ? "مونده" : "کم اومده"}</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-white/10 px-4 py-3">
                  <p className="text-caption text-white/60">خرج این ماه</p>
                  <p className="numeric font-bold mt-1">{formatAmount(stats.totalExpense)}</p>
                </div>
                <div className="rounded-xl bg-white/10 px-4 py-3">
                  <p className="text-caption text-white/60">درآمد این ماه</p>
                  <p className="numeric font-bold mt-1">{formatAmount(stats.totalIncome)}</p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ── هشدار پیش‌بینی ── */}
      {insight && isCurrentMonth && stats.totalExpense > 0 ? (
        <div className={`rounded-2xl border px-4 py-3.5 flex items-start gap-3 mifa-fade-up ${
          insight.projectedDiff < 0
            ? "border-[#FF2E63]/40 bg-[#FF2E63]/[0.07]"
            : "border-[#08D9D6]/40 bg-[#08D9D6]/[0.07]"
        }`}>
          {insight.projectedDiff < 0 ? (
            <AlertTriangle className="w-5 h-5 text-[#FF2E63] shrink-0 mt-0.5" />
          ) : (
            <Sparkles className="w-5 h-5 text-[#08D9D6] shrink-0 mt-0.5" />
          )}
          <p className="text-body-sm leading-6">
            {insight.projectedDiff < 0 ? (
              <>با این روال، آخر ماه حدوداً <span className="numeric font-bold">{formatAmount(Math.abs(insight.projectedDiff))}</span> تومان کم میارى — سقف روزانه رو جدی بگیر.</>
            ) : (
              <>با این روال، آخر ماه حدوداً <span className="numeric font-bold text-[#08D9D6]">{formatAmount(insight.projectedDiff)}</span> تومان برات می‌مونه. عالی پیش می‌ری!</>
            )}
          </p>
        </div>
      ) : null}

      {/* ── دو کارت خلاصه ── */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarClock className="w-4 h-4" />
              <span className="text-caption">خرج امروز</span>
            </div>
            <p className="numeric text-2xl font-extrabold mt-2">{formatAmount(stats.spentToday)}</p>
            <p className="text-caption text-muted-foreground mt-1">تومان</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-muted-foreground">
              {stats.totalExpense > prevStats.totalExpense && prevStats.totalExpense > 0 ? (
                <TrendingUp className="w-4 h-4 text-[#FF2E63]" />
              ) : (
                <TrendingDown className="w-4 h-4 text-[#238B68]" />
              )}
              <span className="text-caption">مقایسه با {monthLabel(prevMonth).split(" ")[0]}</span>
            </div>
            {prevStats.totalExpense > 0 ? (
              <>
                <p className="numeric text-2xl font-extrabold mt-2">
                  {formatPercent(Math.abs(((stats.totalExpense - prevStats.totalExpense) / prevStats.totalExpense) * 100))}
                </p>
                <p className="text-caption text-muted-foreground mt-1">
                  {stats.totalExpense > prevStats.totalExpense ? "بیشتر خرج کردی" : stats.totalExpense < prevStats.totalExpense ? "کمتر خرج کردی ✓" : "هم‌اندازه ماه قبل"}
                </p>
              </>
            ) : (
              <>
                <p className="text-body-sm font-bold mt-2 text-muted-foreground">—</p>
                <p className="text-caption text-muted-foreground mt-1">ماه قبل داده‌ای نداشت</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── نمودار روزانه ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="mifa-h4">خرج روزهای {monthLabel(month)}</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <DailyBars bars={dailyBars} />
          <div className="flex justify-between text-caption text-muted-foreground mt-2 numeric">
            <span>{toPersianDigits(1)}</span>
            <span>{toPersianDigits(stats.dayOfMonth <= 31 && stats.dayOfMonth > 0 ? stats.dayOfMonth : Math.min(today.day, stats.daysInMonth))}</span>
            <span>{toPersianDigits(stats.daysInMonth)}</span>
          </div>
        </CardContent>
      </Card>

      {/* ── دونات دسته‌ها ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="mifa-h4">پول کجا می‌ره؟</CardTitle>
        </CardHeader>
        <CardContent className="pb-5">
          <DonutChart slices={stats.byCategory} />
          {stats.byCategory.length > 0 ? (
            <ul className="mt-5 space-y-2.5">
              {stats.byCategory.slice(0, 4).map((s) => (
                <li key={s.category} className="flex items-center gap-3">
                  <CategoryBadge id={s.category} size="sm" />
                  <span className="text-body-sm font-medium flex-1">{getCategory(s.category).name}</span>
                  <span className="text-caption text-muted-foreground numeric">{formatPercent((s.amount / stats.totalExpense) * 100)}</span>
                  <span className="text-body-sm numeric font-bold w-28 text-left">{formatAmount(s.amount)}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </CardContent>
      </Card>

      {/* ── تراکنش‌های اخیر ── */}
      <Card>
        <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
          <CardTitle className="mifa-h4">آخرین تراکنش‌ها</CardTitle>
          <button onClick={onSeeAll} className="text-caption text-[#08D9D6] hover:underline font-semibold">
            دیدن همه
          </button>
        </CardHeader>
        <CardContent className="pt-1">
          {recent.length === 0 ? (
            <p className="text-body-sm text-muted-foreground py-6 text-center">
              هنوز چیزی ثبت نشده — با دکمه پایین اولین خرج رو ثبت کن
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {recent.map((t) => (
                <li key={t.id} className="flex items-center gap-3 py-3">
                  <CategoryBadge id={t.category} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm font-medium truncate">{t.title ?? getCategory(t.category).name}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{fullJalaliDate(new Date(t.date))}</p>
                  </div>
                  <span className={`numeric font-bold text-body ${t.type === "income" ? "text-[#238B68]" : "text-foreground"}`}>
                    {t.type === "income" ? "+" : "−"}{formatAmount(t.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* خلاصه هفته برای حس بهتر از روال */}
      {isCurrentMonth && stats.spentLast7 > 0 ? (
        <p className="text-center text-caption text-muted-foreground pb-2">
          هفت روز اخیر: <span className="numeric">{formatCompact(stats.spentLast7)}</span> تومان
        </p>
      ) : null}
    </div>
  )
}
