import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator, TouchableOpacity, Alert, RefreshControl, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api/client';
import { useTheme } from '../context/ThemeContext';
import { useSocket } from '../context/SocketContext';
import { StatusPill, GlassCard, AmbientGlow } from '../components';
import { FONTS, RADIUS, SHADOW } from '../theme';

const STEP_ICONS = {
  placed:           'receipt-outline',
  confirmed:        'checkmark-circle-outline',
  preparing:        'flame-outline',
  out_for_delivery: 'bicycle-outline',
  delivered:        'checkmark-done-outline',
};

const CANCELLATION_REASONS = [
  'Placed order by mistake',
  'Wait time is too long',
  'Need to change items or delivery address',
  'Decided to eat later or dine out',
  'Other reason',
];

export default function TrackScreen({ route, navigation }) {
  const { colors, isDark } = useTheme();
  const { socket } = useSocket();
  const [orderId,  setOrderId]  = useState(route.params?.orderId || '');
  const [tracking, setTracking] = useState(null);
  const [trackNotice, setTrackNotice] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  async function handleCancelOrder(reason) {
    if (!tracking?.order?.id) return;
    setCancelling(true);
    try {
      await api.cancelOrder(tracking.order.id, reason);
      setCancelModalVisible(false);
      setTracking(prev => prev ? {
        ...prev,
        order: { ...prev.order, status: 'cancelled' },
      } : prev);
      setTrackNotice('This order has been cancelled.');
      Alert.alert('Order Cancelled', 'Your order was successfully cancelled.');
    } catch (err) {
      Alert.alert('Cancellation Failed', err.message || 'Could not cancel order.');
    } finally {
      setCancelling(false);
    }
  }

  // Auto-track if navigated with an order ID
  useEffect(() => {
    if (route.params?.orderId) doTrack(route.params.orderId);
  }, [route.params?.orderId]);

  // Socket.IO: listen for real-time updates via shared socket
  useEffect(() => {
    if (!socket || !tracking?.order?.id) return;

    socket.emit('join:order', tracking.order.id);

    const handleStatusUpdate = ({ status, steps, estimated_delivery }) => {
      setTracking(prev => prev ? {
        ...prev,
        order: { ...prev.order, status },
        steps: steps || prev.steps,
        estimated_delivery: estimated_delivery || prev.estimated_delivery,
      } : prev);

      if (status === 'delivered') {
        setTrackNotice('Order delivered! Hope you enjoyed your meal.');
      } else if (status === 'cancelled') {
        setTrackNotice('This order has been cancelled.');
      }
    };

    socket.on('order:status_update', handleStatusUpdate);

    return () => {
      socket.emit('leave:order', tracking.order.id);
      socket.off('order:status_update', handleStatusUpdate);
    };
  }, [socket, tracking?.order?.id]);

  async function doTrack(id) {
    const trackId = id || orderId;
    if (!trackId.trim()) return Alert.alert('Enter Order ID', 'Please enter your order ID to track.');
    try {
      setLoading(true);
      const data = await api.trackOrder(trackId.trim());
      setTracking(data);
      if (data?.order?.status === 'delivered') {
        setTrackNotice('Order delivered! Hope you enjoyed your meal.');
      } else if (data?.order?.status === 'cancelled') {
        setTrackNotice('This order has been cancelled.');
      } else {
        setTrackNotice('');
      }
    } catch (_) {
      Alert.alert('Not Found', 'Order not found. Please verify the ID.');
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    if (!tracking?.order?.id) return;
    try {
      setRefreshing(true);
      const data = await api.trackOrder(tracking.order.id);
      setTracking(data);
      if (data?.order?.status === 'delivered') {
        setTrackNotice('Order delivered! Hope you enjoyed your meal.');
      } else if (data?.order?.status === 'cancelled') {
        setTrackNotice('This order has been cancelled.');
      } else {
        setTrackNotice('');
      }
    } catch (_) {
    } finally {
      setRefreshing(false);
    }
  }

  const styles = createStyles(colors, isDark);

  return (
    <View style={styles.container}>
      <AmbientGlow />

      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.saffron]}
            tintColor={colors.saffron}
          />
        }
      >
        {/* Tracking ID Search Input Pill */}
        <GlassCard style={styles.searchBarCard} padding={8}>
          <Ionicons name="search-outline" size={18} color={colors.saffron} style={{ marginLeft: 8 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.inputMiniLabel}>Order ID</Text>
            <TouchableOpacity activeOpacity={1}>
              <Text
                style={[styles.inputOrderText, !orderId && { color: colors.textLight }]}
                numberOfLines={1}
              >
                {orderId || 'Paste your Order ID to track...'}
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.trackBtn}
            onPress={() => doTrack()}
            activeOpacity={0.85}
          >
            <Ionicons name="navigate" size={16} color="#FFFFFF" />
            <Text style={styles.trackBtnText}>Track</Text>
          </TouchableOpacity>
        </GlassCard>

        {loading && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.saffron} />
            <Text style={{ color: colors.textMuted, marginTop: 12, fontSize: 14 }}>
              Connecting to kitchen...
            </Text>
          </View>
        )}

        {!loading && tracking && (
          <GlassCard elevated style={styles.trackCard} padding={20}>
            {/* Header */}
            <View style={styles.orderHeader}>
              <View style={{ flex: 1 }}>
                <View style={styles.idRow}>
                  <Text style={styles.orderId}>{tracking.order.display_id || 'Order'}</Text>
                  <View style={styles.liveBeacon}>
                    <View style={styles.beaconDot} />
                    <Text style={styles.beaconText}>LIVE</Text>
                  </View>
                </View>
                <Text style={styles.orderIdSub} numberOfLines={1} ellipsizeMode="middle">
                  ID: {tracking.order.id}
                </Text>
              </View>
              <StatusPill status={tracking.order.status} />
            </View>

            {/* ETA Glass Banner */}
            {tracking.estimated_delivery && (
              <GlassCard subtle style={styles.etaBanner} padding={12}>
                <View style={styles.etaLeft}>
                  <Ionicons name="timer-outline" size={18} color={colors.turmeric} />
                  <Text style={styles.etaLabel}>Estimated Delivery</Text>
                </View>
                <Text style={styles.etaValue}>
                  {new Date(tracking.estimated_delivery).toLocaleTimeString('en-IN', {
                    hour: '2-digit', minute: '2-digit',
                  })}
                </Text>
              </GlassCard>
            )}

            {/* Items Summary */}
            <GlassCard subtle style={styles.itemsCard} padding={14}>
              <Text style={styles.itemsTitle}>Ordered Items</Text>
              {tracking.order.items.map((i, idx) => (
                <View key={idx} style={styles.trackItemRow}>
                  <Text style={styles.trackItemName} numberOfLines={1}>{i.item_name}</Text>
                  <Text style={styles.trackItemQty}>x{i.quantity}</Text>
                </View>
              ))}

              <View style={styles.summaryDivider} />

              <View style={styles.totalRow}>
                <Text style={styles.totalLbl}>Total Amount</Text>
                <Text style={styles.totalVal}>₹{tracking.order.total || tracking.order.grand_total}</Text>
              </View>
            </GlassCard>

            {/* Real-time Steps Timeline */}
            <View style={styles.timelineSection}>
              <Text style={styles.timelineTitle}>Order Status</Text>

              {tracking.steps.map((step, idx) => {
                const stepIcon = STEP_ICONS[step.key] || 'ellipse-outline';
                const isLast = idx === tracking.steps.length - 1;

                return (
                  <View key={step.key} style={styles.step}>
                    <View style={styles.stepLeft}>
                      <View style={[
                        styles.stepDot,
                        step.done   && styles.stepDotDone,
                        step.active && styles.stepDotActive,
                      ]}>
                        {step.done ? (
                          <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                        ) : step.active ? (
                          <Ionicons name={stepIcon} size={14} color="#FFFFFF" />
                        ) : (
                          <Text style={styles.stepDotTxt}>{idx + 1}</Text>
                        )}
                      </View>
                      {!isLast && (
                        <View style={[
                          styles.stepLine,
                          step.done && styles.stepLineDone,
                        ]} />
                      )}
                    </View>

                    <View style={styles.stepBody}>
                      <View style={styles.stepTitleRow}>
                        <Text style={[
                          styles.stepName,
                          (step.done || step.active) && { color: colors.text, ...FONTS.bold },
                        ]}>
                          {step.label}
                        </Text>
                        {step.active && (
                          <View style={styles.currentStepBadge}>
                            <Text style={styles.currentStepText}>IN PROGRESS</Text>
                          </View>
                        )}
                      </View>

                      {(step.done || step.active) && (
                        <Text style={styles.stepDesc}>{step.desc}</Text>
                      )}

                      {step.active && step.eta && (
                        <View style={styles.etaChip}>
                          <Ionicons name="time" size={12} color={colors.turmeric} />
                          <Text style={styles.stepEta}>ETA: {step.eta}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Delivering To Address */}
            <GlassCard subtle style={styles.deliveryAddrCard} padding={14}>
              <View style={styles.addrHeaderRow}>
                <Ionicons name="location" size={16} color={colors.saffron} />
                <Text style={styles.addrLabel}>Delivering To</Text>
              </View>
              <Text style={styles.addrVal}>{tracking.order.address}</Text>
            </GlassCard>

            {/* Rate Order Button (Delivered) */}
            {tracking.order.status === 'delivered' && (
              <TouchableOpacity
                style={styles.rateBtn}
                onPress={() => navigation.navigate('OrderRating', {
                  orderId: tracking.order.id,
                  displayId: tracking.order.display_id,
                  orderedItems: (tracking.order.items || []).map((item) => {
                    const menuItemObj = typeof item.menu_item === 'object' ? item.menu_item : null;
                    const menuItemId = menuItemObj?._id || item.menu_item || item._id || '';
                    return {
                      id: menuItemId,
                      _id: menuItemId,
                      name: item.item_name || menuItemObj?.name || 'Item',
                      emoji: menuItemObj?.emoji || '🍽️',
                      quantity: item.quantity || 1,
                    };
                  }),
                })}
                activeOpacity={0.88}
              >
                <Ionicons name="star" size={18} color="#FFFFFF" />
                <Text style={styles.rateBtnText}>Rate Your Experience</Text>
              </TouchableOpacity>
            )}

            {/* Self-Cancellation Button (Placed or Confirmed) */}
            {(tracking.order.status === 'placed' || tracking.order.status === 'confirmed') && (
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setCancelModalVisible(true)}
                disabled={cancelling}
                activeOpacity={0.85}
              >
                <Ionicons name="close-circle-outline" size={16} color={colors.error} />
                <Text style={styles.cancelBtnText}>
                  {cancelling ? 'Cancelling...' : 'Cancel Order'}
                </Text>
              </TouchableOpacity>
            )}
          </GlassCard>
        )}

        {!loading && !tracking && (
          <View style={styles.emptyContainer}>
            <GlassCard style={styles.emptyCard} padding={32}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="cube-outline" size={48} color={colors.saffron} />
              </View>
              <Text style={styles.emptyTitle}>Track Your Order</Text>
              <Text style={styles.emptySub}>
                {trackNotice || 'Enter your order ID above to see live updates from the kitchen.'}
              </Text>
            </GlassCard>
          </View>
        )}
      </ScrollView>

      {/* Cancellation Modal with Frosted Reason Tiles */}
      <Modal
        visible={cancelModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCancelModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <GlassCard elevated style={styles.modalCard} padding={22}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Ionicons name="alert-circle-outline" size={20} color={colors.error} />
                <Text style={styles.modalTitle}>Cancel Order</Text>
              </View>
              <TouchableOpacity onPress={() => setCancelModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color={colors.textLight} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              Please tell us why you are cancelling {tracking?.order?.display_id || 'this order'}:
            </Text>

            {CANCELLATION_REASONS.map((reasonText, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.reasonOption}
                onPress={() => {
                  Alert.alert(
                    'Confirm Cancellation',
                    `Are you sure you want to cancel this order? Reason: "${reasonText}"`,
                    [
                      { text: 'Keep Order', style: 'cancel' },
                      {
                        text: 'Cancel Order',
                        style: 'destructive',
                        onPress: () => handleCancelOrder(reasonText),
                      },
                    ]
                  );
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="radio-button-off" size={16} color={colors.saffron} style={{ marginRight: 10 }} />
                <Text style={styles.reasonText}>{reasonText}</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.textLight} />
              </TouchableOpacity>
            ))}

            {cancelling && (
              <ActivityIndicator size="small" color={colors.saffron} style={{ marginTop: 14 }} />
            )}
          </GlassCard>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  screen: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 18,
    paddingBottom: 40,
  },
  searchBarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.full,
    gap: 10,
    marginBottom: 16,
  },
  inputMiniLabel: {
    fontSize: 9.5,
    ...FONTS.bold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputOrderText: {
    fontSize: 13.5,
    ...FONTS.semibold,
    color: colors.text,
  },
  trackBtn: {
    backgroundColor: colors.saffron,
    borderRadius: RADIUS.full,
    paddingHorizontal: 16,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    ...SHADOW.small,
  },
  trackBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    ...FONTS.bold,
  },
  center: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  trackCard: {
    borderRadius: RADIUS.xl,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderId: {
    fontSize: 19,
    ...FONTS.heavy,
    color: colors.text,
    letterSpacing: -0.3,
  },
  liveBeacon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(34,197,94,0.18)' : 'rgba(22,163,74,0.14)',
    borderRadius: RADIUS.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 4,
  },
  beaconDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.green,
  },
  beaconText: {
    fontSize: 9,
    ...FONTS.heavy,
    color: colors.green,
    letterSpacing: 0.5,
  },
  orderIdSub: {
    fontSize: 11.5,
    color: colors.textMuted,
    marginTop: 2,
    maxWidth: 200,
  },
  etaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: RADIUS.lg,
    marginBottom: 16,
  },
  etaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  etaLabel: {
    fontSize: 13,
    ...FONTS.semibold,
    color: colors.text,
  },
  etaValue: {
    fontSize: 14,
    ...FONTS.bold,
    color: colors.turmeric,
  },
  itemsCard: {
    borderRadius: RADIUS.lg,
    marginBottom: 20,
  },
  itemsTitle: {
    fontSize: 13,
    ...FONTS.bold,
    color: colors.text,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  trackItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  trackItemName: {
    fontSize: 13,
    color: colors.text,
    ...FONTS.medium,
    flex: 1,
    marginRight: 8,
  },
  trackItemQty: {
    fontSize: 13,
    color: colors.textMuted,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.glass?.borderSubtle || (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
    marginVertical: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLbl: {
    fontSize: 13.5,
    color: colors.textMuted,
  },
  totalVal: {
    fontSize: 16,
    ...FONTS.heavy,
    color: colors.saffron,
  },
  timelineSection: {
    marginBottom: 16,
  },
  timelineTitle: {
    fontSize: 15,
    ...FONTS.bold,
    color: colors.text,
    marginBottom: 14,
    letterSpacing: -0.2,
  },
  step: {
    flexDirection: 'row',
    gap: 14,
  },
  stepLeft: {
    alignItems: 'center',
    width: 28,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.glass?.card || (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'),
    borderWidth: 1.5,
    borderColor: colors.glass?.border || 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotDone: {
    backgroundColor: colors.saffron,
    borderColor: colors.saffron,
  },
  stepDotActive: {
    backgroundColor: colors.green,
    borderColor: colors.greenLight,
    ...SHADOW.small,
  },
  stepDotTxt: {
    fontSize: 11,
    ...FONTS.bold,
    color: colors.textMuted,
  },
  stepLine: {
    flex: 1,
    width: 2,
    backgroundColor: colors.glass?.border || (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'),
    marginVertical: 4,
    minHeight: 28,
  },
  stepLineDone: {
    backgroundColor: colors.saffron,
  },
  stepBody: {
    flex: 1,
    paddingBottom: 22,
    paddingTop: 2,
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepName: {
    fontSize: 14,
    ...FONTS.medium,
    color: colors.textMuted,
  },
  currentStepBadge: {
    backgroundColor: isDark ? 'rgba(34,197,94,0.16)' : 'rgba(22,163,74,0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  currentStepText: {
    fontSize: 8.5,
    ...FONTS.bold,
    color: colors.green,
    letterSpacing: 0.5,
  },
  stepDesc: {
    fontSize: 12.5,
    color: colors.textMuted,
    marginTop: 3,
    lineHeight: 17,
  },
  etaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  stepEta: {
    fontSize: 11.5,
    color: colors.turmeric,
    ...FONTS.bold,
  },
  deliveryAddrCard: {
    borderRadius: RADIUS.lg,
    marginBottom: 16,
  },
  addrHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  addrLabel: {
    fontSize: 12,
    color: colors.textMuted,
    ...FONTS.semibold,
  },
  addrVal: {
    fontSize: 13.5,
    color: colors.text,
    lineHeight: 19,
    paddingLeft: 22,
  },
  rateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.saffron,
    borderRadius: RADIUS.lg,
    paddingVertical: 14,
    marginTop: 8,
    ...SHADOW.glassGlow,
  },
  rateBtnText: {
    fontSize: 15,
    ...FONTS.bold,
    color: '#FFFFFF',
  },
  cancelBtn: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(239,68,68,0.35)' : 'rgba(220,38,38,0.25)',
    backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(254,242,242,0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  cancelBtnText: {
    color: colors.error,
    ...FONTS.semibold,
    fontSize: 13.5,
  },
  emptyContainer: {
    marginTop: 32,
    alignItems: 'center',
  },
  emptyCard: {
    width: '100%',
    alignItems: 'center',
    borderRadius: RADIUS.xl,
  },
  emptyIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: isDark ? 'rgba(245,158,11,0.14)' : 'rgba(22,163,74,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    ...FONTS.heavy,
    color: colors.text,
  },
  emptySub: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 19,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 390,
    borderRadius: RADIUS.xxl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    ...FONTS.heavy,
    color: colors.text,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalSub: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 16,
    lineHeight: 18,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: colors.glass?.border || (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'),
    backgroundColor: colors.glass?.card || (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)'),
    marginBottom: 8,
  },
  reasonText: {
    fontSize: 13,
    color: colors.text,
    ...FONTS.medium,
    flex: 1,
  },
});
