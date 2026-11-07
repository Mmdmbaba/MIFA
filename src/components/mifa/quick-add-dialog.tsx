"use client"

// دیالوگ ثبت سریع MIFA — ثبت دستی ۱۰ ثانیه‌ای + ثبت گروهی از پیامک بانکی
import { useMemo, useState } from "react"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { CATEGORIES, autoCategory } from "@/lib/mifa/categories"
import { parseAmountInput, formatAmount, toPersianDigits } from "@/lib/mifa/format"
import { parseSmsText, type ParsedSms } from "@/lib/mifa/sms-parser"
import { CategoryIcon } from "./mifa-icons"
import { useAddTransactions } from "./mifa-hooks"
import { Sparkles, MessageSquareText, Keyboard, Trash2 } from "lucide-react"

interface QuickAddDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  month: string
}

export function QuickAddDialog({ open, onOpenChange }: QuickAddDialogProps) {
  const { toast } = useToast()
  const addTx = useAddTransactions()

  // حالت ثبت دستی
  const [type, setType] = useState<"expense" | "income">("expense")
  const [amount, setAmount] = useState("")
  const [note, setNote] = useState("")
  const [category, setCategory] = useState("groceries")
  const [yesterday, setYesterday] = useState(false)

  // حالت پیامک
  const [smsText, setSmsText] = useState("")
  const [parsed, setParsed] = useState<ParsedSms[] | null>(null)
  const [selected, setSelected] = useState<Set<number>>(new Set())

  const suggested = useMemo(() => (note.trim() ? autoCategory(note) : null), [note])
  const amountNum = parseAmountInput(amount)

  const resetManual = () => {
    setAmount(""); setNote(""); setCategory("groceries"); setType("expense"); setYesterday(false)
  }

  const submitManual = () => {
    if (!amountNum) {
      toast({ title: "مبلغ رو بنویس", variant: "destructive" })
      return
    }
    const d = new Date()
    if (yesterday) d.setDate(d.getDate() - 1)
    addTx.mutate(
      [{ type, amount: amountNum, title: note.trim() || null, category, date: d.toISOString() }],
      {
        onSuccess: () => {
          toast({ title: type === "expense" ? "خرج ثبت شد ✓" : "درآمد ثبت شد ✓",
            description: `${formatAmount(amountNum)} تومان` })
          resetManual()
          onOpenChange(false)
        },
        onError: (e) => toast({ title: e.message, variant: "destructive" }),
      }
    )
  }

  const runParse = () => {
    const results = parseSmsText(smsText)
    if (results.length === 0) {
      toast({ title: "تراکنشی پیدا نکردم",
        description: "پیامک‌های خرج کارت، برداشت یا واریز رو بچسبون" })
      setParsed(null)
      return
    }
    setParsed(results)
    setSelected(new Set(results.map((_, i) => i)))
    toast({ title: `${toPersianDigits(results.length)} تراکنش پیدا شد`, description: "بعد از چک کردن، ثبت کن" })
  }

  const submitSms = () => {
    if (!parsed) return
    const items = parsed
      .filter((_, i) => selected.has(i))
      .map((p) => ({ type: p.type, amount: p.amount, title: p.title, category: p.category, date: p.date, source: "sms" }))
    if (items.length === 0) {
      toast({ title: "حداقل یک تراکنش انتخاب کن", variant: "destructive" })
      return
    }
    addTx.mutate(items, {
      onSuccess: () => {
        toast({ title: `${toPersianDigits(items.length)} تراکنش ثبت شد ✓` })
        setSmsText(""); setParsed(null); setSelected(new Set())
        onOpenChange(false)
      },
      onError: (e) => toast({ title: e.message, variant: "destructive" }),
    })
  }

  const changeParsedCategory = (idx: number, cat: string) => {
    setParsed((prev) => prev ? prev.map((p, i) => (i === idx ? { ...p, category: cat } : p)) : prev)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="mifa-h3">ثبت سریع</DialogTitle>
          <DialogDescription>مبلغ و دسته رو بزن — یا پیامک‌های بانک رو بچسبون</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="manual">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="manual" className="gap-1.5"><Keyboard className="w-4 h-4" /> دستی</TabsTrigger>
            <TabsTrigger value="sms" className="gap-1.5"><MessageSquareText className="w-4 h-4" /> از پیامک بانک</TabsTrigger>
          </TabsList>

          {/* ── ثبت دستی ── */}
          <TabsContent value="manual" className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-2">
              <Button variant={type === "expense" ? "default" : "outline"}
                onClick={() => setType("expense")}
                className={type === "expense" ? "bg-primary text-primary-foreground font-bold" : ""}>
                خرج
              </Button>
              <Button variant={type === "income" ? "default" : "outline"}
                onClick={() => setType("income")}
                className={type === "income" ? "bg-[#238B68] text-white font-bold hover:bg-[#238B68]/90" : ""}>
                درآمد
              </Button>
            </div>

            <div>
              <Input
                inputMode="numeric"
                placeholder="مبلغ به تومان — مثلاً ۱۲۰٬۰۰۰"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="numeric h-14 text-2xl font-bold text-center"
                aria-label="مبلغ به تومان"
                onKeyDown={(e) => e.key === "Enter" && submitManual()}
              />
              {amountNum ? (
                <p className="text-center text-caption text-muted-foreground mt-1.5">{formatAmount(amountNum)} تومان</p>
              ) : null}
            </div>

            <div>
              <Label className="text-caption text-muted-foreground">دسته</Label>
              <div className="grid grid-cols-5 gap-1.5 mt-2">
                {CATEGORIES.map((c) => (
                  <button key={c.id} type="button"
                    onClick={() => setCategory(c.id)}
                    aria-pressed={category === c.id}
                    className={`flex flex-col items-center gap-1 rounded-xl py-2.5 px-1 border transition-colors ${
                      category === c.id
                        ? "border-primary bg-accent text-accent-foreground"
                        : "border-border text-muted-foreground hover:border-primary/40"
                    }`}>
                    <CategoryIcon id={c.id} className="w-5 h-5" />
                    <span className="text-[10px] leading-none font-medium">{c.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Input placeholder="یادداشت — مثلاً خرید سوپر (اختیاری)" value={note}
                onChange={(e) => setNote(e.target.value)}
                aria-label="یادداشت" />
              {suggested && suggested !== category ? (
                <button type="button"
                  onClick={() => setCategory(suggested)}
                  className="mt-2 inline-flex items-center gap-1 text-caption text-[#08D9D6] hover:underline">
                  <Sparkles className="w-3.5 h-3.5" />
                  پیشنهاد هوشمند: دسته «{CATEGORIES.find((c) => c.id === suggested)?.name}»
                </button>
              ) : null}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-body-sm cursor-pointer">
                <Checkbox checked={yesterday} onCheckedChange={(v) => setYesterday(v === true)} />
                مال دیروزه
              </label>
              <Button onClick={submitManual} disabled={addTx.isPending}
                className="bg-primary text-primary-foreground font-bold px-8 hover:bg-primary/90">
                {addTx.isPending ? "..." : "ثبت"}
              </Button>
            </div>
          </TabsContent>

          {/* ── ثبت از پیامک بانکی ── */}
          <TabsContent value="sms" className="space-y-4 pt-2">
            {!parsed ? (
              <>
                <Textarea
                  placeholder={`متن پیامک‌های بانک رو اینجا بچسبون — مثلاً:\nخرج کارت: مبلغ 1,500,000 ریال خرید از سوپر\nواریز: مبلغ 20,000,000 ریال`}
                  value={smsText}
                  onChange={(e) => setSmsText(e.target.value)}
                  rows={7}
                  className="text-body-sm leading-6"
                  aria-label="متن پیامک بانکی"
                />
                <p className="text-caption text-muted-foreground">
                  چند پیامک رو یکجا هم می‌تونی بچسبونی — ریال خودکار به تومان تبدیل می‌شه
                </p>
                <Button onClick={runParse} disabled={!smsText.trim()}
                  className="w-full bg-primary text-primary-foreground font-bold hover:bg-primary/90">
                  پیدا کردن تراکنش‌ها
                </Button>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <Label>تراکنش‌های پیدا‌شده</Label>
                  <button type="button"
                    onClick={() => setParsed(null)}
                    className="text-caption text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                    <Trash2 className="w-3.5 h-3.5" /> از اول
                  </button>
                </div>
                <div className="space-y-2 max-h-72 overflow-y-auto pl-1">
                  {parsed.map((p, i) => (
                    <div key={i}
                      className={`rounded-xl border p-3 flex items-start gap-3 ${
                        selected.has(i) ? "border-primary/50 bg-accent/40" : "border-border opacity-60"
                      }`}>
                      <Checkbox
                        checked={selected.has(i)}
                        onCheckedChange={(v) => {
                          const next = new Set(selected)
                          if (v === true) next.add(i); else next.delete(i)
                          setSelected(next)
                        }}
                        className="mt-1"
                        aria-label={`انتخاب تراکنش ${i + 1}`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`font-bold numeric text-body ${p.type === "income" ? "text-[#238B68]" : "text-foreground"}`}>
                            {p.type === "income" ? "+" : "−"}{formatAmount(p.amount)} تومان
                          </span>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {p.type === "income" ? "درآمد" : "خرج"}
                          </span>
                        </div>
                        {p.title ? (
                          <p className="text-caption text-muted-foreground truncate mt-0.5" title={p.raw}>{p.title}</p>
                        ) : null}
                        <select
                          value={p.category}
                          onChange={(e) => changeParsedCategory(i, e.target.value)}
                          className="mt-1.5 text-[11px] bg-transparent border border-border rounded-md px-1.5 py-0.5 text-muted-foreground"
                          aria-label="دسته تراکنش"
                        >
                          {CATEGORIES.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
                <Button onClick={submitSms} disabled={addTx.isPending || selected.size === 0}
                  className="w-full bg-primary text-primary-foreground font-bold hover:bg-primary/90">
                  ثبت {selected.size > 0 ? `${toPersianDigits(selected.size)} تراکنش` : ""}
                </Button>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
