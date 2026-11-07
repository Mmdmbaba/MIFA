import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export interface BudgetPayload {
  month: string
  monthly: number | null
  categories: { category: string; amount: number }[]
}

// GET /api/budget?month=1404-09
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const month = searchParams.get("month") ?? ""
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ error: "month key نامعتبر است" }, { status: 400 })
    }
    const [monthly, cats] = await Promise.all([
      db.budget.findUnique({ where: { month } }),
      db.categoryBudget.findMany({ where: { month } }),
    ])
    return NextResponse.json({
      month,
      monthly: monthly?.amount ?? null,
      categories: cats.map((c) => ({ category: c.category, amount: c.amount })),
    })
  } catch (e) {
    console.error("GET /api/budget error:", e)
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 })
  }
}

// PUT /api/budget — ذخیره بودجه ماهانه و دسته‌ای
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const month: string = body?.month
    if (!/^\d{4}-\d{2}$/.test(month ?? "")) {
      return NextResponse.json({ error: "month key نامعتبر است" }, { status: 400 })
    }

    if (body.monthly !== undefined) {
      const amount = Math.round(Number(body.monthly))
      if (amount > 0) {
        await db.budget.upsert({
          where: { month },
          create: { month, amount },
          update: { amount },
        })
      } else {
        await db.budget.deleteMany({ where: { month } })
      }
    }

    if (Array.isArray(body.categories)) {
      await db.categoryBudget.deleteMany({ where: { month } })
      const rows = body.categories
        .filter((c: { category?: unknown; amount?: unknown }) =>
          typeof c?.category === "string" && Number(c?.amount) > 0)
        .map((c: { category: string; amount: number }) => ({
          month,
          category: c.category,
          amount: Math.round(Number(c.amount)),
        }))
      if (rows.length > 0) {
        await db.categoryBudget.createMany({ data: rows })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("PUT /api/budget error:", e)
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 })
  }
}
