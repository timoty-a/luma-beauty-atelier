# LUMA Beauty Atelier

LUMA is a full-stack cosmetics shop with a Next.js storefront and an Expo mobile app. Both clients use the same Vercel API and Supabase database. Customers can sign in on either client, share one cart across devices, and check out with Mailgun confirmation email.

## Applications

- **Web:** Next.js storefront deployed at <https://luma-beauty-atelier.vercel.app>
- **Mobile:** Expo Router app in [`mobile`](./mobile)
- **Data and auth:** Supabase Postgres and Supabase Auth
- **Email:** Mailgun

## Local development

Web:

```sh
npm install
npm run dev
```

Mobile:

```sh
cd mobile
npm install
npx expo start
```

Copy `.env.example` to `.env.local` for local web development. Never commit credentials. The mobile app calls the production API and contains no database or Mailgun secret.

## Shared cart

Anonymous carts use a random device session. After login, `claim_shared_cart` resolves every client to the account's canonical cart and merges any anonymous items. Cart mutations increment a database revision. Signed-in web and mobile clients long-poll the shared `/api/cart` endpoint, so a change on one device appears on the other without refreshing.

Apply migrations in timestamp order from [`supabase/migrations`](./supabase/migrations). Full setup and verification steps are in [`SETUP.md`](./SETUP.md).

## Verification

```sh
npx tsc --noEmit
npx next build
cd mobile
npm run typecheck
npm run doctor
```
