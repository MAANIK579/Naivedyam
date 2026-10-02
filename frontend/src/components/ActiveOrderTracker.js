// src/components/ActiveOrderTracker.js — Dynamic Unified Bottom Bar (Live Order Tracking + Floating Cart) & Pop-up Modal
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  ScrollView, ActivityIndicator, Alert, Linking, Animated, Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { useSocket } from '../context/SocketContext';
import { FONTS, RADIUS, SHADOW } from '../theme';

const LIVE_STATUSES = ['placed', 'confirmed', 'preparing', 'out_for_delivery'];

const STATUS_CONFIG = {
  placed: {
    label: 'Order Placed',
    sub: 'Waiting for kitchen confirmation',
    icon: 'receipt-outline',
    progress: 0.2,
    defaultMin: 35,
  },
  confirmed: {
    label: 'Order Confirmed',
    sub: 'Kitchen accepted your meal',
    icon: 'restaurant-outline',
    progress: 0.45,
    defaultMin: 30,
  },
  preparing: {
    label: 'Cooking Fresh',
    sub: 'Chefs are preparing your dishes',
    icon: 'flame-outline',
    progress: 0.7,
    defaultMin: 20,
  },
  out_for_delivery: {
    label: 'Out for Delivery',
    sub: 'Rider is on the way with your food',
    icon: 'bicycle-outline',
    progress: 0.9,
    defaultMin: 10,
  },
  delivered: {
    label: 'Delivered',
    sub: 'Enjoy your meal!',
    icon: 'checkmark-circle-outline',
    progress: 1.0,
    defaultMin: 0,
  },
  cancelled: {
    label: 'Order Cancelled',
    sub: 'This order was cancelled',
    icon: 'close-circle-outline',
    progress: 0,
    defaultMin: 0,
  },
};

const STEPS = [
  { key: 'placed',           label: 'Order Placed',      desc: 'We received your order' },
  { key: 'confirmed',        label: 'Order Confirmed',    desc: 'Accepted by Navedyam kitchen' },
  { key: 'preparing',        label: 'Cooking in Kitchen', desc: 'Chefs preparing your food fresh' },
  { key: 'out_for_delivery', label: 'Out for Delivery',   desc: 'Rider is on the way to you' },
  { key: 'delivered',        label: 'Delivered',          desc: 'Enjoy your delicious meal!' },
];

