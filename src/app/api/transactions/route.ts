import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { monthRange } from "@/lib/mifa/jalali"

interface TxInput {
  type: "expense" | "income"
  amount: number
  title?: string | null
  category: string
  date: string
  source?: string
}

// GET /api/transactions?month=1404-09  یا  ?all=1
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const month = searchParams.get("month")
    const all = searchParams.get("all")

    if (all === "1") {
      const rows = await db.transaction.findMany({ orderBy: { date: "desc" } })
      return NextResponse.json(rows)
    }
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ error: "month key نامعتبر است" }, { status: 400 })
    }
    const { start, end } = monthRange(month)
    const rows = await db.transaction.findMany({
      where: { date: { gte: start, lt: end } },
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

    const valid: TxInput[] = []
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
