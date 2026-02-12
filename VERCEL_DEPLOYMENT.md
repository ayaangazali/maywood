# Vercel Deployment Guide

## Quick Deploy

1. **Import to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import `ayaangazali/maywood` repository
   - Select the project and click "Deploy"

## Required Environment Variables

Add these in Vercel Dashboard → Settings → Environment Variables:

### Database
```
DATABASE_URL=file:./dev.db
```
⚠️ **Note**: SQLite is NOT recommended for production. Consider using PostgreSQL via Vercel Postgres or another provider.

### Stripe
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### App Configuration
```
APP_BASE_URL=https://your-app.vercel.app
NODE_ENV=production
```

### Admin
```
ADMIN_PASSWORD=<secure-password>
ADMIN_SECRET=<random-32-char-string>
```

### Email (Optional)
```
EMAIL_PROVIDER=stub
# Or use Resend:
# EMAIL_PROVIDER=resend
# RESEND_API_KEY=re_...
```

### Fulfillment (Optional)
```
GIFT_PROVIDER=mock
# Or use Tango:
# GIFT_PROVIDER=tango
# TANGO_API_KEY=...
```

## Post-Deployment

1. **Database Setup**: After first deploy, run migrations:
   ```bash
   vercel env pull
   npm run db:push
   ```

2. **Production Database**: For production, migrate from SQLite to PostgreSQL:
   - Add Vercel Postgres from the dashboard
   - Update `DATABASE_URL` to use the Postgres connection string
   - Run migrations again

## Build Configuration

The project uses:
- Next.js 16.1.6
- Prisma ORM
- Automatic builds via `vercel.json`
