# ShopGenius 🛍️

AI-Powered E-Commerce Platform tích hợp toàn bộ MCP stack.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase (Postgres + Storage + Realtime) |
| Auth | Firebase Auth + Supabase Auth |
| Payments | Stripe (Checkout + Subscriptions) |
| AI Images | Bria AI (Remove BG + Lifestyle Shots) |
| AI Voice | ElevenLabs (TTS + STT) |
| Deploy | Netlify |

## Architecture Diagram

[View on FigJam](https://www.figma.com/board/27kbsGVE5leHg0l0SOQNlT)

## Getting Started

### 1. Clone & Install

```bash
cd shopgenius
npm install
```

### 2. Environment Variables

```bash
cp .env.example .env.local
# Fill in all values in .env.local
```

### 3. Database Setup

```bash
# Install Supabase CLI
npx supabase init
npx supabase db push
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/
│   ├── (store)/          # Public storefront
│   │   ├── page.tsx      # Homepage
│   │   ├── products/     # Product listing & detail
│   │   └── checkout/     # Checkout flow
│   ├── auth/             # Login / Register
│   ├── dashboard/        # Merchant dashboard
│   └── api/              # API routes
│       ├── products/     # Product CRUD
│       ├── ai/           # Bria AI + ElevenLabs
│       └── stripe/       # Payment + Webhooks
├── components/
│   ├── home/             # Hero, Featured, Categories
│   ├── product/          # Card, Gallery, Info, Audio
│   ├── search/           # Voice Search Bar
│   ├── checkout/         # Form + Order Summary
│   ├── dashboard/        # Sidebar, Header, ProductForm
│   └── layout/           # Navbar, Footer
├── lib/
│   ├── supabase/         # Client + Server + Admin
│   ├── firebase/         # Client + Admin
│   ├── stripe/           # Client
│   ├── bria/             # Image processing
│   ├── elevenlabs/       # TTS + STT
│   └── utils.ts          # Helpers
├── store/
│   └── cart.ts           # Zustand cart store
└── types/
    ├── database.ts       # Supabase generated types
    └── index.ts          # App types
```

## Key Features

### 🎙️ Voice Search (ElevenLabs STT)
- Click mic button → speak → auto-search
- Powered by ElevenLabs Scribe v1

### 🖼️ AI Image Processing (Bria AI)
- Upload raw product photo
- Auto remove background
- Generate lifestyle shots with custom prompt

### 🔊 Audio Descriptions (ElevenLabs TTS)
- Product descriptions converted to audio
- Accessible audio player on product pages

### ⚡ Real-time Stock (Supabase Realtime)
- Live stock updates across all clients

### 💳 Payments (Stripe)
- One-time checkout with Stripe Elements
- Merchant SaaS subscriptions
- Automatic invoice generation
- Webhook-driven order status updates

## Deployment (Netlify)

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login & deploy
netlify login
netlify init
netlify deploy --prod
```

## Environment Variables Required

See `.env.example` for all required variables.
