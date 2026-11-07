"use client"

// لوگوی MIFA — ریبون دستی خودِ کاربر در همه‌جای اپ
// نسخه شفاف برای تم روشن، نسخه نقره‌ای برای تم تیره (کلاس dark:)
export function RibbonMark({ className = "", size = 40 }: { className?: string; size?: number }) {
  return (
    <span className={`relative inline-block shrink-0 ${className}`} style={{ width: size, height: size }}>
      <img
        src="/brand/ribbon.png"
        alt="لوگوی MIFA"
        width={size}
        height={size}
        className="absolute inset-0 w-full h-full object-contain dark:hidden"
        draggable={false}
      />
      <img
        src="/brand/ribbon-dark.png"
        alt=""
        aria-hidden="true"
        width={size}
        height={size}
        className="absolute inset-0 w-full h-full object-contain hidden dark:block"
        draggable={false}
      />
    </span>
  )
}

export function RibbonTile({ className = "", size = 56 }: { className?: string; size?: number }) {
  return (
    <img
      src="/brand/ribbon-tile.png"
      alt="لوگوی MIFA"
      width={size}
      height={size}
      className={`shrink-0 object-contain ${className}`}
      draggable={false}
    />
  )
}

export function MifaWordmark({ tagline = true, tone = "brand" }: { tagline?: boolean; tone?: "brand" | "onDark" }) {
  return (
    <div className="flex flex-col leading-none">
      <span className={`text-[22px] font-black tracking-[0.22em] ${tone === "onDark" ? "text-white" : "text-foreground"}`}>
        MIFA
      </span>
      {tagline ? (
        <span className={`text-[10px] font-semibold mt-1.5 ${tone === "onDark" ? "text-white/60" : "text-muted-foreground"}`}>
          پولت رو بشناس، بیشتر نگه دار
        </span>
      ) : null}
    </div>
  )
}

export function MifaLogo({ compact = false, tone = "brand" }: { compact?: boolean; tone?: "brand" | "onDark" }) {
  if (compact) return <RibbonMark size={34} />
  return (
    <div className="flex items-center gap-2.5">
      <RibbonMark size={44} />
      <MifaWordmark tone={tone} />
    </div>
  )
}
