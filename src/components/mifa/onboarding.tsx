"use client"

// جادوگر شروع MIFA — ۶ مرحله: خوش‌آمد، درآمد، خرج ثابت، پس‌انداز، روز شروع دوره، نتیجه
import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { RibbonMark } from "./mifa-logo"
import { AmountInput } from "./amount-input"
import { AnchorDayPicker } from "./anchor-day-picker"
import { FixedKindIcon } from "./mifa-icons"
import { useSaveProfile } from "./mifa-hooks"
import type { FixedExpense, FixedKind, Profile, SavingsMode } from "@/lib/mifa/types"
import { FIXED_KINDS, FIXED_KIND_MAP } from "@/lib/mifa/types"
import { resolveSavings } from "@/lib/mifa/plan"
import { computeSnapshot } from "@/lib/mifa/mifa-logic"
import { currentCycleKey, firstCyclePreview } from "@/lib/mifa/cycle"
import { todayJalali } from "@/lib/mifa/jalali"
import { formatAmount, formatCompact, parseAmountInput, toPersianDigits } from "@/lib/mifa/format"
import { useToast } from "@/hooks/use-toast"
import {
  ArrowRight, Wallet, Home, PiggyBank, CalendarDays, Check, Plus, X,
  Sparkles, TrendingUp, Landmark, PartyPopper,
} from "lucide-react"

const INCOME_QUICK = [5_000_000, 10_000_000, 15_000_000]

const STEP_TITLES = ["خوش اومدی", "درآمد", "خرج ثابت", "پس‌انداز", "شروع دوره", "برنامه‌ات"]

interface FixedDraft {
  id: string
  label: string
  kind: FixedKind
  amount: string
}

interface WizardState {
  step: number
  dir: number
  income: string
  fixed: FixedDraft[]
  fxKind: FixedKind
  fxLabel: string
  fxAmount: string
  savingsMode: SavingsMode
  savingsAmount: string
  anchorDay: number
}

function initialState(initial?: Profile | null): WizardState {
  return {
    step: initial ? 1 : 0,
    dir: 1,
    income: initial?.monthlyIncome ? formatAmount(initial.monthlyIncome) : "",
    fixed: (initial?.fixedExpenses ?? []).map((f) => ({
      id: f.id,
      label: f.label,
      kind: f.kind,
      amount: formatAmount(f.amount),
    })),
    fxKind: "rent",
    fxLabel: "",
    fxAmount: "",
    savingsMode: initial?.savingsMode ?? "auto",
    savingsAmount: initial?.savingsMode === "manual" && initial.savingsAmount ? formatAmount(initial.savingsAmount) : "",
    anchorDay: initial?.cycleAnchorDay ?? 1,
  }
}

