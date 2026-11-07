"use client"

// تحلیل MIFA v2 — نشت پول، پیش‌بینی آخر ماه بر پایه برنامه و آمار
import { useMemo } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { CategoryBadge } from "./mifa-icons"
import { DonutChart } from "./mifa-charts"
import { useTransactions, useProfile, type Transaction } from "./mifa-hooks"
import { computeMonthStats, computeLeaks } from "./mifa-logic"
import { computePlanStatus, type PlanStatusKind } from "@/lib/mifa/plan"
import { formatAmount, formatPercent, formatCompact, toPersianDigits } from "@/lib/mifa/format"
import { monthLabel, shiftMonth } from "@/lib/mifa/jalali"
import { getCategory } from "@/lib/mifa/categories"
import { ArrowDownRight, ArrowUpRight, Target, TrendingUp, PiggyBank } from "lucide-react"

const STATUS_COLOR: Record<PlanStatusKind, string> = {
  safe: "#08D9D6",
  watch: "#E2AD5D",
  danger: "#FF2E63",
}

interface InsightsViewProps {
  month: string
}

export function InsightsView({ month }: InsightsViewProps) {
  const tx = useTransactions(month)
  const prevTx = useTransactions(shiftMonth(month, -1))
  const profile = useProfile()

  const stats = useMemo(() => computeMonthStats(tx.data ?? [], month), [tx.data, month])
  const prevStats = useMemo(
    () => computeMonthStats(prevTx.data ?? [], shiftMonth(month, -1)),
    [prevTx.data, month]
  )

  const status = useMemo(() => {
    const p = profile.data?.profile
    if (!p) return null
    return computePlanStatus(
      { name: p.name, income: p.income, payday: p.payday, savingsMode: p.savingsMode as never, savingsAmount: p.savingsAmount, savingsPercent: p.savingsPercent },
      profile.data?.fixed ?? [],
      month,
      { totalExpense: stats.totalExpense, totalIncome: stats.totalIncome, dayOfMonth: stats.dayOfMonth }
    )
  }, [profile.data, stats, month])

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

  if (tx.isLoading || prevTx.isLoading || profile.isLoading) {
    return <div className="space-y-4"><Skeleton className="h-56 rounded-3xl" /><Skeleton className="h-56 rounded-3xl" /></div>
  }

  const dailyAvg = stats.dayOfMonth > 0 && stats.dayOfMonth <= 40
    ? Math.round(stats.totalExpense / stats.dayOfMonth)
    : 0

  return (
    <div className="space-y-5 mifa-stagger">
      <div className="pt-1">
        <h1 className="mifa-h2">تحلیل {monthLabel(month)}</h1>
        <p className="text-body-sm text-muted-foreground mt-1">همین‌جاست که می‌تونی جلوی نشت پول رو بگیری</p>
      </div>

      {/* نشت پول */}
      <section className="glass rounded-3xl p-5" aria-label="نشت پول">
        <h2 className="mifa-h4">نشت پول — سه دسته‌ای که بیشتر می‌خورن</h2>
        <div className="mt-4 space-y-3">
          {leaks.length === 0 ? (
            <p className="text-body-sm text-muted-foreground py-4 text-center">این ماه هنوز خرجی ثبت نشده</p>
          ) : (
            leaks.map((leak, idx) => (
              <div key={leak.category} className="flex items-center gap-3 rounded-2xl border border-border p-3.5">
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
                        leak.deltaPct > 5 ? "text-[#FF5B83]" : leak.deltaPct < -5 ? "text-[#2BD38B]" : "text-muted-foreground"
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
        </div>
      </section>

      {/* پیش‌بینی بر پایه برنامه */}
      {status && (
        <section className="glass rounded-3xl p-5" aria-label="پیش‌بینی آخر ماه">
          <h2 className="mifa-h4 inline-flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" /> پیش‌بینی آخر ماه
          </h2>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl bg-muted/50 px-2 py-3.5">
              <p className="text-caption text-muted-foreground">با این روال خرج می‌شه</p>
              <p className="numeric font-extrabold mt-1.5 text-body">{formatCompact(Math.max(0, status.plan.flexible - status.projectedFlexibleLeft))}</p>
            </div>
            <div className="rounded-2xl px-2 py-3.5" style={{ backgroundColor: `${STATUS_COLOR[status.status]}18` }}>
              <p className="text-caption text-muted-foreground">برات می‌مونه</p>
              <p className="numeric font-extrabold mt-1.5 text-body" style={{ color: STATUS_COLOR[status.status] }}>
                {formatCompact(Math.max(0, status.kept))}
              </p>
            </div>
            <div className="rounded-2xl bg-muted/50 px-2 py-3.5">
              <p className="text-caption text-muted-foreground">سقف روزانه</p>
              <p className="numeric font-extrabold mt-1.5 text-body text-primary">{formatCompact(status.dailyAllowance)}</p>
            </div>
          </div>
          <p className="text-caption text-muted-foreground mt-3.5 leading-5">
            پیش‌بینی با فرض تکرار سرعت خرج فعلی تا آخر ماه محاسبه می‌شه و شامل پس‌انداز برنامه‌ات هم هست.
          </p>
        </section>
      )}

      {/* آمار ماه */}
      <section className="glass rounded-3xl p-5" aria-label="آمار ماه">
        <h2 className="mifa-h4 inline-flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" /> آمار ماه
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <StatBox label="میانگین خرج روزانه" value={dailyAvg > 0 ? `${formatAmount(dailyAvg)} تومان` : "—"} />
          <StatBox label="خرج ۷ روز اخیر" value={stats.spentLast7 > 0 ? `${formatAmount(stats.spentLast7)} تومان` : "—"} />
          <StatBox
            label="بزرگ‌ترین خرج ماه"
            value={biggest ? `${formatAmount(biggest.amount)} تومان` : "—"}
            hint={biggest?.title ?? undefined}
          />
          <StatBox
            label="درآمد ثبت‌شده (اضافه بر حقوق)"
            value={stats.totalIncome > 0 ? `${formatAmount(stats.totalIncome)} تومان` : "—"}
            hint={stats.totalIncome > 0 && stats.totalExpense > 0
              ? `${formatPercent((stats.totalExpense / stats.totalIncome) * 100)} خرج شده`
              : undefined}
          />
        </div>
      </section>

      {/* دونات دسته‌ها */}
      <section className="glass rounded-3xl p-5" aria-label="تفکیک دسته‌ها">
        <h2 className="mifa-h4 mb-4">پول کجا می‌ره؟</h2>
        <DonutChart slices={stats.byCategory} />
      </section>

      {/* پس‌انداز انگیزشی */}
      {status && status.plan.savings > 0 && (
        <div className="rounded-2xl border border-[#2BD38B]/40 bg-[#2BD38B]/[0.07] px-4 py-3.5 flex items-start gap-3">
          <PiggyBank className="w-5 h-5 text-[#2BD38B] shrink-0 mt-0.5" />
          <p className="text-body-sm leading-6">
            با پس‌انداز {formatCompact(status.plan.savings)} تومانی‌ات، سالی می‌شه{" "}
            <span className="numeric font-bold text-[#2BD38B]">{formatCompact(status.plan.savings * 12)}</span> تومان —
            یعنی {toPersianDigits(12)} ماه پشت سر هم اگه به همین روال ادامه بدی.
          </p>
        </div>
      )}
    </div>
  )
}

function StatBox({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl bg-muted/50 px-3.5 py-3">
      <p className="text-caption text-muted-foreground">{label}</p>
      <p className="numeric font-bold mt-1">{value}</p>
      {hint ? <p className="text-[11px] text-muted-foreground mt-0.5 truncate" title={hint}>{hint}</p> : null}
    </div>
  )
}