export default function ActiveOrderTracker({ forceOpen = false, onTrackerDismiss, navigation }) {
  const { user } = useAuth();
  const { cartItems, itemCount, itemTotal } = useCart();
  const { colors, isDark } = useTheme();
  const { socket } = useSocket();

  const [activeOrder, setActiveOrder] = useState(null);
  const [modalVisible, setModalVisible] = useState(forceOpen);
  const [cancelling, setCancelling] = useState(false);
  const [fullTracking, setFullTracking] = useState(null);
  const [now, setNow] = useState(Date.now());

  // Dynamic live countdown tick every 30s
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Pulse animation for the live dot
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.35,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  // Sync forceOpen prop
  useEffect(() => {
    if (forceOpen) {
      setModalVisible(true);
    }
  }, [forceOpen]);

  // Fetch active orders
  const refreshActiveOrder = useCallback(async () => {
    if (!user) {
      setActiveOrder(null);
      return;
    }
    try {
      const data = await api.getMyOrders();
      const userOrders = data?.orders || [];
      const liveOrders = userOrders.filter(o => LIVE_STATUSES.includes(o.status));

      if (liveOrders.length > 0) {
        const primary = liveOrders[0];
        setActiveOrder(primary);

        try {
          const trackData = await api.trackOrder(primary.display_id || primary._id);
          setFullTracking(trackData);
        } catch (_) {
          // Fallback to primary order
        }
      } else {
        setActiveOrder(null);
        setFullTracking(null);
      }
    } catch (_) {
      // Network or silent error
    }
  }, [user]);

  // Initial load and periodic polling
  useEffect(() => {
    refreshActiveOrder();
    const interval = setInterval(refreshActiveOrder, 25000);
    return () => clearInterval(interval);
  }, [refreshActiveOrder]);

  // Socket updates
  useEffect(() => {
    if (!socket || !activeOrder) return;

    const orderId = activeOrder._id || activeOrder.id;
    const displayId = activeOrder.display_id;

    if (orderId) socket.emit('join:order', orderId);
    if (displayId) socket.emit('join:order', displayId);

    const handleUpdate = (data) => {
      const updatedStatus = data?.status;
      if (updatedStatus) {
        setActiveOrder(prev => {
          if (!prev) return prev;
          if (updatedStatus === 'delivered' || updatedStatus === 'cancelled') {
            setTimeout(() => refreshActiveOrder(), 3000);
          }
          return {
            ...prev,
            status: updatedStatus,
            estimated_delivery_time: data.estimated_delivery || prev.estimated_delivery_time,
          };
        });

        setFullTracking(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            order: { ...prev.order, status: updatedStatus },
            steps: data.steps || prev.steps,
            estimated_delivery: data.estimated_delivery || prev.estimated_delivery,
          };
        });
      }
    };

    socket.on('order:status_update', handleUpdate);
    socket.on('orders:updated', refreshActiveOrder);

    return () => {
      if (orderId) socket.emit('leave:order', orderId);
      if (displayId) socket.emit('leave:order', displayId);
      socket.off('order:status_update', handleUpdate);
      socket.off('orders:updated', refreshActiveOrder);
    };
  }, [socket, activeOrder?._id, activeOrder?.display_id, refreshActiveOrder]);

  // If nothing to display at all, return null
  if (!activeOrder && itemCount === 0 && !modalVisible) {
    return null;
  }

  const currentStatus = activeOrder?.status || 'placed';
  const cfg = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.placed;

  // Calculate live ETA string and remaining minutes dynamically
  let etaText = 'Calculating...';
  let clockTime = '';

  const estTimeVal = activeOrder?.estimated_delivery_time || fullTracking?.estimated_delivery;
  if (estTimeVal) {
    const estDate = new Date(estTimeVal);
    clockTime = estDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const diffMs = estDate.getTime() - now;
    const remainingMins = Math.max(1, Math.round(diffMs / 60000));
    if (remainingMins > 0 && remainingMins <= 90) {
      etaText = `Arriving in ~${remainingMins} min`;
    } else if (remainingMins <= 0) {
      etaText = currentStatus === 'out_for_delivery' ? 'Arriving any moment' : 'Arriving shortly';
    } else {
      etaText = `Estimated delivery: ${clockTime}`;
    }
  } else {
    etaText = `Arriving in ~${cfg.defaultMin} min`;
  }

  // Preview dishes in cart
  const itemsPreview = (cartItems || [])
    .map(ci => ci?.item?.name)
    .filter(Boolean)
    .slice(0, 2)
    .join(', ') + ((cartItems?.length > 2) ? ` +${cartItems.length - 2} more` : '');

  // Handle cancellation
  async function handleCancel() {
    const orderIdToCancel = activeOrder?._id || activeOrder?.id;
    if (!orderIdToCancel) return;

    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order? This action cannot be undone.',
      [
        { text: 'Keep Order', style: 'cancel' },
        {
          text: 'Cancel Order',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              await api.cancelOrder(orderIdToCancel, 'Cancelled by user from tracking pop-up');
              Alert.alert('Order Cancelled', 'Your order was successfully cancelled.');
              setModalVisible(false);
              refreshActiveOrder();
            } catch (err) {
              Alert.alert('Cancellation Error', err.message || 'Unable to cancel order.');
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  }

  const styles = createStyles(colors, isDark);

  return (
    <>
      {/* ── Dynamic Floating Bottom Bar (Cart & Live Tracking) ──────── */}
      <View style={styles.floatingContainer} pointerEvents="box-none">
        {/* Active Order Tracking Capsule */}
        {activeOrder && (
          <TouchableOpacity
            style={[
              styles.capsuleContainer,
              itemCount > 0 && styles.capsuleStacked,
            ]}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.92}
          >
            <View style={styles.capsuleLeft}>
              <View style={styles.capsuleIconWrap}>
                <Ionicons name={cfg.icon} size={18} color={colors.saffron} />
                <Animated.View style={[styles.pulseDot, { opacity: pulseAnim }]} />
              </View>

              <View style={styles.capsuleTexts}>
                <View style={styles.capsuleTitleRow}>
                  <Text style={styles.capsuleEtaText}>{etaText}</Text>
                  {clockTime ? <Text style={styles.capsuleClockText}>· {clockTime}</Text> : null}
                </View>
                <Text style={styles.capsuleSubText} numberOfLines={1}>
                  #{activeOrder.display_id || 'NVD'} · {cfg.sub}
                </Text>
              </View>
            </View>

            <View style={styles.capsuleRight}>
              <View style={styles.trackActionBtn}>
                <Text style={styles.trackActionText}>Track</Text>
                <Ionicons name="chevron-up" size={13} color="#FFFFFF" />
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Dynamic Floating Cart Bar */}
        {itemCount > 0 && (
          <TouchableOpacity
            style={styles.cartBarContainer}
            onPress={() => navigation?.navigate?.('Cart')}
            activeOpacity={0.92}
          >
            <View style={styles.cartLeft}>
              <View style={styles.cartBadge}>
                <Ionicons name="cart" size={14} color="#FFFFFF" style={{ marginRight: 3 }} />
                <Text style={styles.cartBadgeText}>{itemCount}</Text>
              </View>
              <View style={styles.cartTexts}>
                <View style={styles.cartPriceRow}>
                  <Text style={styles.cartItemCountText}>
                    {itemCount} ITEM{itemCount > 1 ? 'S' : ''}
                  </Text>
                  <Text style={styles.cartDotText}>·</Text>
                  <Text style={styles.cartPriceText}>₹{itemTotal}</Text>
                </View>
                <Text style={styles.cartPreviewText} numberOfLines={1}>
                  {itemsPreview || 'Dishes added to cart'}
                </Text>
              </View>
            </View>

            <View style={styles.cartRight}>
              <Text style={styles.viewCartActionText}>VIEW CART</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Live Tracking Pop-Up Sheet / Modal ────────────────── */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setModalVisible(false);
          onTrackerDismiss?.();
        }}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.backdropPress}
            activeOpacity={1}
            onPress={() => {
              setModalVisible(false);
              onTrackerDismiss?.();
            }}
          />

          <View style={styles.sheetContainer}>
            {/* Drag Handle Pill */}
            <View style={styles.dragPill} />

            {/* Sheet Header */}
            <View style={styles.sheetHeader}>
              <View>
                <View style={styles.orderIdPill}>
                  <Text style={styles.orderIdPillText}>
                    {activeOrder?.display_id || 'ORDER'}
                  </Text>
                  <View style={styles.liveIndicator}>
                    <Animated.View style={[styles.pulseDotSmall, { opacity: pulseAnim }]} />
                    <Text style={styles.liveIndicatorText}>LIVE</Text>
                  </View>
                </View>
                <Text style={styles.sheetHeaderTitle}>Order Tracking</Text>
              </View>

              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => {
                  setModalVisible(false);
                  onTrackerDismiss?.();
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.sheetScroll}
              contentContainerStyle={styles.sheetScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Highlighted ETA & Progress Banner */}
              <View style={styles.etaCard}>
                <View style={styles.etaHeaderRow}>
                  <View style={styles.timerCircle}>
                    <Ionicons name="time" size={24} color={colors.saffron} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.etaBigTitle}>{etaText}</Text>
                    <Text style={styles.etaSubTitle}>
                      {clockTime ? `Expected Arrival by ${clockTime}` : cfg.sub}
                    </Text>
                  </View>
                </View>

                {/* Visual Progress Bar */}
                <View style={styles.progressBarTrack}>
                  <View style={[styles.progressBarFill, { width: `${cfg.progress * 100}%` }]} />
                </View>
                <View style={styles.progressLabelsRow}>
                  <Text style={[styles.progressLabel, currentStatus === 'placed' && styles.progressLabelActive]}>Placed</Text>
                  <Text style={[styles.progressLabel, currentStatus === 'confirmed' && styles.progressLabelActive]}>Confirmed</Text>
                  <Text style={[styles.progressLabel, currentStatus === 'preparing' && styles.progressLabelActive]}>Cooking</Text>
                  <Text style={[styles.progressLabel, currentStatus === 'out_for_delivery' && styles.progressLabelActive]}>On Way</Text>
                  <Text style={[styles.progressLabel, currentStatus === 'delivered' && styles.progressLabelActive]}>Done</Text>
                </View>
              </View>

              {/* Status Timeline */}
              <View style={styles.timelineSection}>
                <Text style={styles.sectionHeading}>Order Status Steps</Text>
                {STEPS.map((step, idx) => {
                  const stepOrder = ['placed', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'];
                  const curIdx = stepOrder.indexOf(currentStatus);
                  const stepIdx = stepOrder.indexOf(step.key);

                  const isDone = stepIdx < curIdx;
                  const isActive = stepIdx === curIdx;
                  const isLast = idx === STEPS.length - 1;

                  return (
                    <View key={step.key} style={styles.stepRow}>
                      <View style={styles.stepIndicatorCol}>
                        <View style={[
                          styles.stepDot,
                          isDone && styles.stepDotDone,
                          isActive && styles.stepDotActive,
                        ]}>
                          {isDone ? (
                            <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                          ) : isActive ? (
                            <Ionicons name={STATUS_CONFIG[step.key]?.icon || 'ellipse'} size={14} color="#FFFFFF" />
                          ) : (
                            <Text style={styles.stepNumberText}>{idx + 1}</Text>
                          )}
                        </View>
                        {!isLast && (
                          <View style={[
                            styles.stepConnectorLine,
                            isDone && styles.stepConnectorDone,
                          ]} />
                        )}
                      </View>

                      <View style={styles.stepContent}>
                        <Text style={[
                          styles.stepLabel,
                          (isDone || isActive) && { color: colors.text, ...FONTS.bold },
                        ]}>
                          {step.label}
                        </Text>
                        <Text style={styles.stepDesc}>
                          {isActive ? cfg.sub : step.desc}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* Order Items & Delivery Address */}
              {activeOrder?.items?.length > 0 && (
                <View style={styles.detailsCard}>
                  <Text style={styles.sectionHeading}>Order Summary</Text>
                  {activeOrder.items.map((it, idx) => (
                    <View key={idx} style={styles.itemRow}>
                      <Text style={styles.itemQty}>{it.quantity}x</Text>
                      <Text style={styles.itemName} numberOfLines={1}>{it.item_name || it.name}</Text>
                      <Text style={styles.itemPrice}>₹{(it.price || 0) * (it.quantity || 1)}</Text>
                    </View>
                  ))}

                  <View style={styles.itemDivider} />

                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total Bill</Text>
                    <Text style={styles.totalVal}>₹{activeOrder.grand_total || activeOrder.total}</Text>
                  </View>

                  {activeOrder.delivery_address?.full_address && (
                    <View style={styles.addressBox}>
                      <Ionicons name="location-outline" size={16} color={colors.saffron} />
                      <Text style={styles.addressText} numberOfLines={2}>
                        {activeOrder.delivery_address.full_address}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Actions: Call Kitchen & Cancel */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.callBtn}
                  onPress={() => Linking.openURL('tel:918901234567')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="call-outline" size={18} color={colors.text} />
                  <Text style={styles.callBtnText}>Call Kitchen</Text>
                </TouchableOpacity>

                {currentStatus === 'placed' && (
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={handleCancel}
                    disabled={cancelling}
                    activeOpacity={0.8}
                  >
                    {cancelling ? (
                      <ActivityIndicator size="small" color={colors.error} />
                    ) : (
                      <>
                        <Ionicons name="close-circle-outline" size={18} color={colors.error} />
                        <Text style={styles.cancelBtnText}>Cancel Order</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>

              {/* Back / Minimize Button */}
              <TouchableOpacity
                style={styles.dismissBtn}
                onPress={() => {
                  setModalVisible(false);
                  onTrackerDismiss?.();
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.dismissBtnText}>Continue Browsing Menu</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  // ── Unified Floating Container ────────────────────────────
  floatingContainer: {
    position: 'absolute',
    bottom: 74, // Cleanly above the 62px bottom tab bar
    left: 14,
    right: 14,
    gap: 8,
    zIndex: 999,
    elevation: 10,
  },

  // ── Floating Cart Bar ─────────────────────────────────────
  cartBarContainer: {
    backgroundColor: colors.saffron,
    borderRadius: RADIUS.lg,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SHADOW.large,
    elevation: 8,
  },
  cartLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  cartBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    marginRight: 10,
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    ...FONTS.heavy,
  },
  cartTexts: {
    flex: 1,
  },
  cartPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  cartItemCountText: {
    color: '#FFFFFF',
    fontSize: 11,
    ...FONTS.bold,
    letterSpacing: 0.4,
    opacity: 0.95,
  },
  cartDotText: {
    color: '#FFFFFF',
    fontSize: 12,
    opacity: 0.7,
  },
  cartPriceText: {
    color: '#FFFFFF',
    fontSize: 15,
    ...FONTS.heavy,
  },
  cartPreviewText: {
    color: '#FFFFFF',
    fontSize: 11,
    opacity: 0.85,
    marginTop: 1,
  },
  cartRight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    gap: 6,
  },
  viewCartActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    ...FONTS.heavy,
    letterSpacing: 0.5,
  },

  // ── Floating Tracking Capsule ─────────────────────────────
  capsuleContainer: {
    backgroundColor: isDark ? '#1C1917' : '#FFFFFF',
    borderRadius: RADIUS.xl,
    paddingVertical: 11,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: colors.saffron,
    ...SHADOW.large,
    elevation: 8,
  },
  capsuleStacked: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: isDark ? '#261F1D' : '#FFF7ED',
  },
  capsuleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  capsuleIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.saffronPale,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginRight: 10,
  },
  pulseDot: {
    position: 'absolute',
    top: 1,
    right: 1,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16A34A',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  pulseDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
    marginRight: 4,
  },
  capsuleTexts: {
    flex: 1,
  },
  capsuleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  capsuleEtaText: {
    fontSize: 13.5,
    ...FONTS.heavy,
    color: colors.saffron,
  },
  capsuleClockText: {
    fontSize: 11.5,
    ...FONTS.medium,
    color: colors.textMuted,
    marginLeft: 4,
  },
  capsuleSubText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  capsuleRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.saffron,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    gap: 3,
  },
  trackActionText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    ...FONTS.bold,
  },

  // ── Modal Sheet ───────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  backdropPress: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: colors.cardBg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    paddingBottom: 24,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...SHADOW.large,
  },
  dragPill: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  orderIdPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderIdPillText: {
    fontSize: 12,
    ...FONTS.bold,
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? '#064E3B' : '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  liveIndicatorText: {
    fontSize: 9.5,
    ...FONTS.heavy,
    color: '#16A34A',
  },
  sheetHeaderTitle: {
    fontSize: 19,
    ...FONTS.heavy,
    color: colors.text,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetScroll: {
    paddingHorizontal: 20,
  },
  sheetScrollContent: {
    paddingVertical: 16,
    gap: 16,
  },

  // ── ETA Card ──────────────────────────────────────────────
  etaCard: {
    backgroundColor: isDark ? '#261F1D' : '#FFF7ED',
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.saffronPale,
  },
  etaHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  timerCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.saffronPale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  etaBigTitle: {
    fontSize: 18,
    ...FONTS.heavy,
    color: colors.saffron,
  },
  etaSubTitle: {
    fontSize: 12.5,
    color: colors.textMuted,
    marginTop: 2,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: colors.borderLight,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 4,
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.saffron,
    borderRadius: 3,
  },
  progressLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 10,
    color: colors.textLight,
    ...FONTS.medium,
  },
  progressLabelActive: {
    color: colors.saffron,
    ...FONTS.bold,
  },

  // ── Timeline ──────────────────────────────────────────────
  timelineSection: {
    backgroundColor: colors.cream,
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  sectionHeading: {
    fontSize: 14,
    ...FONTS.heavy,
    color: colors.text,
    marginBottom: 14,
    letterSpacing: -0.2,
  },
  stepRow: {
    flexDirection: 'row',
    minHeight: 44,
  },
  stepIndicatorCol: {
    alignItems: 'center',
    width: 30,
  },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  stepDotDone: {
    backgroundColor: '#16A34A',
  },
  stepDotActive: {
    backgroundColor: colors.saffron,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    ...SHADOW.small,
  },
  stepNumberText: {
    fontSize: 10,
    color: '#FFFFFF',
    ...FONTS.bold,
  },
  stepConnectorLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 2,
  },
  stepConnectorDone: {
    backgroundColor: '#16A34A',
  },
  stepContent: {
    flex: 1,
    marginLeft: 10,
    paddingBottom: 14,
  },
  stepLabel: {
    fontSize: 13.5,
    color: colors.textMuted,
    ...FONTS.medium,
  },
  stepDesc: {
    fontSize: 11.5,
    color: colors.textLight,
    marginTop: 2,
  },

  // ── Summary Card ──────────────────────────────────────────
  detailsCard: {
    backgroundColor: colors.cream,
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  itemQty: {
    fontSize: 12.5,
    ...FONTS.bold,
    color: colors.saffron,
    width: 28,
  },
  itemName: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
  },
  itemPrice: {
    fontSize: 13,
    ...FONTS.bold,
    color: colors.text,
  },
  itemDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 13.5,
    ...FONTS.bold,
    color: colors.text,
  },
  totalVal: {
    fontSize: 15,
    ...FONTS.heavy,
    color: colors.saffron,
  },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.cardBg,
    borderRadius: RADIUS.md,
    padding: 10,
    marginTop: 10,
    gap: 8,
  },
  addressText: {
    flex: 1,
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
  },

  // ── Action Buttons ────────────────────────────────────────
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  callBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream,
    borderRadius: RADIUS.lg,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  callBtnText: {
    fontSize: 13,
    ...FONTS.bold,
    color: colors.text,
  },
  cancelBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: isDark ? '#450A0A' : '#FEF2F2',
    borderRadius: RADIUS.lg,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.error,
    gap: 6,
  },
  cancelBtnText: {
    fontSize: 13,
    ...FONTS.bold,
    color: colors.error,
  },
  dismissBtn: {
    backgroundColor: colors.saffron,
    borderRadius: RADIUS.lg,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    ...SHADOW.small,
  },
  dismissBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    ...FONTS.heavy,
  },
});
