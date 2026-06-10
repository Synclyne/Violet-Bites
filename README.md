# Violet Bites 🍔💜

A single-restaurant food delivery app: Expo (React Native) client + Express/SQLite server.
Purple/white/pink theme, full ordering flow, simulated live delivery tracking.

## Run it

1. **Server:** `cd server && npm install && npm run dev` (listens on 0.0.0.0:4000)
2. **Find your PC's LAN IP:** `ipconfig` → Wi-Fi adapter IPv4 address.
3. **Point the app at it:** edit `mobile/src/lib/config.ts` and set `API_URL`
   (currently set to `http://192.168.0.103:4000`).
4. **App:** `cd mobile && npm install && npx expo start` → scan the QR with Expo Go
   (phone and PC on the same Wi-Fi).

Seeded discount codes: `WELCOME10`, `VIOLET20`. Orders auto-advance status
(Placed → Preparing → On the way → Delivered) every ~30 seconds.

## Features

- Email/password accounts (JWT, stored in the phone's secure store)
- Menu with categories, search, and item options (sizes, extras)
- Cart with discount codes, checkout with saved addresses, simulated payment
- Live order tracking timeline, order history, reorder
- Reviews (per delivered order) that update item ratings
- Wishlist/favorites and profile management

## Tests

`cd server && npm test` — 30 tests covering auth, menu, favorites, discounts,
order pricing, reviews, and the delivery status simulator.
