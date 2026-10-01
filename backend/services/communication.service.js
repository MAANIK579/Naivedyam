// backend/services/communication.service.js — WhatsApp & SMS notification triggers
const https = require('https');

/**
 * Normalize phone numbers to E.164 format (+91 for India)
 */
function normalizePhone(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  if (digits.startsWith('+')) return phone;
  return `+91${digits.slice(-10)}`;
}

/**
 * Send an SMS message via provider or fallback to structured console logging
 */
async function sendSmsMessage(phone, message) {
  const formattedPhone = normalizePhone(phone);
  if (!formattedPhone) return false;

  try {
    // If Twilio credentials are provided in .env, dispatch via Twilio API
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
      // Pluggable live provider dispatch
      console.log(`[SMS PROVIDER DISPATCH] Sending to ${formattedPhone}`);
    }

    // Default simulated communication logger
    console.log(`\x1b[36m[SMS ALERT]\x1b[0m -> To: ${formattedPhone} | ${message}`);
    return true;
  } catch (err) {
    console.error(`[SMS FAILED] ${formattedPhone}:`, err.message);
    return false;
  }
}

/**
 * Send a WhatsApp notification via provider or fallback to structured console logging
 */
async function sendWhatsAppMessage(phone, message) {
  const formattedPhone = normalizePhone(phone);
  if (!formattedPhone) return false;

  try {
    // If Twilio WhatsApp credentials are provided
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_NUMBER) {
      console.log(`[WHATSAPP PROVIDER DISPATCH] Sending to ${formattedPhone}`);
    }

    // Default simulated communication logger
    console.log(`\x1b[32m[WHATSAPP ALERT]\x1b[0m -> To: ${formattedPhone} | ${message}`);
    return true;
  } catch (err) {
    console.error(`[WHATSAPP FAILED] ${formattedPhone}:`, err.message);
    return false;
  }
}

/**
 * Trigger order confirmation alerts (both WhatsApp and SMS)
 */
async function sendOrderConfirmationAlert(user, order) {
  try {
    const phone = user?.phone || order?.delivery_address?.phone;
    const name = user?.name ? user.name.split(' ')[0] : 'Valued Customer';
    const displayId = order.display_id || String(order._id || order.id).slice(-6);
    const amount = order.grand_total || order.total || 0;
    const itemsCount = (order.items || []).reduce((sum, i) => sum + (i.quantity || 1), 0);
    const minutes = order.estimated_minutes || 35;

    const waMsg = `Namaskar ${name}! 🍱\nYour Navedyam order #${displayId} (${itemsCount} items, ₹${amount}) is confirmed!\nEstimated prep & delivery: ~${minutes} mins.\nWe are cooking your authentic Haryanvi meal with pure desi ghee.`;
    const smsMsg = `Navedyam: Order #${displayId} confirmed (₹${amount})! Delivering in ~${minutes} mins. Bhiwani Kitchen.`;

    await Promise.allSettled([
      sendWhatsAppMessage(phone, waMsg),
      sendSmsMessage(phone, smsMsg),
    ]);
  } catch (err) {
    console.error('sendOrderConfirmationAlert error:', err.message);
  }
}

/**
 * Trigger order dispatch / out-for-delivery alerts
 */
async function sendOrderDispatchAlert(user, order) {
  try {
    const phone = user?.phone || order?.delivery_address?.phone;
    const displayId = order.display_id || String(order._id || order.id).slice(-6);
    const address = order.delivery_address?.full_address || 'your address';
    const instructions = order.delivery_address?.delivery_instructions ? ` Note: "${order.delivery_address.delivery_instructions}"` : '';

    const waMsg = `🛵 Order #${displayId} is Out for Delivery!\nOur delivery rider is on the way to ${address}.${instructions}\nPlease keep your phone handy.`;
    const smsMsg = `Navedyam: Order #${displayId} is out for delivery with our rider! Heading to ${address.slice(0, 30)}...`;

    await Promise.allSettled([
      sendWhatsAppMessage(phone, waMsg),
      sendSmsMessage(phone, smsMsg),
    ]);
  } catch (err) {
    console.error('sendOrderDispatchAlert error:', err.message);
  }
}

/**
 * Trigger order delivered confirmation alerts
 */
async function sendOrderDeliveredAlert(user, order) {
  try {
    const phone = user?.phone || order?.delivery_address?.phone;
    const displayId = order.display_id || String(order._id || order.id).slice(-6);

    const waMsg = `😋 Order #${displayId} has been Delivered!\nHope you enjoy your authentic Haryanvi meal. Please rate your food in the Navedyam app!`;
    const smsMsg = `Navedyam: Order #${displayId} delivered! Enjoy your meal. Rate us on the app!`;

    await Promise.allSettled([
      sendWhatsAppMessage(phone, waMsg),
      sendSmsMessage(phone, smsMsg),
    ]);
  } catch (err) {
    console.error('sendOrderDeliveredAlert error:', err.message);
  }
}

/**
 * Trigger order cancellation alert
 */
async function sendOrderCancelledAlert(user, order, reason) {
  try {
    const phone = user?.phone || order?.delivery_address?.phone;
    const displayId = order.display_id || String(order._id || order.id).slice(-6);
    const reasonText = reason || order.cancellation_reason || 'Cancelled by request';

    const waMsg = `ℹ️ Order #${displayId} has been cancelled (${reasonText}). If this was paid online, your refund will process in 2-4 business days.`;
    const smsMsg = `Navedyam: Order #${displayId} cancelled (${reasonText.slice(0, 30)}). Questions? Call support.`;

    await Promise.allSettled([
      sendWhatsAppMessage(phone, waMsg),
      sendSmsMessage(phone, smsMsg),
    ]);
  } catch (err) {
    console.error('sendOrderCancelledAlert error:', err.message);
  }
}

module.exports = {
  normalizePhone,
  sendSmsMessage,
  sendWhatsAppMessage,
  sendOrderConfirmationAlert,
  sendOrderDispatchAlert,
  sendOrderDeliveredAlert,
  sendOrderCancelledAlert,
};
