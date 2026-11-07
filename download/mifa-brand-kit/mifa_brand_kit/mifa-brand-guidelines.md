# MIFA — Brand Identity System

**Version 1.0 · Personal finance · Persian-first · RTL-ready**

## 1. Brand strategy

**Archetype:** The Sage × The Everyperson. The Sage turns messy spending into clear insight; the Everyperson makes the guidance feel useful, human, and never preachy.

**Three feeling words:** روشن (clear) · مطمئن (assured) · سبک (lighter).

**Main tagline:** «پولت رو بشناس، بیشتر نگه دار.»  
*Transliteration:* *Poolet ro beshnās, bishtar negah dār.*

**Alternatives:**
- «خرج‌هات روشن؛ خیالت آسوده‌تر.» — *Kharj-hāt roshan; khiyālet āsude-tar.*
- «هر خرج، یک انتخاب آگاهانه.» — *Har kharj, yek entekhāb-e āgāhāne.*

**Positioning in one line:** MIFA makes everyday money decisions easier to see and easier to feel in control of — so more of the month’s money stays yours.

**Voice:** calm, direct, clear, friendly, never scolding. Prefer “این ماه کمی بیشتر خرج کردی” over “اشتباه کردی”. Say “تومان” explicitly in financial summaries. Use Persian digits in the Persian UI; use tabular numerals for aligned amounts.

## 2. Logo system

### Three concepts considered
1. **The Retained Flow (selected):** a geometric M-shaped channel narrows toward one dot. It connects the initial of MIFA with the product promise: see where money flows, then retain more of it. Its symmetry hints at Persian geometric construction without borrowing a literal tile, arch, or calligraphic cliché.
2. **The Open Ledger:** two offset brackets form an open page with a small check. Strong for tracking, but closer to generic accounting software and less ownable.
3. **The Quiet Orbit:** a compact central dot surrounded by a broken circular path. It suggests an always-on companion, but communicates budgeting less directly and can read as a loading indicator.

### Selected concept — The Retained Flow
The mark is built from a 48-unit square, rounded vector strokes, and a single terminal dot. The dot represents the amount that remains after the month’s spending is understood; it is a design metaphor, not a coin. The custom Latin wordmark uses monoline geometric letterforms with softened joins and a distinctive open A.

**Latin wordmark:** custom vector lettering; geometric grotesk construction, 5.2-unit strokes, rounded caps and joins. Do not substitute a font-rendered “MIFA” in product headers; use the provided SVG for consistent brand artwork. In body copy use Manrope.

**Persian adaptation:** «میفا» set in Vazirmatn Bold (750) with the same symbol, same optical height, and right-aligned RTL lockup. When exporting production artwork, convert the Persian text to outlines after loading the chosen font so shaping is preserved.

**Primary colors:** symbol `#08D9D6`; wordmark `#252A34`. Dark backgrounds: white/gray wordmark and teal symbol. Monochrome artwork uses a single black or white ink.

**Clear space:** keep a minimum clear area equal to the symbol’s dot diameter (5.4 units) on every side; for the full lockup use the symbol’s inner vertical stem width (4.2 units) as the minimum and prefer 1× symbol-stroke width multiplied by 3 (12.6 units) in layouts. Keep copy, borders, and other icons outside this area.

**Minimum sizes:** full Latin lockup 120 px wide on screen / 28 mm in print; Persian lockup 128 px / 30 mm; symbol 20 px / 6 mm. Below 20 px, use the simplified favicon artwork.

**Files:** `assets/mifa-logo-latin.svg`, `assets/mifa-logo-persian.svg`, `assets/mifa-logo-black.svg`, `assets/mifa-logo-white.svg`, `assets/mifa-symbol.svg`, `assets/mifa-favicon.svg`, `assets/mifa-app-icon-512.svg`.

