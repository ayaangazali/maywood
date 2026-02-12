# One-Time Gift Link 🎁

An end-to-end web application that lets a sender pay for a gift budget and generate a single-use claim link. The recipient opens the link, chooses a gift from a curated catalog within the budget, and receives it instantly.

## Features

- **Gift Creation** — Sender sets a fixed amount or price range ($10–$500), writes a personal message, and picks from 5 card templates
- **Stripe Checkout** — Secure payment via Stripe Checkout Sessions (no raw card handling)
- **One-Time Claim Links** — Cryptographically secure tokens (SHA-256 hashed in DB), redeemable exactly once with race-condition-safe atomic transactions
- **Curated Catalog** — 30+ gift card options across Coffee, Food, Books, Gaming, Streaming, and Generic categories
- **Smart Recommendations** — Occasion-based item suggestions on the claim page
- **Remainder Handling** — If the recipient picks a cheaper item, they can convert the remainder to a gift card or donate to charity
- **Admin Dashboard** — View/search orders, inspect payment and fulfillment details, retry failed deliveries, resend emails, full audit trail
- **Structured Email System** — Email outbox with templates (stubbed to console in MVP; swap to Resend/SendGrid easily)
- **Rate Limiting** — In-memory rate limiter on claim and admin login endpoints
- **Audit Logging** — Every key event is recorded for observability

## Tech Stack

- **Frontend**: Next.js (App Router) + TypeScript + Tailwind CSS
- **Database**: SQLite (zero setup, just a file) + Prisma ORM
- **Payments**: Stripe Checkout
- **Fulfillment**: Mock gift provider (swappable to Tango/Giftbit)
- **Email**: Stub provider (swappable to Resend/SendGrid)
- **Testing**: Vitest

## Quick Start

### Prerequisites

- Node.js 18+
- Stripe account (for test keys)

### 1. Clone and install

```bash
cd maywood
npm install
```

### 2. Set up environment

```bash
cp .env.example .env.local
# Edit .env.local and set the absolute path to your database:
# DATABASE_URL="file:/absolute/path/to/your/project/prisma/dev.db"
# Or on Windows: "file:C:/path/to/your/project/prisma/dev.db"
```

**Important:** SQLite requires an absolute path in Next.js. Replace `/absolute/path/to/your/project` with your actual project path.

### 3. Run database migrations and seed

```bash
npx prisma migrate dev --name init
# This creates the SQLite database and seeds catalog items automatically
```

### 4. Start development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Set up Stripe webhooks (local testing)

```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the webhook signing secret (`whsec_...`) and add it to `.env.local` as `STRIPE_WEBHOOK_SECRET`.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | SQLite database file path (default: `file:./dev.db`) |
| `STRIPE_SECRET_KEY` | ✅ | Stripe secret key (use `sk_test_...`) |
| `STRIPE_PUBLISHABLE_KEY` | ✅ | Stripe publishable key (use `pk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | ✅ | Stripe webhook signing secret |
| `APP_BASE_URL` | ✅ | Base URL of the app (e.g., `http://localhost:3000`) |
| `ADMIN_PASSWORD` | ✅ | Password for admin dashboard |
| `ADMIN_SECRET` | ✅ | 32+ char secret for HMAC cookie signing |
| `EMAIL_PROVIDER` | | `stub` (default) or `resend` |
| `GIFT_PROVIDER` | | `mock` (default) or `tango` |

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run test` | Run unit tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed catalog items |
| `npm run db:studio` | Open Prisma Studio GUI |
| `npm run db:reset` | Reset database |

## Application Flow

```
1. Sender visits /create
   └── Fills form → Submits → Redirected to Stripe Checkout

2. Stripe processes payment
   └── Webhook fires → Order activated → Claim token generated → Emails sent

3. Recipient clicks claim link (/claim/[token])
   └── Sees card + catalog → Selects item → Confirms → Gift fulfilled

4. Post-claim
   └── If remainder exists → Convert to gift card or donate

5. Admin monitors at /admin
   └── View orders → Retry failures → Resend emails → Audit trail
```

## Project Structure

```
maywood/
├── app/                  # Next.js App Router pages & API routes
│   ├── create/           # Gift creation form
│   ├── success/          # Payment success + claim URL
│   ├── claim/[token]/    # Recipient claim page
│   ├── claimed/          # Post-claim confirmation
│   ├── admin/            # Admin dashboard
│   └── api/              # API endpoints
├── components/           # React components
├── lib/                  # Core business logic
│   ├── fulfillment/      # Gift provider abstraction
│   ├── email/            # Email provider abstraction
│   ├── token.ts          # Secure token utilities
│   ├── session.ts        # Admin auth
│   ├── audit.ts          # Audit logging
│   ├── catalog.ts        # Catalog filtering
│   ├── ratelimit.ts      # Rate limiting
│   ├── validation.ts     # Form validation
│   └── card-templates.ts # Card template definitions
├── prisma/               # Database schema & seeds
├── __tests__/            # Unit tests
└── public/catalog/       # Catalog item images
```

## Security

- **Claim tokens**: Generated with `crypto.randomBytes(32)`, stored as SHA-256 hash, verified with timing-safe comparison
- **Atomic redemption**: Prisma transaction ensures one-time claim (SQLite has limited concurrency; switch to Postgres for production)
- **Webhook verification**: Stripe signature verification on all webhook events
- **Admin auth**: HMAC-signed HTTP-only cookies with 24h expiry
- **Rate limiting**: 20 req/min on claim endpoint, 5 req/min on admin login
- **No raw card data**: All payments through Stripe Checkout

## Deployment

### Vercel + Managed Database

1. Push to GitHub
2. Import in Vercel
3. Set environment variables
4. **For production, use a managed database** (Neon, Supabase, or PlanetScale)
   - SQLite works for local dev but not for serverless/multi-instance deployments
   - Update `DATABASE_URL` in Vercel to point to your managed database
   - Switch Prisma schema back to `provider = "postgresql"` if using Postgres
5. Run `npx prisma migrate deploy` in your build command
6. Configure Stripe webhook URL to `https://your-domain.com/api/webhooks/stripe`

### Deployment checklist

- [ ] Set all environment variables in production
- [ ] Run database migrations
- [ ] Seed catalog items
- [ ] Configure Stripe webhook endpoint
- [ ] Set `ADMIN_PASSWORD` to a strong value
- [ ] Generate a random `ADMIN_SECRET` (32+ chars)
- [ ] Verify webhook endpoint is receiving events

## Future Work

- **Real email provider** — Swap `EMAIL_PROVIDER=resend` and add `RESEND_API_KEY` (~30 min)
- **Real gift provider** — Integrate Tango Card or Giftbit API for actual gift card delivery
- **Authorization + capture** — For ranges, authorize max upfront, capture actual amount on claim
- **Multi-currency** — Support currencies beyond USD
- **Gift link analytics** — Show sender when link was opened, claimed, etc.
- **Scheduled delivery** — Allow sender to specify a future delivery date
- **Physical goods support** — Collect recipient shipping address
- **Fraud detection** — Velocity checks, email verification, suspicious pattern detection
- **Phone notifications** — SMS/WhatsApp delivery via Twilio
- **Recipient accounts** — Optional recipient login for order history
- **Charity integration** — Real charity donation processing for remainder
- **Compliance** — Alcohol gift cards (age verification), regional restrictions
- **Accessibility audit** — WCAG 2.1 AA compliance
- **Real-time updates** — WebSocket/SSE for payment confirmation instead of polling

## License

Private — All rights reserved.
