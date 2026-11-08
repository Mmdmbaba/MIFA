"use client"

// ثبت سریع MIFA — شیت پایینی: مبلغ بزرگ، شبکه دسته‌بندی، ذخیره زیر ۱۰ ثانیه
// فرم فقط وقتی شیت باز است mount می‌شود → هر بار با تمیزی کامل شروع می‌شود
import { useMemo, useState } from "react"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AmountInput } from "./amount-input"
import { CategoryIcon } from "./mifa-icons"
import { useAddTransactions } from "./mifa-hooks"
import { CATEGORIES } from "@/lib/mifa/categories"
import { formatAmount, parseAmountInput } from "@/lib/mifa/format"
import { fullJalaliDate } from "@/lib/mifa/jalali"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Check, TrendingDown, TrendingUp } from "lucide-react"

export function QuickAddDialog({
  open,
  onOpenChange,
  defaultCategory = null,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  defaultCategory?: string | null
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="bg-card border-border rounded-t-[28px] px-5 pt-4 pb-[max(env(safe-area-inset-bottom),1rem)] max-w-lg mx-auto inset-x-0 w-full max-h-[92dvh] overflow-y-auto scroll-slim"
      >
        {open && <QuickAddForm defaultCategory={defaultCategory} onDone={() => onOpenChange(false)} />}
      </SheetContent>
    </Sheet>
  )
}

function QuickAddForm({ defaultCategory, onDone }: { defaultCategory: string | null; onDone: () => void }) {
  const [type, setType] = useState<"expense" | "income">("expense")
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState<string>(defaultCategory ?? "groceries")
  const [title, setTitle] = useState("")
  const add = useAddTransactions()
  const { toast } = useToast()

  const amountNum = parseAmountInput(amount) ?? 0
  const canSave = amountNum > 0

  const visibleCategories = useMemo(
    () => (type === "income" ? CATEGORIES.filter((c) => c.id === "savings") : CATEGORIES),
    [type]
  )

  const save = () => {
    if (!canSave) return
    add.mutate(
      [
        {
          type,
          amount: amountNum,
          title: title.trim() || null,
          category: type === "income" ? "savings" : category,
          date: new Date().toISOString(),
          source: "manual",
        },
      ],
      {
        onSuccess: () => {
          toast({
            title: type === "expense" ? "خرجت ثبت شد ✓" : "درآمدت ثبت شد ✓",
            description: `${formatAmount(amountNum)} تومان`,
          })
          onDone()
        },
        onError: () => toast({ title: "ثبت نشد — دوباره تلاش کن", variant: "destructive" }),
      }
    )
  }

  return (
    <>
      <div className="mx-auto w-10 h-1.5 rounded-full bg-muted-foreground/30 mb-4" aria-hidden="true" />
      <SheetTitle className="sr-only">ثبت سریع تراکنش</SheetTitle>

      {/* نوع تراکنش */}
      <div className="grid grid-cols-2 gap-2 mb-4" role="tablist" aria-label="نوع تراکنش">
        <button
          type="button"
          role="tab"
          aria-selected={type === "expense"}
          onClick={() => { setType("expense"); if (!CATEGORIES.some((c) => c.id === category)) setCategory("groceries") }}
          className={cn(
            "h-12 rounded-2xl border font-bold text-body-sm flex items-center justify-center gap-2 transition-colors",
            type === "expense" ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"
          )}
        >
          <TrendingDown className="w-4.5 h-4.5" />
          خرج
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={type === "income"}
          onClick={() => setType("income")}
          className={cn(
            "h-12 rounded-2xl border font-bold text-body-sm flex items-center justify-center gap-2 transition-colors",
            type === "income" ? "border-mifa-success bg-mifa-success/15 text-mifa-success" : "border-border text-muted-foreground"
          )}
        >
          <TrendingUp className="w-4.5 h-4.5" />
          درآمد
        </button>
      </div>

      {/* مبلغ */}
      <div className="relative mb-1.5">
        <AmountInput value={amount} onChange={setAmount} autoFocus ariaLabel="مبلغ به تومان" onEnter={save} />
      </div>
      <p className="text-center text-caption text-muted-foreground mb-4">
        تومان · {fullJalaliDate(new Date())}
      </p>

      {/* دسته‌بندی‌ها */}
      {type === "expense" && (
        <div className="grid grid-cols-5 gap-2 mb-4" role="radiogroup" aria-label="دسته‌بندی">
          {visibleCategories.map((c) => {
            const active = category === c.id
            return (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setCategory(c.id)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl border py-2 px-1 transition-all",
                  active ? "border-primary bg-primary/10" : "border-border/70 hover:border-primary/40"
                )}
              >
                <span
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${c.color}1f`, color: c.color }}
                >
                  <CategoryIcon id={c.id} className="w-4.5 h-4.5" />
                </span>
                <span className={cn("text-[10px] font-bold leading-none", active ? "text-primary" : "text-muted-foreground")}>
                  {c.name}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* یادداشت */}
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="یادداشت (اختیاری) — مثلاً نان و شیر"
        className="h-12 bg-background/60 border-input text-foreground mb-4"
        aria-label="یادداشت"
        onKeyDown={(e) => e.key === "Enter" && save()}
      />

      <Button
        size="lg"
        className="w-full h-14 rounded-2xl text-base font-bold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
        disabled={!canSave || add.isPending}
        onClick={save}
      >
        <Check className="w-5 h-5 -ms-1" />
        {add.isPending ? "داریم ثبت می‌کنیم…" : "ثبت"}
      </Button>
    </>
  )
}
