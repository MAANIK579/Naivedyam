---
last_mapped_commit: 0c47d49f56f6f77d675753cd3a97c10fc5be78bb
last_mapped_at: 2026-10-01
---
# Codebase Concerns

**Analysis Date:** 2026-10-01

## Critical Bugs & Production Blockers

### 1. Premature Kitchen Alert for Unpaid Razorpay Orders

- **Issue:** In `backend/routes/orders.js`, orders placed with `payment_method: 'razorpay'` are persisted with status `placed` and immediately broadcast `io.to('kitchen').emit('new:order', ...)` before the user completes the payment modal.
- **Files:** `backend/routes/orders.js` (lines 40–80)
- **Impact:** If a customer cancels checkout or payment fails, the kitchen receives a ticket and begins preparing food for an unpaid order.
- **Fix approach:** Guard the `new:order` socket emission and status transition. For Razorpay orders, record them in `pending` state and only emit `new:order` when `POST /api/payments/verify` validates the payment signature.

### 2. Missing `SocketProvider` in Mobile Navigation Tree

- **Issue:** `frontend/src/context/SocketContext.js` exists and exports `SocketProvider` and `useSocket()`, but `<SocketProvider>` is never wrapped inside `frontend/App.js`.
- **Files:** `frontend/App.js`, `frontend/src/context/SocketContext.js`, `frontend/src/screens/TrackScreen.js`
- **Impact:** Any component invoking `useSocket()` will crash or receive `null`. Consequently, `frontend/src/screens/TrackScreen.js` had to bypass the context and instantiate a separate unmanaged `io(SOCKET_URL)` connection.
- **Fix approach:** Mount `<SocketProvider>` inside `frontend/App.js` around authenticated navigation, and refactor `TrackScreen.js` to consume `useSocket()`.

### 3. TrackScreen Wipes Tracking State on Delivery, Disabling Rating Button

- **Issue:** When an order updates to `delivered` or `cancelled`, `frontend/src/screens/TrackScreen.js` executes:
  ```javascript
  if (FINAL_ORDER_STATUSES.includes(status)) {
    setTracking(null);
    setTrackNotice('This order is completed or cancelled...');
    return;
  }
  ```
  However, later in the render tree, the screen attempts to show the review prompt:
  ```javascript
  {tracking?.order?.status === 'delivered' && (
    <TouchableOpacity style={styles.rateBtn} onPress={() => navigation.navigate('OrderRating', ...)}>
  ```
- **Files:** `frontend/src/screens/TrackScreen.js`
- **Impact:** The "Rate Your Order" button never renders because `tracking` is wiped to `null` immediately upon delivery.
- **Fix approach:** Preserve `tracking` state upon reaching `delivered` status; only set a flag indicating real-time polling/socket listeners can be paused.

### 4. Unverified UPI Checkout

- **Issue:** Selecting UPI in `frontend/src/screens/PaymentScreen.js` opens a deep-link `upi://pay?...` and provides an "Already Paid" button that immediately marks the order as paid without verifying any transaction reference or webhook callback.
- **Files:** `frontend/src/screens/PaymentScreen.js`
- **Impact:** Customers can place orders without transferring funds.
- **Fix approach:** Route UPI transactions through Razorpay's UPI intent / QR gateway so server-side webhooks or signature callbacks verify the credit before marking `payment_status: 'paid'`.

### 5. Notification Deep Linking Never Receives Navigation Reference

- **Issue:** `frontend/src/context/NotificationContext.js` exports `setNavigation(nav)` to handle background push notification taps (e.g. directing to `TrackScreen`), but neither `App.js` nor `RootNavigator` connects the navigation ref.
- **Files:** `frontend/App.js`, `frontend/src/context/NotificationContext.js`
- **Impact:** Tapping push notifications opens the app but fails to navigate to the order tracking screen.
- **Fix approach:** Create `const navigationRef = useNavigationContainerRef();`, attach to `<NavigationContainer ref={navigationRef}>`, and pass to `setNavigation(navigationRef)` in `NotificationContext.js`.

