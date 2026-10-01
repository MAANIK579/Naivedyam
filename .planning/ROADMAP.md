# Roadmap: Navedyam Cloud Kitchen

## Overview

This roadmap directs Navedyam through three distinct phases: first, thoroughly eliminating all known bugs, security vulnerabilities, and client wiring defects across the entire stack; second, adding core platform features (dish images, customer order self-cancellation, geolocation coordinates, and notifications); and third, carrying out the complete cloud deployment (MongoDB Atlas, Render, Vercel, and standalone mobile APK).

## Phases

- [x] **Phase 1: Codebase Error & Bug Elimination** - Fix critical vulnerabilities, Razorpay notification flows, mobile context wiring, and admin hardcoded URLs
- [x] **Phase 2: Platform Feature Enhancements** - Implement dish photo support, order self-cancellation, address geolocation, and notification triggers
- [ ] **Phase 3: Production Cloud Deployment** - Deploy MongoDB Atlas, Render API, Vercel Admin, and generate standalone Android APK

---

## Phase Details

### Phase 1: Codebase Error & Bug Elimination
**Goal**: Clean and harden the existing codebase so all three tiers (backend, mobile, admin) operate reliably with zero runtime errors or architectural leaks.  
**Depends on**: Nothing (first phase)  
**Requirements**: BUG-01, BUG-02, BUG-03, BUG-04, BUG-05, BUG-06, BUG-07, BUG-08, BUG-09, BUG-10  
**Success Criteria** (what must be TRUE):
  1. Requests to `GET /api/track/:orderId` enforce authentication and ownership checks, returning 401/403 on unauthorized access.
  2. Orders placed with Razorpay only notify the kitchen (`new:order`) after `/api/payments/verify` confirms the signature.
  3. Mobile app wraps the navigation tree with `<SocketProvider>`, and `TrackScreen.js` shows the "Rate Your Order" button on delivered orders.
  4. Mobile push notification taps navigate to the tracked order via connected `navigationRef`.
  5. Mobile theme contrast issues in `src/theme.js` are resolved for both light and dark modes.
  6. Admin dashboard dynamically reads `VITE_API_URL` and `VITE_WS_URL`.
  7. Legacy SQLite files (`backend/db/navedyam.db*`) are permanently removed.
**Plans**: 3 plans

Plans:
- [x] 01-01: Backend hardening (tracking endpoint auth guard, Razorpay socket alert deferral, coupon atomic updates, review hook safety, legacy cleanup)
- [x] 01-02: Mobile client fixes (SocketProvider integration, TrackScreen rating button state, notification navigationRef, theme contrast fixes)
- [x] 01-03: Admin dashboard modernization (dynamic API/WebSocket URL injection, socket lifecycle optimization)

### Phase 2: Platform Feature Enhancements
**Goal**: Expand platform functionality with high-value customer and operational features before cloud release.  
**Depends on**: Phase 1  
**Requirements**: FEAT-01, FEAT-02, FEAT-03, FEAT-04, FEAT-05  
**Success Criteria** (what must be TRUE):
  1. Menu items can display cloud image URLs alongside emojis across mobile dish cards and admin menu tables.
  2. Customers can cancel orders directly from the mobile app while in `placed` or `confirmed` status with a cancellation reason.
  3. Address creation supports GPS coordinates, delivery instructions, and landmark guidance.
  4. System emits WhatsApp/SMS notification events on order confirmation and dispatch.
  5. Simple delivery partner view allows marking assigned orders as picked up and delivered.
**Plans**: 3 plans

Plans:
- [x] 02-01: Dish image support and catalog media management
- [x] 02-02: Customer self-cancellation workflow & address geolocation
- [x] 02-03: Notification triggers & delivery partner fulfillment view

### Phase 3: Production Cloud Deployment
**Goal**: Deploy the platform to production infrastructure and distribute installable mobile binaries.  
**Depends on**: Phase 2  
**Requirements**: DEP-01, DEP-02, DEP-03, DEP-04, DEP-05  
**Success Criteria** (what must be TRUE):
  1. MongoDB Atlas cluster is online, secured, and seeded with live North Indian catalog data.
  2. Express + Socket.IO API is live on Render with active WSS WebSocket support and verified health check.
  3. Admin Dashboard is live on Vercel with real-time kitchen streaming.
  4. Standalone Android `.apk` compiled via EAS Build is downloadable and tested end-to-end on a physical smartphone.
**Plans**: 2 plans

Plans:
- [ ] 03-01: MongoDB Atlas database setup and Render backend deployment
- [ ] 03-02: Vercel Admin deployment and EAS Build Android APK distribution

---

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Codebase Error & Bug Elimination | 3/3 | Complete | 2026-10-01 |
| 2. Platform Feature Enhancements | 3/3 | Complete | 2026-10-01 |
| 3. Production Cloud Deployment | 0/2 | Not started | - |
