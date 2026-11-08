"use client"

// نمای برنامه MIFA — تفکیک درآمد، خرج ثابت، پس‌انداز و پول آزاد + ویرایش
import { useMemo, useState } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { OnboardingWizard } from "./onboarding"
import { CategoryIcon } from "./mifa-icons"
import { useProfile } from "./mifa-hooks"
import { buildPlan } from "@/lib/mifa/plan"
import { formatAmount, formatCompact, toPersianDigits } from "@/lib/mifa/format"
import { cycleLabel, daysInCycle } from "@/lib/mifa/cycle"
import {
  Wallet, Home, PiggyBank, Sparkles, Landmark, Pencil,
  ShieldCheck, CalendarDays,
} from "lucide-react"

interface PlanViewProps {
  cycle: string
  startDay: number
}

export function PlanView({ cycle, startDay }: PlanViewProps) {
  const profile = useProfile()
  const [editOpen, setEditOpen] = useState(false)

  const plan = useMemo(() => {
    const p = profile.data?.profile
    if (!p) return null
    return buildPlan(
      { name: p.name, income: p.income, payday: p.payday, savingsMode: p.savingsMode as never, savingsAmount: p.savingsAmount, savingsPercent: p.savingsPercent },
      profile.data?.fixed ?? []
    )
  }, [profile.data])

  if (profile.isLoading) {
    return <div className="space-y-4"><Skeleton className="h-40 rounded-3xl" /><Skeleton className="h-64 rounded-3xl" /></div>
  }
  if (!plan) return null

  const fixed = profile.data?.fixed ?? []
  const daysTotal = daysInCycle(cycle, startDay)
  const dailyAtStart = Math.floor(plan.flexible / daysTotal)

  return (
    <div className="space-y-5 mifa-stagger">
      {/* ── سرتیتر ── */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="mifa-h2">برنامه دوره</h1>
          <p className="text-body-sm text-muted-foreground mt-1">پول‌ت اول تقسیم می‌شه، بعد خرج می‌کنی</p>
        </div>
        <button onClick={() => setEditOpen(true)}
          className="inline-flex items-center gap-2 rounded-2xl bg-primary/12 text-primary px-4 h-11 font-bold text-body-sm hover:bg-primary/20 transition-colors">
          <Pencil className="w-4 h-4" />
          ویرایش
        </button>
      </div>

      {/* ── نوار تفکیک ── */}
      <section className="hero-card rounded-3xl p-6 text-white" aria-label="تفکیک درآمد">
        <div className="relative z-10">
          <p className="text-caption text-white/60">درآمد دوره {cycleLabel(cycle, startDay)}</p>
          <p className="numeric mifa-display mt-1.5">{formatAmount(plan.income)}</p>
          <p className="text-caption text-white/55 mt-1">تومان</p>

          <div className="h-3.5 rounded-full overflow-hidden flex bg-white/10 mt-5" dir="ltr">
            {(() => {
              const inc = Math.max(plan.income, 1)
              const fixedPct = (plan.fixedTotal / inc) * 100
              const savPct = (plan.savings / inc) * 100
              const flexPct = Math.max(0, 100 - fixedPct - savPct)
              return (
                <>
                  <div style={{ width: `${fixedPct}%` }} className="bg-mifa-warning" />
                  <div style={{ width: `${savPct}%` }} className="bg-[#2BD38B]" />
                  <div style={{ width: `${flexPct}%` }} className="bg-gradient-to-r from-[#08D9D6] to-[#5CE7E3]" />
                </>
              )
            })()}
          </div>
        </div>
      </section>

      {/* ── ردیف‌های برنامه ── */}
      <section className="glass rounded-3xl overflow-hidden" aria-label="جزئیات برنامه">
        <div className="divide-y divide-border">
          <PlanRow
            icon={<Wallet className="w-4.5 h-4.5" />} color="#08D9D6"
            label="درآمد ماهانه" value={plan.income} bold />
          <PlanRow
            icon={<Landmark className="w-4.5 h-4.5" />} color="#7E9BC4"
            label={`روز واریز حقوق: ${toPersianDigits(profile.data?.profile?.payday ?? 1)}`}
            small />
          <PlanRow
            icon={<CalendarDays className="w-4.5 h-4.5" />} color="#08D9D6"
            label={`شروع دوره: روز ${toPersianDigits(startDay)} هر ماه — طول دوره ${toPersianDigits(daysTotal)} روز`}
            small />

          {/* خرج ثابت‌ها */}
          <div className="px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "#E2AD5D22", color: "#E2AD5D" }}>
                  <Home className="w-4.5 h-4.5" />
                </span>
                <div>
                  <p className="text-body-sm font-bold">خرج ثابت ماه</p>
                  <p className="text-caption text-muted-foreground">{toPersianDigits(fixed.length)} مورد</p>
                </div>
              </div>
              <span className="numeric font-bold text-body">{formatAmount(plan.fixedTotal)}</span>
            </div>
            {fixed.length > 0 && (
              <ul className="mt-3 space-y-2 ps-3">
                {fixed.map((f) => (
                  <li key={f.id} className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: "#E2AD5D1A", color: "#E2AD5D" }}>
                      <CategoryIcon id={f.icon} className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-body-sm text-muted-foreground flex-1 truncate">{f.label}</span>
                    <span className="numeric text-body-sm font-semibold">{formatAmount(f.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <PlanRow
            icon={<PiggyBank className="w-4.5 h-4.5" />} color="#2BD38B"
            label={plan.savingsLabel} value={plan.savings} bold />
        </div>
      </section>

      {/* ── پول آزاد ── */}
      <section className="rounded-3xl border border-primary/30 bg-primary/[0.08] p-5">
        <div className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-2xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
            <Sparkles className="w-5.5 h-5.5" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-body-sm font-bold">پول آزاد برای خرج کردن</p>
            <p className="text-caption text-muted-foreground mt-0.5">بعد از جدا شدن خرج ثابت و پس‌انداز</p>
          </div>
          <div className="text-left">
            <p className="numeric text-xl font-extrabold text-primary">{formatAmount(plan.flexible)}</p>
            <p className="text-[10px] text-muted-foreground">تومان در ماه</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-primary/20 flex items-center gap-2.5">
          <CalendarDays className="w-4.5 h-4.5 text-primary shrink-0" />
          <p className="text-body-sm text-muted-foreground">
            یعنی از اول دوره هر روز حدود <span className="numeric font-bold text-foreground">{formatAmount(dailyAtStart)}</span> تومان جا داری
          </p>
        </div>
      </section>

      {/* ── یادآوری منطق ── */}
      <div className="flex items-start gap-2.5 px-2 pb-2">
        <ShieldCheck className="w-4.5 h-4.5 text-primary shrink-0 mt-0.5" />
        <p className="text-caption text-muted-foreground leading-5">
          MIFA اول پس‌اندازت رو کنار می‌ذاره، خرج ثابت‌ها رو جدا می‌کنه و بقیه رو خرج آزاد می‌دونه.
          تا وقتی خرج روزانه‌ت زیر سقف بمونه، آخر ماه پولت سر جاشه.
        </p>
      </div>

      {/* ── دیالوگ ویرایش برنامه ── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg max-h-[94vh] overflow-y-auto">
          <DialogTitle className="sr-only">ویرایش برنامه دوره</DialogTitle>
          <OnboardingWizard editMode onDone={() => setEditOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PlanRow({ icon, color, label, value, bold = false, small = false }: {
  icon: React.ReactNode; color: string; label: string; value?: number; bold?: boolean; small?: boolean
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-4">
      <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}22`, color }}>
        {icon}
      </span>
      <p className={`flex-1 ${small ? "text-body-sm text-muted-foreground" : "text-body-sm font-bold"}`}>{label}</p>
      {value !== undefined && (
        <span className={`numeric ${bold ? "font-extrabold text-body" : "font-semibold text-body-sm"}`}>{formatAmount(value)}</span>
      )}
    </div>
  )
}
