// موتور برنامه MIFA — درآمد − خرج ثابت − پس‌انداز = پول آزادِ خرج کردن
// از اینجا به بعد همه‌چیز از همین محاسبه می‌شود. مبالغ: عدد صحیح تومان.
import type { Profile, SavingsMode } from "./types"

export interface PlanCore {
  income: number
  fixedTotal: number
  disposable: number // درآمد − ثابت‌ها
  savings: number
  savingsLabel: string
  /** توضیح یک‌خطی منطق پیشنهاد (فقط برای حالت auto) */
  savingsNote?: string
  spendable: number // disposable − savings = پول آزاد دوره
}

const roundTo10k = (x: number) => Math.round(x / 10_000) * 10_000

/**
 * پیشنهاد سیستم — پلکانی بر اساس «جیب روزانه»، نه یک درصد کورکورانه:
 *  • اگر با خرج آزاد، روزانه کمتر از ~۱۲۰ هزار تومان می‌ماند → ۱۰٪ (زندگی سخت نشود)
 *  • اگر روزانه بیش از ~۴۰۰ هزار تومان می‌ماند → ۳۰٪ (بدون فشار، پس‌انداز جدی)
 *  • بین این دو → ۲۰٪ (تعادل)
 * نتیجه به نزدیک‌ترین ۱۰ هزار تومان گرد می‌شود تا عدد منطقی و قابل‌حفظ باشد.
 */
export function autoSavings(disposable: number, days = 30): { amount: number; note: string } {
  const d = Math.max(0, Math.round(disposable))
  if (d <= 0) {
    return { amount: 0, note: "فعلاً پول آزادی برای پس‌انداز نیست" }
  }
  const perDay = d / Math.max(1, days)
  if (perDay < 120_000) {
    const amount = Math.min(d, roundTo10k(d * 0.1))
    return { amount, note: "روزانه‌ات تنگ است؛ فقط ۱۰٪ کنار می‌گذاریم تا زندگی سخت نشود" }
  }
  if (perDay > 400_000) {
    const amount = Math.min(d, roundTo10k(d * 0.3))
    return { amount, note: "جیبت راحت است؛ ۳۰٪ کنار می‌گذاریم بدون فشار به خرج روزانه" }
  }
  return { amount: Math.min(d, roundTo10k(d * 0.2)), note: "۲۰٪ پول آزاد — تعادل میان زندگی امروز و آینده" }
}

export function resolveSavings(
  mode: SavingsMode,
  manualAmount: number,
  disposable: number
): { savings: number; label: string; note?: string } {
  const d = Math.max(0, disposable)
  switch (mode) {
    case "manual":
      return { savings: Math.min(d, Math.max(0, Math.round(manualAmount))), label: "پس‌انداز خودت" }
    case "max":
      return { savings: d, label: "حداکثر ممکن" }
    case "auto": {
      const a = autoSavings(d)
      return { savings: a.amount, label: "پیشنهاد MIFA", note: a.note }
    }
  }
}

/** هسته برنامه از پروفایل */
export function computePlanCore(profile: Profile): PlanCore {
  const income = Math.max(0, Math.round(profile.monthlyIncome))
  const fixedTotal = profile.fixedExpenses.reduce((s, f) => s + Math.max(0, f.amount), 0)
  const disposable = Math.max(0, income - fixedTotal)
  const { savings, label, note } = resolveSavings(profile.savingsMode, profile.savingsAmount, disposable)
  return {
    income,
    fixedTotal,
    disposable,
    savings,
    savingsLabel: label,
    savingsNote: note,
    spendable: Math.max(0, disposable - savings),
  }
}
