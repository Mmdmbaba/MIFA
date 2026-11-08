"use client"

// ورودی مبلغ بزرگ MIFA — گروه‌بندی هزارگان با ارقام فارسی، هنگام تایپ
import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { parseAmountInput, formatAmount, toLatinDigits, stripSeparators } from "@/lib/mifa/format"
import { cn } from "@/lib/utils"

interface AmountInputProps {
  value: string // متن خام (ارقام فارسی/لاتین با جداکننده)
  onChange: (raw: string) => void
  placeholder?: string
  size?: "lg" | "md"
  className?: string
  ariaLabel?: string
  autoFocus?: boolean
  onEnter?: () => void
}

/** نمایش فرمت‌شده هنگام تایپ؛ مقدار خام با ارقام فارسی نگه داشته می‌شود */
export function AmountInput({
  value,
  onChange,
  placeholder = "۰",
  size = "lg",
  className,
  ariaLabel,
  autoFocus,
  onEnter,
}: AmountInputProps) {
  const [display, setDisplay] = useState(() => formatTyped(value))

  useEffect(() => {
    setDisplay(formatTyped(value))
  }, [value])

  return (
    <Input
      inputMode="numeric"
      dir="ltr"
      value={display}
      autoFocus={autoFocus}
      onChange={(e) => {
        const raw = toLatinDigits(e.target.value).replace(/[^0-9]/g, "")
        const n = raw ? Number(raw) : 0
        onChange(raw ? formatAmount(Math.min(n, 999_999_999_999)) : "")
      }}
      onKeyDown={(e) => e.key === "Enter" && onEnter?.()}
      placeholder={placeholder}
      aria-label={ariaLabel ?? "مبلغ به تومان"}
      className={cn(
        "numeric text-center font-extrabold tracking-wide bg-card border-input text-foreground placeholder:text-muted-foreground/60",
        size === "lg" ? "h-16 text-[32px]" : "h-12 text-xl",
        className
      )}
    />
  )
}

function formatTyped(raw: string): string {
  const n = parseAmountInput(raw)
  if (!n) return stripSeparators(toLatinDigits(raw)) ? formatAmount(Number(stripSeparators(toLatinDigits(raw)))) : ""
  return formatAmount(n)
}