### Primary Latin logo — SVG
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="288" height="72" viewBox="0 0 288 72" role="img" aria-labelledby="title desc">
  <title id="title">MIFA logo</title><desc id="desc">A geometric M-shaped flow mark with a small retained-value dot, beside the MIFA wordmark.</desc>
  <g transform="translate(8 8)" fill="none" stroke="#08D9D6" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 35V14.5C10 11.8 12.9 10.5 15 12.2L24 20L33 12.2C35.1 10.5 38 11.8 38 14.5V35"/><path d="M24 20V33"/><circle cx="24" cy="39" r="2.7" fill="#08D9D6" stroke="none"/></g>
  <g transform="translate(78 11)" fill="none" stroke="#252A34" stroke-width="5.2" stroke-linecap="round" stroke-linejoin="round"><path d="M0 43V5L20 24L40 5V43"/><path d="M57 5V43"/><path d="M76 43V5H111M76 24H103"/><path d="M126 43L145 5L164 43M133 29H157"/></g>
</svg>
```

### Persian lockup — SVG
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="300" height="84" viewBox="0 0 300 84" role="img" aria-labelledby="title desc">
  <title id="title">نشان فارسی میفا</title><desc id="desc">نشان هندسی میفا در کنار نام فارسی میفا.</desc>
  <g transform="translate(16 16)" fill="none" stroke="#08D9D6" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M10 35V14.5C10 11.8 12.9 10.5 15 12.2L24 20L33 12.2C35.1 10.5 38 11.8 38 14.5V35"/><path d="M24 20V33"/><circle cx="24" cy="39" r="2.7" fill="#08D9D6" stroke="none"/>
  </g>
  <text x="284" y="59" text-anchor="end" direction="rtl" unicode-bidi="plaintext" font-family="Vazirmatn, Peyda, IRANSansX, Noto Sans Arabic, sans-serif" font-size="47" font-weight="750" fill="#252A34">میفا</text>
</svg>
```

### Standalone symbol — SVG
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 48 48" role="img" aria-labelledby="title desc">
  <title id="title">MIFA symbol</title><desc id="desc">An abstract M-shaped funnel that narrows to a dot, representing clarity and money retained.</desc>
  <g fill="none" stroke="#252A34" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 35V14.5C10 11.8 12.9 10.5 15 12.2L24 20L33 12.2C35.1 10.5 38 11.8 38 14.5V35"/><path d="M24 20V33"/><circle cx="24" cy="39" r="2.7" fill="#08D9D6" stroke="none"/></g>
</svg>
```

### Monochrome black and white lockups
The following two complete files are also included: `assets/mifa-logo-black.svg` (single `#000000` ink) and `assets/mifa-logo-white.svg` (single `#FFFFFF` ink).

### Favicon and app icon
Use `assets/mifa-favicon.svg` at 16–64 px; use `assets/mifa-app-icon-512.svg` as the 512 × 512 master. Both are fully vector and use the exact core colors.

## 3. Typography

**Primary Persian:** Vazirmatn Variable. Use `Vazirmatn` for UI, numbers, labels, and Persian wordmark source text. It has a modern, open structure that remains legible at compact dashboard sizes. Peyda or IRANSansX are acceptable project-level alternatives, but do not mix Persian families inside one product surface.

**Complementary Latin:** Manrope. Use for MIFA product copy, English labels, and Latin numerals. The Latin wordmark itself is custom vector artwork, not a typeset font.

| Style | Size / line height | Weight | Typical use |
|---|---:|---:|---|
| H1 | 36 / 44 px | 800 | Page headline |
| H2 | 28 / 36 px | 700 | Main section |
| H3 | 22 / 30 px | 700 | Card / panel title |
| H4 | 18 / 28 px | 600 | Subsection / dialog title |
| Body large | 17 / 28 px | 400 | Introductory copy |
| Body | 15 / 26 px | 400 | Default UI text |
| Body small | 14 / 22 px | 400 | Helper text, dense tables |
| Caption | 12 / 18 px | 500 | Metadata, timestamps |
| Display number | 40 / 48 px | 800 | Balance / monthly total |

