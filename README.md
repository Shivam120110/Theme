# Saanjh — Shopify 2.0 Fine Jewelry Theme

A bespoke Shopify Online Store 2.0 theme for **Saanjh**, a fine jewelry brand built on quiet luxury, ritual, and everyday adornment.

---

## Design Philosophy

> "A private viewing room: generous white space, unhurried pacing, product photography treated as gallery work."

- **No urgency tactics** — no countdown timers, no aggressive pop-ups
- **Trust-first** — certification badges, return policy, and editorial copy near the price
- **Discovery-led** — icon-driven navigation, curated editorial sections

---

## Tech Stack

| Layer | Choice |
|---|---|
| Platform | Shopify Online Store 2.0 |
| Templating | Liquid + JSON Templates |
| Styling | CSS Custom Properties (design tokens) |
| JavaScript | Vanilla ES6+, no framework |
| Fonts | Cormorant Garamond (display) + Poppins (UI) via Google Fonts |
| Icons | Stroke-based SVG snippets (1.5px weight) |

---

## File Structure

```
Theme/
├── .theme-check.yml
├── config/
│   └── settings_schema.json
├── layout/
│   └── theme.liquid
├── templates/
│   ├── index.json          ← Homepage
│   ├── collection.json     ← Collection pages
│   ├── product.json        ← Product detail pages
│   ├── page.json           ← Generic pages
│   ├── cart.json           ← Cart
│   └── 404.json            ← 404 page
├── sections/
│   ├── header.liquid
│   ├── announcement-bar.liquid
│   ├── hero-editorial.liquid
│   ├── shop-by-category.liquid
│   ├── editors-picks.liquid
│   ├── collection-grid.liquid
│   ├── collection-filters.liquid
│   ├── product-media.liquid
│   ├── product-info.liquid
│   └── footer.liquid
├── snippets/
│   ├── icon-all-jewellery.liquid
│   ├── icon-earrings.liquid
│   ├── icon-pendants.liquid
│   ├── icon-daily-wear.liquid
│   ├── icon-gifting.liquid
│   ├── icon-social.liquid
│   └── product-card.liquid
└── assets/
    ├── theme.css
    ├── header.css
    ├── collection.css
    ├── product.css
    ├── header.js
    ├── collection.js
    └── product.js
```

---

## Setup Instructions

### 1. Prerequisites

Install the [Shopify CLI](https://shopify.dev/docs/themes/tools/cli):

```bash
npm install -g @shopify/cli @shopify/theme
```

### 2. Clone / Download

```bash
# If using GitHub
git clone https://github.com/your-org/saanjh-theme.git
cd saanjh-theme
```

### 3. Connect to Your Store

```bash
shopify theme dev --store=your-store.myshopify.com
```

This opens a live preview in your browser with hot-reloading.

### 4. Configure Navigation

In Shopify Admin → **Online Store → Navigation**:

1. Create a menu called **`Main Menu`** (handle: `main-menu`)
2. Add these 5 items in order:
   - All Jewellery → `/collections/all`
   - Earrings → `/collections/earrings`
   - Pendants → `/collections/pendants`
   - Daily Wear → `/collections/daily-wear`
   - Gifting → `/collections/gifting`

> **Important:** The icon mapping in `header.liquid` matches on the exact link title. Use the exact names above for icons to appear correctly.

### 5. Configure Footer Navigation

Create two additional menus:
- **Footer Main** (handle: `footer-main`) — About, Collections, Care Guide, Stockists
- **Footer Legal** (handle: `footer-legal`) — Privacy Policy, Terms, Shipping Policy

### 6. Customize Theme Settings

Go to **Online Store → Themes → Customize**:

- **Colors** — All brand colors can be adjusted here (changes propagate via CSS custom properties)
- **Typography** — Font weights and size scale
- **Announcement Bar** — Enable/disable, set message
- **Social Links** — Instagram, Pinterest, etc.

### 7. Product Metafields (Optional but Recommended)

For the product page's **Styling Notes** and **360° spin**, add these metafields in Shopify Admin → Settings → Custom data → Products:

| Namespace | Key | Type | Purpose |
|---|---|---|---|
| `custom` | `styling_notes` | Multi-line text | Editorial "how to wear" copy |
| `custom` | `spin_embed_url` | URL | 360° spin embed URL (Sirv, etc.) |

### 8. Push to Production

```bash
shopify theme push --store=your-store.myshopify.com
```

---

## Design Tokens

All brand values live in `assets/theme.css` and are overridable from `layout/theme.liquid`:

```css
--color-bg: #F7F4EF;        /* Warm ivory — page background */
--color-ink: #1C1B1A;       /* Deep charcoal — body text */
--color-accent: #B08A5A;    /* Antique gold — hover states, dividers */
--color-surface: #EFEBE3;   /* Warm off-white — card backgrounds */
--color-muted: #8A8680;     /* Warm grey — secondary text, prices */
--color-cta: #8B2635;       /* Deep burgundy — active nav, CTA buttons */
--font-display: 'Cormorant Garamond', Georgia, serif;
--font-body: 'Poppins', system-ui, sans-serif;
```

---

## Theme Check

Run Shopify's linter before pushing:

```bash
shopify theme check
```

Zero errors and warnings expected on a clean build.

---

## Reference Brands Studied

| Brand | Lesson Applied |
|---|---|
| Tiffany & Co. | Single accent color as anchor, extreme white space generosity |
| Cartier | Narrative homepage, restrained micro-interactions |
| Mejuri | Brand-voiced filtering, trust-building near price |
| Aurate | Product videos that show scale, editorial product copy |

---

## Brand Voice Notes

- Copy tone: **intimate, unhurried, precise** — never shouty
- Headings: Cormorant at large sizes (3rem+), low weight (300–400)
- UI labels: Poppins at 0.75rem–0.875rem, tracked small-caps where appropriate
- No exclamation marks in UI copy. No "SALE!" or "LIMITED TIME!"

---

*Saanjh — Fine Jewelry Theme · Built for Shopify Online Store 2.0*
