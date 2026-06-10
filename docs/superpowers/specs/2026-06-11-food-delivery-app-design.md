# Violet Bites — Single-Restaurant Food Delivery App

**Date:** 2026-06-11
**Status:** Approved by user

## Overview

A food delivery mobile app for a single restaurant, built with Expo (React Native) and a local Node.js backend. Layouts are modeled on two reference UI kits provided by the user (card-based menu, bottom tab bar, hero food images, rounded buttons), restyled to a purple/white/pink theme.

## Goals

- Complete customer ordering journey: browse menu → food detail → cart → checkout → order success → tracking.
- Order history, reviews, favorites/wishlist, and a profile area.
- Full email/password authentication.
- Runs on the user's phone via Expo Go, talking to a local server on the same Wi-Fi network.

## Non-Goals

- Multi-restaurant marketplace.
- Real payments (payment method selection is simulated).
- Real delivery/driver logistics or live GPS maps (tracking is a simulated status timeline).
- Table reservations (explicitly out of scope for v1).
- Cloud deployment.

## Tech Stack

| Layer | Choice |
|---|---|
| Mobile app | Expo SDK (latest), TypeScript, Expo Router (file-based navigation) |
| State | Zustand (cart, auth session, wishlist) |
| Secure storage | expo-secure-store for the JWT |
| Backend | Node.js + Express, TypeScript |
| Database | SQLite via better-sqlite3 |
| Auth | JWT (HS256), bcrypt password hashing |
| Backend tests | Vitest + supertest |

## Theme

- **Primary:** purple `#7C3AED` (buttons, active tab, headers)
- **Accent:** pink `#EC4899` (favorites, badges, discounts, highlights)
- **Surfaces:** white `#FFFFFF` on a near-white `#FAF8FF` background; dark text `#1F1633`
- Rounded cards (16px radius), pill-shaped buttons and category chips, soft shadows.

## App Structure (Expo Router)

```
app/
  (auth)/welcome, login, register
  (tabs)/index (Home), orders, wishlist, profile
  food/[id]          # food detail
  cart
  checkout
  order-success
  order/[id]         # order details + tracking timeline
  review/[orderId]   # leave a review
```

### Screens

1. **Welcome/Onboarding** — brand hero, "Get Started" → register/login.
2. **Login / Register** — email + password forms with validation; register also takes name. On success, store JWT and enter tabs.
3. **Home** — greeting header, search bar, horizontal category chips, menu item cards (image, name, price, rating, add button, heart toggle).
4. **Food detail** — hero image, description, size options (S/M/L price variants), extras (checkbox add-ons), quantity stepper, reviews list, add-to-cart bar.
5. **Cart** — line items with steppers, swipe/button to remove, discount code field (seeded codes), subtotal/discount/delivery fee/total, checkout button. Empty state when no items.
6. **Checkout** — select/enter delivery address, payment method radio (Cash on delivery / Card — simulated), order summary, Place Order.
7. **Order success** — confirmation illustration, order number, "Track Order" and "Back to Home" buttons.
8. **Order tracking** (order details) — status timeline: Placed → Preparing → On the way → Delivered. Server auto-advances status every ~30 seconds; app polls every 10 seconds while the screen is open. Shows items, totals, address.
9. **Orders tab** — list of past/active orders with status badges; tap for details; "Reorder" re-fills the cart; "Review" for delivered orders.
10. **Wishlist tab** — grid of favorited items, tap through to detail.
11. **Profile tab** — name/email, manage addresses, order count, logout.
12. **Review screen** — star rating + text for a delivered order's items.

## Backend

### Database tables

- `users` (id, name, email unique, password_hash, created_at)
- `addresses` (id, user_id, label, street, city, is_default)
- `categories` (id, name, icon)
- `menu_items` (id, category_id, name, description, price, image_url, rating, is_available)
- `item_options` (id, menu_item_id, kind: 'size'|'extra', name, price_delta)
- `orders` (id, user_id, address_id, status, payment_method, subtotal, discount, delivery_fee, total, discount_code, created_at, status_updated_at)
- `order_items` (id, order_id, menu_item_id, name, unit_price, quantity, selected_options json)
- `reviews` (id, user_id, menu_item_id, order_id, rating 1-5, comment, created_at)
- `favorites` (user_id, menu_item_id)
- `discount_codes` (code, percent_off, active)

### REST endpoints

- `POST /auth/register`, `POST /auth/login` → `{ token, user }`
- `GET /me`, `PATCH /me` ; `GET/POST/DELETE /me/addresses`
- `GET /menu` (items + categories, optional `?category=&search=`), `GET /menu/:id` (with options + reviews)
- `GET/POST/DELETE /favorites`
- `POST /discounts/validate` → `{ percentOff }`
- `POST /orders` (items, addressId, paymentMethod, discountCode) → created order
- `GET /orders`, `GET /orders/:id`
- `POST /reviews`
- All non-auth routes require `Authorization: Bearer <jwt>`.

### Behavior

- **Order simulation:** a server interval advances any non-delivered order to the next status 30s after its `status_updated_at`.
- **Seed data:** ~20 menu items across 5–6 categories (Burgers, Pizza, Salads, Drinks, Desserts, Sides) with image URLs from a free food-image source; 2–3 discount codes (e.g. `WELCOME10`).
- Server listens on `0.0.0.0:4000` so the phone can reach it; the app reads the API base URL from a single config file the user sets to the PC's LAN IP.

## Error Handling

- API client wraps fetch: network failure → toast "Can't reach the kitchen — check the server is running"; 401 → clear token and return to login; validation errors shown inline on forms.
- Server: zod-validated request bodies returning 400 with field messages; 404/409 where appropriate; global error handler returns JSON.

## Testing

- Backend: Vitest + supertest covering auth (register/login/duplicate email/bad password), menu fetch, order creation math (totals with discount + delivery fee), status auto-advance (with faked timers), favorites, reviews.
- App: manual verification through Expo Go on the user's phone.

## Project Layout

```
Restaurant/
  server/        # Express + SQLite backend (own package.json)
  mobile/        # Expo app (own package.json)
  docs/superpowers/specs/
```
