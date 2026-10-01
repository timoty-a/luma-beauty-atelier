# LUMA shop setup

The storefront and checkout are implemented and connected to Supabase and Mailgun. The published site is private. Products, prices (USD), shipping ($6; free from $60), images and copy are illustrative and need your review before selling. Checkout accepts pay-on-delivery orders only; it never charges a card.

## 1. Supabase database

1. Create a Supabase project.
2. Open its SQL editor and run `supabase/schema.sql` once. This creates products, carts, cart items and orders, with transactional checkout and sample products. Then run `supabase/catalog-expansion.sql` to add six branded products and their source metadata. If the original schema is already installed, run only the expansion SQL. See `CATALOG_SOURCES.md` for official product and image references.
   Projects created from an older copy of the schema must also run `supabase/service-role-grants.sql` once.
3. Get the project URL, publishable key and secret key from project settings. Configure `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SECRET_KEY` as server-side hosting environment variables. Never put the secret key in browser code or source control. Legacy `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` names remain supported for local migration only.
4. Set `SITE_URL` to the exact site origin without a trailing slash. Current preview origin: `https://luma-beauty-atelier.raiseedafrica.chatgpt.site`.

All tables have row-level security enabled and no browser access policies. Server endpoints use the Supabase secret key. Cart identity uses a random, HttpOnly cookie. Google identity is verified through Supabase before it is attached to an order. The cart is stored in Postgres, not browser local storage. Guests keep their cart on the same browser for 30 days. Signed-in carts are linked to the account, but automatic cross-device cart merging is not implemented.

## 2. Google authentication

1. In Google Cloud Console, create/select a project and configure Google Auth Platform branding, audience and data access (email, profile, openid). While in testing, add your test users.
2. Create a Web application OAuth client. Add the exact shop origin to authorized JavaScript origins. Add `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback` as the authorized redirect URI.
3. In Supabase Authentication → Sign In / Providers → Google, enable Google and paste that client ID and client secret. Keep the Google secret in Supabase, not the storefront.
4. In Supabase URL Configuration, set the Site URL to the shop origin and allow `https://luma-beauty-atelier.raiseedafrica.chatgpt.site/api/auth/callback` as a redirect URL. For development also allow `http://127.0.0.1:5173/api/auth/callback` and set local `SITE_URL` accordingly.
5. The shop supports Google OAuth plus Supabase email/password sign-in and account creation. Google uses PKCE, and both methods store the access token in an HttpOnly cookie. Sessions expire after Supabase's access-token lifetime; the customer signs in again rather than using a long-lived refresh token.

Official reference: https://supabase.com/docs/guides/auth/social-login/auth-google

## 3. Mailgun order confirmations

1. Create a Mailgun account and add a sending domain you control.
2. Add Mailgun's DNS verification records at your domain provider and wait for verification. Sandbox domains require authorized test recipients.
3. Configure `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, `MAILGUN_FROM` (for example `LUMA <orders@your-domain.com>`) and `MAILGUN_REGION` (`US` or `EU`) as server-side environment variables.
4. Orders are saved before sending mail. `orders.email_status` records `pending`, `sending`, `sent` or `failed`. A Mailgun failure never discards an order. `sent` means Mailgun accepted the message, not confirmed inbox delivery. There is no automatic retry worker or delivery webhook in this version; inspect failed/pending or stalled sending records and resend through your operational email workflow.

Official reference: https://documentation.mailgun.com/docs/mailgun/user-manual/sending-messages/send-http

## 4. Run locally

Copy `.env.example` to `.env`, fill in your local values, then run `npm install` and `npm run dev`. Keep `.env` out of Git. For hosting, configure the same values as site secrets and republish. Do not paste credentials into chat or commit them.

## 5. Verify before opening the shop

- Sign in with an allowed Google test account; check expiry, sign-out, and canceled sign-in.
- Add/update/remove products; refresh the page and confirm cart persistence.
- Submit checkout, then retry the same request: there must be one order, priced from the database rather than the browser. Cart mutation and checkout serialize on the same database lock.
- Check the order in Supabase and the confirmation in a Mailgun test recipient's inbox. Test mail failure and confirm the order remains saved.
- Review real product information, stock/fulfillment rules, supported countries, tax treatment, currency and shipping. This starter has no inventory accounting, card payments, refunds, admin UI, or carrier integration.
- Add applicable business/privacy/returns terms before public launch. The site is currently owner-private; change its audience only when ready.

## Validation in this delivery

The production Supabase database and Mailgun sandbox are connected. Google sign-in still requires its OAuth client to be added to Supabase. Mailgun's sandbox can deliver only to authorized test recipients until a custom sending domain is verified. Browser WebMCP is optional and feature-detected; it provides only collection filtering.
