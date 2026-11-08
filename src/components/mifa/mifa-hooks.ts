"use client"

// هوک‌های داده MIFA بر پایه TanStack Query
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { CategoryId } from "@/lib/mifa/categories"
import type { PlanProfile, FixedItem } from "@/lib/mifa/plan"

export interface ProfileData {
  profile: (PlanProfile & { onboardedAt: string }) | null
  fixed: FixedItem[]
}

export function useProfile() {
  return useQuery<ProfileData>({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await fetch("/api/profile")
      if (!res.ok) throw new Error("خطا در دریافت پروفایل")
      return res.json()
    },
  })
}

export function useSaveProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: PlanProfile & { fixed: { label: string; amount: number; icon: string }[] }) => {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? "خطا در ذخیره پروفایل")
      }
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  })
}

export function useResetProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/profile", { method: "DELETE" })
      if (!res.ok) throw new Error("خطا در بازنشانی پروفایل")
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  })
}

export interface Transaction {
  id: string
  type: "expense" | "income"
  amount: number
  title: string | null
  category: string
  date: string
  source: string
  createdAt: string
}

export interface BudgetData {
  month: string
  monthly: number | null
  categories: { category: string; amount: number }[]
}

export function useTransactions(cycle: string, startDay: number) {
  return useQuery<Transaction[]>({
    queryKey: ["transactions", cycle, startDay],
    queryFn: async () => {
      const res = await fetch(`/api/transactions?cycle=${encodeURIComponent(cycle)}&startDay=${startDay}`)
      if (!res.ok) throw new Error("خطا در دریافت تراکنش‌ها")
      return res.json()
    },
  })
}

export function useTransactionsAll() {
  return useQuery<Transaction[]>({
    queryKey: ["transactions", "all"],
    queryFn: async () => {
      const res = await fetch("/api/transactions?all=1")
      if (!res.ok) throw new Error("خطا در دریافت تراکنش‌ها")
      return res.json()
    },
  })
}

export function useBudget(month: string) {
  return useQuery<BudgetData>({
    queryKey: ["budget", month],
    queryFn: async () => {
      const res = await fetch(`/api/budget?month=${month}`)
      if (!res.ok) throw new Error("خطا در دریافت بودجه")
      return res.json()
    },
  })
}

export function useInvalidate() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: ["transactions"] })
    qc.invalidateQueries({ queryKey: ["budget"] })
  }
}

export function useAddTransactions() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: async (items: (Omit<Transaction, "id" | "createdAt" | "source"> & { source?: string })[]) => {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(items.map((i) => ({ ...i, source: i.source ?? "manual" }))),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? "خطا در ثبت تراکنش")
      }
      return res.json()
    },
    onSuccess: invalidate,
  })
}

export function useUpdateTransaction() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: async (item: { id: string; type?: string; amount?: number; title?: string | null; category?: string; date?: string }) => {
      const res = await fetch(`/api/transactions/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      })
      if (!res.ok) throw new Error("خطا در ویرایش تراکنش")
      return res.json()
    },
    onSuccess: invalidate,
  })
}

export function useDeleteTransaction() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("خطا در حذف تراکنش")
      return res.json()
    },
    onSuccess: invalidate,
  })
}

export function useSaveBudget() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: async (payload: {
      month: string
      monthly?: number | null
      categories?: { category: string; amount: number }[]
    }) => {
      const res = await fetch("/api/budget", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("خطا در ذخیره بودجه")
      return res.json()
    },
    onSuccess: invalidate,
  })
}

export interface ImportPayload {
  app: string
  version: number
  transactions: { type: string; amount: number; title?: string | null; category: string; date: string; source?: string }[]
  budgets?: { month: string; amount: number }[]
  categoryBudgets?: { month: string; category: string; amount: number }[]
}

export function useImportData() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: async (payload: ImportPayload) => {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? "خطا در بازگردانی داده")
      }
      return res.json()
    },
    onSuccess: invalidate,
  })
}

export function useClearAll() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ app: "MIFA", version: 1, transactions: [] }),
      })
      if (!res.ok) throw new Error("خطا در پاک‌سازی داده")
      return res.json()
    },
    onSuccess: invalidate,
  })
}

export type { CategoryId }
