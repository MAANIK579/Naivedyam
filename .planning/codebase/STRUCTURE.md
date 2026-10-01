---
last_mapped_commit: 0c47d49f56f6f77d675753cd3a97c10fc5be78bb
last_mapped_at: 2026-10-01
---
# Codebase Structure

**Analysis Date:** 2026-10-01

## Directory Layout

```
navedyam/
├── backend/                  # Node.js + Express API server & MongoDB ODM
│   ├── config/               # App configuration & environment loader
│   ├── db/                   # MongoDB connection & idempotent seed script
│   ├── middleware/           # Express middleware (auth, RBAC, validation, rate limits, errors)
│   ├── models/               # Mongoose schemas (User, Category, MenuItem, Order, Review, Coupon, Notification)
│   ├── routes/               # Express API endpoints grouped by domain resource
│   ├── services/             # Core business logic (orders, payments, coupons, push notifications)
│   ├── socket/               # Socket.IO connection handling & room management
│   ├── utils/                # Custom error classes and async helper wrappers
│   ├── validators/           # Joi validation schemas for request payloads
│   ├── server.js             # HTTP/WebSocket application entry point
│   └── package.json          # Backend dependencies and run scripts
│
├── frontend/                 # React Native / Expo cross-platform mobile application
│   ├── android/              # Native Android project wrapper, Gradle build scripts & FCM configs
│   ├── dist/                 # Web export build artifacts
│   ├── src/
│   │   ├── api/              # Axios HTTP client, host resolver, and grouped API calls
│   │   ├── components/       # Shared UI components (Button, Input, Card, Timeline, Modals, Badges)
│   │   ├── context/          # React Context providers (Auth, Cart, Theme, Socket, Favorites, Notifications)
│   │   ├── screens/          # 21 application screens organized by user workflow
│   │   └── theme.js          # Unified Light and Dark mode design tokens & palettes
│   ├── App.js                # Root mobile component & React Navigation hierarchy
│   ├── app.json              # Expo application configuration & plugin settings
│   ├── eas.json              # Expo Application Services build profiles
│   └── package.json          # Mobile dependencies & start scripts
│
└── admin-dashboard/          # React 18 + Vite 5 Kitchen & Operations Dashboard
    ├── src/
    │   ├── api/              # Axios client configured with interceptors and admin endpoints
    │   ├── components/       # Reusable admin UI primitives (Layout, Modal, StatCard, StatusBadge, Icons)
    │   ├── context/          # Admin authentication state provider
    │   ├── pages/            # 8 operational pages (Dashboard, Orders, Menu, Coupons, Users, Analytics)
    │   ├── styles/           # Global CSS variables, reset, themes, and glassmorphism styling
    │   ├── theme/            # Design tokens mapping to CSS variables
    │   ├── App.jsx           # Client router, protected routes, and toast container
    │   └── main.jsx          # Vite React root mount
    ├── index.html            # Admin HTML shell & font definitions
    ├── vite.config.js        # Vite bundler configuration & /api reverse proxy
    └── package.json          # Admin dependencies & build scripts
```

## Directory Purposes

**`backend/models/`:**
- Purpose: Defines database schemas, field validations, compound indexes, and lifecycle hooks.
- Key files: `User.js`, `Category.js`, `MenuItem.js`, `Order.js`, `Review.js`, `Coupon.js`, `Notification.js`.

**`backend/routes/`:**
- Purpose: HTTP endpoint definitions and request dispatch.
- Key files: `auth.js`, `menu.js`, `orders.js`, `track.js`, `payments.js`, `admin.js`, `coupons.js`, `reviews.js`, `addresses.js`, `favorites.js`, `notifications.js`.

**`backend/services/`:**
- Purpose: Encapsulates pure business logic and third-party SDK calls.
- Key files: `order.service.js`, `payment.service.js`, `coupon.service.js`, `notification.service.js`.

**`frontend/src/screens/`:**
- Purpose: Mobile user interface screens.
- Key categories:
  - Discovery: `HomeScreen.js`, `MenuScreen.js`, `SearchScreen.js`, `FavoritesScreen.js`
  - Checkout & Billing: `CartScreen.js`, `PaymentScreen.js`, `CouponScreen.js`, `AddressesScreen.js`, `AddAddressScreen.js`, `OrderSuccessScreen.js`
  - Order Management: `TrackScreen.js`, `OrderHistoryScreen.js`, `OrderDetailScreen.js`, `OrderRatingScreen.js`, `ReviewScreen.js`, `MyReviewsScreen.js`
  - Account: `ProfileScreen.js`, `HelpScreen.js`, `NotificationsScreen.js`, `LoginScreen.js`, `RegisterScreen.js`

