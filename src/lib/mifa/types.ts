// مدل داده MIFA — نسخه کلاینت‌محور (آینه اسکیمای قبلی، بدون سرور)
// همه مبالغ: عدد صحیح به تومان

export type TxType = "expense" | "income"

export interface Transaction {
  id: string
  type: TxType
  amount: number
  title?: string | null
  category: string
  /** ISO timestamp */
  date: string
  source: "manual" | "sms"
  /** ISO timestamp */
  createdAt: string
}

export type FixedKind = "rent" | "bills" | "subscription" | "installment" | "other"

export interface FixedExpense {
  id: string
  label: string
  amount: number
  kind: FixedKind
}

export type SavingsMode = "manual" | "max" | "auto"
export type ThemePref = "light" | "dark" | "system"

export interface Profile {
  onboarded: boolean
  monthlyIncome: number
  fixedExpenses: FixedExpense[]
  /** خودم تعیین می‌کنم / حداکثر ممکن / پیشنهاد سیستم */
  savingsMode: SavingsMode
  /** برای حالت manual؛ نتیجه max/auto هم همین‌جا کش می‌شود */
  savingsAmount: number
  /** روز شروع دوره مالی در تقویم جلالی — ۱ تا ۳۱ (روز ماهِ تاریخ شروع برنامه) */
  cycleAnchorDay: number
  theme?: ThemePref
  /** تاریخ onboarding — مبنای دورۀ اول اگر firstCycleStart نداشته باشیم */
  onboardedAt: string
  /** تاریخ شروع برنامه (کلید جلالی مثل "1405-09-01") — می‌تواند در آینده باشد */
  firstCycleStart?: string
}

export const FIXED_KINDS: { id: FixedKind; label: string; color: string }[] = [
  { id: "rent", label: "اجاره", color: "#6F8790" },
  { id: "bills", label: "قبض‌ها", color: "#A5B5B4" },
  { id: "subscription", label: "اشتراک‌ها", color: "#D3A45B" },
  { id: "installment", label: "قسط", color: "#C18B97" },
  { id: "other", label: "سایر", color: "#7896B0" },
]

export const FIXED_KIND_MAP: Record<FixedKind, { label: string; color: string }> = Object.fromEntries(
  FIXED_KINDS.map((k) => [k.id, { label: k.label, color: k.color }])
) as Record<FixedKind, { label: string; color: string }>
