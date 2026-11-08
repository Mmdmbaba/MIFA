"use client"

// داشبورد MIFA v2 — «امروز چقدر می‌تونی خرج کنی؟» و «چقدر آخر دوره می‌مونه؟»
import { useMemo } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { CategoryBadge } from "./mifa-icons"
import { DailyBars } from "./mifa-charts"
import type { Transaction } from "./mifa-hooks"
import { useTransactions, useProfile } from "./mifa-hooks"
import { computeCycleStats } from "./mifa-logic"
import { computePlanStatus, type PlanStatusKind } from "@/lib/mifa/plan"
import { formatAmount, formatCompact, formatPercent, toPersianDigits } from "@/lib/mifa/format"
import { cycleLabel, cycleDayOf, daysInCycle } from "@/lib/mifa/cycle"
import { fullJalaliDate } from "@/lib/mifa/jalali"
import { getCategory } from "@/lib/mifa/categories"
import {
  AlertTriangle, Sparkles, Flame, PiggyBank, Wallet,
  ArrowLeft, TrendingDown, TrendingUp,
} from "lucide-react"

const STATUS_COLOR: Record<PlanStatusKind, string> = {
  safe: "#08D9D6",
  watch: "#E2AD5D",
  danger: "#FF2E63",
}

interface DashboardViewProps {
  cycle: string
  startDay: number
  onSeeAll: () => void
  onGoPlan: () => void
}

