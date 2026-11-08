// برداشت و بازگردانی CSV — کاملاً سمت کلاینت
import type { Transaction, TxType } from "./types"
import { toLatinDigits } from "./format"

const HEADER = "type,amount,title,category,date,source,createdAt"

function csvCell(v: string): string {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

export function transactionsToCsv(transactions: Transaction[]): string {
  const rows = transactions.map((t) =>
    [
      t.type,
      String(t.amount),
      csvCell(t.title ?? ""),
      t.category,
      t.date,
      t.source,
      t.createdAt,
    ].join(",")
  )
  return [HEADER, ...rows].join("\n")
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = []
  let cur = ""
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (quoted) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"'
        i++
      } else if (c === '"') {
        quoted = false
      } else cur += c
    } else if (c === '"') {
      quoted = true
    } else if (c === ",") {
      cells.push(cur)
      cur = ""
    } else cur += c
  }
  cells.push(cur)
  return cells
}

export interface CsvImportResult {
  transactions: Omit<Transaction, "id" | "createdAt">[]
  skipped: number
}

/** پارس CSV خروجی MIFA — سطرهای نامعتبر نادیده گرفته می‌شوند */
export function parseCsv(text: string): CsvImportResult {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim())
  const transactions: Omit<Transaction, "id" | "createdAt">[] = []
  let skipped = 0
  for (const line of lines.slice(1)) {
    const cells = splitCsvLine(line)
    if (cells.length < 4) {
      skipped++
      continue
    }
    const [type, amountRaw, title, category, date, source, createdAt] = cells
    const t = toLatinDigits(amountRaw).replace(/[^0-9.-]/g, "")
    const amount = Math.round(Number(t))
    if ((type !== "expense" && type !== "income") || !Number.isFinite(amount) || amount <= 0) {
      skipped++
      continue
    }
    const iso = date && !Number.isNaN(new Date(date).getTime()) ? new Date(date).toISOString() : new Date().toISOString()
    transactions.push({
      type: type as TxType,
      amount,
      title: title || null,
      category: category || "groceries",
      date: iso,
      source: source === "sms" ? "sms" : "manual",
      createdAt: createdAt && !Number.isNaN(new Date(createdAt).getTime()) ? createdAt : iso,
    })
  }
  return { transactions, skipped }
}
