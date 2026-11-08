"use client"

// هوک‌های داده MIFA — TanStack Query روی لایه ذخیره‌سازی محلی (IndexedDB)
// هیچ fetch ای در کار نیست؛ خواندن/نوشتن همه‌چیز از src/lib/mifa/store.ts
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"
import { useCallback } from "react"
import type { Profile, Transaction } from "@/lib/mifa/types"
import {
  readMifaState,
  updateMifaState,
  makeTransaction,
  resetMifaState,
  type DraftTransaction,
} from "@/lib/mifa/store"

export const MIFA_QUERY_KEY = ["mifa"] as const

/** وضعیت کامل اپ — پروفایل + تراکنش‌ها */
export function useMifaState() {
  return useQuery({
    queryKey: MIFA_QUERY_KEY,
    queryFn: readMifaState,
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

export interface ProfileData {
  profile: Profile | null
}

/** پروفایل کاربر (null = هنوز onboarding نشده) */
export function useProfile(): { data: ProfileData | undefined; isLoading: boolean } {
  const state = useMifaState()
  return {
    data: state.data ? { profile: state.data.profile } : undefined,
    isLoading: state.isLoading,
  }
}

/** همه تراکنش‌ها (جدیدترین اول) */
export function useTransactions(): { data: Transaction[] | undefined; isLoading: boolean } {
  const state = useMifaState()
  const data = state.data
    ? [...state.data.transactions].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    : undefined
  return { data, isLoading: state.isLoading }
}

/** بعد از هر تغییر، کش TanStack را همگام کن */
function useSyncedMutation<TVars>(fn: (vars: TVars) => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (vars: TVars) => {
      fn(vars)
      const next = await readMifaState()
      qc.setQueryData(MIFA_QUERY_KEY, next)
      return next
    },
  })
}

/** ذخیره نهایی onboarding (یا ویرایش کامل برنامه از تنظیمات) */
export function useSaveProfile() {
  return useSyncedMutation((profile: Profile) => {
    updateMifaState((s) => ({ ...s, profile }))
  })
}

/** اصلاح جزئی پروفایل (بدون دست‌زدن به onboardedAt) */
export function useUpdateProfile() {
  return useSyncedMutation((patch: Partial<Profile>) => {
    updateMifaState((s) => (s.profile ? { ...s, profile: { ...s.profile, ...patch } } : s))
  })
}

export type AddTransactionInput = Omit<DraftTransaction, "source"> & { source?: "manual" | "sms" }

/** افزودن یک یا چند تراکنش (ثبت دستی، چیپ دسته‌بندی، ورود SMS، CSV) */
export function useAddTransactions() {
  return useSyncedMutation((items: AddTransactionInput[]) => {
    updateMifaState((s) => ({
      ...s,
      transactions: [...s.transactions, ...items.map((i) => makeTransaction({ ...i, source: i.source ?? "manual" }))],
    }))
  })
}

export interface TransactionPatch {
  id: string
  type?: "expense" | "income"
  amount?: number
  title?: string | null
  category?: string
  date?: string
}

export function useUpdateTransaction() {
  return useSyncedMutation((patch: TransactionPatch) => {
    updateMifaState((s) => ({
      ...s,
      transactions: s.transactions.map((t) =>
        t.id === patch.id
          ? {
              ...t,
              ...(patch.type ? { type: patch.type } : {}),
              ...(patch.amount !== undefined ? { amount: Math.max(1, Math.round(patch.amount)) } : {}),
              ...(patch.title !== undefined ? { title: patch.title } : {}),
              ...(patch.category ? { category: patch.category } : {}),
              ...(patch.date ? { date: patch.date } : {}),
            }
          : t
      ),
    }))
  })
}

export function useDeleteTransaction() {
  return useSyncedMutation((id: string) => {
    updateMifaState((s) => ({ ...s, transactions: s.transactions.filter((t) => t.id !== id) }))
  })
}

/** پاک‌سازی همه داده‌ها (پروفایل + تراکنش‌ها) — با تأیید دو مرحله‌ای در UI */
export function useClearAll() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await resetMifaState()
      qc.setQueryData(MIFA_QUERY_KEY, await readMifaState())
    },
  })
}

/** خواندن مستقیم وضعیت برای export یا عملیات خارج از هوک */
export function useGetState() {
  return useCallback(async () => readMifaState(), [])
}
