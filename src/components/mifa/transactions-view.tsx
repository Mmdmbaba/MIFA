"use client"

// تراکنش‌های MIFA — جستجو، فیلتر، گروه‌بندی روز جلالی، ویرایش/حذف، ورود پیامک بانکی
import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { CategoryBadge, CategoryIcon } from "./mifa-icons"
import { AmountInput } from "./amount-input"
import { useDeleteTransaction, useTransactions, useUpdateTransaction, useAddTransactions } from "./mifa-hooks"
import { groupByDay, cycleFacts } from "@/lib/mifa/mifa-logic"
import { CATEGORIES, getCategory } from "@/lib/mifa/categories"
import { parseSmsText, type ParsedSms } from "@/lib/mifa/sms-parser"
import { formatAmount, toPersianDigits, formatCompact } from "@/lib/mifa/format"
import { useProfile } from "./mifa-hooks"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import {
  Search, MoreHorizontal, Pencil, Trash2, MessageSquareText, Inbox, X,
} from "lucide-react"

type TypeFilter = "all" | "expense" | "income"

export function TransactionsView({ cycle }: { cycle: string }) {
  const profile = useProfile()
  const txs = useTransactions()
  const deleteTx = useDeleteTransaction()
  const { toast } = useToast()
  const [query, setQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all")
  const [catFilter, setCatFilter] = useState<string | null>(null)
  const [allCycles, setAllCycles] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [smsOpen, setSmsOpen] = useState(false)

  const p = profile.data?.profile ?? null
  const all = txs.data ?? []

  // بازه دوره انتخاب‌شده برای فیلتر
  const range = useMemo(() => {
    if (!p) return null
    return cycleFacts(cycle, p.cycleAnchorDay, p.onboardedAt)
  }, [p, cycle])

  const filtered = useMemo(() => {
    let list = all
    if (!allCycles && range) {
      list = list.filter((t) => {
        const d = new Date(t.date)
        return d >= range.start && d < range.end
      })
    }
    if (typeFilter !== "all") list = list.filter((t) => t.type === typeFilter)
    if (catFilter) list = list.filter((t) => t.category === catFilter)
    if (query.trim()) {
      const q = query.trim()
      list = list.filter(
        (t) => (t.title ?? "").includes(q) || getCategory(t.category).name.includes(q) || String(t.amount).includes(q)
      )
    }
    return list
  }, [all, allCycles, range, typeFilter, catFilter, query])

  const groups = useMemo(() => groupByDay(filtered), [filtered])
  const editingTx = all.find((t) => t.id === editing) ?? null
  const deletingTx = all.find((t) => t.id === deleting) ?? null

  return (
    <div className="space-y-4">
      {/* ── نوار ابزار ── */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" aria-hidden="true" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جستجوی عنوان، دسته یا مبلغ…"
            className="h-11 ps-10 bg-card/70 border-input text-foreground rounded-2xl"
            aria-label="جستجوی تراکنش"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          className="h-11 w-11 rounded-2xl border-border bg-card/70"
          onClick={() => setSmsOpen(true)}
          aria-label="ورود پیامک بانکی"
          title="ورود پیامک بانکی"
        >
          <MessageSquareText className="w-5 h-5" />
        </Button>
      </div>

      {/* ── فیلترها ── */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scroll-slim -mx-5 px-5">
        <FilterChip active={allCycles} onClick={() => setAllCycles((v) => !v)} label={allCycles ? "همه دوره‌ها ✓" : "همه دوره‌ها"} />
        <span className="w-px bg-border mx-1 shrink-0" aria-hidden="true" />
        <FilterChip active={typeFilter === "all"} onClick={() => setTypeFilter("all")} label="همه" />
        <FilterChip active={typeFilter === "expense"} onClick={() => setTypeFilter("expense")} label="خرج" />
        <FilterChip active={typeFilter === "income"} onClick={() => setTypeFilter("income")} label="درآمد" />
        <span className="w-px bg-border mx-1 shrink-0" aria-hidden="true" />
        {CATEGORIES.map((c) => (
          <FilterChip
            key={c.id}
            active={catFilter === c.id}
            onClick={() => setCatFilter(catFilter === c.id ? null : c.id)}
            label={c.name}
            dot={c.color}
          />
        ))}
      </div>

      {/* ── فهرست گروه‌بندی‌شده ── */}
      {groups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 px-4 py-12 text-center">
          <Inbox className="w-8 h-8 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-body-sm text-muted-foreground">
            {txs.isLoading ? "داریم می‌آوریم…" : "تراکنشی پیدا نشد"}
          </p>
        </div>
      ) : (
        <div className="space-y-4 max-h-[62vh] overflow-y-auto scroll-slim pe-0.5">
          {groups.map((g) => (
            <section key={g.key} aria-label={`تراکنش‌های ${g.label}`}>
              <div className="flex items-center justify-between px-1 mb-1.5">
                <p className="text-caption font-extrabold text-foreground">
                  {g.label} <span className="text-muted-foreground font-medium">· {g.weekday}</span>
                </p>
                <p className="numeric text-caption text-muted-foreground">
                  {g.income > 0 && <span className="text-mifa-success ms-2">+{formatCompact(g.income)}</span>}
                  {g.expense > 0 && <span>−{formatCompact(g.expense)}</span>}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card/60 divide-y divide-border overflow-hidden">
                {g.items.map((t) => (
                  <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                    <CategoryBadge id={t.category} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm font-bold text-foreground truncate">
                        {t.title || getCategory(t.category).name}
                        {t.source === "sms" && (
                          <span className="ms-1.5 text-[9px] font-bold bg-mifa-teal/15 text-mifa-teal rounded-full px-1.5 py-0.5 align-middle">پیامک</span>
                        )}
                      </p>
                      <p className="text-caption text-muted-foreground">{getCategory(t.category).name}</p>
                    </div>
                    <span className={`numeric text-body-sm font-extrabold shrink-0 ${t.type === "expense" ? "text-foreground" : "text-mifa-success"}`}>
                      {t.type === "expense" ? "−" : "+"}
                      {formatAmount(t.amount)}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg shrink-0" aria-label="عملیات تراکنش">
                          <MoreHorizontal className="w-4.5 h-4.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="rounded-xl">
                        <DropdownMenuItem onClick={() => setEditing(t.id)} className="gap-2">
                          <Pencil className="w-4 h-4" /> ویرایش
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDeleting(t.id)} className="gap-2 text-destructive focus:text-destructive">
                          <Trash2 className="w-4 h-4" /> حذف
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* ── ویرایش ── */}
      <EditDialog tx={editingTx} onClose={() => setEditing(null)} />

      {/* ── حذف ── */}
      <AlertDialog open={!!deletingTx} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent className="rounded-3xl bg-card border-border max-w-sm">
          <AlertDialogHeader className="text-start">
            <AlertDialogTitle className="text-foreground">این تراکنش حذف شود؟</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingTx && (
                <>
                  «{deletingTx.title || getCategory(deletingTx.category).name}» به مبلغ{" "}
                  <span className="numeric font-bold">{formatAmount(deletingTx.amount)}</span> تومان — این کار برگشتی ندارد.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2">
            <AlertDialogCancel className="rounded-xl mt-0">بی‌خیال</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (deletingTx) {
                  deleteTx.mutate(deletingTx.id, {
                    onSuccess: () => toast({ title: "تراکنش حذف شد" }),
                  })
                }
                setDeleting(null)
              }}
            >
              حذف کن
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── ورود پیامک ── */}
      <SmsImportSheet open={smsOpen} onOpenChange={setSmsOpen} />
    </div>
  )
}

function FilterChip({ active, onClick, label, dot }: { active: boolean; onClick: () => void; label: string; dot?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "shrink-0 h-9 px-3.5 rounded-full border text-caption font-bold transition-colors inline-flex items-center gap-1.5",
        active ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
      )}
    >
      {dot && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: dot }} aria-hidden="true" />}
      {label}
    </button>
  )
}

// ─── دیالوگ ویرایش ───

function EditDialog({ tx, onClose }: { tx: { id: string; type: "expense" | "income"; amount: number; title?: string | null; category: string } | null; onClose: () => void }) {
  const update = useUpdateTransaction()
  const { toast } = useToast()
  const [amount, setAmount] = useState("")
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState(tx?.category ?? "groceries")

  // مقداردهی هر بار تراکنش عوض شود
  const txId = tx?.id ?? null
  const [lastId, setLastId] = useState<string | null>(null)
  if (txId && txId !== lastId) {
    setLastId(txId)
    setAmount(formatAmount(tx!.amount))
    setTitle(tx!.title ?? "")
    setCategory(tx!.category)
  }

  if (!tx) return null
  const amountNum = parseAmountInput(amount) ?? 0

  return (
    <Sheet open={!!tx} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="bg-card border-border rounded-t-[28px] px-5 pt-4 pb-[max(env(safe-area-inset-bottom),1rem)] max-w-lg mx-auto inset-x-0 w-full">
        <div className="mx-auto w-10 h-1.5 rounded-full bg-muted-foreground/30 mb-4" aria-hidden="true" />
        <SheetTitle className="mifa-h4 text-foreground mb-4 text-start">ویرایش تراکنش</SheetTitle>
        <div className="space-y-3">
          <AmountInput value={amount} onChange={setAmount} size="md" ariaLabel="مبلغ" />
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="عنوان"
            className="h-12 bg-background/60 border-input text-foreground"
            aria-label="عنوان"
          />
          <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-label="دسته‌بندی">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={category === c.id}
                onClick={() => setCategory(c.id)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl border py-2 px-1 transition-all",
                  category === c.id ? "border-primary bg-primary/10" : "border-border/70"
                )}
              >
                <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${c.color}1f`, color: c.color }}>
                  <CategoryIcon id={c.id} className="w-4.5 h-4.5" />
                </span>
                <span className={cn("text-[10px] font-bold leading-none", category === c.id ? "text-primary" : "text-muted-foreground")}>
                  {c.name}
                </span>
              </button>
            ))}
          </div>
          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1 h-12 rounded-2xl border-border" onClick={onClose}>
              بی‌خیال
            </Button>
            <Button
              className="flex-1 h-12 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={amountNum <= 0 || update.isPending}
              onClick={() =>
                update.mutate(
                  { id: tx.id, amount: amountNum, title: title.trim() || null, category },
                  {
                    onSuccess: () => {
                      toast({ title: "تراکنش به‌روز شد ✓" })
                      onClose()
                    },
                  }
                )
              }
            >
              ذخیره
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── ورود پیامک بانکی ───

const SMS_SAMPLE = `خرج کارت
مبلغ: 250,000 ریال
خرید از فروشگاه افق
تاریخ: 1404/08/15 ساعت 18:32
موجودی: 12,400,000 ریال

واریز به حساب شما
مبلغ: 5,000,000 ریال
از آقای رضایی

برداشت نقدی
مبلغ: 1,000,000 ریال
تاریخ: 1404/08/16`

function SmsImportSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { toast } = useToast()
  const add = useAddTransactions()
  const [text, setText] = useState("")
  const [parsed, setParsed] = useState<ParsedSms[] | null>(null)
  const [checked, setChecked] = useState<Set<number>>(new Set())

  const doParse = () => {
    const results = parseSmsText(text)
    if (results.length === 0) {
      toast({ title: "تراکنشی پیدا نشد", description: "متن پیامک‌های بانکی را کامل بچسبان" })
      return
    }
    setParsed(results)
    setChecked(new Set(results.map((_, i) => i)))
  }

  const confirm = () => {
    if (!parsed) return
    const items = parsed.filter((_, i) => checked.has(i)).map((r) => ({
      type: r.type,
      amount: r.amount,
      title: r.title,
      category: r.category,
      date: r.date,
      source: "sms" as const,
    }))
    if (items.length === 0) return
    add.mutate(items, {
      onSuccess: () => {
        toast({ title: `${toPersianDigits(items.length)} تراکنش اضافه شد ✓` })
        setParsed(null)
        setText("")
        onOpenChange(false)
      },
    })
  }

  return (
    <Sheet open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setParsed(null) }}>
      <SheetContent side="bottom" className="bg-card border-border rounded-t-[28px] px-5 pt-4 pb-[max(env(safe-area-inset-bottom),1rem)] max-w-lg mx-auto inset-x-0 w-full max-h-[92dvh] overflow-y-auto scroll-slim">
        <div className="mx-auto w-10 h-1.5 rounded-full bg-muted-foreground/30 mb-4" aria-hidden="true" />
        <SheetTitle className="mifa-h4 text-foreground mb-1 text-start flex items-center gap-2">
          <MessageSquareText className="w-5 h-5 text-primary" />
          ورود پیامک بانکی
        </SheetTitle>
        <p className="text-caption text-muted-foreground mb-4 text-start">
          پیامک‌های بانک را همان‌طور که هستند بچسبان؛ MIFA مبلغ، تاریخ و نوع را تشخیص می‌دهد. مبالغ ریالی خودکار به تومان تبدیل می‌شوند.
        </p>

        {!parsed ? (
          <div className="space-y-3">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={SMS_SAMPLE}
              rows={8}
              className="bg-background/60 border-input text-foreground text-body-sm rounded-2xl"
              aria-label="متن پیامک‌های بانکی"
            />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 h-12 rounded-2xl border-border" onClick={() => setText(SMS_SAMPLE)}>
                نمونه بگذار
              </Button>
              <Button className="flex-1 h-12 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90" onClick={doParse} disabled={text.trim().length < 10}>
                تشخیص تراکنش‌ها
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-body-sm font-bold text-foreground">
                {toPersianDigits(parsed.length)} تراکنش پیدا شد
              </p>
              <Button variant="ghost" size="sm" className="h-8 text-caption rounded-lg" onClick={() => setParsed(null)}>
                <X className="w-4 h-4" /> برگشت
              </Button>
            </div>
            <div className="rounded-2xl border border-border divide-y divide-border max-h-[46vh] overflow-y-auto scroll-slim">
              {parsed.map((r, i) => (
                <label key={i} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-primary/5 transition-colors">
                  <input
                    type="checkbox"
                    checked={checked.has(i)}
                    onChange={(e) => {
                      const next = new Set(checked)
                      if (e.target.checked) next.add(i)
                      else next.delete(i)
                      setChecked(next)
                    }}
                    className="w-4.5 h-4.5 accent-[#08D9D6]"
                    aria-label={`افزودن ${r.title ?? ""}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm font-bold text-foreground truncate">{r.title ?? "بدون عنوان"}</p>
                    <p className="text-caption text-muted-foreground truncate">{r.raw}</p>
                  </div>
                  <div className="text-end shrink-0">
                    <p className={cn("numeric text-body-sm font-extrabold", r.type === "expense" ? "text-foreground" : "text-mifa-success")}>
                      {r.type === "expense" ? "−" : "+"}
                      {formatAmount(r.amount)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{r.currencyHint === "rial" ? "ریال→تومان" : "تومان"}</p>
                  </div>
                </label>
              ))}
            </div>
            <Button
              className="w-full h-12 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={checked.size === 0 || add.isPending}
              onClick={confirm}
            >
              افزودن {toPersianDigits(checked.size)} تراکنش
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