export function OnboardingWizard({
  editMode = false,
  initial = null,
  onDone,
}: {
  editMode?: boolean
  initial?: Profile | null
  onDone?: () => void
}) {
  const [s, setS] = useState<WizardState>(() => initialState(editMode ? initial : null))
  const save = useSaveProfile()
  const { toast } = useToast()
  const today = todayJalali()

  const set = (patch: Partial<WizardState>) => setS((prev) => ({ ...prev, ...patch }))

  // ── محاسبات زنده ──
  const incomeNum = parseAmountInput(s.income) ?? 0
  const fixedParsed: FixedExpense[] = s.fixed
    .map((f) => ({ id: f.id, label: f.label.trim() || FIXED_KIND_MAP[f.kind].label, amount: parseAmountInput(f.amount) ?? 0, kind: f.kind }))
    .filter((f) => f.amount > 0)
  const fixedTotal = fixedParsed.reduce((a, f) => a + f.amount, 0)
  const disposable = Math.max(0, incomeNum - fixedTotal)
  const manualNum = parseAmountInput(s.savingsAmount) ?? 0
  const { savings, label: savingsLabel } = resolveSavings(s.savingsMode, manualNum, disposable)

  // پیش‌نمایش دقیق با همان موتور برنامه (دوره اول از امروز) — محاسبه سبک است، هر رندر تازه
  const initialOnboardedAt = initial?.onboardedAt ?? null
  let preview: ReturnType<typeof computeSnapshot> | null = null
  if (incomeNum > 0) {
    const temp: Profile = {
      onboarded: true,
      monthlyIncome: incomeNum,
      fixedExpenses: fixedParsed,
      savingsMode: s.savingsMode,
      savingsAmount: s.savingsMode === "manual" ? manualNum : savings,
      cycleAnchorDay: s.anchorDay,
      onboardedAt: initialOnboardedAt ?? new Date().toISOString(),
    }
    preview = computeSnapshot(temp, [], currentCycleKey(s.anchorDay, temp.onboardedAt))
  }

  const firstPreview = firstCyclePreview(s.anchorDay)

  const canNext = (() => {
    switch (s.step) {
      case 1: return incomeNum > 0
      case 3: return s.savingsMode !== "manual" || manualNum > 0
      default: return true
    }
  })()

  const go = (delta: number) => {
    if (delta > 0 && !canNext) return
    setS((prev) => ({ ...prev, step: Math.min(5, Math.max(0, prev.step + delta)), dir: delta }))
  }

  const addFixed = () => {
    const v = parseAmountInput(s.fxAmount)
    if (!v) {
      toast({ title: "مبلغ خرج ثابت را بنویس", variant: "destructive" })
      return
    }
    setS((prev) => ({
      ...prev,
      fixed: [...prev.fixed, { id: `fx-${Date.now()}`, label: prev.fxLabel.trim(), kind: prev.fxKind, amount: formatAmount(v) }],
      fxLabel: "",
      fxAmount: "",
    }))
  }

  const submit = () => {
    const profile: Profile = {
      onboarded: true,
      monthlyIncome: incomeNum,
      fixedExpenses: fixedParsed,
      savingsMode: s.savingsMode,
      savingsAmount: s.savingsMode === "manual" ? manualNum : savings,
      cycleAnchorDay: s.anchorDay,
      theme: initial?.theme,
      onboardedAt: initial?.onboardedAt ?? new Date().toISOString(),
    }
    save.mutate(profile, {
      onSuccess: () => {
        toast({
          title: editMode ? "برنامه‌ات به‌روز شد ✓" : "برنامه‌ات ساخته شد ✓",
          description: "از همین حالا هر خرجی ثبت کنی، MIFA حساب می‌کند چقدر برات می‌ماند",
        })
        onDone?.()
      },
      onError: () => toast({ title: "ذخیره نشد — دوباره تلاش کن", variant: "destructive" }),
    })
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* ── سربرگ پیشرفت ── */}
      <div className="flex items-center gap-3 pt-2">
        {s.step > 0 && (
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl shrink-0 -ms-2"
            onClick={() => go(-1)} aria-label="مرحله قبل">
            <ArrowRight className="w-5 h-5" />
          </Button>
        )}
        <div className="flex items-center gap-1.5 flex-1 justify-center">
          {STEP_TITLES.map((_, i) => (
            <span
              key={i}
              aria-hidden="true"
              className={`h-1.5 rounded-full transition-all duration-400 ${
                i === s.step ? "w-7 bg-primary" : i < s.step ? "w-1.5 bg-primary/60" : "w-1.5 bg-muted-foreground/25"
              }`}
            />
          ))}
        </div>
        <span className="numeric text-caption text-muted-foreground shrink-0 w-10 text-center">
          {toPersianDigits(s.step + 1)}/{toPersianDigits(6)}
        </span>
      </div>

      {/* ── محتوای مرحله ── */}
      <div className="flex-1 flex flex-col justify-center py-6">
        <AnimatePresence mode="wait" custom={s.dir} initial={false}>
          <motion.div
            key={s.step}
            custom={s.dir}
            initial={{ opacity: 0, x: s.dir >= 0 ? -44 : 44 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: s.dir >= 0 ? 44 : -44 }}
            transition={{ duration: 0.32, ease: [0.2, 0.8, 0.2, 1] }}
          >
            {s.step === 0 && <WelcomeStep editMode={editMode} />}
            {s.step === 1 && <IncomeStep income={s.income} onChange={(v) => set({ income: v })} onEnter={() => canNext && go(1)} />}
            {s.step === 2 && (
              <FixedStep
                state={s}
                set={set}
                addFixed={addFixed}
                removeFixed={(id) => set({ fixed: s.fixed.filter((f) => f.id !== id) })}
                fixedTotal={fixedTotal}
                incomeNum={incomeNum}
              />
            )}
            {s.step === 3 && (
              <SavingsStep
                mode={s.savingsMode}
                setMode={(m) => set({ savingsMode: m })}
                amount={s.savingsAmount}
                setAmount={(v) => set({ savingsAmount: v })}
                disposable={disposable}
                savings={savings}
                savingsLabel={savingsLabel}
                daily={preview ? preview.dailyAllowance : 0}
              />
            )}
            {s.step === 4 && (
              <CycleStep
                anchorDay={s.anchorDay}
                setAnchorDay={(d) => set({ anchorDay: d })}
                todayDay={today.day}
                preview={firstPreview}
                daily={preview?.dailyAllowance ?? 0}
              />
            )}
            {s.step === 5 && (
              <ResultStep
                snapshot={preview}
                incomeNum={incomeNum}
                fixedTotal={fixedTotal}
                savings={savings}
                savingsLabel={savingsLabel}
                cycleLabel={firstPreview.label}
                cycleDays={firstPreview.days}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── ناوبری ── */}
      <div className="pb-6">
        {s.step < 5 ? (
          <Button
            size="lg"
            className="w-full h-14 rounded-2xl text-base font-bold bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={!canNext}
            onClick={() => go(1)}
          >
            {s.step === 0 ? "شروع می‌کنم" : "ادامه"}
            <TrendingUp className="w-5 h-5 -ms-1 opacity-0" aria-hidden="true" />
          </Button>
        ) : (
          <Button
            size="lg"
            className="w-full h-14 rounded-2xl text-base font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_12px_36px_-8px_rgba(8,217,214,0.55)]"
            disabled={save.isPending}
            onClick={submit}
          >
            <PartyPopper className="w-5 h-5 -ms-1" />
            {save.isPending ? "داریم آماده می‌کنیم…" : "شروع می‌کنم!"}
          </Button>
        )}
      </div>
    </div>
  )
}

