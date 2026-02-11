# EZCTO — Your Automated Meme CTO

> One-click AI-powered brand identity, visual assets, and website generation for Meme coin projects.

**EZCTO** is a full-stack SaaS platform that automates the entire "CTO" (Community Takeover) workflow for Meme token projects. Instead of hiring designers, developers, and brand strategists, project founders provide a name, description, and optional reference images — EZCTO's AI pipeline handles everything else: brand strategy analysis, multi-image asset generation, and a fully deployed landing page with custom subdomain.

---

## Core Features

### AI-Powered Launch Pipeline

The platform's flagship feature is a three-module generation pipeline orchestrated by **Claude Opus 4-6** and **Nanobanana** image generation:

| Module | What It Does | Output |
|--------|-------------|--------|
| **ANALYSIS** | Claude analyzes the project's name, description, and uploaded images to produce a comprehensive brand strategy — including personality, color scheme, aesthetic tone, tagline, and a detailed image generation plan (6–10 assets). | Brand strategy JSON + image plan |
| **IMAGES** | Nanobanana generates all planned visual assets in parallel (logo, banners, hero backgrounds, posters, community scenes, feature icons, etc.), with automatic background removal via Sharp. | 6–10 high-quality images uploaded to S3 |
| **WEBSITE** | Claude generates the HTML body using a pre-built CSS framework optimized for Meme coin aesthetics. The server assembles the complete page and deploys it to a custom subdomain on Cloudflare R2. | Live website at `{project-slug}.ezcto.fun` |

The pipeline supports **resumable generation** — if any module fails, it can be retried from the exact point of failure without re-running previous steps. A dedicated **Regenerate Website** button allows users to re-generate only the website portion while reusing existing images, saving significant API token costs.

### Multi-Chain Crypto Payments

EZCTO accepts payments in cryptocurrency across multiple blockchain networks, eliminating the need for traditional payment processors in the Web3 ecosystem.

| Chain | Token | Standard |
|-------|-------|----------|
| BNB Smart Chain (BSC) | USDT | BEP-20 |
| Solana | USDC | SPL Token |
| Ethereum | USDT | ERC-20 |
| Polygon | USDT | ERC-20 |

The payment system includes a **token-gated discount mechanism**: holders of a specific BSC token (configurable) who maintain a minimum balance receive a 30% discount on the base price of $199. Payment verification runs on-chain with automatic confirmation polling.

### Wallet-Based Authentication

Users authenticate exclusively through Web3 wallets using the **Sign-In with Ethereum (SIWE)** standard. The platform supports both EVM-compatible wallets (via RainbowKit + wagmi) and Solana wallets (via Solana Wallet Adapter). No email or password is required — wallet signature verification serves as the sole identity layer.

### Admin Dashboard

Administrators have access to a management panel with capabilities including project oversight, user management, whitelist control for early access, free trial period configuration, site-wide settings, and generation history monitoring.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Client (React 19)                │
│  Tailwind 4 · shadcn/ui · RainbowKit · Solana WA   │
│  wouter routing · tRPC React Query hooks            │
└──────────────────────┬──────────────────────────────┘
                       │ tRPC (superjson)
┌──────────────────────▼──────────────────────────────┐
│                 Server (Express 4)                   │
│  tRPC 11 procedures · JWT sessions · SIWE auth      │
│  Claude Opus 4-6 · Nanobanana · Sharp · Stripe      │
└──────┬───────────┬───────────┬──────────────────────┘
       │           │           │
  ┌────▼────┐ ┌────▼────┐ ┌───▼──────┐
  │ MySQL   │ │ S3/R2   │ │ Cloudflare│
  │ (TiDB)  │ │ Storage │ │ Pages     │
  └─────────┘ └─────────┘ └──────────┘
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Tailwind CSS 4, shadcn/ui, wouter, TanStack React Query |
| **Backend** | Express 4, tRPC 11, Drizzle ORM, superjson |
| **Database** | MySQL (TiDB compatible), 11 tables with Drizzle migrations |
| **AI Services** | Claude Opus 4-6 (analysis + website generation), Nanobanana (image generation) |
| **Web3** | ethers.js, viem, wagmi, RainbowKit, SIWE, Solana Web3.js, Solana Wallet Adapter |
| **Storage** | Cloudflare R2 (S3-compatible) for images and deployed websites |
| **Payments** | On-chain crypto payments (BSC/ETH/Polygon/Solana), Stripe (optional) |
| **Deployment** | Cloudflare R2 static hosting with custom subdomains |

### Database Schema

The application manages 11 database tables covering the full lifecycle of a Meme project:

| Table | Purpose |
|-------|---------|
| `users` | Wallet-authenticated users with role-based access (admin/user) |
| `projects` | Meme projects with brand strategy, status tracking, and subdomain assignment |
| `assets` | Generated visual assets (logo, banners, posters, etc.) linked to projects |
| `orders` | Payment orders tracking pricing, discounts, and completion status |
| `payments` | Stripe payment records (legacy) |
| `generationHistory` | Detailed logs of each generation step for debugging and analytics |
| `subscriptions` | Subscription tier management |
| `customOrders` | Custom design request orders |
| `cryptoPayments` | On-chain payment records with transaction hashes and confirmation status |
| `whitelist` | Early access whitelist with wallet addresses |
| `siteSettings` | Global platform configuration (free trial periods, feature flags) |

