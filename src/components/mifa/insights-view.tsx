"use client"

// تحلیل MIFA — نشت پول، پیش‌بینی آخر ماه و آمار
import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { CategoryBadge } from "./mifa-icons"
import { useTransactions, useBudget, type Transaction } from "./mifa-hooks"
import { computeMonthStats, computeBudgetInsight, computeLeaks } from "./mifa-logic"
import { formatAmount, formatPercent, formatCompact, toPersianDigits } from "@/lib/mifa/format"
import { monthLabel, shiftMonth } from "@/lib/mifa/jalali"
import { getCategory } from "@/lib/mifa/categories"
import { ArrowDownRight, ArrowUpRight, Target, TrendingUp, PiggyBank } from "lucide-react"

interface InsightsViewProps {
  month: string
}

export function InsightsView({ month }: InsightsViewProps) {
  const tx = useTransactions(month)
  const prevTx = useTransactions(shiftMonth(month, -1))
  const budget = useBudget(month)

  const stats = useMemo(() => computeMonthStats(tx.data ?? [], month), [tx.data, month])
  const prevStats = useMemo(
    () => computeMonthStats(prevTx.data ?? [], shiftMonth(month, -1)),
    [prevTx.data, month]
  )
  const insight = useMemo(() => {
    if (!budget.data?.monthly) return null
    return computeBudgetInsight(budget.data.monthly, stats, month, true)
  }, [budget.data, stats, month])

  const leaks = useMemo(
    () => computeLeaks(stats.byCategory, stats.totalExpense, prevStats.byCategory),
    [stats, prevStats]
  )

  const biggest = useMemo(() => {
    let best: Transaction | null = null
    for (const t of tx.data ?? []) {
      if (t.type === "expense" && (!best || t.amount > best.amount)) best = t
    }
    return best
  }, [tx.data])

  if (tx.isLoading || prevTx.isLoading) {
    return <div className="space-y-4"><Skeleton className="h-56 rounded-2xl" /><Skeleton className="h-56 rounded-2xl" /></div>
  }

  const dailyAvg = stats.dayOfMonth > 0 && stats.dayOfMonth <= 40
    ? Math.round(stats.totalExpense / stats.dayOfMonth)
    : 0

  return (
    <div className="space-y-4 mifa-fade-up">
      {/* نشت پول */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="mifa-h4">نشت پول — سه دسته‌ای که بیشتر می‌خورن</CardTitle>
          <p className="text-caption text-muted-foreground">
            مقایسه با {monthLabel(shiftMonth(month, -1))} — همین‌جاست که می‌تونی جلوی خروج پول رو بگیری
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {leaks.length === 0 ? (
            <p className="text-body-sm text-muted-foreground py-4 text-center">این ماه هنوز خرجی ثبت نشده</p>
          ) : (
            leaks.map((leak, idx) => (
              <div key={leak.category} className="flex items-center gap-3 rounded-xl border border-border p-3.5">
                <span className="numeric text-lg font-extrabold text-muted-foreground w-6 text-center">
                  {toPersianDigits(idx + 1)}
                </span>
                <CategoryBadge id={leak.category} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-body-sm font-bold">{getCategory(leak.category).name}</p>
                    <span className="numeric text-body-sm font-extrabold">{formatAmount(leak.amount)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <span className="text-caption text-muted-foreground numeric">
                      {formatPercent(leak.pct)} از کل خرج
                    </span>
                    {leak.deltaPct !== null ? (
                      <span className={`text-caption font-semibold inline-flex items-center gap-1 ${
                        leak.deltaPct > 5 ? "text-destructive" : leak.deltaPct < -5 ? "text-[#238B68]" : "text-muted-foreground"
                      }`}>
                        {leak.deltaPct > 5 ? <ArrowUpRight className="w-3.5 h-3.5" /> :
                         leak.deltaPct < -5 ? <ArrowDownRight className="w-3.5 h-3.5" /> : null}
                        {formatPercent(Math.abs(leak.deltaPct))} نسبت به ماه قبل
                      </span>
                    ) : (
                      <span className="text-caption text-muted-foreground">ماه قبل ثبت نشده بود</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* پیش‌بینی */}
      {insight ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="mifa-h4 inline-flex items-center gap-2">
              <Target className="w-5 h-5 text-[#08D9D6]" /> پیش‌بینی آخر ماه
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-muted/60 px-2 py-3.5">
              <p className="text-caption text-muted-foreground">با این روال خرج می‌شه</p>
              <p className="numeric font-extrabold mt-1.5 text-body-lg">{formatCompact(insight.projectedTotal)}</p>
            </div>
            <div className="rounded-xl bg-muted/60 px-2 py-3.5">
              <p className="text-caption text-muted-foreground">برات می‌مونه</p>
              <p className={`numeric font-extrabold mt-1.5 text-body-lg ${insight.projectedDiff >= 0 ? "text-[#238B68]" : "text-destructive"}`}>
                {formatCompact(Math.abs(insight.projectedDiff))}
              </p>
            </div>
            <div className="rounded-xl bg-muted/60 px-2 py-3.5">
              <p className="text-caption text-muted-foreground">سقف روزانه</p>
              <p className="numeric font-extrabold mt-1.5 text-body-lg text-[#08D9D6]">{formatCompact(insight.dailyAllowance)}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-6 text-center text-body-sm text-muted-foreground">
            برای پیش‌بینی دقیق، اول از تب «بودجه» بودجه این ماه رو بذار
          </CardContent>
        </Card>
      )}

      {/* آمار ماه */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="mifa-h4 inline-flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#08D9D6]" /> آمار {monthLabel(month)}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <StatBox label="میانگین خرج روزانه" value={dailyAvg > 0 ? `${formatAmount(dailyAvg)} تومان` : "—"} />
          <StatBox label="خرج ۷ روز اخیر" value={stats.spentLast7 > 0 ? `${formatAmount(stats.spentLast7)} تومان` : "—"} />
          <StatBox
            label="بزرگ‌ترین خرج ماه"
            value={biggest ? `${formatAmount(biggest.amount)} تومان` : "—"}
            hint={biggest?.title ?? undefined}
          />
          <StatBox
            label="درآمد ثبت‌شده"
            value={stats.totalIncome > 0 ? `${formatAmount(stats.totalIncome)} تومان` : "—"}
            hint={stats.totalIncome > 0 && stats.totalExpense > 0
              ? `${formatPercent((stats.totalExpense / stats.totalIncome) * 100)} خرج شده`
              : undefined}
          />
        </CardContent>
      </Card>

      {/* پس‌انداز */}
      {stats.totalIncome > 0 ? (
        <div className="rounded-2xl border border-[#08D9D6]/40 bg-[#08D9D6]/[0.07] px-4 py-3.5 flex items-start gap-3">
          <PiggyBank className="w-5 h-5 text-[#08D9D6] shrink-0 mt-0.5" />
          <p className="text-body-sm leading-6">
            از درآمد این ماه <span className="numeric font-bold text-[#08D9D6]">
            {formatAmount(Math.max(0, stats.totalIncome - stats.totalExpense))}</span> تومان باقی مونده —
            اگه همین رو پس‌انداز کنی، سالی می‌شه {formatCompact(Math.max(0, (stats.totalIncome - stats.totalExpense)) * 12)} تومان.
          </p>
        </div>
      ) : null}
    </div>
  )
}

function StatBox({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl bg-muted/60 px-3.5 py-3">
      <p className="text-caption text-muted-foreground">{label}</p>
      <p className="numeric font-bold mt-1">{value}</p>
      {hint ? <p className="text-[11px] text-muted-foreground mt-0.5 truncate" title={hint}>{hint}</p> : null}
    </div>
  )
}
