// لایه ذخیره‌سازی محلی MIFA — تمام داده اپ در IndexedDB زیر یک کلید
// دیپلوی هدف: Cloudflare Pages (خروجی استاتیک) → هیچ سروری در کار نیست.
// همه مبالغ عدد صحیح به تومان هستند.

import { get, set } from "idb-keyval"
import type { Profile, Transaction } from "./types"

export interface MifaState {
  version: 2
  profile: Profile | null
  transactions: Transaction[]
}

const STATE_KEY = "mifa:state:v2"
const WRITE_DEBOUNCE_MS = 120

export const EMPTY_STATE: MifaState = { version: 2, profile: null, transactions: [] }

/** حافظه موقت — بعد از اولین خواندن همیشه sync در دسترس است */
let cache: MifaState | null = null
let writeTimer: ReturnType<typeof setTimeout> | null = null
let listening = false

function ensureFlushListeners() {
  if (listening || typeof window === "undefined") return
  listening = true
  const flush = () => void flushMifaState()
  window.addEventListener("pagehide", flush)
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush()
  })
}

/** خواندن وضعیت از IndexedDB (با کش) */
export async function readMifaState(): Promise<MifaState> {
  if (cache) return cache
  ensureFlushListeners()
  try {
    const stored = await get<MifaState>(STATE_KEY)
    cache = stored && stored.version === 2 ? stored : EMPTY_STATE
  } catch {
    cache = EMPTY_STATE
  }
  return cache
}

/** دسترسی همگام به کش — فقط بعد از readMifaState معتبر است */
export function peekMifaState(): MifaState | null {
  return cache
}

/** تغییر وضعیت + نوشتن debounce شده در IndexedDB */
export function updateMifaState(fn: (s: MifaState) => MifaState): MifaState {
  const base = cache ?? EMPTY_STATE
  cache = fn({ ...base, transactions: [...base.transactions], profile: base.profile })
  scheduleWrite()
  return cache
}

function scheduleWrite() {
  if (typeof window === "undefined") return
  if (writeTimer) clearTimeout(writeTimer)
  writeTimer = setTimeout(() => {
    writeTimer = null
    void flushMifaState()
  }, WRITE_DEBOUNCE_MS)
}

/** نوشتن فوری کش در IndexedDB */
export async function flushMifaState(): Promise<void> {
  if (writeTimer) {
    clearTimeout(writeTimer)
    writeTimer = null
  }
  if (!cache) return
  try {
    await set(STATE_KEY, cache)
  } catch {
    /* حافظه پر یا در دسترس نیست — داده در حافظه صفحه می‌ماند */
  }
}

/** پاک‌سازی کامل همه داده‌ها */
export async function resetMifaState(): Promise<void> {
  cache = { ...EMPTY_STATE, transactions: [] }
  await flushMifaState()
}

/** شناسه یکتا بدون وابستگی */
export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID()
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

// ─── عملیات تراکنش ───

export type DraftTransaction = Omit<Transaction, "id" | "createdAt">

export function makeTransaction(draft: DraftTransaction): Transaction {
  return {
    ...draft,
    id: newId(),
    title: draft.title?.trim() || null,
    createdAt: new Date().toISOString(),
  }
}
