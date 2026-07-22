# Hustle Commerce

The custom-built, headless storefront + admin for Hustle — built from the
Hustle 2.0 E-Commerce Blueprint for speed, full design ownership, and
Egypt-first commerce (COD, EGP, governorate shipping).

## Stack

Chosen for raw speed and zero licensing cost:

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 16** (App Router, React 19, Turbopack) | React Server Components render on the edge, streaming HTML, no client JS for static content. |
| Rendering | **ISR** (`revalidate`) on every storefront route | Pages are served from cache (CDN-able) and refresh in the background — no per-request DB round trip for shoppers. |
| Hot-data cache | **Redis** (`ioredis`), cache-aside in `src/lib/cache.ts` | Product/campaign/search queries are cached with short TTLs and explicitly invalidated on admin writes. Degrades gracefully to "no cache" if Redis is down — never a hard dependency. |
| Database | **PostgreSQL on Supabase**, via **Prisma 7** (`@prisma/adapter-pg`, driver adapter, connected through Supabase's session pooler for IPv4 compatibility) | The one production database — schema in `prisma/schema.prisma` covers the whole blueprint (products, campaigns/drops, orders, loyalty, journal, waitlists, discounts), not just the MVP. |
| Images | `next/image` with AVIF/WebP | Automatic responsive, lazy-loaded, modern-format images — a major share of Core Web Vitals score. |
| Fonts | `next/font/google`, self-hosted at build time | Archivo Black / Space Grotesk / Inter / JetBrains Mono per the design system (blueprint p.12), zero runtime request to Google. |
| Auth | Custom, `jose` (JWT) + `bcryptjs` | Lightweight, edge-compatible admin session — no heavy auth framework needed for a single admin role set. |

The whole stack is free / open-source. Redis is optional (the cache layer
degrades gracefully with no Redis configured — see `src/lib/cache.ts`); add
a free Upstash instance if you want the extra speedup.

## What's actually built vs. scaffolded

**Fully functional (Month 1-2 MVP from the roadmap):**
- Storefront: homepage (live/upcoming campaign hero), collection pages by
  line, product detail pages (gallery, size selector, stock countdown,
  reviews), predictive search, journal, drops/waitlist page.
- Cart: slide-out drawer, guest cart via signed cookie, live stock checks.
- Checkout: Egyptian governorate address form, COD (functional end to end —
  places a real order, decrements inventory), shipping cost by governorate,
  order confirmation page. Logged-in customers can pick a saved address.
- Admin: JWT-based login, dashboard (orders/revenue/low-stock), full product
  CRUD (variants, images, inventory, scheduling status), order list + detail
  + status updates, audit log on writes.

**Fully functional (Phase 2 slice — membership, blueprint p.07-08):**
- Customer accounts: signup/login/logout (separate session from admin),
  `/account/*` protected by `src/proxy.ts`.
- Order history + detail with live status, self-service return/exchange
  requests (with a matching admin `/admin/returns` queue).
- Saved addresses (CRUD, default address), wishlist (heart button on every
  PDP), size profile.
- Digital Community Card (member number, tier, points) on the account
  dashboard.
- Loyalty points earned automatically on every order (1 pt / 10 EGP).
- Referral program: unique referral link, referrer earns points on their
  referred member's first order.
- Early-access drop windows gated by loyalty tier (`Campaign.earlyAccessAt`
  / `earlyAccessTier`), and members-only journal posts.

**Fully functional (blueprint p.09-10 — Egypt-specific + drop mechanics):**
- Bilingual storefront: a real locale toggle (cookie-based) that flips
  `dir="rtl"`, swaps to an Arabic-capable font (Cairo), and translates all
  nav/cart/checkout/account chrome. Product/journal *content* stays
  whatever language it was authored in — no Arabic content model yet.
- Phone OTP verification at checkout (Redis-backed code, required before
  an order can be placed).
- Per-customer purchase limits per drop, back-in-stock email alerts,
  raffle/lottery entry with an admin draw-winners action, and a
  Redis-backed admission gate for high-traffic drop launches.
- Product review submission (with an admin moderation queue).

**Integration-ready scaffolding — works in sandbox mode with zero API keys,
switches to the real provider automatically once keys are added, no code
changes required:**
- **Payments** (`src/lib/payments/`) — a `PaymentGateway` interface, a mock
  gateway that completes card checkout instantly for demos/dev, and a
  Paymob adapter (auth → order → payment key → iframe redirect, per their
  documented flow) that activates when `PAYMOB_API_KEY` is set. A webhook
  at `/api/webhooks/paymob` confirms payment via HMAC-verified callback.
  **The Paymob and webhook HMAC code is structured from public docs but
  unverified against a live sandbox — test it against a real Paymob test
  account before trusting it with real money.** Fawry/Kashier/Valu/Souhoola
  aren't implemented; add them alongside Paymob behind the same interface.
- **Couriers** (`src/lib/couriers/`) — a `CourierProvider` interface, a mock
  that hands back a locally generated tracking number, and a Bosta adapter
  that activates when `BOSTA_API_KEY` is set (same "unverified, test before
  trusting" caveat). Fires automatically when an admin marks an order
  SHIPPED. Mylerz/Aramex/Egypt Post aren't implemented.
- **WhatsApp/SMS/email** (`src/lib/notify.ts`) — one `sendNotification()`
  call site used everywhere (order confirmation, shipping/delivery status,
  back-in-stock alerts, raffle winners, OTP codes, drop-live waitlist
  alerts). Currently logs to the console instead of delivering anything —
  set `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_WHATSAPP_FROM` (or
  `TWILIO_SMS_FROM`) and every caller starts actually sending. Twilio is
  trial-credit based, not free forever.
- **New-order alerts to the store owner** (`src/lib/notify-admin.ts`) — a
  separate channel from the customer-facing one above, because it's tied to
  *you*, not a customer's phone/email. Fires on every order (COD, instant
  card charge, and async Paymob confirmation via the webhook). Prefers
  **Telegram** (`src/lib/notifications/telegram.ts`) — genuinely free
  forever, no trial, no card required:
  1. Message **@BotFather** on Telegram → `/newbot` → copy the token into
     `TELEGRAM_BOT_TOKEN`.
  2. Send your new bot any message.
  3. Run `npm run telegram:chat-id` to find your chat ID, paste it into
     `TELEGRAM_CHAT_ID`.

  Falls back to `ADMIN_ALERT_PHONE` via the Twilio SMS/WhatsApp path above
  if Telegram isn't configured.

**Fully functional (admin platform — customers, promotions, content, ops):**
- **Discount codes**: admin CRUD (`/admin/discounts`), a real promo code
  field in the cart drawer and checkout that applies percentage/fixed/free-
  shipping discounts to the actual order total, usage limits enforced.
- **Cart**: save-for-later on removed items, recently-viewed products
  (cookie-based, no DB writes per page view).
- **Customers** (`/admin/customers`): segments (VIP/first-time/lapsed),
  lifetime value, tags/internal notes, CSV segment export, per-customer
  order/address history.
- **Journal CMS** (`/admin/journal`) and **campaign CRUD**
  (`/admin/campaigns`): full create/edit/delete — no longer seed-only.
- **Multi-location inventory** (`/admin/locations`): manage warehouses/
  studios/pop-ups, per-variant stock grid across locations, stock transfer
  between locations.
- **Staff & 2FA** (`/admin/staff`): owner-managed staff accounts with role
  assignment, and real TOTP two-factor auth (from-scratch RFC 6238
  implementation, works with Google Authenticator/Authy — no external
  dependency).
- **Bulk CSV import/export** for the product catalog (one row per variant,
  handles quoted/multiline fields).
- **Analytics** (`/admin/analytics`): sales by line, top products,
  conversion funnel (view → add-to-cart → checkout → order, tracked via a
  real `AnalyticsEvent` table, not fabricated), inventory turnover, cohort
  retention, marketing attribution (first-touch, from referrer/UTM), live
  drop sell-through.
- **Arabic content fields** on products/campaigns/journal posts (admin form
  has paired EN/AR inputs) — the storefront renders the Arabic version when
  the locale toggle is set to AR and a translation exists, falling back to
  English otherwise.

**Scaffolded in the database schema, not yet wired to UI** (remaining items
— POS, Instagram/TikTok shop sync, Egypt e-invoicing, refund/discount
approval workflows). These need either physical hardware or third-party
business-account verification I can't obtain — see note below.

**Still needs real infrastructure before going live:**
- Product images — admin form takes hosted image URLs; wire up a real
  asset host (S3/Cloudinary/R2) before production.
- Every "unverified" integration above — sandbox/mock mode is fully
  functional today, but the real Paymob/Bosta code paths have never run
  against live credentials.
- **Not built at all, by design**: Instagram/TikTok Shop sync (needs Meta/
  TikTok business app review), Egypt e-invoicing (needs an ETA tax-authority
  certificate), and POS (needs physical terminal hardware) — none of these
  can be faked convincingly, so they're left as an honest gap rather than a
  stub that looks done but isn't.

## Getting started

The database is a single Supabase Postgres project — `DATABASE_URL` in
`.env` already points at it (via the session pooler, for IPv4 compatibility;
see the comment above that line if you ever need to rotate credentials).

```bash
npm install                 # also runs `prisma generate` via postinstall
npm run db:migrate           # applies any pending migrations
npm run dev                  # http://localhost:3000
```

The database currently has no demo/seed data — only the admin login exists
(`prisma/seed.ts` is still there if you want to reseed sample products/
campaigns for local testing; run `npm run db:seed`, then wipe it again before
going live the same way this was done — see "Resetting for launch" below).

**Admin login:** whatever email/password you set for the `AdminUser` kept
during the last data wipe. If you ever need a fresh one, either update the
row directly or temporarily reintroduce a seed step.

## Why this hits the speed brief

1. **ISR everywhere** — `export const revalidate = N` on every storefront
   route means shoppers hit a pre-rendered page, not a live DB query.
2. **Redis cache-aside** in front of every hot Prisma query (`src/lib/queries/*`),
   with prefix-based invalidation (`invalidatePrefix("products:")`) fired
   from admin write actions — so the cache never serves stale catalog data
   after an edit, but reads stay fast between edits.
3. **Server Components by default** — cart/search/forms are the only client
   JS shipped; everything else renders on the server and streams.
4. **Self-hosted fonts + AVIF/WebP images** — no external font requests,
   no oversized images, both of which usually dominate real-world Core Web
   Vitals failures.
5. **Connection pooling via `@prisma/adapter-pg`**, reused across requests
   in the same process (see `src/lib/db.ts`) instead of opening a new DB
   connection per request.

## Project layout

```
prisma/schema.prisma        Full domain model (MVP + phases 2-4)
prisma/seed.ts               Sample data + first admin user
src/lib/db.ts                 Prisma client singleton (pg driver adapter)
src/lib/cache.ts              Redis cache-aside + invalidation helpers
src/lib/queries/              Cached read models (products, campaigns)
src/actions/                  Server actions (cart, checkout, admin writes)
src/app/                      Storefront + /admin routes (App Router)
src/components/storefront/    Cart, header, product card, checkout form…
src/components/admin/         Product form, order status control…
src/proxy.ts                  Route protection for /admin/* and /account/* (session check)
src/lib/customer-auth.ts      Customer session, member number / referral code generation
src/lib/loyalty.ts            Tier comparison + early-access eligibility
src/lib/i18n.ts                Translation dictionary + locale helpers
src/lib/payments/              Payment gateway interface, mock + Paymob adapter
src/lib/couriers/              Courier interface, mock + Bosta adapter
src/lib/notify.ts              Customer-facing WhatsApp/SMS/email interface (mock/Twilio)
src/lib/notify-admin.ts        Store-owner new-order alerts (Telegram, free forever)
src/app/api/webhooks/paymob/  Paymob payment-confirmation webhook
scripts/telegram-get-chat-id.ts  Finds your Telegram chat_id after messaging your bot
src/lib/totp.ts                From-scratch RFC 6238 two-factor auth (no dependency)
src/lib/discount.ts            Discount code math (percentage/fixed/free-shipping)
src/lib/csv.ts                  Hand-rolled RFC 4180 CSV parser/stringifier
src/lib/queries/analytics.ts   Funnel/cohort/turnover/attribution queries
src/lib/i18n.ts                 pickLocalized() — EN/AR content fallback
```
