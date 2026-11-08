"use client"

// جادوگر شروع MIFA — اولین ورود: درآمد، خرج ثابت، هدف پس‌انداز و برنامه نهایی
// در حالت edit همان مسیر برای ویرایش برنامه استفاده می‌شود
import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Skeleton } from "@/components/ui/skeleton"
import { RibbonMark, RibbonTile } from "./mifa-logo"
import { CategoryIcon } from "./mifa-icons"
import { useProfile, useSaveProfile, type ProfileData } from "./mifa-hooks"
import { autoSavings, buildPlan, fixedTotalOf, type FixedItem } from "@/lib/mifa/plan"
import { formatAmount, formatCompact, parseAmountInput, toPersianDigits } from "@/lib/mifa/format"
import { currentMonthKey, todayJalali, shiftMonth, JALALI_MONTHS } from "@/lib/mifa/jalali"
import { currentCycleKey, cycleLabel, daysInCycle, daysLeftInCycle } from "@/lib/mifa/cycle"
import { MifaCalendar } from "./mifa-calendar"
import { useToast } from "@/hooks/use-toast"
import {
  ArrowRight, ArrowLeft, Wallet, Home, PiggyBank, Sparkles,
  Landmark, TrendingUp, AlertTriangle, Check, Plus, X, Wand2, Coins, CalendarDays,
} from "lucide-react"

type SavingsMode = "auto" | "amount" | "percent" | "none"

const PRESETS: { label: string; icon: string; hint?: string }[] = [
  { label: "اجاره یا رهن", icon: "home" },
  { label: "قسط وام", icon: "bills" },
  { label: "قبض برق", icon: "bills" },
  { label: "قبض گاز", icon: "bills" },
  { label: "قبض آب", icon: "bills" },
  { label: "اینترنت و موبایل", icon: "bills" },
  { label: "اشتراک‌ها", icon: "entertainment" },
  { label: "بیمه", icon: "bills" },
  { label: "کمک به خانواده", icon: "gifts" },
  { label: "قسط خرید", icon: "savings" },
]

const INCOME_QUICK = [5_000_000, 8_000_000, 12_000_000, 20_000_000, 30_000_000]

interface WizardState {
  step: number
  name: string
  income: string
  payday: number
  cycleStartDay: number
  calMonth: string
  calOpen: boolean
  fixed: { label: string; amount: string; icon: string }[]
  customLabel: string
  customAmount: string
  savingsMode: SavingsMode
  savingsAmount: string
  savingsPercent: number
}

function initialState(data?: ProfileData): WizardState {
  const p = data?.profile
  return {
    step: 0,
    name: p?.name ?? "",
    income: p ? String(p.income) : "",
    payday: p?.payday ?? 1,
    cycleStartDay: p?.cycleStartDay ?? 1,
    calMonth: currentMonthKey(),
    calOpen: false,
    fixed: (data?.fixed ?? []).map((f) => ({ label: f.label, amount: String(f.amount), icon: f.icon })),
    customLabel: "",
    customAmount: "",
    savingsMode: (p?.savingsMode as SavingsMode) ?? "auto",
    savingsAmount: p?.savingsMode === "amount" ? String(p.savingsAmount) : "",
    savingsPercent: p?.savingsPercent ?? 20,
  }
}

