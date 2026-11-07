const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹"
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩"

/** تبدیل اعداد لاتین به فارسی */
export function toPersianDigits(input: number | string): string {
  return String(input).replace(/[0-9]/g, (d) => PERSIAN_DIGITS[Number(d)])
}

/** تبدیل ارقام فارسی/عربی به لاتین */
export function toLatinDigits(input: string): string {
  return input
    .replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(ARABIC_DIGITS.indexOf(d)))
}

/** حذف جداکننده‌های هزارگان فارسی/عربی/لاتین */
export function stripSeparators(input: string): string {
  return toLatinDigits(input).replace(/[٬,،\s]/g, "")
}

/** قالب‌بندی مبلغ با جداکننده و ارقام فارسی: ۱٬۲۵۰٬۰۰۰ */
export function formatAmount(amount: number): string {
  const rounded = Math.round(amount)
  const grouped = rounded.toLocaleString("en-US").replace(/,/g, "٬")
  return toPersianDigits(grouped)
}

/** مبلغ + «تومان» */
export function formatToman(amount: number): string {
  return `${formatAmount(amount)} تومان`
}

/** مبلغ فشرده برای نمودار: ۲.۵ میلیون / ۴۸۰ هزار */
export function formatCompact(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) {
    const m = amount / 1_000_000
    return `${toPersianDigits(m.toFixed(1).replace(/\.0$/, ""))} میلیون`
  }
  if (Math.abs(amount) >= 1_000) {
    const k = Math.round(amount / 1_000)
    return `${toPersianDigits(k)} هزار`
  }
  return formatAmount(amount)
}

/** درصد فارسی: ۴۲٪ */
export function formatPercent(p: number): string {
  return `${toPersianDigits(Math.round(p))}٪`
}

/** پارس ورودی مبلغ کاربر (فارسی/لاتین، با یا بدون جداکننده) → عدد یا null */
export function parseAmountInput(input: string): number | null {
  const cleaned = stripSeparators(input).replace(/[^0-9.]/g, "")
  if (!cleaned) return null
  const n = Number(cleaned)
  if (!Number.isFinite(n) || n <= 0) return null
  return Math.round(n)
}