---

## Project Structure

```
ezcto/
├── client/
│   ├── src/
│   │   ├── pages/              # Page components
│   │   │   ├── Home.tsx        # Landing page
│   │   │   ├── Dashboard.tsx   # User project dashboard
│   │   │   ├── LaunchV2.tsx    # Project creation wizard
│   │   │   ├── LaunchV2Preview.tsx  # Real-time generation progress
│   │   │   ├── ProjectDetails.tsx   # Project management & assets
│   │   │   └── Admin*.tsx      # Admin management pages
│   │   ├── components/         # Reusable UI (shadcn/ui + custom)
│   │   ├── hooks/              # useWeb3, useWalletAuth, useDiscountCheck
│   │   └── contexts/           # Auth, Web3, Theme providers
│   └── public/                 # Static assets
├── server/
│   ├── _core/                  # Framework plumbing (OAuth, LLM, image gen)
│   │   ├── claude.ts           # Claude Opus integration & prompt system
│   │   ├── meme-css-framework.ts  # Pre-built CSS for generated websites
│   │   ├── imageGeneration.ts  # Nanobanana multi-image generation
│   │   └── index.ts            # Express server entry point
│   ├── routers/                # Feature-specific tRPC routers
│   │   ├── admin.ts            # Admin management procedures
│   │   ├── crypto.ts           # Crypto payment procedures
│   │   └── wallet.ts           # Wallet auth (SIWE) procedures
│   ├── launch.ts               # Three-module generation pipeline
│   ├── deployment.ts           # Cloudflare R2 website deployment
│   ├── resumableGeneration.ts  # Checkpoint & retry infrastructure
│   ├── db.ts                   # Database query helpers
│   └── routers.ts              # Main tRPC router aggregation
├── drizzle/                    # Schema & 21 migration files
├── shared/                     # Shared types, payment & Web3 config
└── storage/                    # S3 helpers
```

---

## Generation Pipeline Deep Dive

### Phase 1: Brand Analysis

Claude Opus 4-6 receives the project name, description, and any uploaded reference images. It outputs a structured JSON containing:

- **Brand personality** and tone of voice
- **Color scheme** (primary, secondary, accent, background)
- **Aesthetic direction** (cyberpunk, retro, playful, luxury, edgy, brutalist, etc.)
- **Headline, tagline, and about copy**
- **Image generation plan** — 6 to 10 assets, each with a detailed prompt, dimensions, and style instructions

### Phase 2: Visual Asset Generation

Nanobanana processes the image plan in parallel, generating all assets simultaneously. Each image goes through:

1. AI generation with project-specific prompts
2. Optional background removal (Sharp-based, for logos and character art)
3. Upload to Cloudflare R2 with CDN-optimized paths
4. Database record creation linking the asset to the project

### Phase 3: Website Generation & Deployment

The website generation uses a **CSS framework + HTML-only** architecture to maximize quality while minimizing token consumption:

1. A pre-built CSS framework (`meme-css-framework.ts`) provides all styles, animations, and responsive layouts
2. Claude generates only the HTML `<body>` content using pre-defined CSS classes (8K tokens vs. 32K for full-page)
3. The server assembles the complete HTML document (CSS + HTML body + JavaScript)
4. `validateAndFixHTML` ensures structural integrity
5. The complete page is deployed to Cloudflare R2 under `{slug}.ezcto.fun`

---

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | MySQL/TiDB connection string |
| `JWT_SECRET` | Session cookie signing |
| `CLAUDE_API_KEY` | Claude Opus 4-6 API access |
| `NANOBANANA_API_KEY` | Image generation service |
| `CLOUDFLARE_R2_*` | R2 storage credentials (6 variables) |
| `STRIPE_SECRET_KEY` | Stripe payments (optional) |
| `BUILT_IN_FORGE_API_*` | Manus platform API access |
| `VITE_APP_TITLE` | Application display name |

---

## Development

```bash
# Install dependencies
pnpm install

# Start development server (with hot reload)
pnpm dev

# Run tests
pnpm test

# Generate database migration
pnpm drizzle-kit generate

# Build for production
pnpm build
```

---

## Pricing Model

| Tier | Price | Features |
|------|-------|----------|
| **Free Trial** | $0 | 1 project (configurable via admin) |
| **Standard** | $199 | Full generation pipeline + custom subdomain |
| **Token Holder Discount** | $139.30 | 30% off for qualifying token holders |

Payments are processed entirely on-chain. The platform monitors transaction confirmations and automatically unlocks the generation pipeline upon payment verification.

---

## License

Proprietary. All rights reserved.

---

*Built with Claude Opus 4-6, Nanobanana, and a lot of Meme energy.*
