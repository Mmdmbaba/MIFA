import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// PATCH /api/transactions/[id] — ویرایش تراکنش
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const data: Record<string, unknown> = {}

    if (body.type === "expense" || body.type === "income") data.type = body.type
    if (body.amount !== undefined) {
      const amount = Math.round(Number(body.amount))
      if (!Number.isFinite(amount) || amount <= 0) {
        return NextResponse.json({ error: "مبلغ نامعتبر است" }, { status: 400 })
      }
      data.amount = amount
    }
    if (body.title !== undefined) data.title = body.title?.slice(0, 120) || null
    if (body.category !== undefined) data.category = String(body.category)
    if (body.date !== undefined) {
      const date = new Date(body.date)
      if (Number.isNaN(date.getTime())) {
        return NextResponse.json({ error: "تاریخ نامعتبر است" }, { status: 400 })
      }
      data.date = date
    }

    const updated = await db.transaction.update({ where: { id }, data })
    return NextResponse.json(updated)
  } catch (e) {
    console.error("PATCH /api/transactions/[id] error:", e)
    return NextResponse.json({ error: "تراکنش پیدا نشد" }, { status: 500 })
  }
}

// DELETE /api/transactions/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.transaction.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("DELETE /api/transactions/[id] error:", e)
    return NextResponse.json({ error: "تراکنش پیدا نشد" }, { status: 500 })
  }
}
