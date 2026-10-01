// src/screens/OrderDetailScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, Alert,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { FONTS, RADIUS, SHADOW } from '../theme';
import { StatusPill, Divider } from '../components';
import OrderTimeline from '../components/OrderTimeline';
import { api } from '../api/client';

const FINAL_STATUSES = ['delivered', 'cancelled'];

export default function OrderDetailScreen({ navigation, route }) {
  const { orderId } = route.params || {};
  const { colors } = useTheme();

  const [order, setOrder]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [reordering, setReordering] = useState(false);
  const [reviewedItemIds, setReviewedItemIds] = useState([]);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  async function loadOrder() {
    setLoading(true);
    try {
      const data = await api.getOrder(orderId);
      const fetchedOrder = data.order || data;
      setOrder(fetchedOrder);

      try {
        const reviewData = await api.getMyReviews();
        const myReviews = reviewData.reviews || [];
        const currentOrderId = String(fetchedOrder?._id || fetchedOrder?.id || orderId);
        const reviewedForOrder = myReviews
          .filter((r) => String(r.order) === currentOrderId)
          .map((r) => String(r.menu_item?._id || r.menu_item || ''))
          .filter(Boolean);
        setReviewedItemIds(reviewedForOrder);
      } catch (_) {
        setReviewedItemIds([]);
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not load order');
    } finally {
      setLoading(false);
    }
  }

  async function handleReorder() {
    setReordering(true);
    try {
      await api.reorder(orderId);
      Alert.alert(
        'Added to Cart',
        'Items from this order have been added to your cart!',
        [{ text: 'Go to Cart', onPress: () => navigation.navigate('Cart') }]
      );
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not reorder');
    } finally {
      setReordering(false);
    }
  }

  const styles = createStyles(colors);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.saffron} />
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Order not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isDelivered  = order.status === 'delivered';
  const isCancelled  = order.status === 'cancelled';
  const isFinal      = FINAL_STATUSES.includes(order.status);
  const orderItemIds = (order.items || [])
    .map((item) => item.menu_item?._id || item.menu_item || item._id || item.id)
    .filter(Boolean)
    .map((id) => String(id));
  const hasPendingReview = isDelivered && orderItemIds.some((id) => !reviewedItemIds.includes(id));

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Order ID & Status */}
        <View style={styles.card}>
          <View style={styles.orderTopRow}>
            <View>
              <Text style={styles.orderIdLabel}>Order ID</Text>
              <Text style={styles.orderId}>#{order.display_id || order._id?.slice(-6)?.toUpperCase()}</Text>
            </View>
            <StatusPill status={order.status} />
          </View>
          {order.placed_at && (
            <Text style={styles.placedAt}>
              Placed on {new Date(order.placed_at).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </Text>
          )}
        </View>

        {/* Timeline */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Timeline</Text>
          <OrderTimeline
            status={order.status}
            statusHistory={order.status_history}
          />
        </View>

        {/* Items */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Items Ordered</Text>
          {(order.items || []).map((item, idx) => (
            <View key={idx} style={[styles.itemRow, idx > 0 && { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, marginTop: 10 }]}>
              <Text style={styles.itemEmoji}>{item.emoji || '🍽️'}</Text>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemQty}>Qty: {item.qty || item.quantity}</Text>
              </View>
              <Text style={styles.itemPrice}>₹{(item.price || 0) * (item.qty || item.quantity || 1)}</Text>
            </View>
          ))}
        </View>

        {/* Price breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Bill Summary</Text>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Item Total</Text>
            <Text style={styles.billValue}>₹{order.item_total ?? order.itemTotal ?? 0}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Fee</Text>
            <Text style={styles.billValue}>₹{order.delivery_fee ?? order.deliveryFee ?? 30}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>GST</Text>
            <Text style={styles.billValue}>₹{order.gst ?? 0}</Text>
          </View>
          {(order.discount > 0) && (
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Discount</Text>
              <Text style={[styles.billValue, { color: colors.green }]}>-₹{order.discount}</Text>
            </View>
          )}
          <Divider style={{ marginVertical: 8 }} />
          <View style={styles.billRow}>
            <Text style={styles.grandLabel}>Grand Total</Text>
            <Text style={styles.grandValue}>₹{order.grand_total ?? order.grandTotal ?? 0}</Text>
          </View>
        </View>

        {/* Delivery address */}
        {order.delivery_address && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Delivery Address</Text>
            <Text style={styles.addressText}>
              {order.delivery_address.full_address || order.delivery_address}
            </Text>
            {order.delivery_address.landmark ? (
              <Text style={styles.addressSub}>Near: {order.delivery_address.landmark}</Text>
            ) : null}
          </View>
        )}

        {/* Notes & Payment */}
        <View style={styles.card}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Payment</Text>
            <Text style={styles.metaValue}>
              {order.payment_method === 'cod' ? 'Cash on Delivery' : 'Razorpay'}
            </Text>
          </View>
          {!!order.notes && (
            <View style={[styles.metaRow, { marginTop: 8 }]}>
              <Text style={styles.metaLabel}>Notes</Text>
              <Text style={styles.metaValue}>{order.notes}</Text>
            </View>
          )}
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleReorder}
            disabled={reordering}
            activeOpacity={0.85}
          >
            {reordering
              ? <ActivityIndicator color={colors.white} size="small" />
              : <Text style={styles.actionBtnText}>🔄 Reorder</Text>
            }
          </TouchableOpacity>

          {!isFinal && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnOutline]}
              onPress={() => navigation.navigate('MainTabs', {
                screen: 'Track',
                params: { orderId: order._id || order.id },
              })}
              activeOpacity={0.85}
            >
              <Text style={[styles.actionBtnText, { color: colors.saffron }]}>📍 Track Order</Text>
            </TouchableOpacity>
          )}

          {hasPendingReview && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnGold]}
              onPress={() => navigation.navigate('OrderRating', {
                orderId: order._id || order.id,
                orderedItems: (order.items || []).map(i => ({
                  _id: i.menu_item?._id || i.menu_item || i._id || i.id,
                  name: i.item_name || i.name,
                  emoji: i.menu_item?.emoji || i.emoji,
                  quantity: i.quantity || i.qty || 1,
                })),
              })}
              activeOpacity={0.85}
            >
              <Text style={styles.actionBtnText}>⭐ Rate Order</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    padding: 4,
  },
  backIcon: {
    fontSize: 22,
    color: colors.saffron,
    ...FONTS.bold,
  },
  headerTitle: {
    ...FONTS.bold,
    fontSize: 20,
    color: colors.text,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    ...FONTS.regular,
    fontSize: 16,
    color: colors.textMuted,
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 14,
    ...SHADOW.small,
  },
  cardTitle: {
    ...FONTS.bold,
    fontSize: 15,
    color: colors.text,
    marginBottom: 14,
  },
  orderTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderIdLabel: {
    ...FONTS.regular,
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 2,
  },
  orderId: {
    ...FONTS.heavy,
    fontSize: 20,
    color: colors.text,
  },
  placedAt: {
    ...FONTS.regular,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemEmoji: {
    fontSize: 28,
    marginRight: 10,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    ...FONTS.semibold,
    fontSize: 14,
    color: colors.text,
  },
  itemQty: {
    ...FONTS.regular,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  itemPrice: {
    ...FONTS.bold,
    fontSize: 14,
    color: colors.saffronDeep,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  billLabel: {
    ...FONTS.regular,
    fontSize: 14,
    color: colors.textMuted,
  },
  billValue: {
    ...FONTS.medium,
    fontSize: 14,
    color: colors.text,
  },
  grandLabel: {
    ...FONTS.bold,
    fontSize: 16,
    color: colors.text,
  },
  grandValue: {
    ...FONTS.heavy,
    fontSize: 18,
    color: colors.saffron,
  },
  addressText: {
    ...FONTS.regular,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  addressSub: {
    ...FONTS.regular,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: {
    ...FONTS.regular,
    fontSize: 14,
    color: colors.textMuted,
  },
  metaValue: {
    ...FONTS.medium,
    fontSize: 14,
    color: colors.text,
  },
  actions: {
    gap: 12,
    marginTop: 4,
  },
  actionBtn: {
    backgroundColor: colors.saffron,
    borderRadius: RADIUS.lg,
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionBtnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.saffron,
  },
  actionBtnGold: {
    backgroundColor: colors.turmeric || '#D4A017',
  },
  actionBtnText: {
    ...FONTS.bold,
    fontSize: 15,
    color: colors.white,
    letterSpacing: 0.3,
  },
});
