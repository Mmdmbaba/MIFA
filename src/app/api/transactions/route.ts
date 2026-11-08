import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { monthRange } from "@/lib/mifa/jalali"
import { cycleRange } from "@/lib/mifa/cycle"

interface TxInput {
  type: "expense" | "income"
  amount: number
  title?: string | null
  category: string
  date: string
  source?: string
}

interface TxRow {
  type: "expense" | "income"
  amount: number
  title: string | null
  category: string
  date: Date
  source: string
}

// GET /api/transactions?cycle=1404-09-08&startDay=8  یا  ?month=1404-09  یا  ?all=1
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const cycle = searchParams.get("cycle")
    const startDay = Math.min(31, Math.max(1, Number(searchParams.get("startDay")) || 1))
    const month = searchParams.get("month")
    const all = searchParams.get("all")

    if (all === "1") {
      const rows = await db.transaction.findMany({ orderBy: { date: "desc" } })
      return NextResponse.json(rows)
    }

    let range: { start: Date; end: Date } | null = null
    if (cycle && /^\d{4}-\d{2}-\d{2}$/.test(cycle)) {
      range = cycleRange(cycle, startDay)
    } else if (month && /^\d{4}-\d{2}$/.test(month)) {
      range = monthRange(month)
    }
    if (!range) {
      return NextResponse.json({ error: "کلید دوره نامعتبر است" }, { status: 400 })
    }
    const rows = await db.transaction.findMany({
      where: { date: { gte: range.start, lt: range.end } },
      orderBy: { date: "desc" },
    })
    return NextResponse.json(rows)
  } catch (e) {
    console.error("GET /api/transactions error:", e)
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 })
  }
}

// POST — یک تراکنش یا آرایه‌ای از تراکنش‌ها (ثبت گروهی پیامک/ورودی JSON)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const items: TxInput[] = Array.isArray(body) ? body : [body]

    const valid: TxRow[] = []
    for (const it of items) {
      if (!it || typeof it !== "object") continue
      const amount = Math.round(Number(it.amount))
      if (!Number.isFinite(amount) || amount <= 0) continue
      if (it.type !== "expense" && it.type !== "income") continue
      const date = it.date ? new Date(it.date) : new Date()
      if (Number.isNaN(date.getTime())) continue
      valid.push({
        type: it.type,
        amount,
        title: it.title?.slice(0, 120) || null,
        category: String(it.category || "groceries"),
        date,
        source: it.source === "sms" ? "sms" : "manual",
      })
    }

    if (valid.length === 0) {
      return NextResponse.json({ error: "هیچ تراکنش معتبری در داده نیست" }, { status: 400 })
    }

    const created = await db.transaction.createMany({ data: valid })
    return NextResponse.json({ created: created.count }, { status: 201 })
  } catch (e) {
    console.error("POST /api/transactions error:", e)
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 })
  }
}