Use sentence case, avoid all-caps in Persian, and use tabular numerals for aligned money columns. For amounts, separate the number and unit where practical: `۱٬۲۵۰٬۰۰۰` + `تومان`.

## 4. Extended color system

### Fixed brand core
| Token | Hex | Primary use |
|---|---|---|
| MIFA Teal | `#08D9D6` | Primary actions, active states, key chart series |
| MIFA Navy | `#252A34` | Text, headings, dark-mode foundation |
| MIFA Rose | `#FF2E63` | Budget overrun, urgent alerts only; never more than 10% of a screen |
| MIFA Gray | `#EAEAEA` | Light-mode canvas and card surfaces |

**60/30/10 application:** Light mode: 60% Gray surfaces, 30% Navy structure/type, 10% Teal interaction and data emphasis. Dark mode: 60% Navy surfaces, 30% Gray type/quiet surfaces, 10% Teal interaction. Rose is an exception color, not a fourth constant layer: it replaces a portion of the 10% accent budget only when an alert is genuinely important.

### Derived tints and shades
| Step | Teal | Navy | Rose | Gray |
|---|---|---|---|---|
| 50 | `#E5FCFB` | `#F1F2F4` | `#FFF0F4` | `#FAFAFA` |
| 100 | `#C7F7F5` | `#DDE0E5` | `#FFD5E0` | `#F5F5F5` |
| 200 | `#91EFEC` | `#BEC3CB` | `#FFADC2` | `#EAEAEA` |
| 300 | `#5DE6E2` | `#949CA8` | `#FF7D9F` | `#D7D7D7` |
| 400 | `#2FE0DC` | `#687281` | `#FF527F` | `#BDBDBD` |
| 500 | `#08D9D6` | `#48515E` | `#FF2E63` | `#9C9C9C` |
| 600 | `#06B9B6` | `#343B48` | `#D92352` | `#797979` |
| 700 | `#058E8C` | `#252A34` | `#AB1C41` | `#5A5A5A` |
| 800 | `#066B69` | `#1C2028` | `#7E1632` | `#3B3B3B` |
| 900 | `#074E4D` | `#14171D` | `#551023` | `#252A34` |

### Expense chart colors
| Category | Hex |
|---|---|
| Groceries | `#08D9D6` |
| Transport | `#347F89` |
| Home | `#6F8790` |
| Bills | `#A5B5B4` |
| Entertainment | `#D3A45B` |
| Health | `#70A58F` |
| Clothing | `#8C7565` |
| Education | `#7896B0` |
| Gifts | `#C18B97` |
| Savings | `#78B9A7` |

Use direct labels or a legend; never rely on color alone. Keep category colors stable across the product. Do not use Rose for a routine category.

### Semantic states
| State | Light theme | Dark theme | Use |
|---|---|---|---|
| Success | `#238B68` | `#55C49A` | Budget on track, action completed |
| Warning | `#B97820` | `#E2AD5D` | Approaching a limit, unusual spend |
| Error | `#FF2E63` | `#FF5B83` | Over budget, failed action, urgent notice |
| Info | `#087F86` | `#5CE7E3` | Neutral system guidance |

## 5. Iconography

Use a **rounded outline** family: 1.7 px stroke on a 24 × 24 viewBox, round caps and joins, no fills except where a future active-state variant explicitly needs a filled glyph. Keep optical mass centered and leave at least 2 px internal breathing room. Category icons inherit `currentColor`; default is `--text-muted`, selected is `--brand-ink` on a `--brand-soft` surface. The ten standalone SVGs are `assets/icon-groceries.svg`, `icon-transport.svg`, `icon-home.svg`, `icon-bills.svg`, `icon-entertainment.svg`, `icon-health.svg`, `icon-clothing.svg`, `icon-education.svg`, `icon-gifts.svg`, and `icon-savings.svg`.