## Security & Sensitive Data

### 6. Public Tracking Endpoint Data Exposure

- **Issue:** `GET /api/track/:orderId` in `backend/routes/track.js` has no authentication middleware. Because order display IDs follow a predictable sequential pattern (`NVD-XXXXX`), any actor can scrape delivery addresses, customer phone numbers, and order contents.
- **Files:** `backend/routes/track.js`
- **Impact:** Customer Personally Identifiable Information (PII) leak.
- **Fix approach:** Require `authMiddleware` on tracking requests and assert `req.user._id.toString() === order.user.toString()` (or `req.user.role === 'admin'`).

### 7. Secrets and Key Residue in Version Control

- **Issue:** `google-services.json` and `debug.keystore` in `frontend/android/app/`, as well as `backend/.env` (if tracked), may contain sensitive API credentials in git history.
- **Files:** `frontend/android/app/google-services.json`, `frontend/android/app/debug.keystore`, `backend/.env`
- **Impact:** Leakage of FCM keys, Razorpay test/live keys, and JWT signing secrets.
- **Fix approach:** Ensure `.gitignore` ignores `.env` files; rotate any keys exposed in public repositories.

## Tech Debt & Architectural Gaps

### 8. Hardcoded `localhost:4000` URLs in Admin Dashboard

- **Issue:** Both `admin-dashboard/src/pages/DashboardPage.jsx` and `OrdersPage.jsx` connect to `io('http://localhost:4000')` rather than utilizing environment configuration.
- **Files:** `admin-dashboard/src/pages/DashboardPage.jsx`, `admin-dashboard/src/pages/OrdersPage.jsx`
- **Impact:** Admin dashboard WebSocket connection fails completely when deployed to production or run across local network IP addresses.
- **Fix approach:** Read from `import.meta.env.VITE_WS_URL || window.location.origin`.

### 9. Coupon Over-Redemption Race Condition

- **Issue:** `backend/services/coupon.service.js` checks coupon validity in one step and increments `used_count` in a separate database call without using atomic conditional updates or transactions.
- **Files:** `backend/services/coupon.service.js`, `backend/routes/orders.js`
- **Impact:** Under concurrent checkout requests, users could exceed both global `usage_limit` and `per_user_limit`.
- **Fix approach:** Use an atomic `findOneAndUpdate` with `{ code, used_count: { $lt: usage_limit } }`.

### 10. Display ID Collision Potential

- **Issue:** `backend/models/Order.js` generates random 5-digit IDs (`NVD-XXXXX`) via a `findOne` query in a pre-save hook.
- **Files:** `backend/models/Order.js`
- **Impact:** High order concurrency could cause two simultaneous saves to pick the same random integer, triggering a MongoDB E11000 duplicate key error.
- **Fix approach:** Implement retry catch handling or an auto-incrementing counter collection.

### 11. Redundant Service Logic & Inconsistent API Contracts

- **Issue:** `backend/routes/coupons.js` and `backend/routes/payments.js` duplicate algorithms already defined in `services/`, and response formats inconsistently mix `snake_case` with `camelCase`.
- **Files:** `backend/routes/coupons.js`, `backend/routes/payments.js`
- **Impact:** Fixes made to services do not reflect on route handlers; frontend components require excessive `??` fallback chaining.
- **Fix approach:** Refactor routes to delegate entirely to services and enforce uniform DTO formatting.

### 12. Deprecated SQLite Files in Repository

- **Issue:** `backend/db/navedyam.db`, `navedyam.db-shm`, and `navedyam.db-wal` are legacy files from an earlier SQLite prototype that have been superseded by MongoDB.
- **Files:** `backend/db/navedyam.db*`
- **Impact:** Confuses developers and inflates repository footprint.
- **Fix approach:** Delete the SQLite database files and update `backend/README.md`.

---

*Concerns analysis: 2026-10-01*
