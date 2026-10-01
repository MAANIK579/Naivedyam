require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config');
const connectDB = require('./db/connection');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');
const initSocket = require('./socket');

// Import all route files
const authRoutes = require('./routes/auth');
const menuRoutes = require('./routes/menu');
const orderRoutes = require('./routes/orders');
const trackRoutes = require('./routes/track');
const reviewRoutes = require('./routes/reviews');
const couponRoutes = require('./routes/coupons');
const addressRoutes = require('./routes/addresses');
const favoriteRoutes = require('./routes/favorites');
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/payments');
const notificationRoutes = require('./routes/notifications');

// ── Create Express app & HTTP server ──
const app = express();
const server = http.createServer(app);

// ── Initialise Socket.IO ──
const io = initSocket(server);
app.set('io', io);

// ── Middleware ──
app.use(helmet());
app.use(morgan('dev'));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(apiLimiter);

// ── Health check ──
app.get('/', (req, res) => {
  res.json({ status: 'ok', app: 'Navedyam API', version: '1.0.0' });
});

// ── API Routes ──
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/track', trackRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);

// ── 404 handler ──
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Error handler ──
app.use(errorHandler);

// ── Start server ──
connectDB().then(() => {
  server.listen(config.port, () => {
    console.log(`Navedyam API running on http://localhost:${config.port}`);
  });
});