### Reusable SVG sprite
```svg
<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">
  <symbol id="mifa-icon-groceries" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 9h17l-1.6 10.5H5.1L3.5 9Z"/><path d="M7 9l3-5M17 9l-3-5M8 13v3M12 13v3M16 13v3"/></g></symbol>
  <symbol id="mifa-icon-transport" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17V7.5A2.5 2.5 0 0 1 7.5 5h9A2.5 2.5 0 0 1 19 7.5V17H5Z"/><path d="M5 11h14M8 17v2M16 17v2M8 14h.01M16 14h.01"/></g></symbol>
  <symbol id="mifa-icon-home" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="m3.5 11 8.5-7 8.5 7"/><path d="M5.5 10v10h13V10M9.5 20v-6h5v6"/></g></symbol>
  <symbol id="mifa-icon-bills" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3.8h12v16.4l-3-1.8-3 1.8-3-1.8-3 1.8V3.8Z"/><path d="M9 8h6M9 12h6M9 16h3"/></g></symbol>
  <symbol id="mifa-icon-entertainment" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6.5h16v11H4z"/><path d="m10 9.5 5 2.5-5 2.5v-5Z"/><path d="M7 6.5v-2M17 6.5v-2M7 17.5v2M17 17.5v2"/></g></symbol>
  <symbol id="mifa-icon-health" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20s-7.5-4.4-7.5-10A4.2 4.2 0 0 1 12 7.3 4.2 4.2 0 0 1 19.5 10C19.5 15.6 12 20 12 20Z"/><path d="M12 9v6M9 12h6"/></g></symbol>
  <symbol id="mifa-icon-clothing" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="m8 4 4 2 4-2 4 3-2.2 4-2.3-1.2V20H8.5V9.8L6.2 11 4 7l4-3Z"/></g></symbol>
  <symbol id="mifa-icon-education" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5c3-1.5 5.7-1.2 8 1v13c-2.3-2.2-5-2.5-8-1v-13Z"/><path d="M20 5.5c-3-1.5-5.7-1.2-8 1v13c2.3-2.2 5-2.5 8-1v-13Z"/></g></symbol>
  <symbol id="mifa-icon-gifts" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10h16v10H4zM3 7h18v3H3zM12 7v13"/><path d="M12 7H8.5A2 2 0 1 1 10 4c1.1 1.2 2 3 2 3ZM12 7h3.5A2 2 0 1 0 14 4c-1.1 1.2-2 3-2 3Z"/></g></symbol>
  <symbol id="mifa-icon-savings" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 14.5c0-3.4 2.8-5.8 7-5.8s7 2.4 7 5.8V19H5v-4.5Z"/><path d="M8 8.5 6.5 6M16 8.5 17.5 6M9 14h.01M15 14h.01M12 8.7V5.5M9.5 5.5h5"/></g></symbol>
</svg>
```

Use a sprite symbol like this after the sprite is available in the page: `<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#mifa-icon-groceries" /></svg>`. For environments where inline symbols are blocked, load the standalone `icon-*.svg` files directly.

## 6. Brand elements

**Repeatable pattern:** a very light, repeating M-fold motif with a single dot, based on the brand symbol. Use `assets/mifa-pattern.svg` or the `.mifa-pattern` CSS utility; keep opacity subtle, never behind dense financial data, and never use it as a chart texture.

**Illustration style (3 sentences):** Use flat geometric scenes built from a few large rounded shapes, one clear focal action, and generous empty space. Characters are simplified and expressive through posture rather than facial detail; objects are everyday Iranian life cues such as a transit card, grocery basket, home key, or utility receipt. Use navy linework with teal as the active cue and rose only for a real warning; avoid gradients, 3D effects, coins, banknotes, and decorative Persian motifs.

**Data visualization:** use 2 px strokes, 1 px gridlines, flat fills, 6 px bar radii, and no 3D, bevels, or gradients. The primary series is Teal; comparison series use the category palette; Rose is reserved for over-budget or urgent values. Tooltips open adjacent to the selected point, stay inside the chart bounds, follow RTL alignment, show the exact value in Persian digits with “تومان”, then show the period/category on a second line; hover and keyboard focus should produce the same tooltip.

