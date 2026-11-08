"use client"

// تنظیمات MIFA — برنامه، روز شروع دوره، تم، داده‌ها (CSV) و درباره
import { useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { RibbonMark } from "./mifa-logo"
import { AnchorDayPicker } from "./anchor-day-picker"
import { useProfile, useTransactions, useUpdateProfile, useAddTransactions, useClearAll } from "./mifa-hooks"
import { computePlanCore } from "@/lib/mifa/plan"
import { cycleFacts } from "@/lib/mifa/mifa-logic"
import { currentCycleKey } from "@/lib/mifa/cycle"
import { todayJalali } from "@/lib/mifa/jalali"
import { transactionsToCsv, downloadCsv, parseCsv } from "@/lib/mifa/csv"
import { formatAmount, toPersianDigits } from "@/lib/mifa/format"
import type { ThemePref } from "@/lib/mifa/types"
import { useTheme } from "next-themes"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import {
  Wallet, CalendarDays, Palette, Database, PencilLine, Download,
  Upload, Trash2, AlertTriangle, PiggyBank,
} from "lucide-react"

const APP_VERSION = "3.0.0"

export function SettingsView({
  onEditProgram,
}: {
  onEditProgram: () => void
  onThemeChanged?: () => void
}) {
  const profile = useProfile()
  const txs = useTransactions()
  const updateProfile = useUpdateProfile()
  const addTx = useAddTransactions()
  const clearAll = useClearAll()
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()

  const p = profile.data?.profile ?? null
  const transactions = txs.data ?? []

  const today = todayJalali()
  const [anchorConfirmOpen, setAnchorConfirmOpen] = useState(false)
  const [pendingAnchor, setPendingAnchor] = useState<number | null>(null)
  const [clearOpen, setClearOpen] = useState(false)
  const [clearChecked, setClearChecked] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const core = useMemo(() => (p ? computePlanCore(p) : null), [p])
  const currentAnchorCycle = p ? currentCycleKey(p.cycleAnchorDay, p.onboardedAt) : ""
  const anchorFacts = p ? cycleFacts(currentAnchorCycle, p.cycleAnchorDay, p.onboardedAt) : null

  const exportCsv = () => {
    if (transactions.length === 0) {
      toast({ title: "تراکنشی برای برداشت نیست" })
      return
    }
    const csv = transactionsToCsv(transactions)
    downloadCsv(`mifa-backup-${today.key}-${String(today.day).padStart(2, "0")}.csv`, csv)
    toast({ title: "فایل CSV دانلود شد ✓", description: `${toPersianDigits(transactions.length)} تراکنش` })
  }

  const importCsv = async (file: File) => {
    const text = await file.text()
    const { transactions: rows, skipped } = parseCsv(text)
    if (rows.length === 0) {
      toast({ title: "سطر معتبری پیدا نشد", variant: "destructive" })
      return
    }
    addTx.mutate(rows as Parameters<typeof addTx.mutate>[0], {
      onSuccess: () => {
        toast({
          title: `${toPersianDigits(rows.length)} تراکنش بازگردانی شد ✓`,
          description: skipped > 0 ? `${toPersianDigits(skipped)} سطر نامعتبر نادیده گرفته شد` : undefined,
        })
      },
    })
  }

  const themeOptions: { id: ThemePref; label: string }[] = [
    { id: "light", label: "روشن" },
    { id: "dark", label: "تیره" },
    { id: "system", label: "سیستم" },
  ]

  return (
    <div className="space-y-5 mifa-stagger">
      {/* ── برنامه ماه ── */}
      <section className="rounded-2xl border border-border bg-card/60 p-5" aria-labelledby="set-plan">
        <div className="flex items-center justify-between mb-4">
          <h2 id="set-plan" className="mifa-h4 text-foreground flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            برنامه ماه
          </h2>
          <Button variant="outline" size="sm" className="h-9 rounded-xl border-border gap-1.5" onClick={onEditProgram}>
            <PencilLine className="w-4 h-4" />
            ویرایش
          </Button>
        </div>
        {p && core ? (
          <div className="space-y-2.5">
            <Row label="درآمد ماهانه" value={`${formatAmount(core.income)} تومان`} />
            <Row label="خرج ثابت" value={`${formatAmount(core.fixedTotal)} تومان`} sub={
              p.fixedExpenses.length > 0
                ? p.fixedExpenses.map((f) => f.label).join("، ")
                : "ثبت نشده"
            } />
            <Row
              label={`پس‌انداز (${p.savingsMode === "manual" ? "خودم" : p.savingsMode === "max" ? "حداکثر" : "پیشنهاد MIFA"})`}
              value={`${formatAmount(core.savings)} تومان`}
              icon={<PiggyBank className="w-4 h-4 text-mifa-success" />}
            />
            <Separator className="my-1" />
            <Row label="پول آزاد دوره" value={`${formatAmount(core.spendable)} تومان`} strong />
          </div>
        ) : (
          <p className="text-body-sm text-muted-foreground">برنامه‌ای ثبت نشده</p>
        )}
      </section>

      {/* ── روز شروع دوره ── */}
      <section className="rounded-2xl border border-border bg-card/60 p-5" aria-labelledby="set-anchor">
        <h2 id="set-anchor" className="mifa-h4 text-foreground flex items-center gap-2 mb-1">
          <CalendarDays className="w-5 h-5 text-primary" />
          روز شروع دوره مالی
        </h2>
        <p className="text-caption text-muted-foreground mb-4">
          الان دوره‌ات از روز <span className="numeric font-bold text-foreground">{toPersianDigits(p?.cycleAnchorDay ?? 1)}</span> هر ماه جلالی شروع می‌شود
          {anchorFacts && <> — دوره جاری: <span className="font-bold text-foreground">{anchorFacts.label}</span></>}
        </p>
        <AnchorDayPicker
          compact
          value={pendingAnchor ?? p?.cycleAnchorDay ?? 1}
          todayDay={today.day}
          onChange={(d) => {
            if (d === (p?.cycleAnchorDay ?? 1)) return
            setPendingAnchor(d)
            setAnchorConfirmOpen(true)
          }}
        />
        <p className="text-caption text-muted-foreground mt-3 flex items-start gap-1.5">
          <AlertTriangle className="w-4 h-4 text-mifa-warning shrink-0 mt-0.5" />
          با تغییر این روز، دوره‌ها و سقف روزانه از نو محاسبه می‌شوند.
        </p>
      </section>

      {/* ── ظاهر ── */}
      <section className="rounded-2xl border border-border bg-card/60 p-5" aria-labelledby="set-theme">
        <h2 id="set-theme" className="mifa-h4 text-foreground flex items-center gap-2 mb-4">
          <Palette className="w-5 h-5 text-primary" />
          ظاهر
        </h2>
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="تم">
          {themeOptions.map((t) => {
            const active = (theme ?? "system") === t.id
            return (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => {
                  setTheme(t.id)
                  updateProfile.mutate({ theme: t.id })
                }}
                className={cn(
                  "h-11 rounded-xl border text-body-sm font-bold transition-colors",
                  active ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
                )}
              >
                {t.label}
              </button>
            )
          })}
        </div>
      </section>

      {/* ── داده‌ها ── */}
      <section className="rounded-2xl border border-border bg-card/60 p-5" aria-labelledby="set-data">
        <h2 id="set-data" className="mifa-h4 text-foreground flex items-center gap-2 mb-1">
          <Database className="w-5 h-5 text-primary" />
          داده‌ها
        </h2>
        <p className="text-caption text-muted-foreground mb-4">
          همه‌چیز فقط روی همین دستگاه (IndexedDB) ذخیره می‌شود — با CSV پشتیبان بگیر.
        </p>
        <div className="grid gap-2">
          <Button variant="outline" className="h-12 rounded-2xl border-border justify-start gap-2.5" onClick={exportCsv}>
            <Download className="w-4.5 h-4.5 text-primary" />
            برداشت CSV ({toPersianDigits(transactions.length)} تراکنش)
          </Button>
          <Button variant="outline" className="h-12 rounded-2xl border-border justify-start gap-2.5" onClick={() => fileRef.current?.click()}>
            <Upload className="w-4.5 h-4.5 text-primary" />
            بازگردانی CSV
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            aria-label="فایل CSV"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void importCsv(f)
              e.target.value = ""
            }}
          />
          <Button
            variant="outline"
            className="h-12 rounded-2xl border-destructive/40 text-destructive justify-start gap-2.5 hover:bg-destructive/10 hover:text-destructive"
            onClick={() => { setClearChecked(false); setClearOpen(true) }}
          >
            <Trash2 className="w-4.5 h-4.5" />
            پاک‌سازی همه داده‌ها
          </Button>
        </div>
      </section>

      {/* ── درباره ── */}
      <section className="hero-card rounded-2xl p-6 text-center" aria-labelledby="set-about">
        <RibbonMark size={64} className="mx-auto" />
        <h2 id="set-about" className="mt-3 text-[22px] font-black tracking-[0.22em]" style={{ color: "#EAEAEA" }}>
          MIFA
        </h2>
        <p className="text-body-sm mt-1" style={{ color: "rgba(234,234,234,0.7)" }}>
          پولت رو بشناس، بیشتر نگه دار
        </p>
        <p className="numeric text-caption mt-3" style={{ color: "rgba(234,234,234,0.5)" }}>
          نسخه {toPersianDigits(APP_VERSION.replace(".", "٫").replace(".", "٫"))} · ساخته‌شده برای یک نفر: خودت
        </p>
      </section>

      {/* ── تأیید تغییر روز شروع ── */}
      <AlertDialog open={anchorConfirmOpen} onOpenChange={setAnchorConfirmOpen}>
        <AlertDialogContent className="rounded-3xl bg-card border-border max-w-sm">
          <AlertDialogHeader className="text-start">
            <AlertDialogTitle className="text-foreground">روز شروع دوره عوض شود؟</AlertDialogTitle>
            <AlertDialogDescription>
              دوره جدید از روز <span className="numeric font-bold">{toPersianDigits(pendingAnchor ?? 1)}</span> شروع می‌شود و
              سقف خرج روزانه از همین حالا بر اساس روزهای باقی‌مانده دوره جدید حساب می‌شود.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2">
            <AlertDialogCancel className="rounded-xl mt-0">بی‌خیال</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => {
                if (pendingAnchor) {
                  updateProfile.mutate(
                    { cycleAnchorDay: pendingAnchor },
                    { onSuccess: () => toast({ title: "روز شروع دوره عوض شد ✓", description: "سقف روزانه از نو حساب شد" }) }
                  )
                }
                setPendingAnchor(null)
              }}
            >
              تغییر بده
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── پاک‌سازی دو مرحله‌ای ── */}
      <AlertDialog open={clearOpen} onOpenChange={setClearOpen}>
        <AlertDialogContent className="rounded-3xl bg-card border-border max-w-sm">
          <AlertDialogHeader className="text-start">
            <AlertDialogTitle className="text-foreground flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-mifa-rose" />
              همه‌چیز پاک شود؟
            </AlertDialogTitle>
            <AlertDialogDescription>
              پروفایل، برنامه و هر {toPersianDigits(transactions.length)} تراکنش برای همیشه از این دستگاه پاک می‌شود و برگشتی ندارد.
              اگر می‌خواهی چیزی نزدیک باشد، اول CSV برداشت کن.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <label className="flex items-center gap-2.5 text-body-sm text-foreground cursor-pointer rounded-xl bg-muted/50 px-3.5 py-3">
            <input
              type="checkbox"
              checked={clearChecked}
              onChange={(e) => setClearChecked(e.target.checked)}
              className="w-4.5 h-4.5 accent-[#FF2E63]"
            />
            می‌دانم؛ همه‌چیز پاک می‌شود
          </label>
          <AlertDialogFooter className="flex-row gap-2">
            <AlertDialogCancel className="rounded-xl mt-0">بی‌خیال</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-white hover:bg-destructive/90 disabled:opacity-40"
              disabled={!clearChecked || clearAll.isPending}
              onClick={() => {
                clearAll.mutate(undefined, {
                  onSuccess: () => {
                    toast({ title: "همه داده‌ها پاک شد", description: "از فردا با برنامه تازه شروع کن!" })
                    setClearOpen(false)
                  },
                })
              }}
            >
              پاک کن
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function Row({ label, value, sub, strong = false, icon }: { label: string; value: string; sub?: string; strong?: boolean; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-body-sm text-muted-foreground flex items-center gap-1.5 min-w-0">
        {icon}
        <span className="truncate">{label}</span>
      </span>
      <span className="text-end shrink-0">
        <span className={cn("numeric block", strong ? "text-body font-extrabold text-primary" : "text-body-sm font-bold text-foreground")}>
          {value}
        </span>
        {sub && <span className="block text-[10px] text-muted-foreground max-w-44 truncate" title={sub}>{sub}</span>}
      </span>
    </div>
  )
}