// ─── مرحله ۱: خوش‌آمد ───

function WelcomeStep({ editMode }: { editMode: boolean }) {
  return (
    <div className="text-center space-y-7">
      <div className="relative inline-block">
        <span className="absolute inset-0 rounded-full bg-primary/20 blur-3xl scale-125" aria-hidden="true" />
        <RibbonMark size={editMode ? 96 : 128} className="relative mifa-pop" />
      </div>
      <div>
        <h1 className="mifa-h2 text-foreground">
          {editMode ? "برنامه‌ات را به‌روز کن" : "پولت رو بشناس،"}
          <br />
          {editMode ? "با MIFA" : <span className="text-primary text-glow">بیشتر نگه دار</span>}
        </h1>
        <p className="mifa-body text-muted-foreground mt-4 max-w-xs mx-auto">
          {editMode
            ? "همین چند سوال را دوباره جواب بده تا برنامه ماه بر اساس شرایط جدیدت ساخته شود."
            : "من MIFA هستم؛ با چند سوال کوتاه برنامه‌ات را می‌چینم تا هر روز دقیقاً بدانی چقدر می‌توانی خرج کنی."}
        </p>
      </div>
      {!editMode && (
        <div className="flex items-center justify-center gap-2 text-caption text-muted-foreground">
          <Sparkles className="w-4 h-4 text-primary" />
          همه‌چیز فقط روی گوشی خودت ذخیره می‌شود
        </div>
      )}
    </div>
  )
}

// ─── مرحله ۲: درآمد ───