export function OnboardingWizard({ onDone, editMode = false }: { onDone?: () => void; editMode?: boolean }) {
  const profileQuery = useProfile()
  const save = useSaveProfile()
  const { toast } = useToast()
  const [state, setState] = useState<WizardState | null>(null)
  const [initialized, setInitialized] = useState(false)

  // مقداردهی اولیه بعد از لود پروفایل
  if (!initialized && profileQuery.data) {
    setInitialized(true)
    setState(initialState(profileQuery.data))
  }

  if (!profileQuery.data || !state) {
    return (
      <div className="space-y-4 py-6">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-56 rounded-2xl" />
      </div>
    )
  }

  const s = state
  // آپدیت فانکشنال — همیشه روی آخرین state اجرا می‌شه تا آپدیت‌های پشت‌سرهم گم نشن
  const set = (patch: Partial<WizardState>) => setState((prev) => (prev ? { ...prev, ...patch } : prev))

  const incomeNum = parseAmountInput(s.income) ?? 0
  const fixedParsed: FixedItem[] = s.fixed.map((f, i) => ({
    id: `f${i}`,
    label: f.label,
    amount: parseAmountInput(f.amount) ?? 0,
    icon: f.icon,
  })).filter((f) => f.amount > 0)
  const fixedTotal = fixedTotalOf(fixedParsed)
  const savingsAmountNum = parseAmountInput(s.savingsAmount) ?? 0
  const autoRec = incomeNum > 0 ? autoSavings(incomeNum, fixedTotal) : 0
  const plan = buildPlan(
    {
      name: s.name,
      income: incomeNum,
      payday: s.payday,
      cycleStartDay: s.cycleStartDay,
      savingsMode: s.savingsMode,
      savingsAmount: savingsAmountNum,
      savingsPercent: s.savingsPercent,
    },
    fixedParsed
  )
  const firstCycleKey = currentCycleKey(s.cycleStartDay)
  const firstCycleDays = daysInCycle(firstCycleKey, s.cycleStartDay)
  const firstDaysLeft = Math.max(1, daysLeftInCycle(firstCycleKey, s.cycleStartDay))
  const dailyAtStart = Math.floor(plan.flexible / firstDaysLeft)

  const STEPS = editMode
    ? ["شخصی", "درآمد", "شروع دوره", "خرج ثابت", "پس‌انداز", "برنامه"]
    : ["خوش اومدی", "درآمد", "شروع دوره", "خرج ثابت", "پس‌انداز", "برنامه‌ات"]

  const canNext = (() => {
    switch (s.step) {
      case 0: return s.name.trim().length > 0
      case 1: return incomeNum > 0
      default: return true
    }
  })()

  const go = (delta: number) => set({ step: Math.min(5, Math.max(0, s.step + delta)) })

  const addFixed = (label: string, icon: string, amount: string) => {
    const v = parseAmountInput(amount)
    if (!label.trim() || !v) {
      toast({ title: "عنوان و مبلغ رو کامل کن", variant: "destructive" })
      return
    }
    if (s.fixed.some((f) => f.label === label.trim())) {
      toast({ title: "این خرج ثابت قبلاً اضافه شده", variant: "destructive" })
      return
    }
    set({ fixed: [...s.fixed, { label: label.trim(), amount, icon }], customLabel: "", customAmount: "" })
  }

  const removeFixed = (label: string) => set({ fixed: s.fixed.filter((f) => f.label !== label) })

  const submit = () => {
    if (!canNext) return
    save.mutate(
      {
        name: s.name.trim(),
        income: incomeNum,
        payday: s.payday,
        cycleStartDay: s.cycleStartDay,
        savingsMode: s.savingsMode,
        savingsAmount: savingsAmountNum,
        savingsPercent: s.savingsPercent,
        fixed: fixedParsed.map((f) => ({ label: f.label, amount: f.amount, icon: f.icon })),
      },
      {
        onSuccess: () => {
          toast({ title: editMode ? "برنامه به‌روز شد ✓" : "برنامه‌ات ساخته شد ✓", description: "حالا هر خرجی که ثبت کنی، MIFA حساب می‌کنه چقدر برات می‌مونه" })
          onDone?.()
        },
        onError: (e) => toast({ title: e.message, variant: "destructive" }),
      }
    )
  }

  const togglePreset = (preset: { label: string; icon: string }) => {
    if (s.fixed.some((f) => f.label === preset.label)) removeFixed(preset.label)
    else set({ fixed: [...s.fixed, { label: preset.label, amount: "", icon: preset.icon }] })
  }

  return (
    <div className="relative z-10 flex flex-col min-h-full">
      {/* ── نوار پیشرفت ── */}
      <div className="flex items-center gap-3 px-1">
        <div className="flex items-center gap-1.5 flex-1">
          {STEPS.map((label, i) => (
            <div key={label} className="flex-1 h-1.5 rounded-full overflow-hidden bg-muted">
              <div
                className={`h-full rounded-full transition-all duration-500 ${i <= s.step ? "bg-primary" : "bg-transparent"}`}
                style={{ width: i <= s.step ? "100%" : "0%" }}
              />
            </div>
          ))}
        </div>
        <span className="text-caption text-muted-foreground numeric shrink-0">
          {toPersianDigits(s.step + 1)}/{toPersianDigits(STEPS.length)}
        </span>
      </div>

      {/* ── محتوای مرحله ── */}
      <div className="flex-1 flex flex-col justify-center py-8 mifa-slide-in" key={s.step}>
        {/* مرحله ۰ — خوش آمد */}
        {s.step === 0 && (
          <div className="space-y-8 text-center">
            <RibbonTile size={editMode ? 88 : 128} className="mx-auto drop-shadow-2xl" />
            <div>
              <h1 className="mifa-h2 text-foreground">
                {editMode ? "برنامه‌ات رو به‌روز کن" : "سلام! من MIFA هستم"}
              </h1>
              <p className="mifa-body text-muted-foreground mt-3 max-w-sm mx-auto">
                {editMode
                  ? "همون چند سوال ساده رو دوباره جواب بده تا برنامه ماه بر اساس شرایط جدیدت ساخته شه."
                  : "برای اینکه بدونی چقدر می‌تونی خرج کنی و چقدر آخر ماه برات می‌مونه، چند تا سوال ساده دارم."}
              </p>
            </div>
            <div className="text-start space-y-2">
              <Label className="text-body-sm text-foreground text-foreground">چطور صدات کنم؟</Label>
              <Input
                value={s.name}
                onChange={(e) => set({ name: e.target.value })}
                placeholder="اسمت — مثلاً سارا"
                className="h-13 text-lg bg-card border-input text-foreground placeholder:text-muted-foreground"
                aria-label="اسمت"
                onKeyDown={(e) => e.key === "Enter" && s.name.trim() && go(1)}
              />
            </div>
          </div>
        )}

        {/* مرحله ۱ — درآمد */}
        {s.step === 1 && (
          <div className="space-y-7">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/15 text-primary flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8" />
              </div>
              <h2 className="mifa-h3 text-foreground">
                {s.name}، درآمد ماهانه‌ات معمولاً چقدره؟
              </h2>
              <p className="mifa-body-sm text-muted-foreground mt-2">
                حقوق، مزایا یا هر مبلغ ثابتی که سر ماه می‌رسه
              </p>
            </div>
            <div>
              <Input
                inputMode="numeric"
                value={s.income}
                onChange={(e) => set({ income: e.target.value })}
                placeholder="مثلاً ۱۵٬۰۰۰٬۰۰۰"
                className="numeric h-16 text-3xl font-extrabold text-center bg-card border-input text-foreground placeholder:text-muted-foreground"
                aria-label="درآمد ماهانه به تومان"
              />
              {incomeNum > 0 && (
                <p className="text-center text-caption text-muted-foreground mt-2">
                  {formatAmount(incomeNum)} تومان در ماه
                </p>
              )}
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {INCOME_QUICK.map((v) => (
                  <button key={v} type="button" onClick={() => set({ income: String(v) })}
                    className={`numeric text-caption px-3.5 py-1.5 rounded-full border transition-colors ${
                      parseAmountInput(s.income) === v
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}>
                    {formatCompact(v)}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-muted/50 border border-border px-4 py-3 dark:bg-muted/50">
              <div className="flex items-center gap-2.5">
                <Landmark className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-body-sm font-semibold text-foreground">حقوق کِی واریز می‌شه؟</p>
                  <p className="text-caption text-muted-foreground">روز {toPersianDigits(s.payday)} هر ماه</p>
                </div>
              </div>
              <select
                value={s.payday}
                onChange={(e) => set({ payday: Number(e.target.value) })}
                className="numeric bg-card border border-input rounded-lg px-3 py-2 text-body-sm text-foreground"
                aria-label="روز واریز حقوق"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d} className="text-foreground">روز {toPersianDigits(d)}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* مرحله ۲ — شروع دوره مالی */}
        {s.step === 2 && (() => {
          const t = todayJalali()
          const todayJd = t.day
          const todayMonth = JALALI_MONTHS[Number(t.key.split("-")[1]) - 1]
          const mode =
            s.calOpen ? "custom"
            : s.cycleStartDay === s.payday && s.payday !== 1 ? "payday"
            : s.cycleStartDay === todayJd && todayJd !== 1 ? "today"
            : s.cycleStartDay === 1 ? "month"
            : "custom"
          const optCls = (m: string) =>
            `text-start rounded-2xl border p-3.5 transition-colors ${
              mode === m ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
            }`
          return (
            <div className="space-y-5">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/15 text-primary flex items-center justify-center mx-auto mb-4">
                  <CalendarDays className="w-8 h-8" />
                </div>
                <h2 className="mifa-h3 text-foreground">دوره مالی از کی شروع بشه؟</h2>
                <p className="mifa-body-sm text-muted-foreground mt-2">
                  هر ماه همین روز، پولت دوباره تقسیم می‌شه — مثلاً از اول آذر یا هر روز دیگه از تقویم
                </p>
              </div>

              <div className="grid gap-2">
                <button type="button" onClick={() => set({ cycleStartDay: 1 })} aria-pressed={mode === "month"} className={optCls("month")}>
                  <div className="flex items-center gap-3">
                    <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${mode === "month" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                      <CalendarDays className="w-5 h-5" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-body text-foreground">اول ماه تقویمی</p>
                      <p className="text-caption text-muted-foreground mt-0.5">هر ماه از روز ۱ شروع می‌شه</p>
                    </div>
                    {mode === "month" && <Check className="w-5 h-5 text-primary shrink-0" />}
                  </div>
                </button>

                <button type="button" onClick={() => set({ cycleStartDay: s.payday })} aria-pressed={mode === "payday"} className={optCls("payday")}>
                  <div className="flex items-center gap-3">
                    <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${mode === "payday" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                      <Landmark className="w-5 h-5" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-body text-foreground flex items-center gap-2">
                        روز واریز حقوق
                        <span className="text-[9px] font-bold bg-primary/15 text-primary rounded-full px-2 py-0.5">پیشنهاد MIFA</span>
                      </p>
                      <p className="text-caption text-muted-foreground mt-0.5">هر ماه همزمان با حقوق — روز {toPersianDigits(s.payday)}</p>
                    </div>
                    {mode === "payday" && <Check className="w-5 h-5 text-primary shrink-0" />}
                  </div>
                </button>

                <button type="button" onClick={() => set({ cycleStartDay: todayJd })} aria-pressed={mode === "today"} className={optCls("today")}>
                  <div className="flex items-center gap-3">
                    <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${mode === "today" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                      <Sparkles className="w-5 h-5" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-body text-foreground">همین امروز</p>
                      <p className="text-caption text-muted-foreground mt-0.5">از {toPersianDigits(todayJd)} {todayMonth} به بعد رو حساب کن</p>
                    </div>
                    {mode === "today" && <Check className="w-5 h-5 text-primary shrink-0" />}
                  </div>
                </button>

                <button type="button" onClick={() => set({ calOpen: !s.calOpen })} aria-pressed={mode === "custom"} className={optCls("custom")}>
                  <div className="flex items-center gap-3">
                    <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${mode === "custom" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                      <CalendarDays className="w-5 h-5" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-body text-foreground">از تقویم انتخاب کنم</p>
                      <p className="text-caption text-muted-foreground mt-0.5">هر روزی که خودت بخوای</p>
                    </div>
                    {mode === "custom" && <Check className="w-5 h-5 text-primary shrink-0" />}
                  </div>
                </button>
              </div>

              {s.calOpen && (
                <div className="rounded-2xl border border-border bg-muted/30 p-3">
                  <MifaCalendar
                    monthKey={s.calMonth}
                    onShiftMonth={(d) => set({ calMonth: shiftMonth(s.calMonth, d) })}
                    selectedDay={s.cycleStartDay}
                    onSelectDay={(day) => set({ cycleStartDay: day })}
                  />
                </div>
              )}

              <div className="rounded-2xl bg-primary/10 border border-primary/25 px-4 py-3 flex items-start gap-2.5">
                <CalendarDays className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <p className="text-body-sm text-foreground">
                  دوره اول: <span className="font-bold">{cycleLabel(firstCycleKey, s.cycleStartDay)}</span> — {toPersianDigits(firstCycleDays)} روز
                  {firstDaysLeft < firstCycleDays ? ` · ${toPersianDigits(firstDaysLeft)} روزش باقی مونده` : ""}
                </p>
              </div>
            </div>
          )
        })()}

        {/* مرحله ۳ — خرج ثابت */}
        {s.step === 3 && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-mifa-warning/15 text-mifa-warning flex items-center justify-center mx-auto mb-4">
                <Home className="w-8 h-8" />
              </div>
              <h2 className="mifa-h3 text-foreground">هر ماه چه هزینه‌هایی قطعاً داری؟</h2>
              <p className="mifa-body-sm text-muted-foreground mt-2">
                این‌ها اول از بودجه جدا می‌شن تا خرج آزادت حساب شه
              </p>
            </div>

            {/* چیدمان پیش‌فرض‌ها */}
            <div className="flex flex-wrap justify-center gap-2">
              {PRESETS.map((p) => {
                const active = s.fixed.some((f) => f.label === p.label)
                return (
                  <button key={p.label} type="button" onClick={() => togglePreset(p)}
                    aria-pressed={active}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-caption font-semibold border transition-colors ${
                      active
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}>
                    <CategoryIcon id={p.icon} className="w-3.5 h-3.5" />
                    {p.label}
                    {active && <Check className="w-3.5 h-3.5" />}
                  </button>
                )
              })}
            </div>

            {/* لیست فعال با مبلغ */}
            {s.fixed.length > 0 && (
              <div className="space-y-2">
                {s.fixed.map((f, i) => {
                  const v = parseAmountInput(f.amount)
                  return (
                    <div key={f.label} className="flex items-center gap-2.5 rounded-2xl bg-muted/50 border border-border px-3.5 py-2.5">
                      <span className="w-9 h-9 rounded-xl bg-mifa-warning/15 text-mifa-warning flex items-center justify-center shrink-0">
                        <CategoryIcon id={f.icon} className="w-4.5 h-4.5" />
                      </span>
                      <span className="text-body-sm font-semibold text-foreground flex-1 min-w-0 truncate">{f.label}</span>
                      <Input
                        inputMode="numeric"
                        value={f.amount}
                        onChange={(e) => {
                          const next = [...s.fixed]
                          next[i] = { ...f, amount: e.target.value }
                          set({ fixed: next })
                        }}
                        placeholder="مبلغ"
                        className="numeric h-10 w-36 text-start bg-card border-input text-foreground placeholder:text-muted-foreground"
                        aria-label={`مبلغ ${f.label}`}
                      />
                      <button type="button" onClick={() => removeFixed(f.label)}
                        className="text-muted-foreground/60 hover:text-[#FF5B83] transition-colors shrink-0"
                        aria-label={`حذف ${f.label}`}>
                        <X className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  )
                })}
                {fixedTotal > 0 && (
                  <p className="text-caption text-muted-foreground text-center numeric pt-1">
                    جمع خرج ثابت: {formatAmount(fixedTotal)} تومان
                  </p>
                )}
              </div>
            )}

            {/* افزودن دلخواه */}
            <div className="flex gap-2">
              <Input value={s.customLabel} onChange={(e) => set({ customLabel: e.target.value })}
                placeholder="هزینه ثابت دیگه‌ای داری؟"
                className="h-12 bg-card border-input text-foreground placeholder:text-muted-foreground"
                aria-label="عنوان هزینه ثابت دلخواه" />
              <Input inputMode="numeric" value={s.customAmount}
                onChange={(e) => set({ customAmount: e.target.value })}
                placeholder="مبلغ"
                className="numeric h-12 w-32 bg-card border-input text-foreground placeholder:text-muted-foreground"
                aria-label="مبلغ هزینه دلخواه"
                onKeyDown={(e) => e.key === "Enter" && addFixed(s.customLabel, "bills", s.customAmount)} />
              <Button type="button" size="icon" onClick={() => addFixed(s.customLabel, "bills", s.customAmount)}
                className="h-12 w-12 shrink-0 bg-primary text-primary-foreground hover:bg-primary/90" aria-label="افزودن هزینه ثابت">
                <Plus className="w-5 h-5" />
              </Button>
            </div>
          </div>
        )}

        {/* مرحله ۴ — پس‌انداز */}
        {s.step === 4 && (
          <div className="space-y-5">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#2BD38B]/15 text-[#2BD38B] flex items-center justify-center mx-auto mb-4">
                <PiggyBank className="w-8 h-8" />
              </div>
              <h2 className="mifa-h3 text-foreground">هدف پس‌اندازت چیه؟</h2>
              <p className="mifa-body-sm text-muted-foreground mt-2">
                اول پس‌انداز جدا می‌شه، بعد از باقی پول خرج می‌کنی — این‌طوری آخر ماه چیزی برات می‌مونه
              </p>
            </div>

            <div className="grid gap-2.5">
              {/* خودت حساب کن */}
              <button type="button" onClick={() => set({ savingsMode: "auto" })}
                aria-pressed={s.savingsMode === "auto"}
                className={`text-start rounded-2xl border p-4 transition-colors ${
                  s.savingsMode === "auto"
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}>
                <div className="flex items-center gap-3">
                  <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.savingsMode === "auto" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                    <Wand2 className="w-5 h-5" />
                  </span>
                  <div className="flex-1">
                    <p className="font-bold text-body text-foreground">خودت برام حساب کن</p>
                    <p className="text-caption text-muted-foreground mt-0.5">منطقی‌ترین عدد بر اساس درآمد و خرج ثابتت</p>
                  </div>
                  {s.savingsMode === "auto" && incomeNum > 0 && (
                    <span className="numeric text-caption font-bold text-primary whitespace-nowrap">
                      {formatCompact(autoRec)}
                    </span>
                  )}
                </div>
              </button>

              {/* عدد مشخص */}
              <button type="button" onClick={() => set({ savingsMode: "amount" })}
                aria-pressed={s.savingsMode === "amount"}
                className={`text-start rounded-2xl border p-4 transition-colors ${
                  s.savingsMode === "amount"
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}>
                <div className="flex items-center gap-3">
                  <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.savingsMode === "amount" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                    <Coins className="w-5 h-5" />
                  </span>
                  <div className="flex-1">
                    <p className="font-bold text-body text-foreground">عدد مشخص می‌ذارم</p>
                    <p className="text-caption text-muted-foreground mt-0.5">مثلاً هر ماه ۲ میلیون پس‌انداز کنم</p>
                  </div>
                </div>
                {s.savingsMode === "amount" && (
                  <div className="mt-3">
                    <Input
                      inputMode="numeric"
                      value={s.savingsAmount}
                      onChange={(e) => set({ savingsAmount: e.target.value })}
                      placeholder="مبلغ پس‌انداز ماهانه"
                      className="numeric h-13 text-lg text-center bg-card border-input text-foreground placeholder:text-muted-foreground"
                      aria-label="مبلغ پس‌انداز ماهانه"
                    />
                    {savingsAmountNum > 0 && (
                      <p className="text-caption text-muted-foreground text-center mt-1.5">
                        {formatAmount(savingsAmountNum)} تومان در ماه
                      </p>
                    )}
                  </div>
                )}
              </button>

              {/* درصد */}
              <button type="button" onClick={() => set({ savingsMode: "percent" })}
                aria-pressed={s.savingsMode === "percent"}
                className={`text-start rounded-2xl border p-4 transition-colors ${
                  s.savingsMode === "percent"
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}>
                <div className="flex items-center gap-3">
                  <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.savingsMode === "percent" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                    <TrendingUp className="w-5 h-5" />
                  </span>
                  <div className="flex-1">
                    <p className="font-bold text-body text-foreground">درصدی از درآمد</p>
                    <p className="text-caption text-muted-foreground mt-0.5">هر ماه خودکار حساب می‌شه</p>
                  </div>
                  {s.savingsMode === "percent" && (
                    <span className="numeric text-caption font-bold text-primary whitespace-nowrap">
                      {toPersianDigits(s.savingsPercent)}٪
                    </span>
                  )}
                </div>
                {s.savingsMode === "percent" && (
                  <div className="mt-4 px-1">
                    <Slider
                      value={[s.savingsPercent]}
                      onValueChange={(v) => set({ savingsPercent: v[0] })}
                      min={5}
                      max={50}
                      step={5}
                      aria-label="درصد پس‌انداز"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground numeric mt-1.5">
                      <span>۵٪</span><span>۵۰٪</span>
                    </div>
                  </div>
                )}
              </button>

              {/* بدون پس‌انداز */}
              <button type="button" onClick={() => set({ savingsMode: "none" })}
                aria-pressed={s.savingsMode === "none"}
                className={`text-start rounded-2xl border p-3.5 transition-colors ${
                  s.savingsMode === "none"
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}>
                <p className="text-body-sm font-semibold text-muted-foreground">فعلاً نمی‌خوام پس‌انداز کنم</p>
                <p className="text-caption text-muted-foreground mt-0.5">فقط می‌خوام بدونم پولم کجا می‌ره</p>
              </button>
            </div>
          </div>
        )}

        {/* مرحله ۵ — خلاصه برنامه */}
        {s.step === 5 && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/15 text-primary flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8" />
              </div>
              <h2 className="mifa-h3 text-foreground">برنامه ماه {s.name} آماده‌ست!</h2>
              <p className="mifa-body-sm text-muted-foreground mt-2">
                هر وقت خرج ثبت کنی، MIFA همین حساب رو زنده به‌روز می‌کنه
              </p>
            </div>

            {/* نوار تفکیک درآمد */}
            {plan.income > 0 && (
              <div>
                <div className="h-4 rounded-full overflow-hidden flex bg-muted" dir="ltr">
                  {(() => {
                    const fixedPct = (plan.fixedTotal / plan.income) * 100
                    const savPct = (plan.savings / plan.income) * 100
                    const flexPct = Math.max(0, 100 - fixedPct - savPct)
                    return (
                      <>
                        <div style={{ width: `${fixedPct}%` }} className="bg-mifa-warning" title="خرج ثابت" />
                        <div style={{ width: `${savPct}%` }} className="bg-[#2BD38B]" title="پس‌انداز" />
                        <div style={{ width: `${flexPct}%` }} className="bg-gradient-to-r from-[#08D9D6] to-[#5CE7E3]" title="پول آزاد" />
                      </>
                    )
                  })()}
                </div>
                <div className="flex justify-between mt-2 text-[10px] text-muted-foreground numeric">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-mifa-warning inline-block" /> ثابت</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#2BD38B] inline-block" /> پس‌انداز</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary inline-block" /> آزاد</span>
                </div>
              </div>
            )}

            {/* ردیف‌های برنامه */}
            <div className="rounded-2xl border border-border bg-muted/40 divide-y divide-border overflow-hidden">
              <Row icon={<Wallet className="w-4 h-4" />} color="#08D9D6" label="درآمد ماهانه" value={plan.income} />
              <Row icon={<Home className="w-4 h-4" />} color="#E2AD5D" label={`خرج ثابت (${toPersianDigits(fixedParsed.length)} مورد)`} value={plan.fixedTotal} />
              <Row icon={<PiggyBank className="w-4 h-4" />} color="#2BD38B" label={plan.savingsLabel} value={plan.savings} />
              <div className="flex items-center gap-3 px-4 py-3.5 bg-primary/[0.07]">
                <span className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </span>
                <span className="text-body-sm font-bold text-white flex-1 dark:text-white">پول آزاد برای خرج</span>
                <span className="numeric font-extrabold text-primary text-body">{formatAmount(plan.flexible)}</span>
              </div>
            </div>

            {/* سقف روزانه */}
            <div className="rounded-2xl bg-primary/10 border border-primary/25 px-4 py-3.5 flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
                <Landmark className="w-5 h-5" />
              </span>
              <p className="text-body-sm text-foreground">
                از فردا هر روز حدود <span className="numeric font-extrabold text-primary">{formatAmount(dailyAtStart)}</span> تومان جا برای خرج داری — یعنی آخر ماه {formatCompact(plan.savings)} پس‌انداز برات می‌مونه
              </p>
            </div>

            {plan.income > 0 && fixedTotal > plan.income && (
              <div className="rounded-2xl border border-[#FF2E63]/40 bg-[#FF2E63]/10 px-4 py-3 flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-[#FF5B83] shrink-0 mt-0.5" />
                <p className="text-body-sm text-foreground">
                  خرج ثابتت از درآمدت بیشتره! برنامه رو بازبینی کن یا درآمدت رو کامل وارد کن.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── دکمه‌های ناوبری ── */}
      <div className="flex items-center gap-3 pb-2">
        {s.step > 0 && (
          <Button variant="outline" onClick={() => go(-1)}
            className="h-13 px-5 border-border text-foreground hover:bg-muted">
            <ArrowRight className="w-5 h-5" />
            قبلی
          </Button>
        )}
        {s.step < 5 ? (
          <Button onClick={() => canNext && go(1)} disabled={!canNext}
            className="h-13 flex-1 bg-primary text-primary-foreground font-bold text-lg hover:bg-primary/90 disabled:opacity-40">
            {STEPS[s.step + 1] === "درآمد" ? "بزن بریم" : s.step === 4 ? "برنامه‌ات رو ببین" : "بعدی"}
            <ArrowLeft className="w-5 h-5" />
          </Button>
        ) : (
          <Button onClick={submit} disabled={save.isPending || !canNext}
            className="h-13 flex-1 bg-primary text-primary-foreground font-extrabold text-lg hover:bg-primary/90 shadow-[0_0_36px_-6px_rgba(8,217,214,0.55)]">
            {save.isPending ? "..." : editMode ? "ذخیره برنامه" : "شروع کن"}
            <Check className="w-5 h-5" />
          </Button>
        )}
      </div>
    </div>
  )
}

function Row({ icon, color, label, value }: { icon: React.ReactNode; color: string; label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}26`, color }}>
        {icon}
      </span>
      <span className="text-body-sm font-medium text-foreground flex-1">{label}</span>
      <span className="numeric font-bold text-body text-foreground">{formatAmount(value)}</span>
    </div>
  )
}