## 7. UI tokens

**Corner radii:** 6 px micro-control, 8 px compact control, 12 px input/button, 16 px card, 24 px large panel/modal, 32 px hero surface, 999 px pill. Use one radius per component family consistently.

**Shadows:** `shadow-1` for cards, `shadow-2` for menus/popovers, `shadow-3` for dialogs. Prefer borders over stronger shadows in data-heavy layouts. Teal focus ring is 3 px with 28% opacity.

**Spacing:** 4 px base scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96 px. Dashboard grid gap 16–24 px; card padding 20–24 px; mobile gutters 16 px and desktop gutters 24–32 px.

**RTL behavior:** set `dir="rtl"` at the application root; use logical CSS properties (`margin-inline`, `padding-inline`, `inset-inline-start`) instead of left/right. Keep charts' chronological axis direction consistent within the product; do not mirror numeric sequences or chart geometry just because the surrounding UI is RTL.

### Complete CSS variables
```css
/* MIFA Design Tokens — v1.0
   Load Vazirmatn + Manrope separately. All layout examples assume RTL by default.
*/
:root,
[data-theme="light"] {
  color-scheme: light;
  /* Fixed brand core */
  --mifa-teal: #08D9D6;
  --mifa-navy: #252A34;
  --mifa-rose: #FF2E63;
  --mifa-gray: #EAEAEA;

  /* Complete brand ramps: tints/shades for borders, surfaces and states */
  --teal-50: #E5FCFB; --teal-100: #C7F7F5; --teal-200: #91EFEC; --teal-300: #5DE6E2; --teal-400: #2FE0DC;
  --teal-500: #08D9D6; --teal-600: #06B9B6; --teal-700: #058E8C; --teal-800: #066B69; --teal-900: #074E4D;
  --navy-50: #F1F2F4; --navy-100: #DDE0E5; --navy-200: #BEC3CB; --navy-300: #949CA8; --navy-400: #687281;
  --navy-500: #48515E; --navy-600: #343B48; --navy-700: #252A34; --navy-800: #1C2028; --navy-900: #14171D;
  --rose-50: #FFF0F4; --rose-100: #FFD5E0; --rose-200: #FFADC2; --rose-300: #FF7D9F; --rose-400: #FF527F;
  --rose-500: #FF2E63; --rose-600: #D92352; --rose-700: #AB1C41; --rose-800: #7E1632; --rose-900: #551023;
  --gray-50: #FAFAFA; --gray-100: #F5F5F5; --gray-200: #EAEAEA; --gray-300: #D7D7D7; --gray-400: #BDBDBD;
  --gray-500: #9C9C9C; --gray-600: #797979; --gray-700: #5A5A5A; --gray-800: #3B3B3B; --gray-900: #252A34;

  /* Light surfaces */
  --bg: #EAEAEA;
  --surface: #EAEAEA;
  --surface-raised: #F5F6F6;
  --surface-overlay: #FFFFFF;
  --surface-muted: #DDE1E2;
  --text: #252A34;
  --text-muted: #68717D;
  --text-subtle: #89919B;
  --border: #D1D5D8;
  --border-strong: #AEB7BC;
  --brand: #08D9D6;
  --brand-hover: #06B9B6;
  --brand-pressed: #058E8C;
  --brand-soft: #C7F7F5;
  --brand-ink: #073F40;
  --accent: #FF2E63;
  --accent-soft: #FFD5E0;
  --on-brand: #252A34;
  --on-accent: #FFFFFF;
  --success: #238B68;
  --success-soft: #DDF4EA;
  --warning: #B97820;
  --warning-soft: #FFF0D6;
  --error: #FF2E63;
  --error-soft: #FFE0E8;
  --info: #087F86;
  --focus-ring: #08D9D6;
  --scrim: rgb(37 42 52 / 42%);

  /* Category chart palette — rose is reserved for alerts, not routine categories */
  --chart-01: #08D9D6; /* groceries */
  --chart-02: #347F89; /* transport */
  --chart-03: #6F8790; /* home */
  --chart-04: #A5B5B4; /* bills */
  --chart-05: #D3A45B; /* entertainment */
  --chart-06: #70A58F; /* health */
  --chart-07: #8C7565; /* clothing */
  --chart-08: #7896B0; /* education */
  --chart-09: #C18B97; /* gifts */
  --chart-10: #78B9A7; /* savings */

  /* Typography */
  --font-fa: "Vazirmatn", "Peyda", "IRANSansX", "Noto Sans Arabic", sans-serif;
  --font-latin: "Manrope", "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-ui: var(--font-fa);
  --font-numeric: "Manrope", "Vazirmatn", sans-serif;
  --weight-regular: 400;
  --weight-medium: 500;
  --weight-semibold: 600;
  --weight-bold: 700;
  --weight-extrabold: 800;

  /* 4px spacing scale */
  --space-0: 0;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;
  --space-24: 96px;

  /* Radius scale */
  --radius-xs: 6px;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-2xl: 32px;
  --radius-pill: 999px;

  /* Elevation */
  --shadow-1: 0 1px 2px rgb(37 42 52 / 5%);
  --shadow-2: 0 4px 14px rgb(37 42 52 / 7%);
  --shadow-3: 0 12px 32px rgb(37 42 52 / 12%);
  --shadow-focus: 0 0 0 3px rgb(8 217 214 / 28%);

  /* Data-viz */
  --chart-grid: #D1D5D8;
  --chart-axis: #68717D;
  --chart-tooltip-bg: #252A34;
  --chart-tooltip-text: #EAEAEA;
  --chart-stroke: 2px;

  /* Motion */
  --ease-standard: cubic-bezier(.2, .8, .2, 1);
  --duration-fast: 120ms;
  --duration-normal: 200ms;
  --duration-slow: 320ms;
}

[data-theme="dark"] {
  color-scheme: dark;
  --bg: #252A34;
  --surface: #2D333F;
  --surface-raised: #343B48;
  --surface-overlay: #3B4351;
  --surface-muted: #1C2028;
  --text: #EAEAEA;
  --text-muted: #BEC3CB;
  --text-subtle: #949CA8;
  --border: #48515E;
  --border-strong: #687281;
  --brand: #08D9D6;
  --brand-hover: #2FE0DC;
  --brand-pressed: #06B9B6;
  --brand-soft: #074E4D;
  --brand-ink: #C7F7F5;
  --accent: #FF2E63;
  --accent-soft: #551023;
  --on-brand: #252A34;
  --on-accent: #FFFFFF;
  --success: #55C49A;
  --success-soft: #173F35;
  --warning: #E2AD5D;
  --warning-soft: #49371E;
  --error: #FF5B83;
  --error-soft: #551023;
  --info: #5CE7E3;
  --focus-ring: #08D9D6;
  --scrim: rgb(0 0 0 / 58%);
  --chart-grid: #48515E;
  --chart-axis: #BEC3CB;
  --chart-tooltip-bg: #EAEAEA;
  --chart-tooltip-text: #252A34;
  --shadow-1: 0 1px 2px rgb(0 0 0 / 18%);
  --shadow-2: 0 4px 14px rgb(0 0 0 / 22%);
  --shadow-3: 0 12px 32px rgb(0 0 0 / 30%);
}

/* Use teal as the 10% active accent. Rose replaces part of that accent budget only for alerts. */
html { font-family: var(--font-ui); color: var(--text); background: var(--bg); }
body { margin: 0; background: var(--bg); color: var(--text); direction: rtl; }
button, input, select, textarea { font: inherit; }
.numeric, [data-numeric="true"] { font-family: var(--font-numeric); font-variant-numeric: tabular-nums lining-nums; }

/* Type scale (px / line-height px); sizes apply to Persian and Latin equivalents. */
.mifa-h1 { font-size: 36px; line-height: 44px; font-weight: 800; letter-spacing: -0.025em; }
.mifa-h2 { font-size: 28px; line-height: 36px; font-weight: 700; letter-spacing: -0.02em; }
.mifa-h3 { font-size: 22px; line-height: 30px; font-weight: 700; }
.mifa-h4 { font-size: 18px; line-height: 28px; font-weight: 600; }
.mifa-body-lg { font-size: 17px; line-height: 28px; font-weight: 400; }
.mifa-body { font-size: 15px; line-height: 26px; font-weight: 400; }
.mifa-body-sm { font-size: 14px; line-height: 22px; font-weight: 400; }
.mifa-caption { font-size: 12px; line-height: 18px; font-weight: 500; }
.mifa-display-number { font-family: var(--font-numeric); font-size: 40px; line-height: 48px; font-weight: 800; font-variant-numeric: tabular-nums; letter-spacing: -0.035em; }

.mifa-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); box-shadow: var(--shadow-1); }
.mifa-focusable:focus-visible { outline: 0; box-shadow: var(--shadow-focus); }
.mifa-pattern { background-image: url("../assets/mifa-pattern.svg"); background-repeat: repeat; }
```

