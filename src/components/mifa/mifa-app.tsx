"use client"

// پوسته اصلی MIFA v2 — گیت onboarding، هدر، داک شناور و ناوبری (بر پایه دوره مالی)
import { useEffect, useState } from "react"
import { RibbonMark, MifaWordmark } from "./mifa-logo"
import { OnboardingWizard } from "./onboarding"
import { DashboardView } from "./dashboard-view"
import { TransactionsView } from "./transactions-view"
import { PlanView } from "./plan-view"
import { InsightsView } from "./insights-view"
import { SettingsView } from "./settings-view"
import { QuickAddDialog } from "./quick-add-dialog"
import { currentCycleKey, cycleLabel, shiftCycleKey } from "@/lib/mifa/cycle"
import { todayJalali } from "@/lib/mifa/jalali"
import { useProfile } from "./mifa-hooks"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, LayoutDashboard, ListOrdered, MapPinned, TrendingUp, Settings, Sun, Moon, ChevronRight, ChevronLeft } from "lucide-react"

type Tab = "dashboard" | "transactions" | "plan" | "insights" | "settings"

const TABS: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "خانه", icon: LayoutDashboard },
  { id: "transactions", label: "تراکنش‌ها", icon: ListOrdered },
  { id: "plan", label: "برنامه", icon: MapPinned },
  { id: "insights", label: "تحلیل", icon: TrendingUp },
]

export function MifaApp() {
  const profile = useProfile()
  const [tab, setTab] = useState<Tab>("dashboard")
  const [cycleOverride, setCycleOverride] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const { setTheme, resolvedTheme } = useTheme()
  const today = todayJalali()

  const startDay = profile.data?.profile?.cycleStartDay ?? 1
  const cycle = cycleOverride ?? currentCycleKey(startDay)

  // با تغییر روز شروع دوره، برگرد به دوره جاری
  useEffect(() => {
    setCycleOverride(null)
  }, [startDay])

  // ── لودینگ اولیه ──
  if (profile.isLoading) {
    return (
      <div className="mifa-bg">
        <div className="relative z-10 max-w-lg mx-auto px-5 pt-10 space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-11 w-40 rounded-2xl" />
            <Skeleton className="h-11 w-11 rounded-2xl" />
          </div>
          <Skeleton className="h-52 rounded-3xl" />
          <div className="grid grid-cols-2 gap-4"><Skeleton className="h-24 rounded-2xl" /><Skeleton className="h-24 rounded-2xl" /></div>
          <Skeleton className="h-64 rounded-3xl" />
        </div>
      </div>
    )
  }

  // ── onboarding اولین ورود ──
  if (!profile.data?.profile) {
    return (
      <div className="mifa-bg">
        <div className="relative z-10 min-h-screen flex flex-col justify-center max-w-lg mx-auto px-5 py-10">
          <OnboardingWizard />
        </div>
      </div>
    )
  }

  const currentCycle = currentCycleKey(startDay)
  const isCurrent = cycle === currentCycle
  const canGoNext = cycle < currentCycle
  const toggleTheme = () => setTheme(resolvedTheme === "dark" ? "light" : "dark")

  return (
    <div className="mifa-bg">
      {/* ── هدر ── */}
      <header className="sticky top-0 z-40 bg-background/70 backdrop-blur-xl border-b border-border">
        <div className="max-w-lg mx-auto px-5 h-[68px] flex items-center justify-between gap-3">
          <button onClick={() => setTab("dashboard")} className="flex items-center gap-2.5 min-w-0" aria-label="خانه MIFA">
            <RibbonMark size={38} />
            <MifaWordmark tagline={false} />
          </button>

          {/* انتخاب دوره */}
          {tab !== "settings" && (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" disabled={!canGoNext}
                onClick={() => setCycleOverride(shiftCycleKey(cycle, 1))} aria-label="دوره بعد">
                <ChevronRight className="w-5 h-5" />
              </Button>
              <button
                onClick={() => setCycleOverride(null)}
                className={`min-w-28 max-w-40 text-center rounded-xl px-2 py-1.5 text-body-sm font-bold transition-colors truncate ${
                  isCurrent ? "text-primary" : "text-foreground hover:bg-muted"
                }`}
                title="برگشت به دوره جاری">
                {cycleLabel(cycle, startDay)}
              </button>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl"
                onClick={() => setCycleOverride(shiftCycleKey(cycle, -1))} aria-label="دوره قبل">
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </div>
          )}

          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl"
            onClick={() => setTab("settings")} aria-label="تنظیمات">
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* ── محتوا ── */}
      <main className="relative z-10 w-full max-w-lg mx-auto px-5 py-5 pb-36">
        {tab === "dashboard" && <DashboardView cycle={cycle} startDay={startDay} onSeeAll={() => setTab("transactions")} onGoPlan={() => setTab("plan")} />}
        {tab === "transactions" && <TransactionsView cycle={cycle} startDay={startDay} />}
        {tab === "plan" && <PlanView cycle={cycle} startDay={startDay} />}
        {tab === "insights" && <InsightsView cycle={cycle} startDay={startDay} />}
        {tab === "settings" && <SettingsView onGoBack={() => setTab("dashboard")} />}
      </main>

      {/* ── دیالوگ ثبت ── */}
      <QuickAddDialog open={addOpen} onOpenChange={setAddOpen} />

      {/* ── داک شناور پایین ── */}
      <nav className="fixed bottom-0 inset-x-0 z-40 pb-[calc(env(safe-area-inset-bottom)+14px)] pt-2 pointer-events-none"
        aria-label="ناوبری اصلی">
        <div className="max-w-lg mx-auto px-5 flex items-center justify-center">
          <div className="dock pointer-events-auto rounded-[26px] px-2 py-1.5 flex items-center gap-1 relative">
            {TABS.slice(0, 2).map((t) => (
              <DockItem key={t.id} t={t} active={tab === t.id} onClick={() => setTab(t.id)} />
            ))}

            {/* دکمه ثبت مرکزی */}
            <button
              onClick={() => setAddOpen(true)}
              className="mx-1.5 h-14 w-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-[0_8px_28px_-4px_rgba(8,217,214,0.6)] hover:bg-primary/95 active:scale-95 transition-transform shrink-0"
              aria-label="ثبت خرج جدید">
              <Plus className="w-7 h-7" strokeWidth={2.6} />
            </button>

            {TABS.slice(2).map((t) => (
              <DockItem key={t.id} t={t} active={tab === t.id} onClick={() => setTab(t.id)} />
            ))}
          </div>
        </div>
      </nav>

      {/* دکمه تم شناور بالا-چپ برای دسترسی سریع */}
      <button
        onClick={toggleTheme}
        className="fixed z-40 bottom-8 start-5 h-11 w-11 rounded-2xl glass flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        aria-label="تغییر تم">
        <Sun className="w-5 h-5 hidden dark:block" />
        <Moon className="w-5 h-5 dark:hidden" />
      </button>
    </div>
  )
}

function DockItem({ t, active, onClick }: { t: { id: Tab; label: string; icon: typeof LayoutDashboard }; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`flex flex-col items-center justify-center gap-0.5 h-14 w-[68px] rounded-2xl transition-colors ${
        active ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
      }`}>
      <t.icon className="w-5 h-5" strokeWidth={active ? 2.4 : 2} />
      <span className={`text-[10px] ${active ? "font-bold" : "font-medium"}`}>{t.label}</span>
    </button>
  )
}
