"use client"

// تقویم جلالی MIFA — شبکه ماه، برای انتخاب روز شروع دوره و نمایش گرماشم خرج هر روز
import { useMemo } from "react"
import { toGregorian, jalaaliMonthLength } from "jalaali-js"
import { JALALI_MONTHS, todayJalali } from "@/lib/mifa/jalali"
import { toPersianDigits } from "@/lib/mifa/format"
import { ChevronRight, ChevronLeft } from "lucide-react"

export interface DayMarker {
  heat?: number // ۰ تا ۱ — شدت خرج روز
  dim?: boolean // خارج از دوره فعال
  dot?: boolean // نقطه نشانگر (شروع دوره)
}

interface MifaCalendarProps {
  monthKey: string // "1404-09" — ماه نمایشی
  onShiftMonth?: (delta: number) => void
  selectedDay?: number | null
  onSelectDay?: (day: number) => void
  markers?: Record<number, DayMarker>
  className?: string
}

/** ایندکس ستون شنبه‌مبنا: شنبه=۰ … جمعه=۶ */
function saturdayIndex(getDay: number): number {
  return (getDay + 1) % 7
}

export function MifaCalendar({
  monthKey,
  onShiftMonth,
  selectedDay = null,
  onSelectDay,
  markers = {},
  className = "",
}: MifaCalendarProps) {
  const today = todayJalali()
  const todayKey = `${today.key}-${String(today.day).padStart(2, "0")}`

  const { lead, days } = useMemo(() => {
    const [jy, jm] = monthKey.split("-").map(Number)
    const g = toGregorian(jy, jm, 1)
    const first = new Date(g.gy, g.gm - 1, g.gd)
    return { lead: saturdayIndex(first.getDay()), days: jalaaliMonthLength(jy, jm) }
  }, [monthKey])

  const [jy, jm] = monthKey.split("-").map(Number)
  const isThisMonth = today.key === monthKey

  const cells: (number | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: days }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className={className}>
      {/* سربرگ ماه */}
      <div className="flex items-center justify-between mb-2">
        {onShiftMonth ? (
          <button
            type="button"
            onClick={() => onShiftMonth(-1)}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="ماه قبل"
          >
            <ChevronRight className="w-4.5 h-4.5" />
          </button>
        ) : (
          <span className="w-8" />
        )}
        <p className="text-body-sm font-bold text-foreground numeric">
          {JALALI_MONTHS[jm - 1]} {toPersianDigits(jy)}
        </p>
        {onShiftMonth ? (
          <button
            type="button"
            onClick={() => onShiftMonth(1)}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="ماه بعد"
          >
            <ChevronLeft className="w-4.5 h-4.5" />
          </button>
        ) : (
          <span className="w-8" />
        )}
      </div>

      {/* روزهای هفته */}
      <div className="grid grid-cols-7 gap-1 mb-1" aria-hidden="true">
        {["ش", "ی", "د", "س", "چ", "پ", "ج"].map((w, i) => (
          <span key={w} className={`text-center text-[10px] font-bold py-1 ${i === 6 ? "text-[#FF5B83]/70" : "text-muted-foreground"}`}>
            {w}
          </span>
        ))}
      </div>

      {/* شبکه روزها */}
      <div className="grid grid-cols-7 gap-1" role="grid" aria-label={`تقویم ${JALALI_MONTHS[jm - 1]} ${toPersianDigits(jy)}`}>
        {cells.map((day, i) => {
          if (day === null) return <span key={`e${i}`} />
          const marker = markers[day] ?? {}
          const isSelected = selectedDay === day
          const isToday = isThisMonth && `${monthKey}-${String(day).padStart(2, "0")}` === todayKey
          const selectable = !!onSelectDay && !marker.dim
          const heat = marker.heat ?? 0
          return (
            <button
              key={day}
              type="button"
              disabled={!selectable}
              onClick={() => onSelectDay?.(day)}
              aria-pressed={isSelected}
              aria-label={`روز ${toPersianDigits(day)}`}
              className={`relative h-9.5 rounded-xl flex items-center justify-center numeric text-body-sm transition-all
                ${isSelected ? "bg-primary text-primary-foreground font-extrabold shadow-[0_4px_14px_-3px_rgba(8,217,214,0.6)]" : ""}
                ${!isSelected && marker.dim ? "text-muted-foreground/35" : ""}
                ${!isSelected && !marker.dim ? "text-foreground" : ""}
                ${selectable && !isSelected ? "hover:bg-primary/12 cursor-pointer" : ""}
                ${!selectable && !onSelectDay ? "cursor-default" : ""}
                ${!isSelected && isToday ? "ring-1.5 ring-primary ring-offset-1 ring-offset-background" : ""}
              `}
              style={
                !isSelected && heat > 0
                  ? { backgroundColor: `color-mix(in srgb, #08D9D6 ${Math.round(10 + heat * 45)}%, transparent)` }
                  : undefined
              }
            >
              {toPersianDigits(day)}
              {marker.dot && (
                <span className={`absolute bottom-1 w-1 h-1 rounded-full ${isSelected ? "bg-primary-foreground" : "bg-primary"}`} />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
