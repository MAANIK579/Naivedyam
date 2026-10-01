---
last_mapped_commit: 0c47d49f56f6f77d675753cd3a97c10fc5be78bb
last_mapped_at: 2026-10-01
---
# Technology Stack

**Analysis Date:** 2026-10-01

## Languages

**Primary:**
- JavaScript (Node.js CommonJS) - Backend (`backend/server.js`, `backend/routes/*.js`, `backend/models/*.js`, `backend/services/*.js`)
- JavaScript / JSX (React Native / Expo) - Customer Mobile Application (`frontend/App.js`, `frontend/src/**/*.js`)
- JavaScript / JSX (React 18 / Vite 5) - Kitchen & Admin Operations Dashboard (`admin-dashboard/src/**/*.jsx`)

**Secondary:**
- Kotlin - Android native wrapper and bridge (`frontend/android/app/src/main/java/com/navedyam/app/MainActivity.kt`, `MainApplication.kt`)
- XML - Android manifests, resources, vector drawables (`frontend/android/app/src/main/res/values/*.xml`)
- CSS - Custom CSS variables and styling system (`admin-dashboard/src/styles/global.css`)

## Runtime

**Environment:**
- Node.js (v18.0.0+ recommended)
- Mobile Runtime: Hermes JS Engine on Android / iOS via Expo SDK 54 / React Native 0.81.5

**Package Managers:**
- npm (`package-lock.json` present in each subproject: `backend/`, `frontend/`, `admin-dashboard/`)
- Lockfiles: Present across all 3 apps

## Frameworks

**Core:**
- Express.js (`4.18.2`) - REST API server and HTTP routing (`backend/server.js`)
- React Native (`0.81.5`) & Expo (`~54.0.0`) - Cross-platform mobile client (`frontend/App.js`)
- React (`18.2.0`) & Vite (`5.1.0`) - Admin SPA dev server & bundler (`admin-dashboard/vite.config.js`)
- React Navigation (`6.x`) - Native Stack (`@react-navigation/native-stack`), Bottom Tabs (`@react-navigation/bottom-tabs`), and navigation containers

**Database & ODM:**
- Mongoose (`9.3.0`) - MongoDB Object Data Modeling, schema validation, hooks, and query middleware (`backend/db/connection.js`, `backend/models/*.js`)

**Real-Time & WebSockets:**
- Socket.IO Server (`4.8.3`) - Event-driven bidirectional communication (`backend/socket/index.js`)
- Socket.IO Client (`4.8.3` on mobile & `4.7.0` on admin) - Real-time order status updates and kitchen alerts

**Validation & Security:**
- Joi (`18.0.2`) - API request schema validation (`backend/validators/*.validator.js`)
- jsonwebtoken (`9.0.2`) - Stateless JWT authentication (`backend/middleware/auth.js`)
- bcryptjs (`2.4.3`) - Salted password hashing (`backend/models/User.js`)
- helmet (`8.1.0`) - Secure HTTP headers (`backend/server.js`)
- cors (`2.8.5`) - Cross-origin resource sharing (`backend/server.js`)
- express-rate-limit (`8.3.1`) - IP-based API request throttling (`backend/middleware/rateLimiter.js`)

**Payment Gateway:**
- Razorpay Node SDK (`2.9.6`) - Server-side order creation and payment verification (`backend/services/payment.service.js`)
- react-native-razorpay (`2.3.1`) - Native mobile checkout modal (`frontend/src/screens/PaymentScreen.js`)

**Mobile Device Integrations:**
- expo-notifications (`~0.32.16`) & expo-server-sdk (`6.1.0`) - Push notification delivery and push token registration
- expo-secure-store (`~15.0.8`) - Encrypted JWT storage on device keychain/Keystore (`frontend/src/context/AuthContext.js`)
- @react-native-async-storage/async-storage (`2.2.0`) - Persistent cart, theme mode, and cached state
- react-native-vector-icons (`^10.3.0`) / @expo/vector-icons - Mobile icon primitives

**Admin UI & Visualization:**
- Recharts (`2.12.0`) - Business analytics charts (`admin-dashboard/src/pages/AnalyticsPage.jsx`)
- react-hot-toast (`2.4.1`) - Toast alerts for new order notifications (`admin-dashboard/src/App.jsx`)
- react-router-dom (`6.22.0`) - Admin client-side routing (`admin-dashboard/src/App.jsx`)

## Key Dependencies

**Critical:**
- `mongoose`: Governs all business data persistence, schemas, and integrity (`backend/models/*.js`).
- `socket.io` & `socket.io-client`: Drives kitchen ticket streaming and customer live tracking.
- `react-native-razorpay`: Powers the checkout revenue collection on Android/iOS.
- `expo-secure-store`: Secures bearer tokens for customer authentication.

**Infrastructure:**
- `dotenv` (`17.3.1`): Environment configuration loader (`backend/config/index.js`).
- `morgan` (`1.10.1`): HTTP request logging in development.

## Configuration

**Environment:**
- Backend configuration centralized in `backend/config/index.js` reading from `backend/.env`.
- Required backend keys: `PORT`, `MONGODB_URI`, `JWT_SECRET`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `ADMIN_DEFAULT_PASSWORD`.
- Mobile configuration defined in `frontend/app.json` (slug `navedyam`, bundle ID `com.navedyam.app`) and dynamically resolved `EXPO_PUBLIC_API_URL` in `frontend/src/api/client.js`.
- Admin configuration in `admin-dashboard/vite.config.js` with proxying of `/api` requests to `http://localhost:4000`.

**Build:**
- Mobile builds managed via Expo Application Services (`frontend/eas.json`) targeting Android APK/AAB and iOS.
- Admin dashboard built via Vite (`npm run build` targeting `admin-dashboard/dist`).

## Platform Requirements

**Development:**
- Node.js v18+
- MongoDB 6.0+ instance running locally or via MongoDB Atlas
- Expo CLI (`npx expo start`) or Android Studio / physical Android device for mobile testing
- Local network access / shared Wi-Fi for mobile phone to access backend API

**Production:**
- Backend: Containerized Node.js service (Docker) or Linux VM behind reverse proxy (Nginx / Caddy)
- Database: Managed MongoDB Replica Set (Atlas)
- Admin Dashboard: Static hosting (Vercel / Netlify / Cloudflare Pages / S3)
- Mobile App: Google Play Store (AAB via EAS) and Apple App Store (IPA via EAS)

---

*Stack analysis: 2026-10-01*
