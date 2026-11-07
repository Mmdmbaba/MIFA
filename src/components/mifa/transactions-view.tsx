"use client"

// لیست تراکنش‌ها — فیلتر، جستجو، ویرایش و حذف
import { useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { CategoryBadge } from "./mifa-icons"
import { useTransactions, useDeleteTransaction, useUpdateTransaction, type Transaction } from "./mifa-hooks"
import { CATEGORIES } from "@/lib/mifa/categories"
import { formatAmount, parseAmountInput, toPersianDigits } from "@/lib/mifa/format"
import { fullJalaliDate } from "@/lib/mifa/jalali"
import { Search, Pencil, Trash2 } from "lucide-react"

interface TransactionsViewProps {
  month: string
}

interface EditState {
  tx: Transaction
  amount: string
  title: string
  category: string
}

export function TransactionsView({ month }: TransactionsViewProps) {
  const tx = useTransactions(month)
  const del = useDeleteTransaction()
  const update = useUpdateTransaction()
  const { toast } = useToast()

  const [query, setQuery] = useState("")
  const [catFilter, setCatFilter] = useState<string>("all")
  const [edit, setEdit] = useState<EditState | null>(null)
  const [deleting, setDeleting] = useState<Transaction | null>(null)

  const filtered = useMemo(() => {
    let rows = tx.data ?? []
    if (catFilter !== "all") rows = rows.filter((t) => t.category === catFilter)
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      rows = rows.filter((t) =>
        (t.title ?? "").toLowerCase().includes(q) || String(t.amount).includes(q))
    }
    return rows
  }, [tx.data, catFilter, query])

  const grouped = useMemo(() => {
    const map = new Map<string, Transaction[]>()
    for (const t of filtered) {
      const key = fullJalaliDate(new Date(t.date))
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(t)
    }
    return Array.from(map.entries())
  }, [filtered])

  const saveEdit = () => {
    if (!edit) return
    const amount = parseAmountInput(edit.amount)
    if (!amount) {
      toast({ title: "مبلغ معتبر نیست", variant: "destructive" })
      return
    }
    update.mutate(
      { id: edit.tx.id, amount, title: edit.title.trim() || null, category: edit.category },
      {
        onSuccess: () => {
          toast({ title: "تراکنش به‌روز شد ✓" })
          setEdit(null)
        },
        onError: (e) => toast({ title: e.message, variant: "destructive" }),
      }
    )
  }

  const confirmDelete = () => {
    if (!deleting) return
    del.mutate(deleting.id, {
      onSuccess: () => toast({ title: "تراکنش حذف شد" }),
      onError: (e) => toast({ title: e.message, variant: "destructive" }),
      onSettled: () => setDeleting(null),
    })
  }

  if (tx.isLoading) {
    return <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
    ))}</div>
  }

  return (
    <div className="space-y-4 mifa-fade-up">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="جستجو در یادداشت یا مبلغ..." value={query}
            onChange={(e) => setQuery(e.target.value)} className="ps-9" aria-label="جستجو" />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-36" aria-label="فیلتر دسته">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه دسته‌ها</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {grouped.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-body-sm text-muted-foreground">
            {query || catFilter !== "all" ? "چیزی مطابق فیلتر پیدا نشد" : `در ${monthLabelShort(month)} تراکنشی ثبت نشده`}
          </CardContent>
        </Card>
      ) : (
        grouped.map(([day, rows]) => (
          <div key={day}>
            <p className="text-caption text-muted-foreground mb-2 px-1">{day}</p>
            <Card>
              <CardContent className="p-2">
                <ul className="divide-y divide-border">
                  {rows.map((t) => (
                    <li key={t.id} className="flex items-center gap-3 px-2 py-3">
                      <CategoryBadge id={t.category} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-body-sm font-medium truncate">{t.title ?? labelOf(t.category)}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
                          {labelOf(t.category)}
                          {t.source === "sms" ? (
                            <span className="text-[9px] bg-accent text-accent-foreground rounded px-1 py-px">پیامکی</span>
                          ) : null}
                        </p>
                      </div>
                      <span className={`numeric font-bold text-body-sm ${t.type === "income" ? "text-[#2BD38B]" : ""}`}>
                        {t.type === "income" ? "+" : "−"}{formatAmount(t.amount)}
                      </span>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => setEdit({ tx: t, amount: String(t.amount), title: t.title ?? "", category: t.category })}
                          aria-label="ویرایش">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleting(t)} aria-label="حذف">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        ))
      )}

      {filtered.length > 0 ? (
        <p className="text-center text-caption text-muted-foreground pb-2">
          {toPersianDigits(filtered.length)} تراکنش
        </p>
      ) : null}

      {/* دیالوگ ویرایش */}
      <Dialog open={!!edit} onOpenChange={(v) => !v && setEdit(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="mifa-h4">ویرایش تراکنش</DialogTitle>
            <DialogDescription>مبلغ، دسته و یادداشت رو اصلاح کن</DialogDescription>
          </DialogHeader>
          {edit ? (
            <div className="space-y-4">
              <Input inputMode="numeric" value={edit.amount}
                onChange={(e) => setEdit({ ...edit, amount: e.target.value })}
                className="numeric h-12 text-lg font-bold text-center" aria-label="مبلغ" />
              <Input placeholder="یادداشت" value={edit.title}
                onChange={(e) => setEdit({ ...edit, title: e.target.value })} aria-label="یادداشت" />
              <Select value={edit.category} onValueChange={(v) => setEdit({ ...edit, category: v })}>
                <SelectTrigger aria-label="دسته"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setEdit(null)}>انصراف</Button>
                <Button onClick={saveEdit} disabled={update.isPending}
                  className="bg-primary text-primary-foreground font-bold hover:bg-primary/90">
                  ذخیره
                </Button>
              </DialogFooter>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* تایید حذف */}
      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف تراکنش؟</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting ? `${formatAmount(deleting.amount)} تومان — ${deleting.title ?? labelOf(deleting.category)}` : ""}
              <br />این کار قابل بازگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-white hover:bg-destructive/90">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function labelOf(category: string): string {
  return CATEGORIES.find((c) => c.id === category)?.name ?? "سایر"
}

function monthLabelShort(key: string): string {
  const [jy, jm] = key.split("-")
  const names = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"]
  return `${names[Number(jm) - 1]} ${toPersianDigits(jy)}`
}
