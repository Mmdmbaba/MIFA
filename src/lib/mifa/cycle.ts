// موتور «دوره مالی» MIFA — ماه مالی کاربر از هر روزی که بخواد شروع می‌شه
// مثلاً ۱ آذر، روز واریز حقوق یا هر روز دیگه از تقویم.
// کلید دوره مثل "1404-09-08" = تاریخ جلالیِ روز شروع دوره
import { toJalaali, toGregorian, jalaaliMonthLength } from "jalaali-js"
import { JALALI_MONTHS, monthLabel } from "./jalali"
import { toPersianDigits } from "./format"

export interface JDate {
  jy: number
  jm: number
  jd: number
}

/** روز startDay اگر از طول ماه بیرون بزنه، به آخر ماه گیره می‌کنه */
export function clampDay(jy: number, jm: number, day: number): number {
  return Math.min(Math.max(1, Math.round(day)), jalaaliMonthLength(jy, jm))
}

export function jalaliOf(date: Date): JDate {
  const { jy, jm, jd } = toJalaali(date)
  return { jy, jm, jd }
}

/** ماه قبل/بعد در تقویم جلالی */
export function shiftJalaliMonth(jy: number, jm: number, delta: number): { jy: number; jm: number } {
  const total = jy * 12 + (jm - 1) + delta
  return { jy: Math.floor(total / 12), jm: (total % 12) + 1 }
}

function gregorianOf(j: JDate): Date {
  const g = toGregorian(j.jy, j.jm, j.jd)
  return new Date(g.gy, g.gm - 1, g.gd, 0, 0, 0, 0)
}

export function parseCycleKey(key: string): JDate {
  const [jy, jm, jd] = key.split("-").map(Number)
  return { jy, jm, jd }
}

export function cycleKeyOfJalali(j: JDate): string {
  return `${j.jy}-${String(j.jm).padStart(2, "0")}-${String(j.jd).padStart(2, "0")}`
}

/** شروع دوره‌ای که این تاریخ داخلش قرار می‌گیره */
export function cycleStartOf(date: Date, startDay: number): JDate {
  const { jy, jm, jd } = jalaliOf(date)
  if (jd >= clampDay(jy, jm, startDay)) {
    return { jy, jm, jd: clampDay(jy, jm, startDay) }
  }
  const prev = shiftJalaliMonth(jy, jm, -1)
  return { jy: prev.jy, jm: prev.jm, jd: clampDay(prev.jy, prev.jm, startDay) }
}

/** کلید دورهٔ فعال برای یک تاریخ */
export function cycleKeyOf(date: Date, startDay: number): string {
  return cycleKeyOfJalali(cycleStartOf(date, startDay))
}

/** کلید دورهٔ امروز */
export function currentCycleKey(startDay: number): string {
  return cycleKeyOf(new Date(), startDay)
}

/** تاریخ شروع (میلادی، نیمه‌شب) */
export function cycleStartDate(key: string): Date {
  return gregorianOf(parseCycleKey(key))
}

/** پایان دوره (انحصاری) = شروع دوره بعد */
export function cycleEndDate(key: string, startDay: number): Date {
  const { jy, jm } = parseCycleKey(key)
  const next = shiftJalaliMonth(jy, jm, 1)
  return gregorianOf({ jy: next.jy, jm: next.jm, jd: clampDay(next.jy, next.jm, startDay) })
}

export function cycleRange(key: string, startDay: number): { start: Date; end: Date } {
  return { start: cycleStartDate(key), end: cycleEndDate(key, startDay) }
}

/** طول دوره به روز */
export function daysInCycle(key: string, startDay: number): number {
  const { start, end } = cycleRange(key, startDay)
  return Math.round((end.getTime() - start.getTime()) / 86_400_000)
}

/** چندمین روز دوره برای یک تاریخ (۱-مبنا)؛ خارج دوره → null */
export function cycleDayOf(date: Date, key: string): number | null {
  const start = cycleStartDate(key)
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diff = Math.round((d.getTime() - start.getTime()) / 86_400_000)
  return diff >= 0 ? diff + 1 : null
}

/** روزهای باقی‌مانده دوره (شامل امروز)؛ دوره آینده = کل طول، دوره گذشته = ۰ */
export function daysLeftInCycle(key: string, startDay: number): number {
  const today = new Date()
  const total = daysInCycle(key, startDay)
  const cur = currentCycleKey(startDay)
  if (key === cur) {
    const day = cycleDayOf(today, key) ?? 1
    return Math.max(1, total - day + 1)
  }
  return key > cur ? total : 0
}

/** کلید دوره قبل/بعد */
export function shiftCycleKey(key: string, delta: number): string {
  const { jy, jm, jd } = parseCycleKey(key)
  const next = shiftJalaliMonth(jy, jm, delta)
  return cycleKeyOfJalali({ jy: next.jy, jm: next.jm, jd: clampDay(next.jy, next.jm, jd) })
}

/** عنوان فارسی دوره — اگر از اول ماه شروع بشه مثل «آذر ۱۴۰۴»، وگرنه بازه «۸ آذر – ۷ دی» */
export function cycleLabel(key: string, startDay: number): string {
  const { jy, jm, jd } = parseCycleKey(key)
  if (startDay <= 1) {
    return monthLabel(`${jy}-${String(jm).padStart(2, "0")}`)
  }
  const end = shiftCycleKey(key, 1)
  const endDate = new Date(cycleStartDate(end))
  endDate.setDate(endDate.getDate() - 1)
  const pe = jalaliOf(endDate)
  return `${toPersianDigits(jd)} ${JALALI_MONTHS[jm - 1]} – ${toPersianDigits(pe.jd)} ${JALALI_MONTHS[pe.jm - 1]}`
}

/** عنوان کوتاه برای متن‌های خالی: «آذر ۱۴۰۴» یا «دورهٔ ۸ آذر» */
export function cycleLabelShort(key: string, startDay: number): string {
  const { jy, jm, jd } = parseCycleKey(key)
  if (startDay <= 1) return monthLabel(`${jy}-${String(jm).padStart(2, "0")}`)
  return `دورهٔ ${toPersianDigits(jd)} ${JALALI_MONTHS[jm - 1]}`
}
