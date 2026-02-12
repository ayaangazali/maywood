# 🚀 Quick Setup

## 1. Install dependencies
```bash
npm install
```

## 2. Set up database
```bash
npx prisma migrate dev --name init
# Creates SQLite database and seeds 31 catalog items
```

## 3. Configure environment
Edit `.env.local` and update the database path to YOUR absolute path:
```
DATABASE_URL="file:/Users/yourusername/path/to/maywood/prisma/dev.db"
```

Then add your Stripe test keys:
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Get webhook secret by running:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## 4. Start dev server
```bash
npm run dev
```

## 5. Test it
- Visit http://localhost:3000
- Create a gift (use Stripe test card: 4242 4242 4242 4242)
- Copy claim URL from success page
- Open claim URL and select an item
- Check console for "email" logs

## Admin Dashboard
- Go to http://localhost:3000/admin/login
- Password: `admin123` (from .env.local)

## Troubleshooting

**"Unable to open the database file"**
- Make sure `DATABASE_URL` in `.env.local` uses an ABSOLUTE path
- Example: `file:/Users/yourname/Documents/maywood/prisma/dev.db`
- NOT: `file:./prisma/dev.db` (relative paths don't work with Next.js)
