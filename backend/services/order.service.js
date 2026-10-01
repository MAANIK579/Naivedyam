/**
 * Calculate the full order total breakdown.
 * @param {number} itemTotal - Sum of item prices.
 * @param {number} discount - Discount amount (default 0).
 * @returns {{ delivery_fee: number, gst: number, discount: number, grand_total: number }}
 */
function calculateOrderTotal(itemTotal, discount = 0) {
  const delivery_fee = 30;
  const gst = Math.round(itemTotal * 0.05 * 100) / 100; // 5% GST
  const grand_total = itemTotal + delivery_fee + gst - discount;

  return { delivery_fee, gst, discount, grand_total };
}

/**
 * Estimate the delivery time based on current order status.
 * @param {string} status - Current order status.
 * @param {number} maxPrepTime - Maximum preparation time in minutes (default 20).
 * @returns {Date|null}
 */
function estimateDeliveryTime(status, maxPrepTime = 20) {
  const now = new Date();

  switch (status) {
    case 'placed':
    case 'confirmed':
      return new Date(now.getTime() + (maxPrepTime + 15) * 60 * 1000);
    case 'preparing':
      return new Date(now.getTime() + (maxPrepTime * 0.5 + 15) * 60 * 1000);
    case 'out_for_delivery':
      return new Date(now.getTime() + 15 * 60 * 1000);
    case 'delivered':
      return null;
    default:
      return null;
  }
}

/**
 * Generate a human-readable display ID for an order.
 * @returns {string} e.g. 'NVD-4521'
 */
function generateDisplayId() {
  const num = Math.floor(Math.random() * (9999 - 2000 + 1)) + 2000;
  return 'NVD-' + num;
}

module.exports = { calculateOrderTotal, estimateDeliveryTime, generateDisplayId };