## 8. Collateral specifications

### Two-sided business card
- **Trim:** 90 × 50 mm, landscape; 3 mm bleed, 4 mm safe margin, 300 dpi, CMYK conversion only at print handoff.
- **Front:** `#252A34` full bleed. Latin logo centered optically, teal symbol + `#EAEAEA` wordmark. Tagline below in Vazirmatn Medium, 8.5 pt, `#EAEAEA`; keep the composition quiet.
- **Back:** `#EAEAEA` background, navy text. Persian name/title aligned right; contact details below using Vazirmatn 8–9 pt. Teal 0.5 pt divider; QR code at left in a navy-on-gray quiet zone. Rose is not used on the card.

### X / Twitter banner
- **Canvas:** 1500 × 500 px. Background `#252A34`; use a faint MIFA pattern at 10–14% opacity over the far right third only.
- **Composition:** logo at x=112, y=115; tagline at x=112, y=220 in `#EAEAEA`, 42 px / 600; teal key phrase or short CTA at x=112, y=294. Keep the center-right open for the symbol at 260 px wide. Avoid critical content in the lower-left area where the profile avatar may overlap.

### Telegram profile image
- **Canvas:** 512 × 512 px square, designed to survive a circular crop. Use `mifa-app-icon-512.svg`: navy field `#252A34`, teal mark `#08D9D6`, minimum 15% internal padding. No wordmark or small text.