**`frontend/src/context/`:**
- Purpose: Client-side reactive state machines.
- Key files: `AuthContext.js`, `CartContext.js`, `FavoritesContext.js`, `NotificationContext.js`, `ThemeContext.js`, `SocketContext.js`.

**`admin-dashboard/src/pages/`:**
- Purpose: Admin view screens for kitchen staff and management.
- Key files: `DashboardPage.jsx`, `OrdersPage.jsx`, `OrderDetailModal.jsx`, `MenuPage.jsx`, `CouponsPage.jsx`, `UsersPage.jsx`, `AnalyticsPage.jsx`, `LoginPage.jsx`.

## Key File Locations

**Entry Points:**
- `backend/server.js`: Node API and Socket.IO server
- `frontend/App.js`: Mobile root and navigation controller
- `admin-dashboard/src/main.jsx`: Admin Web SPA mount

**Configuration:**
- `backend/config/index.js`: Server environment parser with fallbacks
- `frontend/app.json`: Expo native configurations and permissions
- `frontend/eas.json`: Cloud APK/AAB build configuration
- `admin-dashboard/vite.config.js`: Vite dev server and proxy configuration

**Core Logic & APIs:**
- `backend/services/order.service.js`: Pricing, fee, and status calculations
- `frontend/src/api/client.js`: Mobile REST communication layer
- `admin-dashboard/src/api/client.js`: Admin REST communication layer

## Naming Conventions

**Files:**
- React components / screens: PascalCase (`HomeScreen.js`, `OrderDetailModal.jsx`, `Layout.jsx`)
- Services and utilities: camelCase or dotted (`order.service.js`, `asyncHandler.js`, `client.js`)
- Mongoose Models: PascalCase (`User.js`, `Order.js`, `MenuItem.js`)
- Route files: plural lowercase (`orders.js`, `coupons.js`, `addresses.js`)

**Variables & Functions:**
- JavaScript variables, functions, and React hooks: camelCase (`calculateOrderTotal`, `useAuth`, `handlePlaceOrder`)
- Database document fields: snake_case (`display_id`, `is_available`, `grand_total`, `delivery_address`)
- Constants & Enums: UPPER_SNAKE_CASE (`ORDER_STATUS`, `STATUS_STEPS`, `LIGHT_COLORS`)

## Where to Add New Code

**New Backend API Feature:**
- Add schema/model (if needed): `backend/models/NewModel.js`
- Add business service: `backend/services/newFeature.service.js`
- Add Joi validator: `backend/validators/newFeature.validator.js`
- Add route handler: `backend/routes/newFeature.js`
- Register route: mount in `backend/server.js` under `/api/new-feature`

**New Mobile Screen / Component:**
- Screen implementation: `frontend/src/screens/NewScreen.js`
- Register in navigation: `frontend/App.js` in `<AppStack.Screen name="New" component={NewScreen} />`
- Add reusable UI: `frontend/src/components/NewComponent.js` and export in `frontend/src/components/index.js`
- API calls: define in `frontend/src/api/client.js`

**New Admin Page:**
- Page component: `admin-dashboard/src/pages/NewAdminPage.jsx`
- Add route: `admin-dashboard/src/App.jsx` inside `<Route element={<Layout><NewAdminPage /></Layout>} />`
- Add sidebar link: `admin-dashboard/src/components/Layout.jsx`

## Special Directories

**`backend/db/`:**
- Purpose: Database configuration and seeding scripts. Contains legacy SQLite files (`navedyam.db*`) which should be archived.
- Generated: Database files were generated during earlier runs.
- Committed: Seed script is committed; `.db` binaries should be excluded.

**`frontend/android/`:**
- Purpose: Pre-built native Android Gradle project.
- Generated: Pre-built via Expo Prebuild (`npx expo prebuild`).
- Committed: Yes, enables custom native modules like `react-native-razorpay`.

---

*Structure analysis: 2026-10-01*