function IncomeStep({ income, onChange, onEnter }: { income: string; onChange: (v: string) => void; onEnter: () => void }) {
  const num = parseAmountInput(income)
  return (
    <div className="space-y-7">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/15 text-primary flex items-center justify-center mx-auto mb-4">
          <Wallet className="w-8 h-8" />
        </div>
        <h2 className="mifa-h3 text-foreground">ماهانه چقدر درآمد داری؟</h2>
        <p className="mifa-body-sm text-muted-foreground mt-2">حقوق، مزایا یا هر درآمد ثابتی که سر ماه می‌رسد — به تومان</p>
      </div>
      <div className="relative">
        <AmountInput value={income} onChange={onChange} placeholder="مثلاً ۱۵٬۰۰۰٬۰۰۰" onEnter={onEnter} ariaLabel="درآمد ماهانه به تومان" />
        <span className="absolute -bottom-7 inset-x-0 text-center text-caption text-muted-foreground">
          {num ? `${formatAmount(num)} تومان در ماه` : ""}
        </span>
      </div>
      <div className="flex flex-wrap justify-center gap-2 pt-8">
        {INCOME_QUICK.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(formatAmount(v))}
            aria-pressed={num === v}
            className={`numeric text-caption px-4 py-2 rounded-full border transition-colors ${
              num === v
                ? "border-primary bg-primary/15 text-primary font-bold"
                : "border-border text-muted-foreground hover:border-primary/50"
            }`}
          >
            {formatCompact(v)}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── مرحله ۳: خرج ثابت ───

function FixedStep({
  state,
  set,
  addFixed,
  removeFixed,
  fixedTotal,
  incomeNum,
}: {
  state: WizardState
  set: (p: Partial<WizardState>) => void
  addFixed: () => void
  removeFixed: (id: string) => void
  fixedTotal: number
  incomeNum: number
}) {
  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-mifa-warning/15 text-mifa-warning flex items-center justify-center mx-auto mb-4">
          <Home className="w-8 h-8" />
        </div>
        <h2 className="mifa-h3 text-foreground">هر ماه چه خرج‌های قطعی داری؟</h2>
        <p className="mifa-body-sm text-muted-foreground mt-2">اجاره، قسط، قبض‌ها… این‌ها اول از بودجه جدا می‌شوند</p>
      </div>

      {/* انتخاب نوع */}
      <div className="flex flex-wrap justify-center gap-1.5">
        {FIXED_KINDS.map((k) => {
          const active = state.fxKind === k.id
          return (
            <button
              key={k.id}
              type="button"
              onClick={() => set({ fxKind: k.id })}
              aria-pressed={active}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-caption font-semibold border transition-colors ${
                active ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              <FixedKindIcon kind={k.id} className="w-3.5 h-3.5" />
              {k.label}
            </button>
          )
        })}
      </div>

      {/* افزودن */}
      <div className="flex gap-2 items-start">
        <Input
          value={state.fxLabel}
          onChange={(e) => set({ fxLabel: e.target.value })}
          placeholder={`عنوان — مثلاً ${FIXED_KINDS.find((k) => k.id === state.fxKind)?.label}`}
          className="h-12 bg-card border-input text-foreground"
          aria-label="عنوان خرج ثابت"
        />
        <div className="w-40 shrink-0">
          <AmountInput value={state.fxAmount} onChange={(v) => set({ fxAmount: v })} size="md" ariaLabel="مبلغ خرج ثابت" onEnter={addFixed} />
        </div>
        <Button
          type="button"
          size="icon"
          className="h-12 w-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
          onClick={addFixed}
          aria-label="افزودن خرج ثابت"
        >
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      {/* فهرست */}
      {state.fixed.length > 0 && (
        <div className="rounded-2xl border border-border bg-card/60 divide-y divide-border max-h-56 overflow-y-auto scroll-slim">
          {state.fixed.map((f) => (
            <div key={f.id} className="flex items-center gap-3 px-4 py-3">
              <span
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${FIXED_KIND_MAP[f.kind].color}22`, color: FIXED_KIND_MAP[f.kind].color }}
              >
                <FixedKindIcon kind={f.kind} className="w-4.5 h-4.5" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-body-sm font-bold text-foreground truncate">{f.label.trim() || FIXED_KIND_MAP[f.kind].label}</p>
                <p className="text-caption text-muted-foreground">{FIXED_KIND_MAP[f.kind].label}</p>
              </div>
              <span className="numeric text-body-sm font-extrabold text-foreground">{formatAmount(parseAmountInput(f.amount) ?? 0)}</span>
              <button
                type="button"
                onClick={() => removeFixed(f.id)}
                className="h-9 w-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                aria-label={`حذف ${f.label}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* جمع */}
      <div className={`rounded-2xl px-4 py-3 flex items-center justify-between border ${
        incomeNum > 0 && fixedTotal > incomeNum
          ? "bg-mifa-rose/10 border-mifa-rose/30"
          : "bg-primary/10 border-primary/25"
      }`}>
        <span className="text-body-sm text-foreground">جمع خرج ثابت</span>
        <span className={`numeric text-body font-extrabold ${incomeNum > 0 && fixedTotal > incomeNum ? "text-mifa-rose" : "text-primary"}`}>
          {formatAmount(fixedTotal)} تومان
        </span>
      </div>
      {incomeNum > 0 && fixedTotal >= incomeNum && (
        <p className="text-caption text-mifa-rose text-center">
          خرج ثابت از درآمد بیشتر شد! جایی از هزینه‌ها را می‌توانی کم کنی؟
        </p>
      )}
    </div>
  )
}

// ─── مرحله ۴: پس‌انداز ───

function SavingsStep({
  mode,
  setMode,
  amount,
  setAmount,
  disposable,
  savings,
  savingsLabel,
  daily,
}: {
  mode: SavingsMode
  setMode: (m: SavingsMode) => void
  amount: string
  setAmount: (v: string) => void
  disposable: number
  savings: number
  savingsLabel: string
  daily: number
}) {
  const cards: { id: SavingsMode; title: string; desc: string; icon: typeof PiggyBank }[] = [
    { id: "manual", title: "خودم تعیین می‌کنم", desc: "یک عدد مشخص هر ماه کنار بگذار", icon: PiggyBank },
    { id: "max", title: "حداکثر ممکن", desc: "همه پول آزاد پس‌انداز شود — سخت‌گیرانه اما سریع‌ترین راه", icon: Landmark },
    { id: "auto", title: "پیشنهاد سیستم", desc: "۲۰٪ پول آزاد؛ تعادلی بین زندگی امروز و آینده", icon: Sparkles },
  ]
  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/15 text-primary flex items-center justify-center mx-auto mb-4">
          <PiggyBank className="w-8 h-8" />
        </div>
        <h2 className="mifa-h3 text-foreground">چقدر هر ماه پس‌انداز کنی؟</h2>
        <p className="mifa-body-sm text-muted-foreground mt-2">
          پول آزاد تو: <span className="numeric font-bold text-foreground">{formatAmount(disposable)} تومان</span>
        </p>
      </div>

      <div className="grid gap-2">
        {cards.map((c) => {
          const active = mode === c.id
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setMode(c.id)}
              aria-pressed={active}
              className={`text-start rounded-2xl border p-4 transition-all ${
                active ? "border-primary bg-primary/10 shadow-[0_0_0_1px_rgba(8,217,214,0.4)]" : "border-border bg-card/50 hover:border-primary/40"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${active ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                  <c.icon className="w-5 h-5" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-body text-foreground flex items-center gap-2">
                    {c.title}
                    {active && <Check className="w-4 h-4 text-primary" />}
                  </p>
                  <p className="text-caption text-muted-foreground mt-0.5">{c.desc}</p>
                </div>
                {c.id !== "manual" && active && (
                  <span className="numeric text-body-sm font-extrabold text-primary shrink-0">{formatAmount(savings)}</span>
                )}
              </div>
              {c.id === "manual" && active && (
                <div className="mt-3">
                  <AmountInput value={amount} onChange={setAmount} size="md" ariaLabel="مبلغ پس‌انداز ماهانه" />
                  {parseAmountInput(amount) && disposable > 0 && (parseAmountInput(amount) ?? 0) > disposable && (
                    <p className="text-caption text-mifa-rose mt-2">
                      بیشتر از پول آزاد است — تا سقف {formatAmount(disposable)} تومان حساب می‌شود
                    </p>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>

      <div className="rounded-2xl hero-card px-4 py-3.5 flex items-center gap-3" role="status">
        <TrendingUp className="w-5 h-5 text-primary shrink-0" />
        <p className="text-body-sm" style={{ color: "#EAEAEA" }}>
          با «{savingsLabel}» ({formatAmount(savings)} تومان)، هر روز می‌توانی{" "}
          <span className="numeric font-extrabold text-[#5DE6E2]">{formatAmount(daily)}</span> تومان خرج کنی
        </p>
      </div>
      {mode === "max" && (
        <p className="text-caption text-muted-foreground text-center -mt-2">
          چون همه پول آزاد پس‌انداز می‌شود، سقف روزانه صفر می‌شود — برای اهداف کوتاه‌مدت عالی است، برای روزمره سخت!
        </p>
      )}
    </div>
  )
}

// ─── مرحله ۵: روز شروع دوره ───

function CycleStep({
  anchorDay,
  setAnchorDay,
  todayDay,
  preview,
  daily,
}: {
  anchorDay: number
  setAnchorDay: (d: number) => void
  todayDay: number
  preview: ReturnType<typeof firstCyclePreview>
  daily: number
}) {
  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/15 text-primary flex items-center justify-center mx-auto mb-4">
          <CalendarDays className="w-8 h-8" />
        </div>
        <h2 className="mifa-h3 text-foreground">دوره مالی از کدام روز ماه شروع شود؟</h2>
        <p className="mifa-body-sm text-muted-foreground mt-2">
          مثلاً از اول آذر یا هر روزی که خودت خواستی — همون روز، پولت دوباره تقسیم می‌شود
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card/50 p-4">
        <AnchorDayPicker value={anchorDay} onChange={setAnchorDay} todayDay={todayDay} />
      </div>

      <div className="rounded-2xl bg-primary/10 border border-primary/25 px-4 py-3.5 space-y-1.5">
        <p className="text-body-sm text-foreground flex items-center gap-2">
          <CalendarDays className="w-4.5 h-4.5 text-primary shrink-0" />
          دوره اول: <span className="font-extrabold text-primary">{preview.label}</span>
          <span className="numeric text-muted-foreground">({toPersianDigits(preview.days)} روز)</span>
        </p>
        <p className="text-caption text-muted-foreground ps-7">
          چون همین حالا شروع می‌کنی، دوره اول از امروز حساب می‌شود و بودجه‌اش به‌اندازه روزهای باقی‌مانده کسری می‌شود.
        </p>
      </div>

      {daily > 0 && (
        <p className="text-center text-caption text-muted-foreground">
          یعنی فعلاً هر روز: <span className="numeric font-bold text-foreground">{formatAmount(daily)}</span> تومان
        </p>
      )}
    </div>
  )
}

// ─── مرحله ۶: نتیجه ───

function ResultStep({
  snapshot,
  incomeNum,
  fixedTotal,
  savings,
  savingsLabel,
  cycleLabel,
  cycleDays,
}: {
  snapshot: ReturnType<typeof computeSnapshot> | null
  incomeNum: number
  fixedTotal: number
  savings: number
  savingsLabel: string
  cycleLabel: string
  cycleDays: number
}) {
  if (!snapshot) {
    return <Skeleton className="h-64 rounded-3xl" />
  }
  return (
    <div className="space-y-6">
      <div className="hero-card rounded-3xl p-7 text-center mifa-pop">
        <p className="text-body-sm" style={{ color: "rgba(234,234,234,0.75)" }}>هر روز می‌توانی خرج کنی</p>
        <p className={`numeric mifa-display mt-2 text-glow ${snapshot.dailyAllowance > 0 ? "text-[#5DE6E2]" : "text-[#FF7D9F]"}`}>
          {formatAmount(snapshot.dailyAllowance)}
        </p>
        <p className="text-body-sm mt-1" style={{ color: "rgba(234,234,234,0.75)" }}>تومان</p>
        <p className="text-caption mt-3" style={{ color: "rgba(234,234,234,0.55)" }}>
          دوره اول: {cycleLabel} · {toPersianDigits(cycleDays)} روز
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card/60 divide-y divide-border">
        <BreakdownRow label="درآمد ماهانه" value={incomeNum} sign="+" />
        <BreakdownRow label="خرج ثابت" value={fixedTotal} sign="−" />
        <BreakdownRow label={`پس‌انداز (${savingsLabel})`} value={savings} sign="−" />
        <BreakdownRow label="پول آزاد دوره" value={snapshot.cycleBudget} sign="=" bold />
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-body-sm text-muted-foreground">÷ روزهای باقی‌مانده</span>
          <span className="numeric text-body-sm font-bold text-foreground">{toPersianDigits(snapshot.facts.daysLeft)} روز</span>
        </div>
      </div>
    </div>
  )
}

function BreakdownRow({ label, value, sign, bold = false }: { label: string; value: number; sign: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className={`text-body-sm ${bold ? "font-extrabold text-foreground" : "text-muted-foreground"}`}>
        <span className="inline-block w-5 text-primary font-bold">{sign}</span> {label}
      </span>
      <span className={`numeric ${bold ? "text-body font-extrabold text-primary" : "text-body-sm font-bold text-foreground"}`}>
        {formatAmount(value)}
      </span>
    </div>
  )
}
