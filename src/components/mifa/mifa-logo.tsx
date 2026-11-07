"use client"

// لوگوی MIFA — علامت قیفی M + وردمارک، از برند کیت (وکتور خطی)
export function MifaSymbol({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <g stroke="#08D9D6" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 35V14.5C10 11.8 12.9 10.5 15 12.2L24 20L33 12.2C35.1 10.5 38 11.8 38 14.5V35" />
        <path d="M24 20V33" />
      </g>
      <circle cx="24" cy="39" r="2.7" fill="#08D9D6" />
    </svg>
  )
}

export function MifaLogo({ compact = false, className = "" }: { compact?: boolean; className?: string }) {
  if (compact) {
    return <MifaSymbol className={`w-8 h-8 ${className}`} />
  }
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <MifaSymbol className="w-9 h-9" />
      <div className="flex flex-col leading-none">
        <span className="text-xl font-extrabold tracking-[0.18em] text-foreground">MIFA</span>
        <span className="text-[10px] font-medium text-muted-foreground mt-1">مدیریت مالی شخصی</span>
      </div>
    </div>
  )
}
