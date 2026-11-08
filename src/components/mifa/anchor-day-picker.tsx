"use client"

// انتخابگر روز شروع دوره مالی — شبکه ۱ تا ۳۱ تقویم جلالی
import { toPersianDigits } from "@/lib/mifa/format"
import { cn } from "@/lib/utils"
import { CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AnchorDayPickerProps {
  value: number
  onChange: (day: number) => void
  todayDay?: number // روز جلالی امروز برای نشان‌دادن
  compact?: boolean
}

export function AnchorDayPicker({ value, onChange, todayDay, compact = false }: AnchorDayPickerProps) {
  const days = Array.from({ length: 31 }, (_, i) => i + 1)
  return (
    <div>
      <div
        role="radiogroup"
        aria-label="روز شروع دوره مالی"
        className={cn("grid grid-cols-7 gap-1.5", compact && "gap-1")}
      >
        {days.map((d) => {
          const active = value === d
          const isToday = todayDay === d
          return (
            <button
              key={d}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={`روز ${toPersianDigits(d)}`}
              onClick={() => onChange(d)}
              className={cn(
                "numeric relative rounded-xl transition-all flex items-center justify-center",
                compact ? "h-9 text-[13px]" : "h-10 text-sm",
                active
                  ? "bg-primary text-primary-foreground font-extrabold shadow-[0_6px_18px_-4px_rgba(8,217,214,0.55)]"
                  : "bg-muted/60 text-foreground hover:bg-primary/15 hover:text-primary"
              )}
            >
              {toPersianDigits(d)}
              {isToday && !active && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" aria-hidden="true" />
              )}
            </button>
          )
        })}
      </div>
      <div className="flex gap-2 mt-3">
        <Button type="button" variant="outline" size="sm"
          className="h-9 rounded-xl border-border"
          onClick={() => onChange(1)}>
          <CalendarDays className="w-4 h-4" />
          اول ماه
        </Button>
        {todayDay ? (
          <Button type="button" variant="outline" size="sm"
            className="h-9 rounded-xl border-border"
            onClick={() => onChange(todayDay)}>
            همین امروز ({toPersianDigits(todayDay)})
          </Button>
        ) : null}
      </div>
    </div>
  )
}
