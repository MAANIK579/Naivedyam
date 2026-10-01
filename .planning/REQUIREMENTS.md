# Requirements: Navedyam Cloud Kitchen

**Defined:** 2026-10-01  
**Core Value:** Customers can seamlessly place authentic food orders and receive real-time updates from kitchen confirmation to doorstep delivery, while kitchen operators have instantaneous, reliable ticket management.

## v1 Requirements

### Phase 1: Codebase Error & Bug Elimination
- [x] **BUG-01**: Secure public tracking endpoint (`/api/track/:orderId`) with authentication checks to prevent PII and delivery address exposure.
- [x] **BUG-02**: Remove deprecated legacy SQLite database files from `backend/db/` and verify `.env` is strictly gitignored.
- [x] **BUG-03**: Guard Razorpay order lifecycle so kitchen is ONLY notified via Socket.IO after payment signature is verified via `/api/payments/verify`.
- [x] **BUG-04**: Fix coupon race condition in `coupon.service.js` with atomic conditional updates.
- [x] **BUG-05**: Add error handling to Review model post-save aggregation hook to prevent unhandled promise rejections.
- [x] **BUG-06**: Mount `<SocketProvider>` in mobile `App.js` and refactor `TrackScreen.js` to consume `useSocket()` from context.
- [x] **BUG-07**: Fix `TrackScreen.js` so reaching `delivered` status preserves tracking data, allowing the "Rate Your Order" button to render.
- [x] **BUG-08**: Connect `navigationRef` in mobile `App.js` to `NotificationContext.js` so push notification taps navigate to order tracking.
- [x] **BUG-09**: Fix theme color contrast anomalies in `frontend/src/theme.js` (light mode textMuted readability and dark mode green badges).
- [x] **BUG-10**: Configure Admin Dashboard (`DashboardPage.jsx`, `OrdersPage.jsx`, `api/client.js`) to use dynamic environment variables (`VITE_API_URL`, `VITE_WS_URL`) instead of hardcoded `localhost:4000`.

### Phase 2: Feature Enhancements
- [ ] **FEAT-01**: Support food dish images/photo URLs in catalog browsing and item detail cards on mobile and admin.
- [ ] **FEAT-02**: Customer order self-cancellation with reason selection (permitted while order is `placed` or `confirmed`).
- [ ] **FEAT-03**: Enhanced delivery address form with GPS pin/coordinates and delivery instructions.
- [ ] **FEAT-04**: WhatsApp / SMS order confirmation & dispatch alerts trigger framework.
- [ ] **FEAT-05**: Delivery partner status view for marking orders picked up and delivered.

### Phase 3: Production Cloud Deployment (Final Step)
- [ ] **DEP-01**: Configure connection to managed MongoDB Atlas cluster via `MONGODB_URI` and verify schema indexes.
- [ ] **DEP-02**: Execute idempotent database seed script (`backend/db/seed.js`) against MongoDB Atlas to populate live catalog.
- [ ] **DEP-03**: Deploy Express + Socket.IO API to Render with production environment variables and verify CORS + WSS handshakes.
- [ ] **DEP-04**: Deploy React 18 / Vite 5 Admin Dashboard to Vercel connected to Render backend.
- [ ] **DEP-05**: Trigger EAS Build (`eas build --platform android --profile preview`) to generate standalone Android `.apk`.

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| BUG-01 to BUG-10 | Phase 1: Codebase Error & Bug Elimination | Pending |
| FEAT-01 to FEAT-05 | Phase 2: Feature Enhancements | Pending |
| DEP-01 to DEP-05 | Phase 3: Production Cloud Deployment | Pending |

**Coverage:**
- Total v1 requirements: 20
- Mapped to phases: 20
- Unmapped: 0 ✓
