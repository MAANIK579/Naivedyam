# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

## Users

- **Diners / End Customers**: Food enthusiasts and local residents ordering fresh, authentic Haryanvi and North Indian cuisine. Situation: Mobile ordering during meal times (quick lunch, family dinners) on handheld devices. Job: Discover authentic regional specialties, customize order options (veg/non-veg, spice levels), apply discount coupons, complete secure digital checkout, and follow real-time cooking and delivery progress.
- **Kitchen Operators & Admin Staff**: Cloud kitchen cooks, expeditors, and operational managers. Situation: Managing high-tempo ticket streams in a fast-paced kitchen environment on desktop or tablet displays. Job: Receive instantaneous incoming order alerts, transition ticket preparation stages reliably, toggle menu stock availability on the fly, and review daily sales and performance metrics.

## Product Purpose

Navedyam exists to provide an authentic, dependable cloud kitchen dining platform celebrating traditional Haryanvi and North Indian culinary heritage. Success means friction-free mobile ordering with instant verified payment for diners, paired with uninterrupted real-time order dispatch and ticket management for kitchen operators.

## Positioning

A dedicated single-brand cloud kitchen celebrating authentic regional culinary traditions (Haryanvi & North Indian flavors) with direct kitchen-to-doorstep real-time visibility, contrasting with generic multi-vendor aggregator marketplaces.

## Operating Context

- **Customer Mobile**: Handheld Android/iOS mobile environments (Expo / React Native) used on cellular or variable WiFi connections. Demands streamlined navigation, thumb-accessible interactions, clear pricing breakdowns (GST, delivery fee, discounts), and responsive live order status updates.
- **Kitchen Dashboard**: Web SPA (React 18 / Vite 5) operated on kitchen tablets, POS monitors, or management laptops in busy kitchen environments. Demands high visual contrast, immediate audio/toast cues on order arrival, and one-tap status updates without page refreshes.

## Capabilities and Constraints

- **Capabilities**:
  - Customer authentication via JWT and bcrypt phone/password login.
  - Rich menu catalog with category tabs, dish customization, veg/non-veg indicators, and search.
  - Cart calculation with automated 5% GST and delivery fees.
  - Coupon management supporting percentage and flat discounts.
  - Razorpay mobile checkout with backend HMAC-SHA256 signature verification.
  - Real-time Socket.IO synchronization between customer tracking (`order:${id}`) and kitchen ticket streams (`kitchen`).
  - Operational ticket progression (`placed` → `confirmed` → `preparing` → `out_for_delivery` → `delivered`).
  - Live catalog stock availability toggling with optimistic UI updates.
  - Post-delivery order ratings and 5-star review aggregation.
- **Constraints**:
  - Dedicated single-brand cloud kitchen architecture (multi-vendor marketplace is out of scope).
  - Discrete milestone status tracking rather than continuous GPS courier mapping.
  - Stack: Node.js/Express/MongoDB API, React Native/Expo mobile app, React 18/Vite 5 admin dashboard.

## Brand Commitments

- **Name**: Navedyam (reverent offering of wholesome, authentic food).
- **Voice & Tone**: Grounded, warm, hospitable, culturally proud, and dependable.
- **Visual Identity**: Warm, appetite-stimulating palette drawing from regional heritage—saffron, warm amber/turmeric, emerald greens (for vegetarian clarity), and rich mocha/espresso backdrops. Complete dual-theme support (Light & Dark modes) across mobile and web.

## Evidence on Hand

- Functional full-stack codebase across `backend/`, `frontend/`, and `admin-dashboard/`.
- Seed data with authentic dish titles, descriptions, pricing, and categories in `backend/db/seed.js`.
- Design token system with light and dark mode palettes in `frontend/src/theme.js`.
- Verified product requirements, roadmap, and architecture in `README.md` and `.planning/PROJECT.md`.

## Product Principles

- **Culinary Authenticity First**: Dish representations, naming, and copy honor authentic regional culinary traditions rather than generic fast-food shorthand.
- **High-Glanceability Kitchen Control**: Kitchen interfaces must be impossible to miss or misinterpret across a noisy, active kitchen counter.
- **Transparent Transaction Trust**: Pricing breakdowns (taxes, delivery, discounts) and order preparation milestones are accurate, verified, and updated in real time.
- **Frictionless Mobile Flow**: Dish discovery, customization, and checkout require minimal taps and operate gracefully through network fluctuations.

## Accessibility & Inclusion

- High contrast text ratios adhering to WCAG standards across both Light and Dark modes.
- Clear visual distinction for dietary preferences (emerald green veg indicator vs. distinct non-veg markers).
- Minimum 44x44 dp/px touch targets on mobile touch surfaces and accessible form labels on admin dashboards.
