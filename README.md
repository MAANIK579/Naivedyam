# 🍛 Navedyam — Authentic Cloud Kitchen Platform

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express-4.18-lightgrey.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose%209.3-brightgreen.svg)](https://www.mongodb.com/)
[![React Native](https://img.shields.io/badge/React%20Native-0.81-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo%20SDK-54-black.svg)](https://expo.dev/)
[![React](https://img.shields.io/badge/React-18-cyan.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-purple.svg)](https://vitejs.dev/)

A modern, full-stack cloud kitchen food ordering and kitchen management platform built for authentic Haryanvi and North Indian dining. Designed for fast mobile ordering, real-time ticket dispatch, and comprehensive operations control.

---

## 🌟 Key Architecture & Highlights

- **📱 Customer Mobile App (Expo / React Native)**:
  - 21 screens covering dish customization, veg/non-veg filtering, cart calculations, coupon discounts, and order ratings.
  - Native **Razorpay checkout** integration with signature verification.
  - Live order tracking with animated status progression powered by **Socket.IO**.
  - Accessible Light and Dark themes with full push notification support via **Expo Notifications**.

- **💻 Operations & Kitchen Dashboard (React 18 / Vite 5)**:
  - Live kitchen orders stream with instant audio/toast alerts via **WebSockets**.
  - Interactive status progression: `placed` → `confirmed` → `preparing` → `out_for_delivery` → `delivered`.
  - Instant catalog availability toggles with optimistic UI updates.
  - Coupon management and revenue/order analytics via **Recharts**.

- **⚡ Real-Time API Server (Node.js / Express / MongoDB)**:
  - Scalable document models managed via **Mongoose 9.3**.
  - Dual WebSocket room segmentation: `kitchen` ticket stream & `order:${id}` customer live tracking.
  - Role-based access control (RBAC) with secure stateless **JWT authentication**.
  - Cryptographically verified **Razorpay webhook/signature verification** preventing uncollected orders.

---

## 📁 Repository Structure

```
navedyam/
├── backend/                  # Express REST API & Socket.IO server
│   ├── config/               # App configuration & environment loader
│   ├── db/                   # MongoDB connection & idempotent seed script
│   ├── middleware/           # Auth, RBAC, Joi validation, rate limiters
│   ├── models/               # Mongoose schemas (User, MenuItem, Order, Review, Coupon)
│   ├── routes/               # API routes (auth, menu, orders, track, payments, admin)
│   ├── services/             # Core business logic (orders, payments, coupons, push alerts)
│   ├── socket/               # Socket.IO connection handling & room management
│   └── server.js             # HTTP/WebSocket server entry point
│
├── frontend/                 # React Native / Expo mobile client
│   ├── src/
│   │   ├── api/              # Axios client with dynamic IP/URL resolution
│   │   ├── components/       # Shared UI primitives (Buttons, Cards, Timeline, Modals)
│   │   ├── context/          # React Contexts (Auth, Cart, Socket, Theme, Notifications)
│   │   ├── screens/          # 21 mobile screens (Home, Menu, Cart, Track, Reviews, etc.)
│   │   └── theme.js          # Design system & tokens (Light and Dark palettes)
│   ├── App.js                # Root navigation controller & provider tree
│   └── app.json              # Expo application configuration & EAS profiles
│
└── admin-dashboard/          # React 18 + Vite 5 kitchen management SPA
    ├── src/
    │   ├── api/              # Axios client configured with JWT interceptors
    │   ├── components/       # Layout, StatCard, StatusBadge, Modals
    │   ├── pages/            # Dashboard, Orders, Menu, Coupons, Users, Analytics
    │   └── App.jsx           # Protected routes & real-time notification listener
    └── vite.config.js        # Vite build configuration & proxy settings
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js v18.0.0 or higher
- MongoDB instance running locally (`mongodb://localhost:27017/navedyam`) or MongoDB Atlas URI
- Expo CLI: `npm install -g expo-cli`

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env     # Configure MONGODB_URI, JWT_SECRET, RAZORPAY keys
node db/seed.js          # Seed initial categories, menu items, and admin account
npm start                # Starts API on http://localhost:4000
```

### 2. Admin Dashboard Setup
```bash
cd admin-dashboard
npm install
npm run dev              # Starts admin portal on http://localhost:5173
```
*Default admin credentials from seed: Phone: `9999999999` / Password: `admin123456`*

### 3. Mobile App Setup
```bash
cd frontend
npm install
npx expo start           # Opens Expo dev server (press 'a' for Android emulator or scan QR)
```

---

## 🔒 Security & Best Practices

- All passwords hashed using **bcryptjs** with 10 salt rounds.
- REST endpoints protected with **Helmet** HTTP security headers and IP rate limiting.
- Order tracking endpoints strictly enforce user ownership checks.
- Environment variables and keys are excluded from source control.

---

## 📜 License
MIT License. Built with passion for authentic culinary experiences.
