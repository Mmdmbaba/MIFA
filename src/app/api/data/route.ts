import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// GET /api/data — خروجی کامل JSON برای پشتیبان‌گیری
export async function GET() {
  try {
    const [transactions, budgets, categoryBudgets] = await Promise.all([
      db.transaction.findMany({ orderBy: { date: "asc" } }),
      db.budget.findMany(),
      db.categoryBudget.findMany(),
    ])
    return NextResponse.json({
      app: "MIFA",
      version: 1,
      exportedAt: new Date().toISOString(),
      transactions,
      budgets,
      categoryBudgets,
    })
  } catch (e) {
    console.error("GET /api/data error:", e)
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 })
  }
}

// POST /api/data — ورودی JSON (بازگردانی پشتیبان — همه داده قبلی جایگزین می‌شود)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body || body.app !== "MIFA" || !Array.isArray(body.transactions)) {
      return NextResponse.json({ error: "فایل پشتیبان MIFA معتبر نیست" }, { status: 400 })
    }

    await db.transaction.deleteMany({})
    await db.budget.deleteMany({})
    await db.categoryBudget.deleteMany({})

    const txs = body.transactions
      .filter((t: Record<string, unknown>) =>
        (t?.type === "expense" || t?.type === "income") && Number(t?.amount) > 0)
      .map((t: Record<string, unknown>) => ({
        type: String(t.type),
        amount: Math.round(Number(t.amount)),
        title: t.title ? String(t.title).slice(0, 120) : null,
        category: String(t.category || "groceries"),
        date: new Date(String(t.date)),
        source: t.source === "sms" ? "sms" : "manual",
      }))
      .filter((t: { date: Date }) => !Number.isNaN(t.date.getTime()))

    if (txs.length > 0) {
      await db.transaction.createMany({ data: txs })
    }

    if (Array.isArray(body.budgets)) {
      const budgets = body.budgets
        .filter((b: Record<string, unknown>) =>
          typeof b?.month === "string" && /^\d{4}-\d{2}$/.test(String(b.month)) && Number(b?.amount) > 0)
        .map((b: Record<string, unknown>) => ({ month: String(b.month), amount: Math.round(Number(b.amount)) }))
      if (budgets.length > 0) await db.budget.createMany({ data: budgets })
    }

    if (Array.isArray(body.categoryBudgets)) {
      const cb = body.categoryBudgets
        .filter((c: Record<string, unknown>) =>
          typeof c?.month === "string" && /^\d{4}-\d{2}$/.test(String(c.month)) &&
          typeof c?.category === "string" && Number(c?.amount) > 0)
        .map((c: Record<string, unknown>) => ({
          month: String(c.month),
          category: String(c.category),
          amount: Math.round(Number(c.amount)),
        }))
      if (cb.length > 0) await db.categoryBudget.createMany({ data: cb })
    }

    return NextResponse.json({ ok: true, imported: txs.length })
  } catch (e) {
    console.error("POST /api/data error:", e)
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 })
  }
}
