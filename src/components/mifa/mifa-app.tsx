"use client"

// پوسته اصلی MIFA — ناوبری، هدر، انتخاب ماه و دیالوگ ثبت
import { useState } from "react"
import { MifaLogo, MifaSymbol } from "./mifa-logo"
import { DashboardView } from "./dashboard-view"
import { TransactionsView } from "./transactions-view"
import { BudgetView } from "./budget-view"
import { InsightsView } from "./insights-view"
import { SettingsView } from "./settings-view"
import { QuickAddDialog } from "./quick-add-dialog"
import { currentMonthKey, monthLabel, shiftMonth, todayJalali } from "@/lib/mifa/jalali"
import { toPersianDigits } from "@/lib/mifa/format"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Plus, LayoutDashboard, ListOrdered, PiggyBank, TrendingUp, Settings, Sun, Moon, ChevronRight, ChevronLeft } from "lucide-react"

type Tab = "dashboard" | "transactions" | "budget" | "insights" | "settings"

const TABS: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "خانه", icon: LayoutDashboard },
  { id: "transactions", label: "تراکنش‌ها", icon: ListOrdered },
  { id: "budget", label: "بودجه", icon: PiggyBank },
  { id: "insights", label: "تحلیل", icon: TrendingUp },
  { id: "settings", label: "تنظیمات", icon: Settings },
]

export function MifaApp() {
  const [tab, setTab] = useState<Tab>("dashboard")
  const [month, setMonth] = useState(currentMonthKey())
  const [addOpen, setAddOpen] = useState(false)
  const { setTheme, resolvedTheme } = useTheme()
  const today = todayJalali()

  const isCurrent = month === today.key
  const canGoNext = month < today.key

  const toggleTheme = () => setTheme(resolvedTheme === "dark" ? "light" : "dark")

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── هدر ── */}
      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-md border-b border-border">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <MifaLogo compact={false} className="sm:flex" />
          <MifaLogo compact={true} className="sm:hidden" />

          {/* انتخاب ماه */}
          {tab !== "settings" ? (
            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="icon" className="h-9 w-9" disabled={!canGoNext}
                onClick={() => setMonth(shiftMonth(month, 1))} aria-label="ماه بعد">
                <ChevronRight className="w-5 h-5" />
              </Button>
              <button
                onClick={() => setMonth(today.key)}
                className={`min-w-28 text-center rounded-xl px-3 py-1.5 font-bold text-body-sm transition-colors ${
                  isCurrent ? "text-primary" : "text-foreground hover:bg-muted"
                }`}
                title="برگشت به ماه جاری">
                {monthLabel(month)}
              </button>
              <Button variant="ghost" size="icon" className="h-9 w-9"
                onClick={() => setMonth(shiftMonth(month, -1))} aria-label="ماه قبل">
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </div>
          ) : <div />}

          <Button variant="ghost" size="icon" className="h-9 w-9"
            onClick={toggleTheme}
            aria-label="تغییر تم">
            {/* آیکون‌ها با CSS کنترل می‌شن تا hydration mismatch نداشته باشیم */}
            <Sun className="w-5 h-5 hidden dark:block" />
            <Moon className="w-5 h-5 dark:hidden" />
          </Button>
        </div>

        {/* تب‌های دسکتاپ */}
        <nav className="hidden md:flex max-w-3xl mx-auto px-4 pb-3 gap-1.5" aria-label="بخش‌های اپ">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              aria-current={tab === t.id ? "page" : undefined}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-body-sm font-semibold transition-colors ${
                tab === t.id
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}>
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      {/* ── محتوا ── */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-5 pb-28 md:pb-8">
        {tab === "dashboard" && <DashboardView month={month} onSeeAll={() => setTab("transactions")} />}
        {tab === "transactions" && <TransactionsView month={month} />}
        {tab === "budget" && <BudgetView month={month} />}
        {tab === "insights" && <InsightsView month={month} />}
        {tab === "settings" && <SettingsView />}
      </main>

      {/* ── دیالوگ ثبت ── */}
      <QuickAddDialog open={addOpen} onOpenChange={setAddOpen} month={month} />

      {/* ── ناوبری موبایل ── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-background/92 backdrop-blur-md border-t border-border pb-[env(safe-area-inset-bottom)]"
        aria-label="ناوبری موبایل">
        <div className="grid grid-cols-5 h-16">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              aria-current={tab === t.id ? "page" : undefined}
              className={`flex flex-col items-center justify-center gap-1 ${
                tab === t.id ? "text-primary" : "text-muted-foreground"
              }`}>
              <t.icon className="w-5 h-5" />
              <span className="text-[10px] font-semibold">{t.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* ── دکمه شناور ثبت ── */}
      <button
        onClick={() => setAddOpen(true)}
        className="fixed z-50 bottom-20 md:bottom-8 start-4 md:start-8 h-14 px-5 rounded-2xl bg-primary text-primary-foreground font-bold shadow-lg flex items-center gap-2 hover:bg-primary/90 active:scale-[0.97] transition-transform"
        aria-label="ثبت خرج جدید">
        <Plus className="w-6 h-6" strokeWidth={2.5} />
        <span className="text-body-sm">ثبت سریع</span>
      </button>
    </div>
  )
}
