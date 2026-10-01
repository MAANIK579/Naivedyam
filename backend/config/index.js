require('dotenv').config();

const config = Object.freeze({
  port: parseInt(process.env.PORT, 10) || 4000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/navedyam',
  jwtSecret: process.env.JWT_SECRET || 'navedyam_secret_key_change_in_production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '30d',
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
  },
  expoPushAccessToken: process.env.EXPO_PUSH_ACCESS_TOKEN || '',
  adminDefaultPassword: process.env.ADMIN_DEFAULT_PASSWORD || 'admin123456',
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') === 'development',
});

module.exports = config;
