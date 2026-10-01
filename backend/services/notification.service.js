const { Expo } = require('expo-server-sdk');
const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Internal helper — send a push notification via Expo.
 */
async function sendPush(pushToken, title, body, data = {}) {
  const expo = new Expo();

  const message = {
    to: pushToken,
    sound: 'default',
    title,
    body,
    data,
  };

  try {
    const chunks = expo.chunkPushNotifications([message]);
    for (const chunk of chunks) {
      await expo.sendPushNotificationsAsync(chunk);
    }
  } catch (err) {
    console.error('Expo push error:', err.message);
  }
}

/**
 * Save a notification to the database and optionally send a push notification.
 */
async function sendOrderNotification(userId, title, body, data = {}) {
  try {
    // Persist to database
    await Notification.create({ user: userId, title, body, data });

    // Look up push token
    const user = await User.findById(userId).select('push_token');
    if (user && user.push_token && Expo.isExpoPushToken(user.push_token)) {
      await sendPush(user.push_token, title, body, data);
    }
  } catch (err) {
    console.error('sendOrderNotification error:', err.message);
    // Don't throw — push failures should not break calling code
  }
}

module.exports = { sendOrderNotification, sendPush };
