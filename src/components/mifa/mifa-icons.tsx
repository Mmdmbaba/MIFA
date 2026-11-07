"use client"

// آیکون‌های دسته‌بندی از برند کیت MIFA (خطی، ضخامت 1.7، viewBox 24×24)
import { getCategory } from "@/lib/mifa/categories"

const ICON_PATHS: Record<string, string[]> = {
  groceries: ["M3.5 9h17l-1.6 10.5H5.1L3.5 9Z", "M7 9l3-5M17 9l-3-5M8 13v3M12 13v3M16 13v3"],
  transport: ["M5 17V7.5A2.5 2.5 0 0 1 7.5 5h9A2.5 2.5 0 0 1 19 7.5V17H5Z", "M5 11h14M8 17v2M16 17v2M8 14h.01M16 14h.01"],
  home: ["m3.5 11 8.5-7 8.5 7", "M5.5 10v10h13V10M9.5 20v-6h5v6"],
  bills: ["M6 3.8h12v16.4l-3-1.8-3 1.8-3-1.8-3 1.8V3.8Z", "M9 8h6M9 12h6M9 16h3"],
  entertainment: ["M4 6.5h16v11H4z", "m10 9.5 5 2.5-5 2.5v-5Z", "M7 6.5v-2M17 6.5v-2M7 17.5v2M17 17.5v2"],
  health: ["M12 20s-7.5-4.4-7.5-10A4.2 4.2 0 0 1 12 7.3 4.2 4.2 0 0 1 19.5 10C19.5 15.6 12 20 12 20Z", "M12 9v6M9 12h6"],
  clothing: ["m8 4 4 2 4-2 4 3-2.2 4-2.3-1.2V20H8.5V9.8L6.2 11 4 7l4-3Z"],
  education: ["M4 5.5c3-1.5 5.7-1.2 8 1v13c-2.3-2.2-5-2.5-8-1v-13Z", "M20 5.5c-3-1.5-5.7-1.2-8 1v13c2.3-2.2 5-2.5 8-1v-13Z"],
  gifts: ["M4 10h16v10H4zM3 7h18v3H3zM12 7v13", "M12 7H8.5A2 2 0 1 1 10 4c1.1 1.2 2 3 2 3ZM12 7h3.5A2 2 0 1 0 14 4c-1.1 1.2-2 3-2 3Z"],
  savings: ["M5 14.5c0-3.4 2.8-5.8 7-5.8s7 2.4 7 5.8V19H5v-4.5Z", "M8 8.5 6.5 6M16 8.5 17.5 6M9 14h.01M15 14h.01M12 8.7V5.5M9.5 5.5h5"],
}

export function CategoryIcon({ id, className, strokeWidth = 1.7 }: { id: string; className?: string; strokeWidth?: number }) {
  const paths = ICON_PATHS[id] ?? ICON_PATHS.groceries
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  )
}

/** آیکون دسته با رنگ برند دسته در پس‌زمینه نرم */
export function CategoryBadge({ id, size = "md" }: { id: string; size?: "sm" | "md" }) {
  const cat = getCategory(id)
  const box = size === "sm" ? "w-8 h-8 rounded-lg" : "w-11 h-11 rounded-xl"
  return (
    <div className={`${box} flex items-center justify-center shrink-0`}
      style={{ backgroundColor: `${cat.color}22`, color: cat.color }}>
      <CategoryIcon id={cat.id} className={size === "sm" ? "w-4 h-4" : "w-5 h-5"} />
    </div>
  )
}
