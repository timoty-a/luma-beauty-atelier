# LUMA mobile app

This Expo Router app runs on Android and iOS and uses the same production API as the LUMA website.

## Run on a phone

1. Install Expo Go on the phone.
2. Run `npm install` in this directory.
3. Run `npx expo start --tunnel`.
4. Scan the QR code with Expo Go on Android or the Camera app on iPhone.

Sign in with the same email/password account on the website and mobile app. Add or remove an item on either client; the other client updates automatically.

Authentication tokens are stored in the operating system's secure storage through `expo-secure-store`. Supabase and Mailgun secret keys remain on the Next.js server.

## Checks

```sh
npm run typecheck
npm run doctor
npx expo export --platform android
```
