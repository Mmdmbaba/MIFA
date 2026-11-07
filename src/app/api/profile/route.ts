import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

interface FixedInput {
  label: string
  amount: number
  icon: string
}

interface ProfilePayload {
  name: string
  income: number
  payday: number
  savingsMode: string
  savingsAmount: number
  savingsPercent: number
  fixed: FixedInput[]
}

const VALID_MODES = new Set(["auto", "amount", "percent", "none"])

// GET — پروفایل + هزینه‌های ثابت (اگر onboarding نشده profile = null)
export async function GET() {
  try {
    const [profile, fixed] = await Promise.all([
      db.profile.findUnique({ where: { id: "me" } }),
      db.fixedExpense.findMany({ orderBy: { sortOrder: "asc" } }),
    ])
    return NextResponse.json({ profile, fixed })
  } catch (e) {
    console.error("GET /api/profile error:", e)
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 })
  }
}

// PUT — ذخیره پروفایل + جایگزینی کامل هزینه‌های ثابت (upsert)
export async function PUT(req: NextRequest) {
  try {
    const body: ProfilePayload = await req.json()

    const name = String(body.name ?? "").trim().slice(0, 40)
    const income = Math.round(Number(body.income))
    const payday = Math.min(31, Math.max(1, Math.round(Number(body.payday) || 1)))
    const savingsMode = VALID_MODES.has(body.savingsMode) ? body.savingsMode : "auto"
    const savingsAmount = Math.max(0, Math.round(Number(body.savingsAmount) || 0))
    const savingsPercent = Math.min(90, Math.max(0, Math.round(Number(body.savingsPercent) || 0)))

    if (!name) return NextResponse.json({ error: "اسم رو بنویس" }, { status: 400 })
    if (!Number.isFinite(income) || income <= 0)
      return NextResponse.json({ error: "درآمد ماهانه معتبر نیست" }, { status: 400 })

    const fixed = Array.isArray(body.fixed)
      ? body.fixed
          .filter((f) => f && String(f.label ?? "").trim() && Number(f.amount) > 0)
          .slice(0, 30)
          .map((f, i) => ({
            label: String(f.label).trim().slice(0, 60),
            amount: Math.round(Number(f.amount)),
            icon: String(f.icon ?? "bills").slice(0, 20),
            sortOrder: i,
          }))
      : []

    const [profile] = await Promise.all([
      db.profile.upsert({
        where: { id: "me" },
        update: { name, income, payday, savingsMode, savingsAmount, savingsPercent },
        create: { id: "me", name, income, payday, savingsMode, savingsAmount, savingsPercent },
      }),
      db.fixedExpense.deleteMany(),
      fixed.length > 0 ? db.fixedExpense.createMany({ data: fixed }) : Promise.resolve(),
    ])

    const savedFixed = await db.fixedExpense.findMany({ orderBy: { sortOrder: "asc" } })
    return NextResponse.json({ profile, fixed: savedFixed })
  } catch (e) {
    console.error("PUT /api/profile error:", e)
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 })
  }
}

// DELETE — پاک کردن پروفایل برای اجرای مجدد onboarding
export async function DELETE() {
  try {
    await Promise.all([db.profile.deleteMany(), db.fixedExpense.deleteMany()])
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("DELETE /api/profile error:", e)
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 })
  }
}
