# Navedyam Cloud Kitchen

## What This Is

Navedyam is a full-stack, cloud kitchen food ordering platform specifically designed for authentic Haryanvi and North Indian cuisine. It consists of a React Native (Expo) customer mobile application, an Express/MongoDB real-time backend API, and a React (Vite) kitchen and administrative operations dashboard. The platform enables customers to discover dishes, customize orders, pay via Razorpay/COD/UPI, and track order preparation and delivery live.

## Core Value

Customers can seamlessly place authentic food orders and receive real-time updates from kitchen confirmation to doorstep delivery, while kitchen operators have instantaneous, reliable ticket management.

## Business Context

- **Customer**: Residents and food lovers ordering fresh Haryanvi & North Indian cloud-kitchen meals.
- **Revenue model**: Direct-to-consumer food sales with itemized pricing, delivery fees, and promotional coupon discounts.
- **Success metric**: Successful end-to-end order placement, payment verification, and delivery tracking under real cloud conditions.

## Requirements

### Validated

- ✓ Customer authentication (JWT + bcrypt phone/password registration & login) — existing
- ✓ Dynamic menu catalog browsing with category tabs, dish customization, veg/non-veg flags, and full-text search — existing
- ✓ Multi-item cart management with automatic GST (5%) and delivery fee calculation — existing
- ✓ Coupon validation engine supporting flat and percentage discounts — existing
- ✓ Order creation, custom display IDs (`NVD-XXXXX`), and order history tracking — existing
- ✓ Razorpay mobile checkout and HMAC-SHA256 signature verification — existing
- ✓ Real-time Socket.IO communication between mobile clients (`order:status_update`) and kitchen dashboard (`new:order`) — existing
- ✓ Admin operations dashboard with live order status progression, menu catalog stock toggling, and Recharts analytics — existing
- ✓ Customer reviews, 5-star ratings, and automatic menu item rating aggregation — existing
- ✓ User saved delivery addresses and favorite items management — existing
- ✓ Polished dual-theme system (Light & Dark mode) across both mobile and admin web interfaces — existing

### Active (Milestone 1: Hardening & Cloud Deployment)

- [ ] **SEC-01**: Secure public tracking endpoint (`/api/track/:orderId`) with authentication checks to prevent PII and delivery address exposure.
- [ ] **PAY-01**: Fix Razorpay order lifecycle so kitchen is ONLY notified on verified payments (prevent phantom unpaid orders).
- [ ] **MOB-01**: Mount `<SocketProvider>` in mobile `App.js` and fix `TrackScreen.js` so "Rate Your Order" button displays on delivered orders.
- [ ] **ADM-01**: Inject dynamic environment variables (`VITE_API_BASE_URL` and `VITE_WS_URL`) in Admin Dashboard, eliminating hardcoded `localhost:4000`.
- [ ] **DB-01**: Provision and configure production MongoDB Atlas M0 cluster, running seed script for initial live menu data.
- [ ] **SRV-01**: Deploy Express + Socket.IO API to Render with production environment variables and verified health checks.
- [ ] **WEB-01**: Deploy Admin Dashboard SPA to Vercel with connected live API and WebSocket endpoints.
- [ ] **BLD-01**: Configure EAS Build for mobile client and generate a standalone downloadable Android `.apk` for live testing.

### Out of Scope

- iOS App Store publishing — deferred to Milestone 2 (requires Apple Developer Program enrollment; Android APK covers immediate testing).
- Multi-restaurant / multi-vendor marketplace architecture — Navedyam operates as a dedicated single-brand cloud kitchen.
- Automated delivery driver routing / Google Maps live courier GPS tracking — using discrete timeline stages (`placed`, `confirmed`, `preparing`, `out_for_delivery`, `delivered`) for Milestone 1.
- In-house automated telephone IVR / WhatsApp order bot — deferred to future milestones.

## Context

- The codebase was developed and thoroughly mapped (~105 files across `backend/`, `frontend/`, and `admin-dashboard/`).
- The project is transitioning into an active personal product with immediate deployment to public cloud infrastructure.
- Core cloud providers selected: MongoDB Atlas (Database), Render (Node.js API + WebSockets), Vercel (Admin SPA), and Expo EAS (Mobile APK).
- Razorpay API credentials are ready for integration and testing.

## Constraints

- **Backend Runtime**: Node.js 18+ with persistent WebSocket support (Socket.IO requires a host that supports WebSockets, e.g. Render).
- **Database**: MongoDB 6+ managed cluster (Atlas Free M0 tier).
- **Mobile Platform**: Expo SDK 54 with Android standalone APK target for Milestone 1 testing.
- **Cost**: Zero to low-cost infrastructure (Render Free/Starter, Vercel Hobby, MongoDB Atlas Free, EAS free tier).

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| MongoDB Atlas over local SQLite | SQLite files in `backend/db/` were legacy remnants; MongoDB is already implemented across all models and is cloud-native | ✓ Good |
| Render for Backend & WebSockets | Supports native Node.js and persistent WebSocket connections required by Socket.IO | — Pending |
| Vercel for Admin Dashboard | Fast static SPA CDN hosting with effortless custom domain and Vite build integration | — Pending |
| EAS Standalone APK for Mobile | Allows direct installation on Android devices without requiring Google Play Store review for Milestone 1 | — Pending |
| Fix Razorpay flow before deploy | Prevents unpaid orders from leaking into kitchen order streams during production testing | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-10-01 after initialization*
