# NovaPOS — Vue 3 Point of Sale System

A premium, commercially-styled **frontend** for a retail POS product, built as a clean multi-file
Vue 3 application that is ready to grow into a production SaaS.

## Tech stack

- **Vue 3** (Composition API, `<script setup>` SFCs — JavaScript only)
- **Vue Router 4** · **Pinia** · **Vue I18n** (English 🇬🇧 / Khmer 🇰🇭)
- **Tailwind CSS v4** (`@tailwindcss/vite`) with a single indigo brand scale
- **xlsx**, **jspdf + jspdf-autotable** (Excel / CSV / PDF exports & imports)
- **qrcode** (real scannable KHQR payment codes) · **jsbarcode** (receipt barcode)
- **Vite** build tooling

## Getting started

```bash
npm install      # REQUIRED — installs vue, pinia, i18n, xlsx, jspdf, qrcode, jsbarcode…
npm run dev      # http://localhost:5173
npm run build    # outputs to dist/
npm run preview  # preview the production build
```

### ⚡ Instant preview (no install)

Open **`preview.html`** directly in your browser — it is a self-contained UX/UI demo
(login, dashboard, POS, products with pagination, orders, discounts, theme + currency).
Nothing to install, nothing to build.

### ⚠️ Blank page / "I can't see the website"

This is a **Vite project, not a static HTML page**. `index.html` only contains
`<div id="app">` plus `<script type="module" src="/src/main.js">`, so it cannot run by itself.

| Symptom | Cause | Fix |
| --- | --- | --- |
| Blank white page | Opened `index.html` directly (`file://`) or served the folder statically | Run `npm install` then `npm run dev` |
| `Failed to resolve module specifier "vue"` | Dependencies not installed / not bundled | `npm install` |
| No styling at all | Tailwind is compiled by the Vite plugin at build time | Use the dev server or `npm run build` |
| 404 on refresh at `/pos`, `/discounts`… | SPA uses HTML5 history mode | Host needs an SPA fallback — `public/_redirects` and `vercel.json` are included |

Always open the URL printed by `npm run dev` (default **http://localhost:5173**).

Demo logins: `admin@novapos.io`, `manager@novapos.io`, `cashier@novapos.io` — any password 4+ chars.
Registration, forgot-password and 6-digit OTP verification flows are all functional (mocked).

## Highlights

### Experience
- Collapsible sidebar with **grouped dropdown navigation**, smooth 300 ms open/close, active pill +
  indicator bar, cart badge, mobile drawer.
- Page headers with a **clean bottom border**, icon chip, subtitle and action slot.
- **Animated metric counters**, animated line/bar/donut charts with hover tooltips, page and list
  transitions, toast stack.
- **Dark / light mode** (visual theme picker) and **full i18n** via `vue-i18n` with Khmer font support.

### Data tables (`components/ui/DataTable.vue`)
- Row **multi-select + delete all**, sortable columns, sticky header
- **Table ⇄ Card view toggle** with consistent card metrics (min-height, equal grid)
- **Fullscreen mode**, toolbar/filter slot, per-cell slots, empty states

### POS terminal
`Select product → cart → qty / item & order discount → tax → checkout → payment → success → receipt → new sale`
- Payment modal with method rail, numeric keypad, quick-tender, live change
- **Real KHQR QR code** generated from an EMV-style payload (scannable)
- **Professional receipt**: logo, itemised table, totals, **Code128 barcode** + verification QR,
  print stylesheet and text download

### Exports (Excel `.xlsx` / CSV / PDF) — all via a reusable `ExportMenu` dropdown
| Area | Formats |
| --- | --- |
| Sales (dashboard) | Excel · CSV · PDF + quick date filter |
| Orders list / Order invoice | Excel · CSV · PDF / per-order PDF invoice |
| Products | Excel · CSV + **Import** from Excel/CSV |
| Inventory, Stock In, Stock Out, Low stock | Excel · CSV · PDF |
| Customers / Purchase history | Excel · CSV / PDF · Excel |
| Suppliers / Purchase history | Excel · CSV / PDF · Excel |
| Expenses | Excel · CSV · PDF |
| Reports (Sales, Profit, Product, Inventory, Customer, Expense) | Excel · CSV · PDF |

### Quick date dropdown (`DateRangeDropdown`)
Today · Yesterday — This/Last Week · This/Last Month — This/Last Quarter — This/Last Year —
Week/Month/Year to date — Last 7 / 14 / 30 / 60 / 90 days — **Custom range**
Used on Dashboard, Orders, Expenses and Reports.

## Structure

```
src/
├── assets/styles/main.css      Design tokens, component classes, animations, print CSS
├── i18n/                       index.js + locales/en.js, km.js
├── utils/                      helpers.js · icons.js · dateRanges.js · export.js
├── data/                       Mock datasets
├── stores/                     auth · cart · products · orders · inventory · customers ·
│                               suppliers · expenses · users · settings · ui
├── router/index.js
├── components/
│   ├── layout/   Sidebar · SidebarNav · MobileSidebar · Navbar · PageHeader · navigation.js
│   ├── ui/       Button · Input · Select · Modal · Badge · StatCard · DataTable · Dropdown ·
│   │             DropdownItem · ExportMenu · DateRangeDropdown · AnimatedNumber · QrCode ·
│   │             Barcode · Icon · ToastHost
│   ├── charts/   LineChart · BarChart · DonutChart
│   ├── pos/      SearchProduct · CategoryTabs · ProductGrid · ProductCard · Cart · CartItem ·
│   │             OrderSummary · CheckoutModal · PaymentModal · PaymentSuccessModal · ReceiptModal
│   └── products/ ProductForm · ProductTable · ProductFilters
├── views/        Login · Dashboard · POS · Products · ProductCreate · ProductEdit · Categories ·
│                 Inventory · StockIn · StockOut · Orders · Customers · Suppliers · Purchases ·
│                 Expenses · Reports · Users · Settings
├── App.vue
└── main.js
```

All state is mock data in Pinia — swapping the `data/` imports for API calls inside store actions is
the only change needed to connect a backend.
