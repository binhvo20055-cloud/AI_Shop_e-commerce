# ShopGenius 🛍️✨

> **AI-Powered E-Commerce Platform** — Nền tảng thương mại điện tử thông minh tích hợp toàn bộ AI stack

[![Deploy Status](https://api.netlify.com/api/v1/badges/8a73fe18-a624-4f7f-9c34-ee99e67ff4b0/deploy-status)](https://app.netlify.com/projects/shopgenius-ai/deploys)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-green?logo=supabase)](https://supabase.com)
[![Firebase](https://img.shields.io/badge/Firebase-Auth-orange?logo=firebase)](https://firebase.google.com)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-purple?logo=stripe)](https://stripe.com)

---

## 🌐 Live Demo

| Link | Mô tả |
|------|-------|
| 🚀 **[shopgenius-ai.netlify.app](https://shopgenius-ai.netlify.app)** | Production deployment |
| 📦 **[GitHub Repo](https://github.com/binhvo20055-cloud/AI_Shop_e-commerce)** | Source code |
| 🗄️ **[Supabase Dashboard](https://supabase.com/dashboard/project/nxwmgmuxmhfzsreqohrm)** | Database & Storage |
| 🔥 **[Firebase Console](https://console.firebase.google.com/project/shopgenius-ecommerce-2026)** | Auth & Firestore |
| 🎨 **[Architecture Diagram (FigJam)](https://www.figma.com/board/27kbsGVE5leHg0l0SOQNlT)** | System architecture |

---

## 🏗️ Tech Stack & MCP Integrations

ShopGenius được xây dựng bằng cách tích hợp **10 MCP Powers** của Kiro:

| MCP Power | Service | Vai trò | Link |
|-----------|---------|---------|------|
| 🎨 **Figma** | Figma | Architecture diagram, UI design | [figma.com](https://figma.com) |
| 📋 **Miro** | Miro | System architecture whiteboard | [miro.com](https://miro.com) |
| 🔥 **Firebase** | Google Firebase | Auth (Google/Email), Firestore notifications | [firebase.google.com](https://firebase.google.com) |
| 🗄️ **Supabase** | Supabase | Postgres DB, Storage, Realtime subscriptions | [supabase.com](https://supabase.com) |
| 💳 **Stripe** | Stripe | Checkout Sessions, Subscriptions, Billing Portal | [stripe.com](https://stripe.com) |
| 🖼️ **Bria AI** | Bria AI | Remove background, Lifestyle shots, Upscale | [bria.ai](https://bria.ai) |
| 🎙️ **ElevenLabs** | ElevenLabs | TTS audio descriptions, STT voice search | [elevenlabs.io](https://elevenlabs.io) |
| 🧪 **Postman** | Postman | API testing collections | [postman.com](https://postman.com) |
| 🚀 **Netlify** | Netlify | CI/CD deployment, CDN hosting | [netlify.com](https://netlify.com) |

---

## ✨ Tính năng chính

### 🛒 Storefront
- **Homepage** với Hero section, Featured products, Category grid
- **Product listing** với filter (category, price range), sort, pagination
- **Product detail** với image gallery, audio description player, reviews
- **Voice Search** — nói để tìm kiếm sản phẩm (ElevenLabs Scribe realtime)
- **Shopping cart** với persistent state (Zustand + localStorage)
- **Checkout** → Stripe hosted checkout (PCI compliant)
- **Order tracking** với progress tracker (pending → confirmed → shipped → delivered)

### 🤖 AI Features
- **Bria AI Image Pipeline**: Upload ảnh thô → xóa nền → tạo lifestyle shot tự động
- **ElevenLabs TTS**: Mô tả sản phẩm được chuyển thành audio (eleven_flash_v2_5, ~75ms latency)
- **ElevenLabs STT Realtime**: Voice search với live transcript (Scribe v2 realtime)
- **On-demand TTS**: Audio player tự generate nếu chưa có pre-generated audio

### 🏪 Merchant Dashboard
- **Product management**: CRUD, toggle active/draft, AI processing status
- **Order management**: Update status, view details
- **Analytics**: KPI cards, revenue, order breakdown (Supabase RPC)
- **Billing**: Plan upgrade (Starter/Pro/Enterprise), Customer Portal, Invoice history

### 🔐 Auth & Security
- **Firebase Auth**: Google OAuth + Email/Password
- **Supabase RLS**: Row Level Security trên tất cả tables
- **Middleware**: Route protection cho dashboard
- **Webhook verification**: Stripe signature validation

### ⚡ Realtime
- **Stock updates**: Supabase Realtime subscriptions
- **Notifications**: Firebase Firestore realtime (order updates, low stock alerts)

---

## 📁 Project Structure

```
shopgenius/
├── src/
│   ├── app/
│   │   ├── (store)/              # Public storefront
│   │   │   ├── page.tsx          # Homepage
│   │   │   ├── products/         # Product listing & detail
│   │   │   ├── search/           # Search results
│   │   │   ├── cart/             # Shopping cart
│   │   │   ├── checkout/         # Stripe checkout + success
│   │   │   └── orders/           # Order history & detail
│   │   ├── auth/                 # Login / Register
│   │   ├── dashboard/            # Merchant dashboard
│   │   │   ├── page.tsx          # Overview
│   │   │   ├── products/         # Product management
│   │   │   ├── orders/           # Order management
│   │   │   ├── analytics/        # Analytics & stats
│   │   │   ├── billing/          # Stripe billing
│   │   │   └── onboarding/       # New merchant setup
│   │   └── api/
│   │       ├── ai/               # Bria AI + ElevenLabs endpoints
│   │       ├── auth/             # Firebase token sync
│   │       ├── merchants/        # Merchant registration
│   │       ├── orders/           # Order CRUD
│   │       ├── products/         # Product CRUD
│   │       ├── reviews/          # Product reviews
│   │       ├── search/           # Full-text search
│   │       └── stripe/           # Checkout, webhook, portal
│   ├── components/
│   │   ├── checkout/             # ShippingForm, OrderSummary, SuccessContent
│   │   ├── dashboard/            # Tables, forms, billing buttons
│   │   ├── home/                 # Hero, FeaturedProducts, CategoryGrid
│   │   ├── layout/               # Navbar, Footer, NotificationBell
│   │   ├── orders/               # OrderCard
│   │   ├── product/              # Card, Gallery, Info, AudioPlayer, Reviews
│   │   ├── search/               # VoiceSearchBar
│   │   └── ui/                   # Pagination
│   ├── hooks/
│   │   ├── useAuth.ts            # Firebase Auth hook
│   │   ├── useNotifications.ts   # Firestore realtime notifications
│   │   └── useRealtimeStock.ts   # Supabase Realtime stock
│   ├── lib/
│   │   ├── bria/                 # Bria AI client (remove BG, lifestyle, upscale)
│   │   ├── elevenlabs/           # ElevenLabs client (TTS stream, STT)
│   │   ├── firebase/             # Firebase client + admin
│   │   ├── stripe/               # Stripe server + client
│   │   ├── supabase/             # Supabase browser + server + admin
│   │   └── utils.ts              # formatPrice, formatDate, slugify...
│   ├── providers/
│   │   └── AuthProvider.tsx      # Firebase Auth context
│   ├── store/
│   │   └── cart.ts               # Zustand cart store (persisted)
│   └── types/
│       ├── database.ts           # Supabase generated types + RPC types
│       └── index.ts              # App-level types
├── supabase/
│   └── migrations/               # 5 migration files
├── docs/
│   ├── ai-setup.md               # Bria AI + ElevenLabs setup guide
│   └── stripe-setup.md           # Stripe setup guide
├── netlify.toml                  # Netlify build config
├── firebase.json                 # Firebase config
├── firestore.rules               # Firestore security rules
└── firestore.indexes.json        # Firestore indexes
```

---

## 🗄️ Database Schema (Supabase)

```
profiles          — User profiles (synced from Firebase Auth)
merchants         — Merchant stores (Stripe customer/subscription)
categories        — Product categories (hierarchical)
products          — Products (with AI-processed images + audio)
orders            — Orders (Stripe payment intent linked)
reviews           — Product reviews (verified purchase check)
```

**Storage Buckets:**
- `product-images` — Raw + processed product images (10MB limit)
- `product-audio` — ElevenLabs TTS audio files (5MB limit)
- `merchant-logos` — Merchant store logos (2MB limit)

**RPC Functions:**
- `decrement_stock(product_id, quantity)` — Atomic stock decrement
- `search_products(query, filters...)` — Full-text search with ranking
- `get_merchant_stats(merchant_id)` — Aggregated dashboard stats

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- npm 10+
- Git

### 1. Clone & Install

```bash
git clone https://github.com/binhvo20055-cloud/AI_Shop_e-commerce.git
cd AI_Shop_e-commerce/shopgenius
npm install
```

### 2. Environment Variables

```bash
cp .env.example .env.local
```

Điền các giá trị vào `.env.local`:

```env
# ── Supabase (đã có sẵn) ──────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://nxwmgmuxmhfzsreqohrm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=          # Supabase Dashboard → Settings → API

# ── Firebase (đã có sẵn) ─────────────────────────────────────
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAolS5GkuMrHCrlGm7AsdyYeZW_42ft7BQ
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=shopgenius-ecommerce-2026.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=shopgenius-ecommerce-2026
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=shopgenius-ecommerce-2026.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=266358600636
NEXT_PUBLIC_FIREBASE_APP_ID=1:266358600636:web:05b13c78498364a51cf1b9
FIREBASE_ADMIN_PRIVATE_KEY=         # Firebase Console → Service Accounts → Generate key
FIREBASE_ADMIN_CLIENT_EMAIL=        # Firebase Console → Service Accounts

# ── Stripe ───────────────────────────────────────────────────
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY= # Stripe Dashboard → Developers → API Keys
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=              # stripe listen --forward-to localhost:3000/api/stripe/webhook
STRIPE_PRO_PRICE_ID=                # Stripe Dashboard → Products → Create price

# ── Bria AI ──────────────────────────────────────────────────
BRIA_API_TOKEN=                     # platform.bria.ai → API Keys

# ── ElevenLabs ───────────────────────────────────────────────
ELEVENLABS_API_KEY=                 # elevenlabs.io → Profile → API Keys
NEXT_PUBLIC_ELEVENLABS_VOICE_ID=JBFqnCBsd6RMkjVDRZzb  # George voice

# ── App ──────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Run Development Server

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000)

### 4. Stripe Webhook (local)

```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
# Copy webhook secret → STRIPE_WEBHOOK_SECRET
```

---

## 🌍 Deployment (Netlify)

### Tự động (CI/CD qua GitHub)

1. Vào [Netlify Dashboard](https://app.netlify.com/projects/shopgenius-ai)
2. **Site configuration → Build & deploy → Link repository**
3. Chọn `binhvo20055-cloud/AI_Shop_e-commerce`
4. Base directory: `shopgenius`
5. Build command: `npm run build`
6. Publish directory: `.next`

### Thủ công (CLI)

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Link site
netlify link --id 8a73fe18-a624-4f7f-9c34-ee99e67ff4b0

# Deploy production
netlify deploy --prod --build
```

### Environment Variables trên Netlify

Vào **Site settings → Environment variables** và thêm tất cả keys từ `.env.local`.

Hoặc dùng CLI:

```bash
netlify env:set SUPABASE_SERVICE_ROLE_KEY "your-key"
netlify env:set STRIPE_SECRET_KEY "sk_live_..."
netlify env:set BRIA_API_TOKEN "your-token"
netlify env:set ELEVENLABS_API_KEY "your-key"
netlify env:set FIREBASE_ADMIN_PRIVATE_KEY "-----BEGIN PRIVATE KEY-----\n..."
netlify env:set FIREBASE_ADMIN_CLIENT_EMAIL "firebase-adminsdk@..."
```

Sau khi set env vars → **Trigger redeploy**:

```bash
netlify deploy --prod --build
```

---

## 🔌 API Reference

### AI Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `POST` | `/api/ai/process-image` | Bria AI pipeline: remove BG + lifestyle shot + TTS |
| `POST` | `/api/ai/text-to-speech` | ElevenLabs TTS streaming (eleven_flash_v2_5) |
| `POST` | `/api/ai/speech-to-text` | ElevenLabs Scribe v1 file transcription |
| `GET`  | `/api/ai/scribe-token` | Mint single-use Scribe token cho browser STT |

### Product Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET`  | `/api/products` | List products (paginated, filterable) |
| `POST` | `/api/products` | Create product |
| `GET`  | `/api/products/[id]` | Get product by ID |
| `PATCH`| `/api/products/[id]` | Update product (owner only) |
| `DELETE`| `/api/products/[id]` | Delete product (owner only) |
| `GET`  | `/api/search` | Full-text search with filters |

### Order Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET`  | `/api/orders` | List user's orders |
| `POST` | `/api/orders` | Create order |
| `GET`  | `/api/orders/[id]` | Get order detail |
| `PATCH`| `/api/orders/[id]` | Update order status (merchant only) |

### Stripe Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `POST` | `/api/stripe/checkout` | Create Checkout Session (one-time payment) |
| `POST` | `/api/stripe/subscription` | Create subscription Checkout Session |
| `DELETE`| `/api/stripe/subscription` | Cancel subscription at period end |
| `POST` | `/api/stripe/portal` | Create Customer Portal session |
| `GET`  | `/api/stripe/session` | Get session details (for success page) |
| `POST` | `/api/stripe/webhook` | Stripe webhook handler |

### Auth Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `POST` | `/api/auth/sync` | Sync Firebase user → Supabase profile |
| `POST` | `/api/merchants` | Register as merchant |
| `POST` | `/api/reviews` | Create product review |
| `POST` | `/api/notifications` | Send notification (internal) |

---

## 🧪 Testing

### Stripe Test Cards

| Card Number | Result |
|-------------|--------|
| `4242 4242 4242 4242` | ✅ Payment success |
| `4000 0000 0000 0002` | ❌ Card declined |
| `4000 0025 0000 3155` | 🔐 3D Secure required |
| `4000 0000 0000 9995` | 💸 Insufficient funds |

Expiry: any future date | CVC: any 3 digits | ZIP: any 5 digits

### Postman Collection

Import file `docs/shopgenius.postman_collection.json` (coming soon) để test tất cả API endpoints.

---

## 📊 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client (Next.js + Netlify)                │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │ UI Pages │  │ Voice Search │  │   Audio Player        │  │
│  │          │  │ (ElevenLabs  │  │   (ElevenLabs TTS)    │  │
│  │          │  │  STT Scribe) │  │                       │  │
│  └────┬─────┘  └──────┬───────┘  └───────────────────────┘  │
└───────┼───────────────┼─────────────────────────────────────┘
        │               │
        ▼               ▼
┌───────────────┐  ┌──────────────────────────────────────────┐
│ Firebase Auth │  │              Supabase                    │
│ (Google/Email)│  │  ┌──────────┐ ┌─────────┐ ┌──────────┐  │
│               │  │  │ Postgres │ │ Storage │ │Realtime  │  │
│ Firestore     │  │  │ (6 tables│ │(images, │ │(stock    │  │
│ (notifications│  │  │  + RLS)  │ │ audio)  │ │ updates) │  │
│  realtime)    │  │  └──────────┘ └─────────┘ └──────────┘  │
└───────────────┘  └──────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────┐
│                      AI Services                          │
│  ┌─────────────────────┐  ┌──────────────────────────┐   │
│  │      Bria AI        │  │       ElevenLabs         │   │
│  │  • Remove BG        │  │  • TTS (flash_v2_5)      │   │
│  │  • Lifestyle shots  │  │  • STT (Scribe v1/v2)    │   │
│  │  • Upscale 2x/4x    │  │  • Realtime transcription│   │
│  └─────────────────────┘  └──────────────────────────┘   │
└───────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────┐
│                    Stripe Payments                        │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │   Checkout   │  │ Subscriptions│  │ Customer Portal│  │
│  │  Sessions    │  │  (Billing)   │  │  (self-serve)  │  │
│  └──────────────┘  └──────────────┘  └────────────────┘  │
└───────────────────────────────────────────────────────────┘
```

---

## 🗓️ Development Timeline

| Week | Focus | Status |
|------|-------|--------|
| Week 1 | Next.js scaffold, project structure, all MCP integrations | ✅ Done |
| Week 2 | Supabase schema + Firebase Auth (real projects created) | ✅ Done |
| Week 3 | Core product/order features, search, realtime stock | ✅ Done |
| Week 4 | Stripe Checkout Sessions + Billing subscriptions | ✅ Done |
| Week 5 | Bria AI image pipeline + ElevenLabs TTS/STT | ✅ Done |
| Week 6 | Postman tests + Netlify deploy | ✅ Done |

---

## 🔗 Useful Links

### MCP Powers Documentation
- [Figma MCP](https://www.figma.com/developers/mcp) — Design to code
- [Firebase MCP](https://firebase.google.com/docs/ai-assistance/mcp-server) — Firebase CLI integration
- [Supabase MCP](https://supabase.com/docs/guides/getting-started/mcp) — Database management
- [Stripe MCP](https://stripe.com/docs/stripe-cli/mcp) — Payment integration
- [Bria AI API](https://docs.bria.ai) — Image generation & editing
- [ElevenLabs API](https://elevenlabs.io/docs) — Voice AI
- [Netlify CLI](https://docs.netlify.com/cli/get-started/) — Deployment

### Project Resources
- [Supabase Project](https://supabase.com/dashboard/project/nxwmgmuxmhfzsreqohrm) — `nxwmgmuxmhfzsreqohrm`
- [Firebase Project](https://console.firebase.google.com/project/shopgenius-ecommerce-2026) — `shopgenius-ecommerce-2026`
- [Netlify Site](https://app.netlify.com/projects/shopgenius-ai) — `shopgenius-ai`
- [Architecture Diagram](https://www.figma.com/board/27kbsGVE5leHg0l0SOQNlT) — FigJam

---

## 📄 License

MIT © 2026 ShopGenius

---

<div align="center">
  <p>Built with ❤️ using <strong>Kiro AI</strong> + 10 MCP Powers</p>
  <p>
    <a href="https://shopgenius-ai.netlify.app">🌐 Live Demo</a> ·
    <a href="https://github.com/binhvo20055-cloud/AI_Shop_e-commerce">📦 GitHub</a> ·
    <a href="https://www.figma.com/board/27kbsGVE5leHg0l0SOQNlT">🎨 Architecture</a>
  </p>
</div>