### App-store intro shot
- **Working canvas:** 1242 × 2688 px portrait (adapt to the store's current submission template at export). Background `#EAEAEA`; headline in navy, 68 px / 800, right-aligned; supporting copy in navy 30 px / 400. Show one realistic dashboard crop with a teal spending trend and one restrained rose alert. Include no more than one feature message: “پولتو بهتر ببین؛ بیشتر نگه دار.” Use 24 px card radius, subtle shadow, and generous outer margins. Keep UI figures illustrative and label them as sample data.

## 9. Do / Don’t

1. **Do** lead with calm, plain-language insight. **Don’t** shame users for spending.
2. **Do** use Teal for primary actions and active data. **Don’t** make every component teal.
3. **Do** reserve Rose for meaningful alerts. **Don’t** use it as a routine category or decoration.
4. **Do** keep Persian typography, digits, and layout genuinely RTL. **Don’t** mix font families or reverse numeric sequences.
5. **Do** use flat, legible charts and direct labels. **Don’t** use 3D charts, gradients, or color-only meaning.
6. **Do** preserve logo clear space and minimum size. **Don’t** stretch, rotate, outline, add shadows to, or recolor the mark outside approved monochrome versions.

## Package map

- `assets/` — complete logo set, favicon, app icon, pattern, standalone expense-category icons, and icon sprite.
- `css/mifa-tokens.css` — complete light/dark token system and base type utilities.
- `mifa-brand-guidelines.md` — this document, including the full logo, icon-sprite, and CSS source blocks.
