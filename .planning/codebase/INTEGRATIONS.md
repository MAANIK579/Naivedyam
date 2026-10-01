---
last_mapped_commit: 0c47d49f56f6f77d675753cd3a97c10fc5be78bb
last_mapped_at: 2026-10-01
---
# External Integrations

**Analysis Date:** 2026-10-01

## APIs & External Services

**Payment Processing:**
- Razorpay Payments API - Online payments via UPI, Cards, NetBanking, and Wallets
  - Backend SDK: `razorpay` (`backend/services/payment.service.js`)
  - Mobile SDK: `react-native-razorpay` (`frontend/src/screens/PaymentScreen.js`)
  - Auth: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` in `backend/.env`
  - Flow: Server creates order in paise → Client opens RazorpayCheckout → Server verifies HMAC-SHA256 signature (`razorpay_order_id|razorpay_payment_id`)

**Push Notifications:**
- Expo Push Notification Service - Delivers remote push notifications to Android and iOS devices
  - Backend SDK: `expo-server-sdk` (`backend/services/notification.service.js`)
  - Mobile SDK: `expo-notifications` (`frontend/src/context/NotificationContext.js`)
  - Push Credentials: `google-services.json` in `frontend/android/app/` for Firebase Cloud Messaging (FCM) on Android
  - Auth: Optional `EXPO_PUSH_ACCESS_TOKEN` in `backend/.env`
  - Triggers: Order placement, status updates, promotional alerts

**Real-Time WebSocket Transport:**
- Socket.IO Server & Client - Bi-directional real-time event streaming
  - Server: `socket.io` mounted on HTTP server in `backend/server.js` and managed in `backend/socket/index.js`
  - Clients: `socket.io-client` in `frontend/src/screens/TrackScreen.js` and `admin-dashboard/src/pages/DashboardPage.jsx`, `OrdersPage.jsx`
  - Channels & Rooms:
    - `kitchen` room: Notified on `new:order` when orders are placed
    - `order:${orderId}` room: Notified on `order:status_update` as kitchen advances order progress

## Data Storage

**Databases:**
- MongoDB (Document Store)
  - Connection: `MONGODB_URI` in `backend/.env` (default: `mongodb://localhost:27017/navedyam`)
  - Client / ODM: Mongoose 9.3 (`backend/db/connection.js`)
  - Models: `User`, `Category`, `MenuItem`, `Order`, `Review`, `Coupon`, `Notification`

**File & Media Storage:**
- Current Implementation: Unicode emoji and remote image URLs stored as string fields (`emoji`, `image_url` on `MenuItem` and `Category`)
- No active cloud blob storage (S3 / Cloudinary) configured yet; ready for cloud bucket integration.

**Caching & Transient Storage:**
- In-memory Node.js runtime process (no Redis instance configured)
- Mobile Client Cache: `@react-native-async-storage/async-storage` for cart items (`navedyam_cart`) and user preferences (`navedyam_theme_mode`)

## Authentication & Identity

**Auth Provider:**
- Custom JWT Stateless Authentication
  - Implementation: `jsonwebtoken` + `bcryptjs` (10 rounds) in `backend/models/User.js` and `backend/middleware/auth.js`
  - Key configuration: `JWT_SECRET` and `JWT_EXPIRES_IN` (default: 30 days) in `backend/config/index.js`
  - Mobile Storage: `expo-secure-store` storing token under `navedyam_token` (`frontend/src/context/AuthContext.js`)
  - Admin Storage: `localStorage` storing token under `admin_token` (`admin-dashboard/src/context/AuthContext.jsx`)
  - Roles: `customer`, `admin`, `delivery_partner` checked via `backend/middleware/authorize.js`

## Monitoring & Observability

**Error Tracking:**
- Centralized Express Error Middleware (`backend/middleware/errorHandler.js`)
- Development stack trace logging when `NODE_ENV === 'development'`
- No third-party APM or exception tracker (e.g. Sentry) currently installed

**Logs:**
- HTTP Request Logging: `morgan('dev')` formatting method, URL, status code, and latency in terminal console

## CI/CD & Deployment

**Mobile Build Pipeline:**
- Expo Application Services (EAS Build) configured in `frontend/eas.json`
- Supports `development` (standalone debug APK), `preview` (internal distribution APK), and `production` (Google Play AAB)
- Project ID: `f24ee4f9-6c58-415b-8c0c-0af4ea6e9c66`

**Web / Admin Deployment:**
- Standard Vite static build output (`admin-dashboard/dist`) suitable for static web hosting

## Environment Configuration

**Required Backend Environment Variables (`backend/.env`):**
- `PORT`: HTTP port (default: 4000)
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for signing authorization tokens
- `RAZORPAY_KEY_ID`: Razorpay public test/live key
- `RAZORPAY_KEY_SECRET`: Razorpay private HMAC secret
- `ADMIN_DEFAULT_PASSWORD`: Seed password for default admin account
- `EXPO_PUSH_ACCESS_TOKEN`: (Optional) Expo notification service access token
- `NODE_ENV`: Runtime mode (`development` / `production`)

**Secrets Location:**
- Local `.env` files in `backend/` and `frontend/` (Must be kept in `.gitignore` and excluded from source control)

## Webhooks & Callbacks

**Incoming:**
- Razorpay Webhooks: Not yet exposed as an HTTP route; signature verification is currently handled via direct client POST to `/api/payments/verify`.
- Expo Notification Response: Handled on client via `Notifications.addNotificationResponseReceivedListener` (`frontend/src/context/NotificationContext.js`).

**Outgoing:**
- Expo Push API: `POST https://exp.host/--/api/v2/push/send` executed via `expo-server-sdk` in `backend/services/notification.service.js`.

---

*Integration audit: 2026-10-01*
