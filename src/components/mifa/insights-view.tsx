"use client"

// تحلیل MIFA — نشت پول، بزرگ‌ترین خرج، میانگین روزانه و پیش‌بینی آخر دوره
import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { CategoryBadge } from "./mifa-icons"
import { useProfile, useTransactions } from "./mifa-hooks"
import {
  computeLeaks, computeSnapshot, cycleByCategory, cycleFacts, type PlanSnapshot,
} from "@/lib/mifa/mifa-logic"
import { planCtxFrom } from "@/lib/mifa/cycle"
import { getCategory } from "@/lib/mifa/categories"
import { formatAmount, formatCompact, formatPercent, toPersianDigits } from "@/lib/mifa/format"
import { TrendingDown, TrendingUp, SearchCheck, CalendarClock, PieChart, Sparkles } from "lucide-react"

export function InsightsView({ cycle }: { cycle: string }) {
  const profile = useProfile()
  const txs = useTransactions()

  const p = profile.data?.profile ?? null
  const transactions = txs.data ?? []
  const ctx = useMemo(() => planCtxFrom(p), [p])

  const snapshot: PlanSnapshot | null = useMemo(() => {
    if (!p) return null
    return computeSnapshot(p, transactions, cycle)
  }, [p, transactions, cycle])

  const leaks = useMemo(() => {
    if (!p) return []
    const facts = cycleFacts(cycle, ctx)
    return computeLeaks(transactions, facts, ctx)
  }, [p, transactions, cycle, ctx])

  const extra = useMemo(() => {
    if (!snapshot) return null
    const inCycle = transactions.filter((t) => {
      const d = new Date(t.date)
      return d >= snapshot.facts.start && d < snapshot.facts.end
    })
    const biggest = inCycle
      .filter((t) => t.type === "expense")
      .reduce<{ tx: typeof inCycle[number] | null; amount: number }>((acc, t) => (t.amount > acc.amount ? { tx: t, amount: t.amount } : acc), { tx: null, amount: 0 })
    const elapsed = Math.max(1, snapshot.facts.activeDays - snapshot.facts.daysLeft)
    const dailyAvg = Math.round(snapshot.spent / elapsed)
    const byCat = cycleByCategory(transactions, snapshot.facts)
    return { biggest: biggest.tx, dailyAvg, byCat, elapsed }
  }, [snapshot, transactions])

  if (!p || !snapshot || !extra) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-40 rounded-3xl" />
        <Skeleton className="h-64 rounded-3xl" />
      </div>
    )
  }

  const hasData = snapshot.spent > 0

  return (
    <div className="space-y-6 mifa-stagger">
      {/* ── پیش‌بینی آخر دوره ── */}
      <section className={`rounded-[28px] p-6 border ${toneCard(snapshot.tone)}`} aria-label="پیش‌بینی آخر دوره">
        <div className="flex items-center gap-2.5 mb-3">
          <span className={`w-10 h-10 rounded-2xl flex items-center justify-center ${toneIconBg(snapshot.tone)}`}>
            {snapshot.tone === "safe" ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
          </span>
          <h2 className="mifa-h4 text-foreground">اگر همین‌طور خرج کنی…</h2>
        </div>
        {hasData ? (
          <p className="mifa-body-sm text-muted-foreground leading-7">
            آخر دوره{" "}
            <span className={`numeric font-extrabold ${snapshot.projectedDiff < 0 ? "text-mifa-rose" : "text-primary"}`}>
              {formatAmount(Math.abs(snapshot.projectedDiff))} تومان{" "}
              {snapshot.projectedDiff < 0 ? "کم" : "زیاد"} می‌آوری
            </span>
            {" "}— با روال فعلی تا آخر دوره حدود{" "}
            <span className="numeric font-bold text-foreground">{formatAmount(snapshot.projectedSpend)}</span> تومان خرج می‌کنی
            (سقف: <span className="numeric font-bold text-foreground">{formatAmount(snapshot.cycleBudget + snapshot.incomeExtra)}</span>).
          </p>
        ) : (
          <p className="mifa-body-sm text-muted-foreground">
            هنوز خرجی در این دوره ثبت نشده. اولین خرجت را ثبت کن تا پیش‌بینی دقیق شود.
          </p>
        )}
      </section>

      {/* ── نشت پول ── */}
      <section aria-label="نشت پول">
        <div className="flex items-center gap-2 mb-3 px-1">
          <SearchCheck className="w-5 h-5 text-mifa-rose" />
          <h2 className="mifa-h4 text-foreground">نشت پول کجاست؟</h2>
        </div>
        {leaks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/40 px-4 py-8 text-center">
            <PieChart className="w-7 h-7 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-body-sm text-muted-foreground">هنوز خرجی برای تحلیل نیست</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaks.map((leak, i) => {
              const cat = getCategory(leak.category)
              const isTop = i === 0
              return (
                <div key={leak.category} className={`rounded-2xl border p-4 bg-card/60 ${isTop ? "border-mifa-rose/35" : "border-border"}`}>
                  <div className="flex items-center gap-3">
                    <CategoryBadge id={leak.category} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm font-extrabold text-foreground">{cat.name}</p>
                      <p className="text-caption text-muted-foreground">
                        {formatPercent(leak.pct)} از خرج دوره
                        {leak.prevAmount !== null && (
                          <>
                            {" "}· دوره قبل: <span className="numeric">{formatCompact(leak.prevAmount)}</span>
                          </>
                        )}
                      </p>
                    </div>
                    <div className="text-end shrink-0">
                      <p className={`numeric text-body-sm font-extrabold ${isTop ? "text-mifa-rose" : "text-foreground"}`}>
                        {formatAmount(leak.amount)}
                      </p>
                      {leak.deltaPct !== null && (
                        <p className={`numeric text-[10px] font-bold ${leak.deltaPct > 0 ? "text-mifa-rose" : "text-mifa-success"}`}>
                          {leak.deltaPct > 0 ? "▲" : "▼"} {formatPercent(Math.abs(leak.deltaPct))}
                        </p>
                      )}
                    </div>
                  </div>
                  {/* نوار سهم */}
                  <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden" role="img" aria-label={`سهم ${cat.name}: ${formatPercent(leak.pct)}`}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(leak.pct, 100)}%`, background: isTop ? "#FF2E63" : cat.color }}
                    />
                  </div>
                </div>
              )
            })}
            {leaks.length > 0 && (
              <p className="text-caption text-muted-foreground px-1">
                نشت پول یعنی دسته‌هایی که بی‌سروصدا بیشترین پول را می‌برند — روی بزرگ‌ترین‌شان متمرکز شو.
              </p>
            )}
          </div>
        )}
      </section>

      {/* ── ردیف آمار ── */}
      <section className="grid grid-cols-2 gap-3" aria-label="آمار دوره">
        <div className="rounded-2xl border border-border bg-card/60 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-mifa-warning" />
            <span className="text-caption text-muted-foreground">بزرگ‌ترین خرج</span>
          </div>
          {extra.biggest ? (
            <>
              <p className="numeric text-body font-extrabold text-foreground">{formatAmount(extra.biggest.amount)}</p>
              <p className="text-caption text-muted-foreground truncate mt-0.5">
                {extra.biggest.title || getCategory(extra.biggest.category).name}
              </p>
            </>
          ) : (
            <p className="text-body-sm text-muted-foreground">—</p>
          )}
        </div>
        <div className="rounded-2xl border border-border bg-card/60 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CalendarClock className="w-4 h-4 text-primary" />
            <span className="text-caption text-muted-foreground">میانگین روزانه</span>
          </div>
          <p className="numeric text-body font-extrabold text-foreground">{formatAmount(extra.dailyAvg)}</p>
          <p className="text-caption text-muted-foreground mt-0.5">
            در {toPersianDigits(extra.elapsed)} روزِ گذشته
          </p>
        </div>
      </section>

      {/* ── ترکیب دسته‌ها ── */}
      {extra.byCat.length > 0 && (
        <section aria-label="ترکیب خرج‌ها">
          <h2 className="mifa-h4 text-foreground mb-3 px-1">ترکیب خرج‌های دوره</h2>
          <div className="rounded-2xl border border-border bg-card/60 p-4 space-y-3">
            {extra.byCat.map((c) => {
              const cat = getCategory(c.category)
              const pct = snapshot.spent > 0 ? (c.amount / snapshot.spent) * 100 : 0
              return (
                <div key={c.category} className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} aria-hidden="true" />
                  <span className="text-caption font-bold text-foreground w-16 shrink-0 truncate">{cat.name}</span>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: cat.color }} />
                  </div>
                  <span className="numeric text-caption text-muted-foreground w-16 text-end shrink-0">{formatCompact(c.amount)}</span>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}

function toneCard(tone: PlanSnapshot["tone"]): string {
  switch (tone) {
    case "safe": return "bg-primary/10 border-primary/30"
    case "watch": return "bg-mifa-warning/10 border-mifa-warning/30"
    case "danger": return "bg-mifa-rose/10 border-mifa-rose/30"
  }
}

function toneIconBg(tone: PlanSnapshot["tone"]): string {
  switch (tone) {
    case "safe": return "bg-primary/20 text-primary"
    case "watch": return "bg-mifa-warning/20 text-mifa-warning"
    case "danger": return "bg-mifa-rose/20 text-mifa-rose"
  }
}
