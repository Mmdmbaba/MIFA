"use client"

// نمودارهای SVG سبک MIFA — بدون کتابخانه سنگین، مطابق سبک دیتاویز برند کیت
// (خط 2px، پرکردن فلت، شعاع 6px، بدون گرادیان و سه‌بعدی)
import { getCategory } from "@/lib/mifa/categories"
import { formatCompact } from "@/lib/mifa/format"

export interface Slice {
  category: string
  amount: number
}

/** نمودار دونات تفکیک خرج بر اساس دسته */
export function DonutChart({ slices, size = 180 }: { slices: Slice[]; size?: number }) {
  const total = slices.reduce((s, x) => s + x.amount, 0)
  if (total <= 0) {
    return (
      <div className="flex items-center justify-center text-muted-foreground text-sm h-44">
        هنوز خرجی ثبت نشده
      </div>
    )
  }
  const stroke = 26
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r

  // محاسبه آفست‌ها به‌صورت خالص (بدون reassign در رندر)
  const segments = slices.reduce<{ cat: string; color: string; dash: string; offset: number }[]>((acc, s) => {
    const prevOffset = acc.length > 0 ? acc[acc.length - 1].offset + acc[acc.length - 1].len : 0
    const len = (s.amount / total) * c
    const dashLen = Math.max(len - 2, 0.5)
    acc.push({
      cat: s.category,
      color: getCategory(s.category).color,
      len,
      dash: `${dashLen} ${c - dashLen}`,
      offset: prevOffset,
    })
    return acc
  }, [])

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto" role="img"
      aria-label="تفکیک خرج بر اساس دسته">
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--muted)" strokeWidth={stroke} />
        {segments.map((seg) => (
          <circle
            key={seg.cat}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={stroke}
            strokeDasharray={seg.dash}
            strokeDashoffset={-seg.offset}
            strokeLinecap="butt"
          />
        ))}
      </g>
      <text x={size / 2} y={size / 2 - 2} textAnchor="middle" className="fill-foreground"
        style={{ fontSize: 15, fontWeight: 800 }} direction="rtl">
        {formatCompact(total)}
      </text>
      <text x={size / 2} y={size / 2 + 16} textAnchor="middle" className="fill-muted-foreground"
        style={{ fontSize: 11 }} direction="rtl">
        تومان خرج ماه
      </text>
    </svg>
  )
}

export interface DayBar {
  day: number // روز جلالی ماه
  amount: number
}

/** نمودار میله‌ای خرج روزانه در ماه جلالی */
export function DailyBars({ bars, height = 120 }: { bars: DayBar[]; height?: number }) {
  if (bars.length === 0) return null
  const max = Math.max(...bars.map((b) => b.amount), 1)
  const w = 100 // درصدی کار می‌کنیم
  const gap = 1.6

  return (
    <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }} role="img"
      aria-label="خرج روزهای ماه">
      {bars.map((b, i) => {
        const barW = (w - gap * (bars.length - 1)) / bars.length
        const x = i * (barW + gap)
        const h = Math.max((b.amount / max) * (height - 8), b.amount > 0 ? 3 : 2)
        const isToday = i === bars.length - 1
        return (
          <rect
            key={b.day}
            x={x}
            y={height - h}
            width={barW}
            height={h}
            rx={Math.min(6, barW / 2)}
            fill={isToday ? "#08D9D6" : "color-mix(in srgb, #08D9D6 45%, var(--muted))"}
          />
        )
      })}
    </svg>
  )
}
