---
last_mapped_commit: 0c47d49f56f6f77d675753cd3a97c10fc5be78bb
last_mapped_at: 2026-10-01
---
# Coding Conventions

**Analysis Date:** 2026-10-01

## Naming Patterns

**Files:**
- React components and screens use PascalCase: `frontend/src/screens/HomeScreen.js`, `admin-dashboard/src/pages/OrdersPage.jsx`, `frontend/src/components/BannerCarousel.js`.
- Services and utilities use camelCase or domain dot notation: `backend/services/order.service.js`, `backend/utils/asyncHandler.js`.
- Mongoose Models use singular PascalCase: `backend/models/MenuItem.js`, `backend/models/Order.js`.
- Express route modules use plural lowercase: `backend/routes/menu.js`, `backend/routes/orders.js`.

**Functions & Variables:**
- Functions, methods, and hooks use camelCase: `calculateOrderTotal`, `applyCouponUsage`, `useAuth`, `handleToggleStock`.
- React functional components use PascalCase: `function StatCard({ title, value })`.
- Database schema attributes use snake_case: `display_id`, `grand_total`, `is_available`, `delivery_address`.
- Constants and frozen objects use UPPER_SNAKE_CASE: `ORDER_STATUS_STEPS`, `DEFAULT_DELIVERY_FEE`.

**Types / Schemas:**
- Joi validation schemas use camelCase suffixed with `Schema`: `registerSchema`, `placeOrderSchema`, `createCouponSchema`.

## Code Style

**JavaScript Standards:**
- Modern ES6+ syntax across all modules: destructuring, async/await, arrow functions, optional chaining (`?.`), and nullish coalescing (`??`).
- Module formats:
  - Backend uses Node.js CommonJS (`require` / `module.exports`).
  - Mobile Frontend and Admin Dashboard use ES Modules (`import` / `export default` / named exports).

**Formatting:**
- 2-space indentation throughout.
- Single quotes preferred in JS/JSX files (`'react'`, `'#16A34A'`).
- Semicolons used consistently at the end of statements.

## Import Organization

**Backend Import Order:**
1. Core Node.js built-ins (`crypto`, `http`, `path`)
2. Third-party npm libraries (`express`, `mongoose`, `joi`, `socket.io`, `razorpay`)
3. Internal configurations & utilities (`../config`, `../utils/asyncHandler`)
4. Middleware & validators (`../middleware/auth`, `../validators/order.validator`)
5. Models & Services (`../models/Order`, `../services/order.service`)

**Frontend Import Order:**
1. React & React Native primitives (`import React, { useState, useEffect } from 'react'`, `import { View, Text, StyleSheet } from 'react-native'`)
2. Navigation & vector icons (`@react-navigation/native`, `@expo/vector-icons`)
3. Context hooks (`useAuth`, `useCart`, `useTheme`, `useNotification`)
4. Shared UI components (`from '../components'`)
5. API client & theme constants (`import api from '../api/client'`, `import { SPACING, RADIUS } from '../theme'`)

## Error Handling

**Backend Strategy:**
- Centralized asynchronous error propagation using `asyncHandler`:
  ```javascript
  // backend/routes/orders.js
  router.post('/', authMiddleware, validate(placeOrderSchema), asyncHandler(async (req, res) => {
    // Controller logic without boilerplate try/catch
    if (!item) throw new ApiError(404, 'Item not found');
  }));
  ```
- All unhandled exceptions funnel into `backend/middleware/errorHandler.js`, returning structured JSON:
  `{ success: false, error: 'User-friendly message', ...(isDev && { stack: err.stack }) }`.

**Frontend Strategy:**
- User-facing async calls are wrapped in `try/catch/finally` with loading states:
  ```javascript
  try {
    setLoading(true);
    const data = await api.getMenuItems();
    setItems(data.items);
  } catch (err) {
    Alert.alert('Error', err.message || 'Failed to load menu');
  } finally {
    setLoading(false);
  }
  ```
- Admin dashboard uses `react-hot-toast` (`toast.error(...)`, `toast.success(...)`).

## Logging

**Framework:**
- Server-side HTTP traffic is logged via `morgan('dev')`.
- Operational and startup logs use standard `console.log` / `console.error` with emoji status badges (`✅ MongoDB Connected`, `🍛 Navedyam API running on http://localhost:4000`).

## Comments & Documentation

**When to Comment:**
- Comments are used to delineate major route sections (`// ─── AUTH CONTROLLERS ───`).
- Business rules are annotated inline (e.g. calculation of 5% GST and ₹30 standard delivery fee in `services/order.service.js`).
- Complex Regexes and aggregations are documented with their purpose.

## Function & Component Design

**Size:**
- Modular functions adhering to single responsibility. Complex operations are split into helper methods (e.g., `calculateItemTotal`, `verifySignature`).
- Screens are kept focused; large modals and cards are extracted into `frontend/src/components/` (e.g., `ItemDetailModal.js`, `OrderTimeline.js`).

**Props & State:**
- Mobile components declare destructuring defaults: `function Button({ title, variant = 'primary', loading = false, onPress })`.
- Shared state is encapsulated in custom hooks: `useCart()`, `useAuth()`, `useTheme()`, `useAdminAuth()`.

---

*Convention analysis: 2026-10-01*
