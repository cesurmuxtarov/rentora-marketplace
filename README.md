# RENTORA

RENTORA is a responsive Azerbaijani peer-to-peer rental marketplace built from the supplied Stitch design. The original `code.html`, `screen.png`, and `DESIGN.md` remain unchanged as design references.

## Run locally

```bash
npm install
npm run dev
```

Production verification:

```bash
npm run typecheck
npm test
npm run build
npm run preview
```

## Configuration

Copy `.env.example` to `.env.local` and add:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_PAYMENT_MODE=demo` until a supported provider is configured

Apply all files in `supabase/migrations` to a Supabase project in filename order. Never place the service-role key in any `VITE_` variable or browser bundle.

## Exact Supabase setup

1. Create a new Supabase project and save its Project URL and anon/publishable key.
2. Install the Supabase CLI, sign in, then link this folder:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
supabase db seed
```

3. In Supabase Auth → URL Configuration, set the Site URL to the production Vercel URL and add `http://localhost:5173/**` plus the production callback URL to Redirect URLs.
4. In Auth providers, enable Email. Configure a production SMTP provider before launch.
5. The migrations create public `avatars` and `listing-images` buckets plus private `message-attachments` and `condition-evidence` buckets with RLS policies.
6. Deploy the server functions when a payment provider has been selected:

```bash
supabase functions deploy create-checkout
supabase functions deploy payment-webhook --no-verify-jwt
```

7. Set server-only secrets; do not prefix these with `VITE_`:

```bash
supabase secrets set PAYMENT_PROVIDER=demo
supabase secrets set PAYMENT_WEBHOOK_SECRET=replace_after_provider_setup
```

Supabase automatically provides the function runtime with `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.

## Production integrations still required

1. Supabase project, Auth redirect URLs, storage buckets, and deployment of the included migration.
2. Apply and verify the included public/private storage policies for listing images, chat attachments and handover evidence. Add server-side media validation before production; the UI already limits JPG/PNG/WebP to 8 MB.
3. A payment provider whose business onboarding explicitly supports the operating company and Azerbaijan. It must provide hosted checkout/tokenization, signed webhooks, idempotency, refunds and a legally supported payout flow. Payment status must only change in a trusted webhook/Edge Function. The current adapters deliberately return “not configured” and never collect raw card data.
4. An identity-verification provider (for example, an approved Asan İmza/KYC integration). The UI does not claim that a real verification occurred.
5. Transactional email/SMS, production monitoring, abuse controls and rate limiting.
6. Review of terms, privacy, rental agreement, cancellation, deposit and dispute documents by an Azerbaijani legal professional.

## Architecture notes

- All visible primary routes are implemented in React Router.
- Search suggestions, category/location/date/rating/price filters, sorting, pagination, favorites, bookings, owner decisions, delivery selection, booking details, messaging, notifications and validated forms work locally.
- Demo checkout includes field validation, card/expiry formatting, duplicate-submit protection, failure simulation and a confirmation state. Test card data stays in browser memory and is never sent to the backend.
- Demo state is persisted in `localStorage` so journeys can be tested without credentials.
- When Supabase credentials are present, Auth, protected routes, active catalogue reads, listing creation/editing, listing image uploads, favorites, booking requests/status changes, conversation creation, private messages, Realtime subscription and validated attachment upload use Supabase.
- Database-enforced multi-role access and RLS policies are included. Confirmed/active booking overlap is prevented by database constraints and the server-authoritative booking RPC.
- Refundable deposits are stored and displayed separately from rental revenue and commission.

## Payment provider requirements

Before changing `PAYMENT_PROVIDER` from `demo`, implement and verify all of the following in the Edge Functions:

1. Create hosted checkout from the database booking amount, never from a browser-supplied price.
2. Map the provider payment ID to one unique RENTORA payment record and idempotency key.
3. Verify webhook signatures against the raw request body using the provider's official server SDK/specification.
4. Treat only a verified webhook as payment success; frontend redirects are informational only.
5. Implement partial/full refunds and deposit release as separate transactions.
6. Confirm the provider and legal entity support owner payouts. Do not label the flow escrow unless contractually supported.
7. Add webhook replay tests, duplicate-event tests, failed-payment tests and refund reconciliation.

## Deployment

1. Push the project to GitHub.
2. Import it in Vercel as a Vite project.
3. Use `npm run build` and output directory `dist`.
4. Add `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_PAYMENT_MODE`, and `VITE_APP_URL` in Vercel Environment Variables.
5. Deploy, then add the final Vercel domain to Supabase Auth URL Configuration.
6. `vercel.json` preserves React Router deep links.
