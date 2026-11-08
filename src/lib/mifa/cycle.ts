// موتور «دوره مالی» MIFA — ماه مالی کاربر از هر روز جلالی‌ای که بخواد شروع می‌شه
// مثلاً ۱ آذر، روز واریز حقوق یا هر روز دیگه از تقویم.
// قاعده onboarding وسط ماه: دورۀ اول از «همین امروز» شروع می‌شه و روز قبل از
// لنگر بعدی تموم می‌شه؛ دوره‌های بعدی روی روز لنگر لنگر می‌شن.
// کلید دوره مثل "1404-08-17" = تاریخ جلالیِ روز شروع دوره
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

function gregorianOfJ(j: JDate): Date {
  const g = toGregorian(j.jy, j.jm, j.jd)
  return new Date(g.gy, g.gm - 1, g.gd, 0, 0, 0, 0)
}

/** نیمه‌شب محلی یک تاریخ */
export function dayStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function jToTime(j: JDate): number {
  return gregorianOfJ(j).getTime()
}

export function parseCycleKey(key: string): JDate {
  const [jy, jm, jd] = key.split("-").map(Number)
  return { jy, jm, jd }
}

export function cycleKeyOfJalali(j: JDate): string {
  return `${j.jy}-${String(j.jm).padStart(2, "0")}-${String(j.jd).padStart(2, "0")}`
}

/**
 * اولین روز لنگر «بعد از» روز j — اگر j قبل از لنگرِ ماهش باشه همان ماه،
 * وگرنه لنگر ماه بعد.
 */
export function nextAnchorAfter(j: JDate, anchor: number): JDate {
  const clamped = clampDay(j.jy, j.jm, anchor)
  if (j.jd < clamped) return { jy: j.jy, jm: j.jm, jd: clamped }
  const n = shiftJalaliMonth(j.jy, j.jm, 1)
  return { jy: n.jy, jm: n.jm, jd: clampDay(n.jy, n.jm, anchor) }
}

/**
 * آیا این کلید، دورۀ اولِ از-روز-onboarding است؟
 * کلید دورۀ اول همیشه کلیدِ روز onboarding است (چون cycleStartOf برای
 * تاریخ‌های قبل از لنگر بعدی، همان روز onboarding را برمی‌گرداند).
 */
export function isFirstCycle(key: string, startDay: number, onboardedAt?: string): boolean {
  if (!onboardedAt) return false
  const ob = jalaliOf(dayStart(new Date(onboardedAt)))
  return key === cycleKeyOfJalali(ob)
}

/** شروع دوره با قاعده استاندارد (بدون در نظر گرفتن onboarding) */
function cycleStartOfStandard(date: Date, startDay: number): JDate {
  const { jy, jm, jd } = jalaliOf(date)
  if (jd >= clampDay(jy, jm, startDay)) {
    return { jy, jm, jd: clampDay(jy, jm, startDay) }
  }
  const prev = shiftJalaliMonth(jy, jm, -1)
  return { jy: prev.jy, jm: prev.jm, jd: clampDay(prev.jy, prev.jm, startDay) }
}

/**
 * شروع دوره‌ای که این تاریخ داخلش قرار می‌گیره.
 * اگر onboardedAt داده شده باشد و تاریخ داخل دورۀ اول (از روز onboarding تا
 * روز قبل از لنگر بعدی) باشد، شروع = روز onboarding؛ وگرنه قاعده لنگر.
 */
export function cycleStartOf(date: Date, startDay: number, onboardedAt?: string): JDate {
  const d = dayStart(date)
  if (onboardedAt) {
    const ob = jalaliOf(dayStart(new Date(onboardedAt)))
    const s1 = nextAnchorAfter(ob, startDay)
    if (d.getTime() < jToTime(s1)) return ob
  }
  return cycleStartOfStandard(d, startDay)
}

/** کلید دورهٔ فعال برای یک تاریخ */
export function cycleKeyOf(date: Date, startDay: number, onboardedAt?: string): string {
  return cycleKeyOfJalali(cycleStartOf(date, startDay, onboardedAt))
}

/** کلید دورهٔ امروز */
export function currentCycleKey(startDay: number, onboardedAt?: string): string {
  return cycleKeyOf(new Date(), startDay, onboardedAt)
}

/** تاریخ شروع (میلادی، نیمه‌شب) */
export function cycleStartDate(key: string): Date {
  return gregorianOfJ(parseCycleKey(key))
}

/** پایان دوره (انحصاری) */
export function cycleEndDate(key: string, startDay: number, onboardedAt?: string): Date {
  if (isFirstCycle(key, startDay, onboardedAt)) {
    return gregorianOfJ(nextAnchorAfter(parseCycleKey(key), startDay))
  }
  const { jy, jm } = parseCycleKey(key)
  const next = shiftJalaliMonth(jy, jm, 1)
  return gregorianOfJ({ jy: next.jy, jm: next.jm, jd: clampDay(next.jy, next.jm, startDay) })
}

export function cycleRange(key: string, startDay: number, onboardedAt?: string): { start: Date; end: Date } {
  return { start: cycleStartDate(key), end: cycleEndDate(key, startDay, onboardedAt) }
}

/** طول دوره به روز */
export function daysInCycle(key: string, startDay: number, onboardedAt?: string): number {
  const { start, end } = cycleRange(key, startDay, onboardedAt)
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000))
}

