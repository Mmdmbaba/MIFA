import { toJalaali, toGregorian, jalaaliMonthLength } from "jalaali-js"
import { toPersianDigits } from "./format"

export const JALALI_MONTHS = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
]

export const JALALI_WEEKDAYS = ["شنبه", "یک‌شنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه", "جمعه"]

/** کلید ماه جلالی مثل "1404-09" از یک Date */
export function monthKey(date: Date): string {
  const { jy, jm } = toJalaali(date)
  return `${jy}-${String(jm).padStart(2, "0")}`
}

/** کلید ماه جلالی فعلی */
export function currentMonthKey(): string {
  return monthKey(new Date())
}

export function parseMonthKey(key: string): { jy: number; jm: number } {
  const [jy, jm] = key.split("-").map(Number)
  return { jy, jm }
}

/** عنوان فارسی ماه مثل "آذر ۱۴۰۴" */
export function monthLabel(key: string): string {
  const { jy, jm } = parseMonthKey(key)
  return `${JALALI_MONTHS[jm - 1]} ${toPersianDigits(jy)}`
}

/** ماه قبل/بعد */
export function shiftMonth(key: string, delta: number): string {
  const { jy, jm } = parseMonthKey(key)
  const total = jy * 12 + (jm - 1) + delta
  const ny = Math.floor(total / 12)
  const nm = (total % 12) + 1
  return `${ny}-${String(nm).padStart(2, "0")}`
}

/** تعداد روزهای ماه جلالی */
export function daysInJalaliMonth(key: string): number {
  const { jy, jm } = parseMonthKey(key)
  return jalaaliMonthLength(jy, jm)
}

/** شروع و پایان ماه جلالی به صورت Date (برای کوئری دیتابیس) */
export function monthRange(key: string): { start: Date; end: Date } {
  const { jy, jm } = parseMonthKey(key)
  const gyStart = toGregorian(jy, jm, 1)
  const start = new Date(gyStart.gy, gyStart.gm - 1, gyStart.gd, 0, 0, 0, 0)
  const next = shiftMonth(key, 1)
  const { jy: ny, jm: nm } = parseMonthKey(next)
  const gyEnd = toGregorian(ny, nm, 1)
  const end = new Date(gyEnd.gy, gyEnd.gm - 1, gyEnd.gd, 0, 0, 0, 0)
  return { start, end }
}

/** تاریخ امروز به شکل کلید ماه + روز جلالی */
export function todayJalali(): { key: string; day: number; weekday: string } {
  const now = new Date()
  const { jy, jm, jd } = toJalaali(now)
  return {
    key: `${jy}-${String(jm).padStart(2, "0")}`,
    day: jd,
    weekday: JALALI_WEEKDAYS[now.getDay() === 6 ? 0 : now.getDay() + 1] ?? "",
  }
}

/** روزهای باقی‌مانده ماه (شامل امروز) */
export function daysLeftInMonth(key: string): number {
  const total = daysInJalaliMonth(key)
  const { key: nowKey, day } = todayJalali()
  if (nowKey !== key) return 0
  return Math.max(1, total - day + 1)
}

/** روز جلالی ماه برای یک Date (اگر خارج ماه باشد null) */
export function jalaliDayOf(date: Date, key: string): number | null {
  if (monthKey(date) !== key) return null
  const { jd } = toJalaali(date)
  return jd
}

/** تاریخ کامل فارسی مثل "۵ آذر ۱۴۰۴" */
export function fullJalaliDate(date: Date): string {
  const { jy, jm, jd } = toJalaali(date)
  return `${toPersianDigits(jd)} ${JALALI_MONTHS[jm - 1]} ${toPersianDigits(jy)}`
}

