// دسته‌بندی‌های خرج MIFA — هماهنگ با برند کیت
export type CategoryId =
  | "groceries" | "transport" | "home" | "bills" | "entertainment"
  | "health" | "clothing" | "education" | "gifts" | "savings"

export interface CategoryDef {
  id: CategoryId
  name: string // نام فارسی
  color: string // رنگ نمودار از برند کیت
  keywords: string[] // کلمات کلیدی برای دسته‌بندی خودکار
}

export const CATEGORIES: CategoryDef[] = [
  { id: "groceries",     name: "خوراک",     color: "#08D9D6", keywords: ["فروشگاه", "سوپر", "هایپر", "نانوایی", "قصابی", "میوه", "سبزی", "لبنیات", "اسنپ فود", "دلیجری", "رستوران", "کافه", "غذا", "فست‌فود", "پیتزا"] },
  { id: "transport",     name: "حمل‌ونقل",  color: "#347F89", keywords: ["اسنپ", "تپسی", "مترو", "اتوبوس", "تاکسی", "پمپ بنزین", "بنزین", "گازوئیل", "ایران‌مال", "تگ", "عوارض راه", "پارکینگ", "آپاراتی", "هزینه ماشین"] },
  { id: "home",          name: "خانه",       color: "#6F8790", keywords: ["اجاره", "رهن", "موبلیات", "لوازم خانگی", "تعمیرات", "کرایه", "ودیعه"] },
  { id: "bills",         name: "قبض",        color: "#A5B5B4", keywords: ["برق", "گاز", "آب", "تلفن", "اینترنت", "شارژ", "همراه اول", "ایرانسل", "مبین‌نت", "قبض", "عوارض", "بیمه"] },
  { id: "entertainment", name: "تفریح",      color: "#D3A45B", keywords: ["سینما", "فیلم", "نتفلیکس", "فیلیمو", "نماوا", "بازی", "استیم", "تفریح", "سفر", "هتل", "بلیط", "ورزش", "باشگاه", "کافه"] },
  { id: "health",        name: "سلامت",      color: "#70A58F", keywords: ["دارو", "پزشک", "دکتر", "درمان", "بیمارستان", "آزمایش", "عینک", "دندان", "داروخانه", "کلینیک", "فیزیوتراپی"] },
  { id: "clothing",      name: "پوشاک",      color: "#8C7565", keywords: ["لباس", "کیف", "کفش", "پوشاک", "مانتو", "شلوار", "تیشرت", "بوتیک", "خیاطی"] },
  { id: "education",     name: "آموزش",      color: "#7896B0", keywords: ["کتاب", "دوره", "کلاس", "دانشگاه", "مدرسه", "آموزش", "کنکور", "زبان", "تدریس"] },
  { id: "gifts",         name: "هدیه",       color: "#C18B97", keywords: ["هدیه", "کادو", "عیدی", "گل", "عروسی", "تولد"] },
  { id: "savings",       name: "پس‌انداز",   color: "#78B9A7", keywords: ["پس‌انداز", "سرمایه", "طلا", "سکه", "ارز", "سهام", "صندوق", "قسط وام"] },
]

export const CATEGORY_MAP: Record<string, CategoryDef> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c])
)

export function getCategory(id: string): CategoryDef {
  return CATEGORY_MAP[id] ?? CATEGORIES[0]
}

/** دسته‌بندی خودکار بر اساس متن یادداشت (قاعده‌محور، بدون API پولی) */
export function autoCategory(text: string): CategoryId {
  const t = text.toLowerCase().trim()
  if (!t) return "groceries"
  let best: CategoryId = "groceries"
  let bestScore = 0
  for (const cat of CATEGORIES) {
    let score = 0
    for (const kw of cat.keywords) {
      if (t.includes(kw.toLowerCase())) score += kw.length
    }
    if (score > bestScore) {
      bestScore = score
      best = cat.id
    }
  }
  return best
}
