---
last_mapped_commit: 0c47d49f56f6f77d675753cd3a97c10fc5be78bb
last_mapped_at: 2026-10-01
---
# Testing Patterns

**Analysis Date:** 2026-10-01

## Test Framework

**Current State:**
- **No automated test runner or test suites currently configured** in any of the subprojects (`backend/package.json`, `frontend/package.json`, or `admin-dashboard/package.json`).
- Test scripts in package manifests:
  - Backend: `npm test` script is not defined or defaults to `echo "Error: no test specified" && exit 1`.
  - Frontend: `npm test` is not configured.
  - Admin Dashboard: Vitest or Jest is not installed.

**Recommended Test Stack for Personal Project Evolution:**
- **Backend**: Jest (`^29.x`) or Mocha + Supertest (`^6.x`) for HTTP route smoke & integration testing; MongoDB Memory Server for isolated in-memory DB tests.
- **Frontend**: Jest + `@testing-library/react-native` for component and context testing.
- **Admin Dashboard**: Vitest + `@testing-library/react` for Vite-native unit and component tests.

## Test File Organization (Recommended)

**Location:**
- Backend API tests: `backend/tests/` (e.g. `auth.test.js`, `orders.test.js`, `coupons.test.js`).
- Frontend unit tests: Co-located in `__tests__/` subdirectories next to components or contexts.

**Naming:**
- `*.test.js` or `*.spec.jsx`.

## Planned Test Structure & Patterns

### 1. Backend Route Smoke Test Pattern (Supertest)

```javascript
const request = require('supertest');
const { app } = require('../server');
const { connectDB, closeDB } = require('./testDb');

describe('API Smoke Tests', () => {
  beforeAll(async () => await connectDB());
  afterAll(async () => await closeDB());

  it('GET /api/menu/items returns 200 with menu list', async () => {
    const res = await request(app).get('/api/menu/items');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
  });
});
```

### 2. Service Unit Test Pattern (Coupon Validation)

```javascript
const { validateCoupon } = require('../services/coupon.service');

describe('Coupon Service', () => {
  it('rejects expired coupon', async () => {
    const result = await validateCoupon('EXPIRED_CODE', userId, 500);
    expect(result.valid).toBe(false);
  });
});
```

### 3. Frontend Context Reducer Test Pattern (Cart)

```javascript
import { cartReducer, initialCartState } from '../context/CartContext';

describe('Cart Reducer', () => {
  it('correctly increments item quantity', () => {
    const state = cartReducer(initialCartState, {
      type: 'ADD',
      item: { id: 'item1', name: 'Dal Makhani', price: 220 }
    });
    expect(state['item1'].quantity).toBe(1);
  });
});
```

## Mocking Strategy

**External Payment Gateway:**
- Mock `Razorpay` SDK instances during testing to prevent triggering live API transactions or requiring test keys:
  ```javascript
  jest.mock('razorpay', () => {
    return jest.fn().mockImplementation(() => ({
      orders: {
        create: jest.fn().mockResolvedValue({ id: 'order_mock_123', amount: 50000 })
      }
    }));
  });
  ```

**Expo Push Service:**
- Mock `expo-server-sdk` in `backend/services/notification.service.js` to assert payload structures without making outbound HTTP requests to `exp.host`.

## Coverage

**Requirements:**
- None currently enforced.

**Priority Target Areas for Initial Test Coverage:**
1. Order total, GST (5%), and delivery fee calculation in `backend/services/order.service.js`.
2. Coupon discount algorithms and usage limits in `backend/services/coupon.service.js`.
3. HMAC-SHA256 signature verification in `backend/services/payment.service.js`.
4. Authentication middleware and JWT validation in `backend/middleware/auth.js`.
5. Mobile cart reducer state transitions in `frontend/src/context/CartContext.js`.

---

*Testing analysis: 2026-10-01*
