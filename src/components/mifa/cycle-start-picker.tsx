"use client"

// تقویم کوچک جلالی برای انتخاب «تاریخ شروع برنامه» — امروز، اول ماه بعد، یا هر روز دیگر
// خروجی: کلید جلالی "1405-09-01" که مستقیم در Profile.firstCycleStart ذخیره می‌شود
import { useMemo, useState } from "react"
import { toJalaali, toGregorian, jalaaliMonthLength } from "jalaali-js"
import { JALALI_MONTHS } from "@/lib/mifa/jalali"
import { toPersianDigits } from "@/lib/mifa/format"
import { cycleKeyOfJalali, jalaliOf, dayStart } from "@/lib/mifa/cycle"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ChevronRight, ChevronLeft } from "lucide-react"

const WEEKDAY_HEADS = ["ش", "ی", "د", "س", "چ", "پ", "ج"]

interface CycleStartPickerProps {
  /** کلید جلالی روز انتخاب‌شده مثل "1405-09-01" */
  value: string
  onChange: (key: string) => void
  compact?: boolean
}

/** ایندکس ستون شنبه‌مبنا: شنبه=۰ … جمعه=۶ */
function saturdayIndex(getDay: number): number {
  return (getDay + 1) % 7
}

export function CycleStartPicker({ value, onChange, compact = false }: CycleStartPickerProps) {
  const todayJ = useMemo(() => jalaliOf(dayStart(new Date())), [])
  const todayKey = cycleKeyOfJalali(todayJ)

  const [view, setView] = useState(() => {
    const v = value ? parseKeyLocal(value) : todayJ
    return { jy: v.jy, jm: v.jm }
  })

  const monthLen = jalaaliMonthLength(view.jy, view.jm)
  const g1 = toGregorian(view.jy, view.jm, 1)
  const offset = saturdayIndex(new Date(g1.gy, g1.gm - 1, g1.gd).getDay())

  // ناوبری: یک ماه به عقب تا ۱۲ ماه جلو
  const canPrev = view.jy * 12 + view.jm > todayJ.jy * 12 + todayJ.jm - 1
  const canNext = view.jy * 12 + view.jm < todayJ.jy * 12 + todayJ.jm + 12

  const shiftView = (delta: number) => {
    const total = view.jy * 12 + (view.jm - 1) + delta
    setView({ jy: Math.floor(total / 12), jm: (total % 12) + 1 })
  }

  const pick = (jd: number) => onChange(cycleKeyOfJalali({ jy: view.jy, jm: view.jm, jd }))

  const quickTo = (j: { jy: number; jm: number; jd: number }) => {
    onChange(cycleKeyOfJalali(j))
    setView({ jy: j.jy, jm: j.jm })
  }

  const nextMonthFirst = useMemo(() => {
    const nm = view.jm === 12 ? { jy: view.jy + 1, jm: 1 } : { jy: view.jy, jm: view.jm + 1 }
    return nm
  }, [view])

  return (
    <div>
      {/* سربرگ ماه */}
      <div className="flex items-center justify-between mb-2">
        <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-xl"
          disabled={!canNext} onClick={() => shiftView(1)} aria-label="ماه بعد">
          <ChevronLeft className="w-4.5 h-4.5" />
        </Button>
        <span className="text-body-sm font-extrabold text-foreground">
          {JALALI_MONTHS[view.jm - 1]} {toPersianDigits(view.jy)}
        </span>
        <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-xl"
          disabled={!canPrev} onClick={() => shiftView(-1)} aria-label="ماه قبل">
          <ChevronRight className="w-4.5 h-4.5" />
        </Button>
      </div>

      {/* روزهای هفته */}
      <div className="grid grid-cols-7 mb-1" aria-hidden="true">
        {WEEKDAY_HEADS.map((w) => (
          <span key={w} className="text-center text-[10px] font-bold text-muted-foreground py-1">{w}</span>
        ))}
      </div>

      {/* شبکه روزها */}
      <div role="radiogroup" aria-label="تاریخ شروع برنامه" className="grid grid-cols-7 gap-1">
        {Array.from({ length: offset }).map((_, i) => (
          <span key={`b${i}`} aria-hidden="true" />
        ))}
        {Array.from({ length: monthLen }).map((_, i) => {
          const jd = i + 1
          const key = cycleKeyOfJalali({ jy: view.jy, jm: view.jm, jd })
          const active = value === key
          const isToday = todayKey === key
          const isPast = key < todayKey
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={`${toPersianDigits(jd)} ${JALALI_MONTHS[view.jm - 1]}`}
              onClick={() => pick(jd)}
              className={cn(
                "numeric relative rounded-lg transition-all flex items-center justify-center",
                compact ? "h-8 text-[12px]" : "h-9 text-[13px]",
                active
                  ? "bg-primary text-primary-foreground font-extrabold shadow-[0_6px_18px_-4px_rgba(8,217,214,0.55)]"
                  : isPast
                    ? "text-muted-foreground/60 hover:bg-primary/10 hover:text-primary"
                    : "bg-muted/50 text-foreground hover:bg-primary/15 hover:text-primary"
              )}
            >
              {toPersianDigits(jd)}
              {isToday && !active && (
                <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-primary" aria-hidden="true" />
              )}
            </button>
          )
        })}
      </div>

      {/* میان‌برها */}
      <div className="flex flex-wrap gap-2 mt-3">
        <Button type="button" variant="outline" size="sm" className="h-9 rounded-xl border-border"
          onClick={() => quickTo(todayJ)}>
          همین امروز ({toPersianDigits(todayJ.jd)})
        </Button>
        <Button type="button" variant="outline" size="sm" className="h-9 rounded-xl border-border"
          onClick={() => quickTo({ jy: nextMonthFirst.jy, jm: nextMonthFirst.jm, jd: 1 })}>
          اول ماه بعد ({JALALI_MONTHS[nextMonthFirst.jm - 1]})
        </Button>
        {todayJ.jd > 1 && (
          <Button type="button" variant="outline" size="sm" className="h-9 rounded-xl border-border"
            onClick={() => quickTo({ jy: todayJ.jy, jm: todayJ.jm, jd: 1 })}>
            اول این ماه
          </Button>
        )}
      </div>
    </div>
  )
}

function parseKeyLocal(key: string): { jy: number; jm: number; jd: number } {
  const [jy, jm, jd] = key.split("-").map(Number)
  return { jy, jm, jd }
}