export function DashboardView({ cycle, startDay, onSeeAll, onGoPlan }: DashboardViewProps) {
  const tx = useTransactions(cycle, startDay)
  const profile = useProfile()

  const stats = useMemo(() => computeCycleStats(tx.data ?? [], cycle, startDay), [tx.data, cycle, startDay])

  const status = useMemo(() => {
    const p = profile.data?.profile
    if (!p) return null
    return computePlanStatus(
      { name: p.name, income: p.income, payday: p.payday, cycleStartDay: p.cycleStartDay, savingsMode: p.savingsMode as never, savingsAmount: p.savingsAmount, savingsPercent: p.savingsPercent },
      profile.data?.fixed ?? [],
      cycle,
      { totalExpense: stats.totalExpense, totalIncome: stats.totalIncome, dayNum: stats.dayNum }
    )
  }, [profile.data, stats, cycle])

  const dailyBars = useMemo(() => {
    if (!tx.data) return []
    const total = daysInCycle(cycle, startDay)
    const arr: { day: number; amount: number }[] = []
    for (let d = 1; d <= total; d++) arr.push({ day: d, amount: 0 })
    for (const t of tx.data) {
      if (t.type !== "expense") continue
      const day = cycleDayOf(new Date(t.date), cycle)
      if (day !== null && day <= total) arr[day - 1].amount += t.amount
    }
    return arr
  }, [tx.data, cycle, startDay])

  const recent = useMemo(() => (tx.data ?? []).slice(0, 5), [tx.data])

  if (tx.isLoading || profile.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-56 rounded-3xl" />
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-24 rounded-2xl" /><Skeleton className="h-24 rounded-2xl" /><Skeleton className="h-24 rounded-2xl" />
        </div>
        <Skeleton className="h-52 rounded-3xl" />
      </div>
    )
  }

  const name = profile.data?.profile?.name ?? ""
  const spentToday = stats.spentToday

  return (
    <div className="space-y-5 mifa-stagger">
      {/* ── سلام و تاریخ ── */}
      <div className="flex items-end justify-between pt-1">
        <div>
          <p className="text-body-sm text-muted-foreground">سلام {name}</p>
          <h1 className="mifa-h3 mt-1">{fullJalaliDate(new Date())}</h1>
        </div>
      </div>

      {/* ── کارت هیرو: سقف خرج امروز ── */}
      {status && (
        <section className="hero-card rounded-3xl p-6 text-white" aria-label="وضعیت پول امروز">
          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 sm:gap-5">
            {/* حلقه پیشرفت */}
            <div className="relative shrink-0" style={{ width: 132, height: 132 }}>
              <svg viewBox="0 0 132 132" className="w-full h-full -rotate-90">
                <circle cx="66" cy="66" r="56" fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="11" />
                <circle
                  cx="66" cy="66" r="56" fill="none"
                  stroke={STATUS_COLOR[status.status]}
                  strokeWidth="11" strokeLinecap="round"
                  strokeDasharray={`${Math.min(status.spentPct, 100) * 3.517} 999`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[10px] text-white/55">خرج از پول آزاد</span>
                <span className="numeric text-lg font-extrabold" style={{ color: STATUS_COLOR[status.status] }}>
                  {formatPercent(status.spentPct)}
                </span>
              </div>
            </div>

            {/* عدد اصلی */}
            <div className="flex-1 min-w-0 text-center sm:text-start">
              {status.isCurrent ? (
                <>
                  <p className="text-caption text-white/60">امروز مجاز به خرجی:</p>
                  <div className="flex items-baseline justify-center sm:justify-start gap-1.5 mt-1 flex-wrap">
                    <span className="numeric text-[34px] leading-none font-black sm:mifa-display text-glow" style={{ color: STATUS_COLOR[status.status] }}>
                      {formatAmount(status.dailyAllowance)}
                    </span>
                    <span className="text-body text-white/70">تومان</span>
                  </div>
                  <p className="text-caption text-white/55 mt-2 numeric">
                    خرج امروز: {formatAmount(spentToday)} تومان
                    {status.dailyAllowance > 0 && spentToday <= status.dailyAllowance
                      ? ` — ${formatAmount(status.dailyAllowance - spentToday)} جا داری`
                      : spentToday > 0 && status.dailyAllowance > 0
                        ? " — سقف امروز پر شده!"
                        : ""}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-caption text-white/60">مجموع خرج {cycleLabel(cycle, startDay)}:</p>
                  <div className="flex items-baseline justify-center sm:justify-start gap-1.5 mt-1 flex-wrap">
                    <span className="numeric text-[34px] leading-none font-black sm:mifa-display">{formatAmount(stats.totalExpense)}</span>
                    <span className="text-body text-white/70">تومان</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* نوار وضعیت: پول نگه‌داشته‌شده */}
          <div className="relative z-10 mt-5 rounded-2xl bg-white/[0.08] border border-white/10 px-4 py-3 flex items-center gap-3">
            <PiggyBank className="w-5 h-5 shrink-0" style={{ color: STATUS_COLOR[status.status] }} />
            <div className="flex-1 min-w-0">
              <p className="text-body-sm font-bold">
                با این روال آخر دوره <span className="numeric" style={{ color: STATUS_COLOR[status.status] }}>{formatAmount(Math.max(0, status.kept))}</span> تومان برات می‌مونه
              </p>
              <p className="text-caption text-white/55 mt-0.5">
                شامل {formatCompact(status.plan.savings)} پس‌انداز {status.isCurrent ? `و ${toPersianDigits(status.daysLeft)} روز تا آخر دوره` : ""}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ── بنر هشدار/تشویق ── */}
      {status && status.isCurrent && stats.totalExpense > 0 && (
        <div className={`rounded-2xl border px-4 py-3.5 flex items-start gap-3 ${
          status.status === "danger"
            ? "border-[#FF2E63]/40 bg-[#FF2E63]/[0.08]"
            : status.status === "watch"
              ? "border-[#E2AD5D]/40 bg-[#E2AD5D]/[0.08]"
              : "border-[#08D9D6]/40 bg-[#08D9D6]/[0.08]"
        }`}>
          {status.status === "danger" ? (
            <AlertTriangle className="w-5 h-5 text-[#FF5B83] shrink-0 mt-0.5" />
          ) : (
            <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          )}
          <p className="text-body-sm leading-6">
            {status.statusText}
            {status.projectedFlexibleLeft < 0 && (
              <> — حدود <span className="numeric font-bold">{formatAmount(Math.abs(status.projectedFlexibleLeft))}</span> تومان از پس‌انداز خورده می‌شه</>
            )}
            {status.projectedFlexibleLeft > 0 && status.status === "safe" && (
              <> — حدود <span className="numeric font-bold text-primary">{formatAmount(status.projectedFlexibleLeft)}</span> تومان هم آزادِ اضافه می‌مونه</>
            )}
          </p>
        </div>
      )}

      {/* ── چیپ‌های آمار ── */}
      {status && (
        <div className="grid grid-cols-3 gap-3">
          <StatChip icon={<Wallet className="w-4 h-4" />} label="خرج امروز" value={formatCompact(spentToday)} />
          <StatChip icon={<Flame className="w-4 h-4" />} label="خرج این دوره" value={formatCompact(stats.totalExpense)} />
          <StatChip
            icon={status.overFlexible ? <TrendingUp className="w-4 h-4 text-[#FF5B83]" /> : <TrendingDown className="w-4 h-4 text-primary" />}
            label="پول آزاد باقی‌مانده"
            value={formatCompact(Math.max(0, status.remainingFlexible))}
            danger={status.overFlexible}
          />
        </div>
      )}

      {/* ── خالی بودن دوره ── */}
      {(tx.data ?? []).length === 0 && (
        <div className="rounded-3xl border border-dashed border-border px-6 py-10 text-center">
          <Sparkles className="w-8 h-8 text-primary mx-auto" />
          <p className="mifa-h4 mt-3">اولین خرجت رو ثبت کن</p>
          <p className="text-body-sm text-muted-foreground mt-1.5">
            مبلغ رو بزن و دسته رو انتخاب کن — ده ثانیه بیشتر طول نمی‌کشه
          </p>
        </div>
      )}

      {/* ── نشت پول: سه دستهٔ اصلی ── */}
      {stats.byCategory.length > 0 && (
        <section className="glass rounded-3xl p-5">
          <div className="flex items-center justify-between">
            <h2 className="mifa-h4">پول کجا نشت می‌کنه؟</h2>
            <button onClick={onGoPlan} className="text-caption text-primary font-semibold hover:underline inline-flex items-center gap-1">
              برنامه <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="mt-4 space-y-3.5">
            {stats.byCategory.slice(0, 3).map((s, i) => {
              const pct = stats.totalExpense > 0 ? (s.amount / stats.totalExpense) * 100 : 0
              return (
                <div key={s.category} className="flex items-center gap-3">
                  <CategoryBadge id={s.category} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-body-sm font-semibold">{getCategory(s.category).name}</span>
                      <span className="numeric text-caption text-muted-foreground">{formatPercent(pct)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted mt-1.5 overflow-hidden">
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${Math.max(pct, 3)}%`, backgroundColor: getCategory(s.category).color }} />
                    </div>
                  </div>
                  <span className="numeric text-body-sm font-bold w-24 text-left">{formatAmount(s.amount)}</span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ── نمودار روزانه ── */}
      {dailyBars.length > 0 && stats.totalExpense > 0 && (
        <section className="glass rounded-3xl p-5">
          <h2 className="mifa-h4">خرج روزهای {cycleLabel(cycle, startDay)}</h2>
          <div className="mt-4">
            <DailyBars bars={dailyBars} height={96} todayIndex={status?.isCurrent ? stats.dayNum - 1 : -1} />
            <div className="flex justify-between text-caption text-muted-foreground mt-2 numeric">
              <span>روز ۱</span>
              <span>{status?.isCurrent ? `امروز (${toPersianDigits(stats.dayNum)})` : ""}</span>
              <span>روز {toPersianDigits(stats.daysInPeriod)}</span>
            </div>
          </div>
        </section>
      )}

      {/* ── تراکنش‌های اخیر ── */}
      <section className="glass rounded-3xl p-5">
        <div className="flex items-center justify-between">
          <h2 className="mifa-h4">آخرین تراکنش‌ها</h2>
          <button onClick={onSeeAll} className="text-caption text-primary font-semibold hover:underline">
            دیدن همه
          </button>
        </div>
        {recent.length === 0 ? (
          <p className="text-body-sm text-muted-foreground py-6 text-center">هنوز چیزی ثبت نشده</p>
        ) : (
          <ul className="divide-y divide-border mt-1">
            {recent.map((t: Transaction) => (
              <li key={t.id} className="flex items-center gap-3 py-3">
                <CategoryBadge id={t.category} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-body-sm font-medium truncate">{t.title ?? getCategory(t.category).name}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{fullJalaliDate(new Date(t.date))}</p>
                </div>
                <span className={`numeric font-bold text-body ${t.type === "income" ? "text-[#2BD38B]" : "text-foreground"}`}>
                  {t.type === "income" ? "+" : "−"}{formatAmount(t.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function StatChip({ icon, label, value, danger = false }: { icon: React.ReactNode; label: string; value: string; danger?: boolean }) {
  return (
    <div className="glass rounded-2xl px-3 py-3.5 text-center">
      <span className={`inline-flex w-8 h-8 rounded-lg items-center justify-center ${danger ? "text-[#FF5B83]" : "text-primary"}`}>
        {icon}
      </span>
      <p className="numeric text-body font-extrabold mt-1.5">{value}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
    </div>
  )
}
