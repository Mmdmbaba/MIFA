// موتور برنامه MIFA — درآمد − خرج ثابت − پس‌انداز = پول آزادِ خرج کردن
// از اینجا به بعد همه‌چیز از همین محاسبه می‌شود. مبالغ: عدد صحیح تومان.
import type { Profile, SavingsMode } from "./types"

export interface PlanCore {
  income: number
  fixedTotal: number
  disposable: number // درآمد − ثابت‌ها
  savings: number
  savingsLabel: string
  spendable: number // disposable − savings = پول آزاد دوره
}

/** پیشنهاد سیستم: ~۲۰٪ پول آزاد (بین ۰ و خودِ پول آزاد) */
export function autoSavings(disposable: number): number {
  const d = Math.max(0, disposable)
  return Math.min(d, Math.round(d * 0.2))
}

export function resolveSavings(
  mode: SavingsMode,
  manualAmount: number,
  disposable: number
): { savings: number; label: string } {
  const d = Math.max(0, disposable)
  switch (mode) {
    case "manual":
      return { savings: Math.min(d, Math.max(0, Math.round(manualAmount))), label: "پس‌انداز خودت" }
    case "max":
      return { savings: d, label: "حداکثر ممکن" }
    case "auto":
      return { savings: autoSavings(d), label: "پیشنهاد MIFA" }
  }
}

/** هسته برنامه از پروفایل */
export function computePlanCore(profile: Profile): PlanCore {
  const income = Math.max(0, Math.round(profile.monthlyIncome))
  const fixedTotal = profile.fixedExpenses.reduce((s, f) => s + Math.max(0, f.amount), 0)
  const disposable = Math.max(0, income - fixedTotal)
  const { savings, label } = resolveSavings(profile.savingsMode, profile.savingsAmount, disposable)
  return {
    income,
    fixedTotal,
    disposable,
    savings,
    savingsLabel: label,
    spendable: Math.max(0, disposable - savings),
  }
}
