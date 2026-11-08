"use client"

// پوسته اصلی MIFA v3 — گیت onboarding، هدر لاغر، نوار پایین با FAB مرکزی
import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { RibbonMark, MifaWordmark } from "./mifa-logo"
import { OnboardingWizard } from "./onboarding"
import { DashboardView } from "./dashboard-view"
import { TransactionsView } from "./transactions-view"
import { InsightsView } from "./insights-view"
import { SettingsView } from "./settings-view"
import { QuickAddDialog } from "./quick-add-dialog"
import { currentCycleKey, cycleLabel, shiftCycleKey } from "@/lib/mifa/cycle"
import { useProfile } from "./mifa-hooks"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Plus, House, ReceiptText, ChartNoAxesColumn, Settings, Sun, Moon,
  ChevronRight, ChevronLeft,
} from "lucide-react"

type Tab = "dashboard" | "transactions" | "insights" | "settings"

const TABS: { id: Tab; label: string; icon: typeof House }[] = [
  { id: "dashboard", label: "خانه", icon: House },
  { id: "transactions", label: "تراکنش‌ها", icon: ReceiptText },
  { id: "insights", label: "تحلیل", icon: ChartNoAxesColumn },
  { id: "settings", label: "تنظیمات", icon: Settings },
]

export function MifaApp() {
  const profile = useProfile()
  const [tab, setTab] = useState<Tab>("dashboard")
  const [cycleOverride, setCycleOverride] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [addCategory, setAddCategory] = useState<string | null>(null)
  const [wizardOpen, setWizardOpen] = useState(false)
  const { setTheme, resolvedTheme } = useTheme()

  const p = profile.data?.profile ?? null
  const onboarded = !!p?.onboarded
  const startDay = p?.cycleAnchorDay ?? 1
  const onboardedAt = p?.onboardedAt
  const cycle = cycleOverride ?? currentCycleKey(startDay, onboardedAt)

  // با تغییر روز شروع دوره، برگرد به دوره جاری
  const [prevStartDay, setPrevStartDay] = useState(startDay)
  if (prevStartDay !== startDay) {
    setPrevStartDay(startDay)
    setCycleOverride(null)
  }

  const toggleTheme = () => setTheme(resolvedTheme === "dark" ? "light" : "dark")
  const openAdd = (category?: string) => {
    setAddCategory(category ?? null)
    setAddOpen(true)
  }

  // ── لودینگ اولیه ──
  if (profile.isLoading) {
    return (
      <div className="mifa-bg">
        <div className="relative z-10 max-w-lg mx-auto px-5 pt-8 space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-11 w-36 rounded-2xl" />
            <Skeleton className="h-10 w-10 rounded-2xl" />
          </div>
          <Skeleton className="h-56 rounded-3xl" />
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
          </div>
          <Skeleton className="h-64 rounded-3xl" />
        </div>
      </div>
    )
  }

  // ── onboarding اولین ورود ──
  if (!onboarded) {
    return (
      <div className="mifa-bg">
        <div className="relative z-10 min-h-screen flex flex-col justify-center max-w-lg mx-auto px-5 py-8">
          <div className="flex items-center justify-center gap-2.5 mb-6">
            <RibbonMark size={30} />
            <MifaWordmark tagline={false} />
          </div>
          <OnboardingWizard />
        </div>
      </div>
    )
  }

  const currentCycle = currentCycleKey(startDay, onboardedAt)
  const isCurrent = cycle === currentCycle
  const canGoPrev = !!shiftCycleKey(cycle, -1, startDay, onboardedAt)
  const canGoNext = cycle < currentCycle

  return (
    <div className="mifa-bg">
      {/* ── هدر لاغر ── */}
      <header className="sticky top-0 z-40 bg-background/72 backdrop-blur-xl border-b border-border/70">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between gap-2">
          <button onClick={() => setTab("dashboard")} className="flex items-center gap-2.5 min-w-0" aria-label="خانه MIFA">
            <RibbonMark size={34} />
            <MifaWordmark tagline={false} />
          </button>

          {tab !== "settings" && (
            <div className="flex items-center gap-0.5">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" disabled={!canGoNext}
                onClick={() => setCycleOverride(shiftCycleKey(cycle, 1, startDay, onboardedAt))} aria-label="دوره بعد">
                <ChevronRight className="w-5 h-5" />
              </Button>
              <button
                onClick={() => setCycleOverride(null)}
                className={`min-w-24 max-w-36 text-center rounded-xl px-2 py-1.5 text-caption font-bold transition-colors truncate ${
                  isCurrent ? "text-primary" : "text-foreground hover:bg-muted"
                }`}
                title={isCurrent ? "دوره جاری" : "برگشت به دوره جاری"}>
                {cycleLabel(cycle, startDay, onboardedAt)}
              </button>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" disabled={!canGoPrev}
                onClick={() => setCycleOverride(shiftCycleKey(cycle, -1, startDay, onboardedAt))} aria-label="دوره قبل">
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </div>
          )}

          {tab === "settings" ? (
            <span className="w-9" aria-hidden="true" />
          ) : (
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl"
              onClick={toggleTheme} aria-label="تغییر تم روشن/تیره">
              <Sun className="w-5 h-5 hidden dark:block" />
              <Moon className="w-5 h-5 dark:hidden" />
            </Button>
          )}
        </div>
      </header>

      {/* ── محتوا ── */}
      <main className="relative z-10 w-full max-w-lg mx-auto px-5 py-5 pb-40">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.24, ease: [0.2, 0.8, 0.2, 1] }}
          >
            {tab === "dashboard" && (
              <DashboardView
                cycle={cycle}
                onSeeAll={() => setTab("transactions")}
                onQuickAdd={openAdd}
                onGoInsights={() => setTab("insights")}
              />
            )}
            {tab === "transactions" && <TransactionsView cycle={cycle} />}
            {tab === "insights" && <InsightsView cycle={cycle} />}
            {tab === "settings" && (
              <SettingsView
                onEditProgram={() => setWizardOpen(true)}
                onThemeChanged={toggleTheme}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ── ویرایش برنامه ── */}
      {wizardOpen && p && (
        <div className="fixed inset-0 z-50 bg-background overflow-y-auto scroll-slim">
          <div className="max-w-lg mx-auto px-5 py-6 relative z-10">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <RibbonMark size={28} />
                <h1 className="mifa-h4 text-foreground">ویرایش برنامه ماه</h1>
              </div>
              <Button variant="ghost" size="sm" className="h-9 rounded-xl" onClick={() => setWizardOpen(false)}>
                بستن
              </Button>
            </div>
            <OnboardingWizard editMode initial={p} onDone={() => setWizardOpen(false)} />
          </div>
        </div>
      )}

      {/* ── ثبت سریع ── */}
      <QuickAddDialog open={addOpen} onOpenChange={setAddOpen} defaultCategory={addCategory} />

      {/* ── نوار پایین با FAB مرکزی ── */}
      <nav
        className="fixed bottom-0 inset-x-0 z-40 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-2 px-4 pointer-events-none"
        aria-label="ناوبری اصلی"
      >
        <div className="max-w-lg mx-auto relative">
          {/* FAB مرکزی */}
          <button
            onClick={() => openAdd()}
            className="pointer-events-auto absolute -top-6 left-1/2 -translate-x-1/2 h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center border-4 border-background shadow-[0_10px_30px_-6px_rgba(8,217,214,0.65)] hover:brightness-105 active:scale-95 transition-transform"
            aria-label="ثبت خرج جدید"
          >
            <Plus className="w-8 h-8" strokeWidth={2.6} />
          </button>

          <div className="tabbar pointer-events-auto rounded-[26px] px-3 py-1.5 flex items-center justify-between">
            {TABS.slice(0, 2).map((t) => (
              <TabItem key={t.id} t={t} active={tab === t.id} onClick={() => setTab(t.id)} />
            ))}
            <span className="w-18 shrink-0" aria-hidden="true" />
            {TABS.slice(2).map((t) => (
              <TabItem key={t.id} t={t} active={tab === t.id} onClick={() => setTab(t.id)} />
            ))}
          </div>
        </div>
      </nav>
    </div>
  )
}

function TabItem({
  t,
  active,
  onClick,
}: {
  t: { id: Tab; label: string; icon: typeof House }
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`flex flex-col items-center justify-center gap-0.5 h-14 w-16 rounded-2xl transition-colors ${
        active ? "text-primary" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <t.icon className="w-5.5 h-5.5" strokeWidth={active ? 2.4 : 1.9} />
      <span className={`text-[10px] leading-none ${active ? "font-extrabold" : "font-medium"}`}>{t.label}</span>
      <span className={`h-1 w-1 rounded-full transition-all ${active ? "bg-primary" : "bg-transparent"}`} aria-hidden="true" />
    </button>
  )
}