/** چندمین روز دوره برای یک تاریخ (۱-مبنا)؛ خارج دوره → null */
export function cycleDayOf(date: Date, key: string, startDay: number, onboardedAt?: string): number | null {
  const start = cycleStartDate(key)
  const end = cycleEndDate(key, startDay, onboardedAt)
  const d = dayStart(date)
  const diff = Math.round((d.getTime() - start.getTime()) / 86_400_000)
  if (diff >= 0 && d.getTime() < end.getTime()) return diff + 1
  return null
}

/** روزهای باقی‌مانده دوره (شامل امروز)؛ دوره آینده = کل طول، دوره گذشته = ۰ */
export function daysLeftInCycle(key: string, startDay: number, onboardedAt?: string): number {
  const today = dayStart(new Date())
  const total = daysInCycle(key, startDay, onboardedAt)
  const cur = currentCycleKey(startDay, onboardedAt)
  if (key === cur) {
    const day = cycleDayOf(today, key, startDay, onboardedAt) ?? 1
    return Math.max(1, total - day + 1)
  }
  return key > cur ? total : 0
}

/**
 * کلید دوره قبل/بعد — اگر از اولین دوره عبور کنیم null برمی‌گردد.
 */
export function shiftCycleKey(key: string, delta: number, startDay: number, onboardedAt?: string): string | null {
  if (delta === 0) return key
  if (delta > 0) {
    if (isFirstCycle(key, startDay, onboardedAt)) {
      const end = cycleEndDate(key, startDay, onboardedAt)
      return cycleKeyOf(end, startDay, onboardedAt)
    }
    const { jy, jm, jd } = parseCycleKey(key)
    const next = shiftJalaliMonth(jy, jm, delta)
    return cycleKeyOfJalali({ jy: next.jy, jm: next.jm, jd: clampDay(next.jy, next.jm, jd) })
  }
  // دوره قبل
  if (isFirstCycle(key, startDay, onboardedAt)) return null
  const { jy, jm, jd } = parseCycleKey(key)
  const prev = shiftJalaliMonth(jy, jm, -1)
  const prevKey = cycleKeyOfJalali({ jy: prev.jy, jm: prev.jm, jd: clampDay(prev.jy, prev.jm, jd) })
  if (onboardedAt && isFirstCycle(prevKey, startDay, onboardedAt)) return prevKey
  return prevKey
}

/**
 * طول دوره «نامزد» کامل — برای کسری کردن بودجهٔ دورۀ اولِ ناقص.
 * برای دورۀ اول = طول دورۀ بعدی (استاندارد)؛ برای بقیه = طول خود دوره.
 */
export function nominalCycleDays(key: string, startDay: number, onboardedAt?: string): number {
  if (isFirstCycle(key, startDay, onboardedAt)) {
    const next = shiftCycleKey(key, 1, startDay, onboardedAt)
    if (next) return daysInCycle(next, startDay, onboardedAt)
  }
  return daysInCycle(key, startDay, onboardedAt)
}

/** عنوان فارسی دوره — «آذر ۱۴۰۴» یا بازه «۱۷ آبان – ۳۰ آبان» */
export function cycleLabel(key: string, startDay: number, onboardedAt?: string): string {
  const { jy, jm, jd } = parseCycleKey(key)
  if (startDay <= 1 && !isFirstCycle(key, startDay, onboardedAt)) {
    return monthLabel(`${jy}-${String(jm).padStart(2, "0")}`)
  }
  const endDate = new Date(cycleEndDate(key, startDay, onboardedAt))
  endDate.setDate(endDate.getDate() - 1)
  const pe = jalaliOf(endDate)
  if (pe.jm === jm) {
    return `${toPersianDigits(jd)}–${toPersianDigits(pe.jd)} ${JALALI_MONTHS[jm - 1]}`
  }
  return `${toPersianDigits(jd)} ${JALALI_MONTHS[jm - 1]} – ${toPersianDigits(pe.jd)} ${JALALI_MONTHS[pe.jm - 1]}`
}

/** عنوان کوتاه برای متن‌های خالی: «آذر ۱۴۰۴» یا «دورهٔ ۱۷ آبان» */
export function cycleLabelShort(key: string, startDay: number, onboardedAt?: string): string {
  const { jy, jm, jd } = parseCycleKey(key)
  if (startDay <= 1 && !isFirstCycle(key, startDay, onboardedAt)) {
    return monthLabel(`${jy}-${String(jm).padStart(2, "0")}`)
  }
  return `دورهٔ ${toPersianDigits(jd)} ${JALALI_MONTHS[jm - 1]}`
}

/** پیش‌نمایش دورۀ اول برای onboarding/تنظیمات: از امروز تا روز قبل از لنگر بعدی */
export function firstCyclePreview(startDay: number, from: Date = new Date()): {
  start: Date
  end: Date
  days: number
  label: string
} {
  const start = dayStart(from)
  const end = gregorianOfJ(nextAnchorAfter(jalaliOf(start), startDay))
  const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000))
  const pe = jalaliOf(new Date(end.getTime() - 86_400_000))
  const ps = jalaliOf(start)
  const label =
    ps.jm === pe.jm
      ? `${toPersianDigits(ps.jd)}–${toPersianDigits(pe.jd)} ${JALALI_MONTHS[ps.jm - 1]}`
      : `${toPersianDigits(ps.jd)} ${JALALI_MONTHS[ps.jm - 1]} – ${toPersianDigits(pe.jd)} ${JALALI_MONTHS[pe.jm - 1]}`
  return { start, end, days, label }
}
