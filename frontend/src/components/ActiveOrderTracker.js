// src/components/ActiveOrderTracker.js — Unified Floating Bottom Bar (Sliding Live Order Tracking & Cart) & Pop-up Modal
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  ScrollView, ActivityIndicator, Alert, Linking, Animated, Easing,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { useSocket } from '../context/SocketContext';
import { FONTS, RADIUS, SHADOW } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 28; // 14px padding on each side

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
  const [activeSlide, setActiveSlide] = useState(0); // 0 = Tracking, 1 = Cart

  const sliderScrollRef = useRef(null);

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
          // Fallback
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

  // Auto-scroll to newly added cart if user was on tracking
  const prevItemCount = useRef(itemCount);
  useEffect(() => {
    if (prevItemCount.current === 0 && itemCount > 0 && activeOrder) {
      // User just added an item while having an active order: switch to cart slide with a gentle delay
      setTimeout(() => {
        sliderScrollRef.current?.scrollTo({ x: CARD_WIDTH, animated: true });
        setActiveSlide(1);
      }, 300);
    }
    prevItemCount.current = itemCount;
  }, [itemCount, activeOrder]);

  // If nothing to display at all, return null
  const hasActiveOrder = !!activeOrder;
  const hasCartItems = itemCount > 0;
  const hasBoth = hasActiveOrder && hasCartItems;

  if (!hasActiveOrder && !hasCartItems && !modalVisible) {
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

  function handleSlideToggle(targetIndex) {
    sliderScrollRef.current?.scrollTo({ x: targetIndex * CARD_WIDTH, animated: true });
    setActiveSlide(targetIndex);
  }

  const styles = createStyles(colors, isDark);

  return (
    <>
      {/* ── Single Unified Floating Bottom Card (Sliding between Tracking & Cart) ── */}
      <View style={styles.floatingContainer} pointerEvents="box-none">
        <View style={styles.unifiedCard}>
          {hasBoth ? (
            // Both exist: Single card with horizontal swipeable slider
            <>
              <ScrollView
                ref={sliderScrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                scrollEventThrottle={16}
                onMomentumScrollEnd={(e) => {
                  const x = e.nativeEvent.contentOffset.x;
                  const idx = Math.round(x / CARD_WIDTH);
                  setActiveSlide(idx);
                }}
                style={styles.sliderScrollView}
              >
                {/* Slide 0: Live Order Tracking */}
                <TouchableOpacity
                  style={styles.slideItem}
                  onPress={() => setModalVisible(true)}
                  activeOpacity={0.92}
                >
                  <View style={styles.slideLeft}>
                    <View style={styles.iconWrapLive}>
                      <Ionicons name={cfg.icon} size={18} color="#FFFFFF" />
                      <Animated.View style={[styles.pulseDot, { opacity: pulseAnim }]} />
                    </View>
                    <View style={styles.slideTexts}>
                      <View style={styles.titleRow}>
                        <Text style={styles.slideTitleLive}>{etaText}</Text>
                        {clockTime ? <Text style={styles.clockSubText}>· {clockTime}</Text> : null}
                      </View>
                      <Text style={styles.slideDesc} numberOfLines={1}>
                        #{activeOrder.display_id || 'NVD'} · {cfg.sub}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.slideRight}>
                    <View style={styles.trackPillBtn}>
                      <Text style={styles.trackPillText}>Track</Text>
                      <Ionicons name="chevron-up" size={13} color="#FFFFFF" />
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Slide 1: Cart Summary */}
                <TouchableOpacity
                  style={styles.slideItem}
                  onPress={() => navigation?.navigate?.('Cart')}
                  activeOpacity={0.92}
                >
                  <View style={styles.slideLeft}>
                    <View style={styles.iconWrapCart}>
                      <Ionicons name="cart" size={17} color="#FFFFFF" />
                      <View style={styles.cartCountBadge}>
                        <Text style={styles.cartCountBadgeText}>{itemCount}</Text>
                      </View>
                    </View>
                    <View style={styles.slideTexts}>
                      <View style={styles.titleRow}>
                        <Text style={styles.slideTitleCart}>
                          {itemCount} ITEM{itemCount > 1 ? 'S' : ''} · ₹{itemTotal}
                        </Text>
                      </View>
                      <Text style={styles.slideDesc} numberOfLines={1}>
                        {itemsPreview || 'Dishes added to cart'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.slideRight}>
                    <View style={styles.cartPillBtn}>
                      <Text style={styles.cartPillText}>View Cart</Text>
                      <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                    </View>
                  </View>
                </TouchableOpacity>
              </ScrollView>

              {/* Bottom Pagination Bar / Dots */}
              <View style={styles.paginationBar}>
                <TouchableOpacity
                  onPress={() => handleSlideToggle(activeSlide === 0 ? 1 : 0)}
                  activeOpacity={0.7}
                  style={styles.paginationHintRow}
                >
                  <Text style={styles.paginationHintText}>
                    {activeSlide === 0 ? 'SWIPE OR TAP FOR CART' : 'SWIPE OR TAP TO TRACK'}
                  </Text>
                  <Ionicons
                    name={activeSlide === 0 ? 'arrow-forward' : 'arrow-back'}
                    size={11}
                    color="rgba(255, 255, 255, 0.65)"
                  />
                </TouchableOpacity>

                <View style={styles.dotsRow}>
                  <TouchableOpacity
                    onPress={() => handleSlideToggle(0)}
                    style={[styles.dot, activeSlide === 0 ? styles.dotActive : styles.dotInactive]}
                  />
                  <TouchableOpacity
                    onPress={() => handleSlideToggle(1)}
                    style={[styles.dot, activeSlide === 1 ? styles.dotActive : styles.dotInactive]}
                  />
                </View>
              </View>
            </>
          ) : hasActiveOrder ? (
            // Only Active Order exists: Clean, sleek single tracking row
            <TouchableOpacity
              style={styles.slideItemStandalone}
              onPress={() => setModalVisible(true)}
              activeOpacity={0.92}
            >
              <View style={styles.slideLeft}>
                <View style={styles.iconWrapLive}>
                  <Ionicons name={cfg.icon} size={18} color="#FFFFFF" />
                  <Animated.View style={[styles.pulseDot, { opacity: pulseAnim }]} />
                </View>
                <View style={styles.slideTexts}>
                  <View style={styles.titleRow}>
                    <Text style={styles.slideTitleLive}>{etaText}</Text>
                    {clockTime ? <Text style={styles.clockSubText}>· {clockTime}</Text> : null}
                  </View>
                  <Text style={styles.slideDesc} numberOfLines={1}>
                    #{activeOrder.display_id || 'NVD'} · {cfg.sub}
                  </Text>
                </View>
              </View>

              <View style={styles.slideRight}>
                <View style={styles.trackPillBtn}>
                  <Text style={styles.trackPillText}>Track</Text>
                  <Ionicons name="chevron-up" size={13} color="#FFFFFF" />
                </View>
              </View>
            </TouchableOpacity>
          ) : (
            // Only Cart exists: Clean, sleek single cart row
            <TouchableOpacity
              style={styles.slideItemStandalone}
              onPress={() => navigation?.navigate?.('Cart')}
              activeOpacity={0.92}
            >
              <View style={styles.slideLeft}>
                <View style={styles.iconWrapCart}>
                  <Ionicons name="cart" size={17} color="#FFFFFF" />
                  <View style={styles.cartCountBadge}>
                    <Text style={styles.cartCountBadgeText}>{itemCount}</Text>
                  </View>
                </View>
                <View style={styles.slideTexts}>
                  <View style={styles.titleRow}>
                    <Text style={styles.slideTitleCart}>
                      {itemCount} ITEM{itemCount > 1 ? 'S' : ''} · ₹{itemTotal}
                    </Text>
                  </View>
                  <Text style={styles.slideDesc} numberOfLines={1}>
                    {itemsPreview || 'Dishes added to cart'}
                  </Text>
                </View>
              </View>

              <View style={styles.slideRight}>
                <View style={styles.cartPillBtn}>
                  <Text style={styles.cartPillText}>View Cart</Text>
                  <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                </View>
              </View>
            </TouchableOpacity>
          )}
        </View>
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
    bottom: 68, // Precision docked 6px above the 62px bottom tab bar
    left: 14,
    right: 14,
    zIndex: 999,
    elevation: 12,
  },

  // ── Single Sleek Luxury Floating Card ─────────────────────
  unifiedCard: {
    backgroundColor: '#18181B', // Premium obsidian dark background for maximum contrast over food cards
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.32,
    shadowRadius: 14,
    elevation: 12,
  },

  sliderScrollView: {
    width: CARD_WIDTH,
  },

  slideItem: {
    width: CARD_WIDTH,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },

  slideItemStandalone: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    paddingHorizontal: 14,
  },

  slideLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },

  iconWrapLive: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(234, 88, 12, 0.25)', // Saffron glow
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginRight: 10,
  },

  iconWrapCart: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
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
    backgroundColor: '#22C55E', // Vivid emerald green
    borderWidth: 1.5,
    borderColor: '#18181B',
  },

  pulseDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
    marginRight: 4,
  },

  cartCountBadge: {
    position: 'absolute',
    top: -2,
    right: -3,
    backgroundColor: colors.saffron,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#18181B',
  },

  cartCountBadgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    ...FONTS.heavy,
  },

  slideTexts: {
    flex: 1,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  slideTitleLive: {
    fontSize: 13.5,
    ...FONTS.heavy,
    color: '#FB923C', // Warm luminous saffron
  },

  slideTitleCart: {
    fontSize: 13.5,
    ...FONTS.heavy,
    color: '#FFFFFF',
  },

  clockSubText: {
    fontSize: 11.5,
    ...FONTS.medium,
    color: 'rgba(255, 255, 255, 0.6)',
    marginLeft: 4,
  },

  slideDesc: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.72)',
    marginTop: 1,
  },

  slideRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  trackPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.saffron,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    gap: 3,
  },

  trackPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    ...FONTS.bold,
  },

  cartPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.saffron,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    gap: 4,
  },

  cartPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    ...FONTS.bold,
  },

  // ── Pagination Bar ────────────────────────────────────────
  paginationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingBottom: 6,
    paddingTop: 1,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.07)',
  },

  paginationHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  paginationHintText: {
    fontSize: 9.5,
    ...FONTS.bold,
    color: 'rgba(255, 255, 255, 0.55)',
    letterSpacing: 0.5,
  },

  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  dot: {
    height: 4,
    borderRadius: 2,
  },

  dotActive: {
    width: 14,
    backgroundColor: colors.saffron,
  },

  dotInactive: {
    width: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
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
