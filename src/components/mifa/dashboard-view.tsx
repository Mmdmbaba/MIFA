"use client"

// خانه MIFA — کارت هیرو «امروز می‌توانی X تومان خرج کنی» + آمار دوره + تراکنش‌های اخیر
import { useMemo } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { CategoryBadge } from "./mifa-icons"
import { useProfile, useTransactions } from "./mifa-hooks"
import { computeSnapshot, groupByDay, type PlanSnapshot } from "@/lib/mifa/mifa-logic"
import { currentCycleKey } from "@/lib/mifa/cycle"
import { getCategory } from "@/lib/mifa/categories"
import { formatAmount, toPersianDigits } from "@/lib/mifa/format"
import { CATEGORIES } from "@/lib/mifa/categories"
import {
  ArrowLeft, PiggyBank, Wallet, CalendarRange, Flame, TriangleAlert,
} from "lucide-react"

export function DashboardView({
  cycle,
  onSeeAll,
  onQuickAdd,
  onGoInsights,
}: {
  cycle: string
  onSeeAll: () => void
  onQuickAdd: (category?: string) => void
  onGoInsights: () => void
}) {
  const profile = useProfile()
  const txs = useTransactions()

  const p = profile.data?.profile ?? null
  const transactions = txs.data ?? []

  const snapshot: PlanSnapshot | null = useMemo(() => {
    if (!p) return null
    return computeSnapshot(p, transactions, cycle)
  }, [p, transactions, cycle])

  const isCurrent = !!snapshot && cycle === currentCycleKey(p?.cycleAnchorDay ?? 1, p?.onboardedAt)

  const recent = useMemo(() => [...transactions].slice(0, 5), [transactions])
  const recentGroups = useMemo(() => groupByDay(recent), [recent])

  if (!p || !snapshot) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-60 rounded-3xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
    )
  }

  const overToday = snapshot.remainingToday < 0
  const ringPct =
    snapshot.dailyAllowance > 0
      ? Math.min(snapshot.spentToday / snapshot.dailyAllowance, 1)
      : snapshot.spentToday > 0
        ? 1
        : 0

  return (
    <div className="space-y-6 mifa-stagger">
      {/* ── کارت هیرو ── */}
      <section className="hero-card rounded-[28px] p-6" aria-label="سقف خرج امروز">
        <div className="flex items-center gap-5">
          {/* حلقه پیشرفت */}
          <div className="relative shrink-0" style={{ width: 108, height: 108 }}>
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
              <circle cx="60" cy="60" r="52" fill="none" stroke="var(--ring-track)" strokeWidth="10" />
              <motion.circle
                cx="60" cy="60" r="52" fill="none"
                stroke={overToday ? "#FF2E63" : "#08D9D6"}
                strokeWidth="10" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 52}
                initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 52 * (1 - ringPct) }}
                transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
                style={{ filter: `drop-shadow(0 0 8px ${overToday ? "rgba(255,46,99,0.5)" : "rgba(8,217,214,0.5)"})` }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[10px] font-bold" style={{ color: "rgba(234,234,234,0.6)" }}>از سقف امروز</span>
              <span className="numeric text-body font-extrabold" style={{ color: overToday ? "#FF7D9F" : "#5DE6E2" }}>
                {toPersianDigits(Math.round(ringPct * 100))}٪
              </span>
            </div>
          </div>

          {/* عدد اصلی */}
          <div className="flex-1 min-w-0">
            {isCurrent ? (
              <>
                <p className="text-body-sm" style={{ color: "rgba(234,234,234,0.72)" }}>
                  {overToday ? "امروز از سقف رد شدی —" : "امروز می‌توانی خرج کنی"}
                </p>
                <p className={`numeric text-[30px] leading-tight font-black mt-1 ${overToday ? "text-glow-rose" : "text-glow"}`}
                  style={{ color: overToday ? "#FF7D9F" : "#5DE6E2" }}>
                  {formatAmount(Math.abs(snapshot.remainingToday))}
                </p>
                <p className="text-caption mt-1" style={{ color: "rgba(234,234,234,0.6)" }}>
                  {overToday ? "تومان بیشتر از سقف امروز" : "تومان تا آخر امروز"} · سقف: {formatAmount(snapshot.dailyAllowance)}
                </p>
              </>
            ) : (
              <>
                <p className="text-body-sm" style={{ color: "rgba(234,234,234,0.72)" }}>این دوره گذشته — برای مرور:</p>
                <p className="numeric text-[26px] leading-tight font-black mt-1" style={{ color: "#EAEAEA" }}>
                  {formatAmount(snapshot.spent)} تومان
                </p>
                <p className="text-caption mt-1" style={{ color: "rgba(234,234,234,0.6)" }}>مجموع خرج این دوره</p>
              </>
            )}
          </div>
        </div>

        {/* خط پیش‌بینی */}
        <button
          onClick={onGoInsights}
          className="mt-5 w-full flex items-center gap-2 rounded-2xl px-3.5 py-2.5 text-start transition-colors hover:bg-white/5"
          style={{ background: "rgba(255,255,255,0.05)" }}
        >
          {snapshot.tone === "danger" ? (
            <TriangleAlert className="w-4.5 h-4.5 shrink-0" style={{ color: "#FF7D9F" }} />
          ) : (
            <Flame className="w-4.5 h-4.5 shrink-0" style={{ color: "#5DE6E2" }} />
          )}
          <span className="text-caption flex-1" style={{ color: "rgba(234,234,234,0.78)" }}>
            {snapshot.toneText}
            {snapshot.tone !== "safe" && snapshot.projectedDiff !== 0 && (
            <span className="numeric font-bold" style={{ color: snapshot.projectedDiff < 0 ? "#FF7D9F" : "#5DE6E2" }}>
              {" "}({formatAmount(Math.abs(snapshot.projectedDiff))} تومان {snapshot.projectedDiff < 0 ? "کم" : "زیاد"} می‌آوری)
            </span>
            )}
          </span>
          <ArrowLeft className="w-4 h-4 shrink-0" style={{ color: "rgba(234,234,234,0.5)" }} />
        </button>
      </section>

      {/* ── چیپ‌های آمار دوره ── */}
      <section className="grid grid-cols-3 gap-3" aria-label="آمار دوره">
        <StatChip
          icon={<CalendarRange className="w-4 h-4" />}
          tint="#D3A45B"
          label="صرف‌شده دوره"
          value={formatAmount(snapshot.spent)}
        />
        <StatChip
          icon={<Wallet className="w-4 h-4" />}
          tint="#08D9D6"
          label="باقی‌مانده دوره"
          value={formatAmount(Math.max(0, snapshot.remainingCycle))}
        />
        <StatChip
          icon={<PiggyBank className="w-4 h-4" />}
          tint="#55C49A"
          label="پس‌انداز ماه"
          value={formatAmount(snapshot.savings)}
        />
      </section>

      {/* ── ثبت سریع با یک لمس ── */}
      <section aria-label="ثبت سریع">
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="mifa-h4 text-foreground">ثبت سریع</h2>
          <span className="text-caption text-muted-foreground">یک لمس، خرج ثبت شود</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1.5 scroll-slim -mx-5 px-5">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => onQuickAdd(c.id)}
              className="shrink-0 flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-card/60 px-3.5 py-2.5 hover:border-primary/50 hover:bg-primary/5 transition-colors min-w-[72px]"
              aria-label={`ثبت خرج ${c.name}`}
            >
              <span className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${c.color}1f`, color: c.color }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5" aria-hidden="true">
                  {(c.id === "groceries" ? ["M3.5 9h17l-1.6 10.5H5.1L3.5 9Z", "M7 9l3-5M17 9l-3-5"] :
                    c.id === "transport" ? ["M5 17V7.5A2.5 2.5 0 0 1 7.5 5h9A2.5 2.5 0 0 1 19 7.5V17H5Z", "M5 11h14M8 17v2M16 17v2"] :
                    c.id === "home" ? ["m3.5 11 8.5-7 8.5 7", "M5.5 10v10h13V10"] :
                    c.id === "bills" ? ["M6 3.8h12v16.4l-3-1.8-3 1.8-3-1.8-3 1.8V3.8Z", "M9 8h6M9 12h6"] :
                    c.id === "entertainment" ? ["M4 6.5h16v11H4z", "m10 9.5 5 2.5-5 2.5v-5Z"] :
                    c.id === "health" ? ["M12 20s-7.5-4.4-7.5-10A4.2 4.2 0 0 1 12 7.3 4.2 4.2 0 0 1 19.5 10C19.5 15.6 12 20 12 20Z", "M12 9v6M9 12h6"] :
                    c.id === "clothing" ? ["m8 4 4 2 4-2 4 3-2.2 4-2.3-1.2V20H8.5V9.8L6.2 11 4 7l4-3Z"] :
                    c.id === "education" ? ["M4 5.5c3-1.5 5.7-1.2 8 1v13c-2.3-2.2-5-2.5-8-1v-13Z", "M20 5.5c-3-1.5-5.7-1.2-8 1v13c2.3-2.2 5-2.5 8-1v-13Z"] :
                    c.id === "gifts" ? ["M4 10h16v10H4zM3 7h18v3H3zM12 7v13"] :
                    ["M5 14.5c0-3.4 2.8-5.8 7-5.8s7 2.4 7 5.8V19H5v-4.5Z", "M8 8.5 6.5 6M16 8.5 17.5 6M9 14h.01M15 14h.01"]
                  ).map((d, i) => <path key={i} d={d} />)}
                </svg>
              </span>
              <span className="text-[11px] font-bold text-foreground leading-none">{c.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ── تراکنش‌های اخیر ── */}
      <section aria-label="تراکنش‌های اخیر">
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="mifa-h4 text-foreground">آخرین تراکنش‌ها</h2>
          <Button variant="ghost" size="sm" className="h-8 text-caption text-primary hover:text-primary rounded-lg" onClick={onSeeAll}>
            همه
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </div>
        {recentGroups.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/40 px-4 py-8 text-center">
            <p className="text-body-sm text-muted-foreground">هنوز چیزی ثبت نشده — با دکمه وسط یا چیپ‌های بالا شروع کن!</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card/60 divide-y divide-border overflow-hidden">
            {recentGroups.map((g) =>
              g.items.slice(0, 5).map((t) => (
                <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                  <CategoryBadge id={t.category} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm font-bold text-foreground truncate">{t.title || getCategory(t.category).name}</p>
                    <p className="text-caption text-muted-foreground">{g.label} · {getCategory(t.category).name}</p>
                  </div>
                  <span className={`numeric text-body-sm font-extrabold shrink-0 ${t.type === "expense" ? "text-foreground" : "text-mifa-success"}`}>
                    {t.type === "expense" ? "−" : "+"}
                    {formatAmount(t.amount)}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </section>
    </div>
  )
}

function StatChip({ icon, tint, label, value }: { icon: React.ReactNode; tint: string; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card/60 px-3 py-3 flex flex-col gap-1.5">
      <span className="w-7 h-7 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: `${tint}1f`, color: tint }}>
        {icon}
      </span>
      <span className="numeric text-body-sm font-extrabold text-foreground leading-none truncate" title={value}>{value}</span>
      <span className="text-[10px] font-semibold text-muted-foreground leading-none">{label}</span>
    </div>
  )
}
