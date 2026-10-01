---
last_mapped_commit: 0c47d49f56f6f77d675753cd3a97c10fc5be78bb
last_mapped_at: 2026-10-01
---
<!-- refreshed: 2026-10-01 -->

# Architecture

**Analysis Date:** 2026-10-01

## System Overview

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                           Presentation Tier                             │
├───────────────────────────────────┬─────────────────────────────────────┤
│   React Native (Expo SDK 54)      │    React 18 + Vite 5 Admin Web SPA  │
│   `frontend/src/screens/*.js`     │    `admin-dashboard/src/pages/*.jsx`│
└─────────────────┬─────────────────┴──────────────────┬──────────────────┘
                  │                                    │
                  │  HTTP REST (/api)                  │  HTTP REST (/api)
                  │  Socket.IO (order updates)         │  Socket.IO (kitchen feed)
                  ▼                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     Node.js / Express Server API                        │
│                     `backend/server.js`                                 │
├─────────────────────────────────────────────────────────────────────────┤
│ Middlewares: `auth.js` | `authorize.js` | `validate.js` | `rateLimiter` │
├───────────────────────────────────┬─────────────────────────────────────┤
│   Controllers & Route Handlers    │   Business Services Layer           │
│   `backend/routes/*.js`           │   `backend/services/*.service.js`   │
├───────────────────────────────────┴─────────────────────────────────────┤
│   Data Access Layer (Mongoose 9.3 Models)                               │
│   `backend/models/{User,Category,MenuItem,Order,Review,Coupon}.js`      │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│               Data Store & External Service Gateways                    │
├───────────────────┬─────────────────────────┬───────────────────────────┤
│   MongoDB 6+      │   Razorpay Gateway      │   Expo Push Service       │
│   `backend/db/`   │   `services/payment...` │   `services/notification..│
└───────────────────┴─────────────────────────┴───────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| **Server Entry** | Express server initialization, Socket.IO binding, route mounting, error handling | `backend/server.js` |
| **Auth System** | User registration, password hashing, JWT generation & verification, role gating | `backend/routes/auth.js`, `backend/middleware/auth.js` |
| **Catalog Engine** | Menu items & categories browsing, full-text search, cuisine & price filtering | `backend/routes/menu.js`, `backend/models/MenuItem.js` |
| **Order Processing** | Cart stock & price re-validation, coupon calculation, order creation, display ID generation | `backend/routes/orders.js`, `backend/services/order.service.js` |
| **Live Tracking** | Order timeline progression, status transition validation, WebSocket broadcasting | `backend/routes/track.js`, `backend/socket/index.js` |
| **Payments** | Razorpay order generation and HMAC-SHA256 signature verification | `backend/routes/payments.js`, `backend/services/payment.service.js` |
| **Mobile App Shell** | Navigation hierarchy (AuthStack vs MainTabs/Drawer), deep link handling | `frontend/App.js` |
| **Mobile State** | Context-driven cart reducer, authentication, favorites, theming, notifications | `frontend/src/context/*.js` |
| **Mobile UI** | 21 screens covering dish discovery, checkout, tracking, address & review management | `frontend/src/screens/*.js` |
| **Admin App Shell** | Protected routing, sidebar layout, theme switching, real-time kitchen audio/toast alerts | `admin-dashboard/src/App.jsx`, `Layout.jsx` |
| **Admin Operations**| Live order kanban, menu stock toggles, coupon creation, revenue analytics | `admin-dashboard/src/pages/*.jsx` |

## Pattern Overview

**Overall:** 3-tier Layered Architecture (Client-Server-Database) with Event-Driven Real-Time Extensions.

**Key Characteristics:**
- **Layered Backend Separation**: Request → Middleware Validation → Route Handler → Service Business Logic → Mongoose Model.
- **Provider-Based Client Architecture**: React Context providers encapsulate authentication, cart state machine, theme mode, and push notification tokens.
- **Bi-directional WebSocket Rooms**: Socket.IO channels segment traffic into `kitchen` (broadcasting new orders to all admin screens) and `order:${id}` (streaming progression to the placing customer).

## Layers

**API Routing Layer (`backend/routes/`):**
- Purpose: HTTP endpoint dispatch, parameter extraction, and status code responses.
- Depends on: `backend/middleware/`, `backend/models/`, `backend/services/`, `backend/validators/`.
- Used by: Mobile app (`frontend/src/api/client.js`) and Admin app (`admin-dashboard/src/api/client.js`).

**Business Services Layer (`backend/services/`):**
- Purpose: Reusable core domain logic isolated from HTTP concerns (`order.service.js`, `payment.service.js`, `coupon.service.js`, `notification.service.js`).
- Contains: Pricing calculation, Razorpay SDK calls, Expo push batching, discount algorithms.
- Depends on: External SDKs (`razorpay`, `expo-server-sdk`) and Mongoose models.

**Data Access Layer (`backend/models/`):**
- Purpose: Schema validation, indexes, hooks (pre-save, post-save), and aggregation pipelines.
- Contains: 7 Mongoose schemas (`User`, `Category`, `MenuItem`, `Order`, `Review`, `Coupon`, `Notification`).

**Client State Management (`frontend/src/context/` & `admin-dashboard/src/context/`):**
- Purpose: Centralized state distribution to prevent prop drilling.
- Mobile: `AuthContext`, `CartContext` (with `useReducer`), `FavoritesContext`, `NotificationContext`, `ThemeContext`.
- Admin: `AuthContext` (managing `admin_token` and role validation).

## Data Flow

### Primary Request Path: Order Placement & Kitchen Dispatch

1. **Cart Submission**: Mobile user taps checkout in `frontend/src/screens/PaymentScreen.js` invoking `api.placeOrder()`.
2. **Authentication & Validation**: `backend/middleware/auth.js` verifies JWT; `backend/middleware/validate.js` runs Joi validation on items array.
3. **Price Re-Verification**: `backend/routes/orders.js` queries `MenuItem` collection in DB to fetch live prices and verify `is_available: true`.
4. **Discount Calculation**: If coupon provided, `backend/services/coupon.service.js` validates thresholds and calculates deduction.
5. **Persistence**: `backend/models/Order.js` `pre('save')` generates unique `NVD-XXXXX` display ID and saves document.
6. **Real-Time Notification**:
   - Backend calls `io.to('kitchen').emit('new:order', orderData)` in `backend/routes/orders.js`.
   - Admin dashboard receives event in `admin-dashboard/src/pages/DashboardPage.jsx`, plays toast, and updates live count.
7. **Push Alert**: `backend/services/notification.service.js` dispatches Expo push notification to user's phone.

### Secondary Flow: Real-Time Order Tracking

1. **Room Subscription**: Customer opens `frontend/src/screens/TrackScreen.js`, which emits `join:order` with `orderId`.
2. **Kitchen Status Update**: Admin updates order to `preparing` or `out_for_delivery` in `admin-dashboard/src/pages/OrdersPage.jsx` via `PATCH /api/track/:orderId/status`.
3. **Broadcast**: `backend/routes/track.js` updates status history and emits `order:status_update` to room `order:${orderId}`.
4. **Client Animation**: `frontend/src/screens/TrackScreen.js` receives event and animates vertical timeline step in `frontend/src/components/OrderTimeline.js`.

## Key Abstractions

**Display ID Generator (`models/Order.js`):**
- Purpose: Generates human-friendly order codes (`NVD-12345`) instead of raw 24-character hexadecimal MongoDB ObjectIds.
- Pattern: Pre-save Mongoose hook with collision retry loop.

**Dynamic Review Aggregation (`models/Review.js`):**
- Purpose: Keeps `MenuItem.avg_rating` and `rating_count` updated without requiring on-the-fly calculations during catalog browsing.
- Pattern: Post-save Mongoose aggregation pipeline running `$match` and `$group`.

**Optimistic Stock Toggling (`admin-dashboard/src/pages/MenuPage.jsx`):**
- Purpose: Instant UI feedback for kitchen staff when marking items in or out of stock.
- Pattern: Local React state updates immediately with rollback catch handler on network error.

## Entry Points

**Backend Service:**
- `backend/server.js`: Boots HTTP + Socket.IO servers on port 4000 after connecting to MongoDB via `backend/db/connection.js`.

**Mobile Client:**
- `frontend/App.js`: Mounts theme and context providers, renders conditional `RootNavigator` checking authentication.

**Admin Dashboard:**
- `admin-dashboard/src/main.jsx` & `App.jsx`: Mounts React root, renders client router with `ProtectedRoute` guards and toast container.

## Architectural Constraints

- **Single Database Authority**: All business data resides in MongoDB; no dual-write databases (the SQLite files in `backend/db/` are deprecated artifacts).
- **Stateless API**: Authentication is decoupled via JWT; backend instances do not hold session memory, making it container/cluster ready.
- **Client Socket Architecture**: Sockets connect with WebSocket transport preference (`transports: ['websocket']`) to avoid long-polling overhead.

## Anti-Patterns

### Anti-Pattern 1: Premature Kitchen Notification for Unpaid Orders

**What happens:** In `backend/routes/orders.js`, orders with `payment_method: 'razorpay'` are saved and immediately emit `new:order` to the kitchen socket room before Razorpay payment is collected.  
**Why it's wrong:** If a user closes the payment sheet without paying, the kitchen prepares a phantom order.  
**Do this instead:** Mark Razorpay orders as `status: 'placed', payment_status: 'pending'`, and only emit `new:order` to the kitchen when `POST /api/payments/verify` confirms the signature.

### Anti-Pattern 2: Unmounted SocketProvider in Mobile App

**What happens:** `frontend/src/context/SocketContext.js` is defined but `<SocketProvider>` is never added to `frontend/App.js`.  
**Why it's wrong:** Calling `useSocket()` in components fails or returns null, forcing `TrackScreen.js` to instantiate a raw, unmanaged socket connection.  
**Do this instead:** Wrap `<SocketProvider>` in `frontend/App.js` and consume `useSocket()` inside `TrackScreen.js`.

### Anti-Pattern 3: Bypassing Dedicated Service Layers

**What happens:** Several route handlers (`backend/routes/coupons.js`, `backend/routes/payments.js`) re-implement validation and HMAC hashing inline rather than invoking `backend/services/coupon.service.js` and `payment.service.js`.  
**Why it's wrong:** Violates DRY; changes made to business logic in services do not propagate to route endpoints.  
**Do this instead:** Centralize all domain algorithms in services and have routes act as thin controllers.

## Error Handling

**Strategy:** Centralized middleware error interception with domain-specific status code mapping.

**Patterns:**
- `backend/utils/asyncHandler.js`: Wraps async route handlers to catch rejected promises and forward to `next(err)`.
- `backend/utils/ApiError.js`: Subclasses native `Error` with HTTP status codes and `isOperational = true`.
- `backend/middleware/errorHandler.js`: Maps Mongoose `ValidationError` (400), CastError (400), Mongo Duplicate Key `11000` (409), and JWT errors (401).

## Cross-Cutting Concerns

**Logging:** Console request tracing via `morgan('dev')` in development.  
**Validation:** Declarative Joi schema validation executed before handler execution in `backend/middleware/validate.js`.  
**Authentication:** Header extraction (`Authorization: Bearer <token>`) validated via `backend/middleware/auth.js`.

---

*Architecture analysis: 2026-10-01*
