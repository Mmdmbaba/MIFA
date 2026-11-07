"use client"

// بودجه‌بندی MIFA — بودجه کل ماه + سقف هر دسته
import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { CategoryIcon } from "./mifa-icons"
import { useBudget, useTransactions, useSaveBudget } from "./mifa-hooks"
import { computeMonthStats } from "./mifa-logic"
import { CATEGORIES, getCategory } from "@/lib/mifa/categories"
import { formatAmount, parseAmountInput, formatPercent, toPersianDigits } from "@/lib/mifa/format"
import { monthLabel } from "@/lib/mifa/jalali"
import { AlertTriangle } from "lucide-react"

interface BudgetViewProps {
  month: string
}

export function BudgetView({ month }: BudgetViewProps) {
  const budget = useBudget(month)
  const tx = useTransactions(month)
  const save = useSaveBudget()
  const { toast } = useToast()

  const [monthly, setMonthly] = useState("")
  const [catBudgets, setCatBudgets] = useState<Record<string, string>>({})
  const [syncedMonth, setSyncedMonth] = useState<string | null>(null)

  // همگام‌سازی با داده سرور — الگوی تنظیم state در رندر
  if (budget.data && syncedMonth !== month && !budget.isLoading) {
    setMonthly(budget.data.monthly ? String(budget.data.monthly) : "")
    const map: Record<string, string> = {}
    for (const c of budget.data.categories) map[c.category] = String(c.amount)
    setCatBudgets(map)
    setSyncedMonth(month)
  }

  const stats = useMemo(() => computeMonthStats(tx.data ?? [], month), [tx.data, month])
  const catSpent = useMemo(() => {
    const map = new Map(stats.byCategory.map((x) => [x.category, x.amount]))
    return map
  }, [stats.byCategory])

  const monthlyNum = parseAmountInput(monthly)
  const totalCatBudget = Object.values(catBudgets)
    .reduce((s, v) => s + (parseAmountInput(v) ?? 0), 0)

  const saveAll = () => {
    const m = monthlyNum ?? 0
    const cats = Object.entries(catBudgets)
      .map(([category, v]) => ({ category, amount: parseAmountInput(v) ?? 0 }))
      .filter((x) => x.amount > 0)
    if (m === 0 && cats.length === 0) {
      toast({ title: "حداقل بودجه کل یا یک دسته رو پر کن", variant: "destructive" })
      return
    }
    save.mutate(
      { month, monthly: m > 0 ? m : null, categories: cats },
      { onSuccess: () => toast({ title: "بودجه ذخیره شد ✓" }),
        onError: (e) => toast({ title: e.message, variant: "destructive" }) }
    )
  }

  if (budget.isLoading || tx.isLoading) {
    return <div className="space-y-4"><Skeleton className="h-48 rounded-2xl" /><Skeleton className="h-96 rounded-2xl" /></div>
  }

  return (
    <div className="space-y-4 mifa-fade-up">
      {/* بودجه کل ماه */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="mifa-h4">بودجه کل {monthLabel(month)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-caption text-muted-foreground">کل پولی که این ماه خرج می‌کنی (تومان)</Label>
            <Input inputMode="numeric" placeholder="مثلاً ۸٬۰۰۰٬۰۰۰" value={monthly}
              onChange={(e) => setMonthly(e.target.value)}
              className="numeric h-13 mt-2 text-xl font-bold" aria-label="بودجه کل ماه" />
          </div>
          {monthlyNum && stats.totalExpense > 0 ? (
            <div>
              <Progress value={Math.min((stats.totalExpense / monthlyNum) * 100, 100)} className="h-2.5"
                indicatorStyle={{
                  backgroundColor: (stats.totalExpense / monthlyNum) > 1 ? "#FF2E63" : "#08D9D6",
                }} />
              <div className="flex justify-between text-caption text-muted-foreground mt-2 numeric">
                <span>خرج شده: {formatAmount(stats.totalExpense)}</span>
                <span>{formatPercent((stats.totalExpense / monthlyNum) * 100)}</span>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* سقف دسته‌ها */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="mifa-h4">سقف هر دسته (اختیاری)</CardTitle>
          <p className="text-caption text-muted-foreground">
            فقط برای دسته‌هایی که می‌خوای کنترلشون کنی سقف بذار
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {CATEGORIES.map((c) => {
            const spent = catSpent.get(c.id) ?? 0
            const cap = parseAmountInput(catBudgets[c.id] ?? "")
            const over = cap !== null && spent > cap
            const near = cap !== null && !over && cap > 0 && spent / cap >= 0.8
            return (
              <div key={c.id} className={`rounded-xl border p-3 ${over ? "border-destructive/50" : "border-border"}`}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${c.color}22`, color: c.color }}>
                    <CategoryIcon id={c.id} className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm font-semibold">{c.name}</p>
                    {spent > 0 ? (
                      <p className="text-caption text-muted-foreground numeric mt-0.5">
                        خرج شده: {formatAmount(spent)}
                        {cap ? ` از ${formatAmount(cap)}` : ""}
                      </p>
                    ) : (
                      <p className="text-caption text-muted-foreground mt-0.5">این ماه خرجی نداشتی</p>
                    )}
                  </div>
                  <Input inputMode="numeric" placeholder="سقف" value={catBudgets[c.id] ?? ""}
                    onChange={(e) => setCatBudgets((prev) => ({ ...prev, [c.id]: e.target.value }))}
                    className="numeric w-32 h-9 text-sm text-center" aria-label={`سقف دسته ${c.name}`} />
                </div>
                {cap && spent > 0 ? (
                  <Progress value={Math.min((spent / cap) * 100, 100)} className="h-2 mt-3"
                    indicatorStyle={{ backgroundColor: over ? "#FF2E63" : near ? "#E2AD5D" : c.color }} />
                ) : null}
                {over ? (
                  <p className="text-caption text-destructive font-semibold mt-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {formatAmount(spent - cap)} تومان از سقف رد شده
                  </p>
                ) : null}
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* جمع سقف‌ها */}
      {totalCatBudget > 0 && monthlyNum ? (
        <p className={`text-center text-caption ${totalCatBudget > monthlyNum ? "text-destructive" : "text-muted-foreground"}`}>
          جمع سقف دسته‌ها: <span className="numeric">{formatAmount(totalCatBudget)}</span> تومان
          {totalCatBudget > monthlyNum ? " — از بودجه کل بیشتره!" : ` از بودجه کل (${formatAmount(monthlyNum)})`}
        </p>
      ) : null}

      <Button onClick={saveAll} disabled={save.isPending}
        className="w-full h-12 bg-primary text-primary-foreground font-bold hover:bg-primary/90 text-base">
        {save.isPending ? "در حال ذخیره..." : "ذخیره بودجه"}
      </Button>
    </div>
  )
}
