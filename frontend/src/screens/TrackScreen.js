// src/screens/TrackScreen.js — Intelligent Auto-Loading Live Order Tracking Screen
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator, TouchableOpacity, Alert, RefreshControl, Modal, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api/client';
import { useTheme } from '../context/ThemeContext';
import { useSocket } from '../context/SocketContext';
import { StatusPill } from '../components';
import { FONTS, RADIUS, SHADOW } from '../theme';

const STEP_ICONS = {
  placed:           'receipt-outline',
  confirmed:        'checkmark-circle-outline',
  preparing:        'flame-outline',
  out_for_delivery: 'bicycle-outline',
  delivered:        'checkmark-done-circle-outline',
};

const CANCELLATION_REASONS = [
  'Placed order by mistake',
  'Wait time is too long',
  'Need to change items or address',
  'Decided to dine out instead',
  'Other reason',
];

export default function TrackScreen({ route, navigation }) {
  const { colors, isDark } = useTheme();
  const { socket } = useSocket();
  const [orderId,  setOrderId]  = useState(route.params?.orderId || '');
  const [tracking, setTracking] = useState(null);
  const [activeOrders, setActiveOrders] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Auto-discover active orders if no orderId is passed
  const findAndTrackOrder = useCallback(async (targetId) => {
    setLoading(true);
    try {
      if (targetId) {
        setOrderId(targetId);
        const data = await api.trackOrder(targetId.trim());
        setTracking(data);
      } else {
        // Fetch user's orders to discover any live order
        const ordersData = await api.getMyOrders();
        const userOrders = ordersData?.orders || [];
        const liveOrders = userOrders.filter(o =>
          ['placed', 'confirmed', 'preparing', 'out_for_delivery'].includes(o.status)
        );
        setActiveOrders(liveOrders);

        if (liveOrders.length > 0) {
          const latestLive = liveOrders[0];
          const trackId = latestLive.display_id || latestLive._id || latestLive.id;
          setOrderId(trackId);
          const data = await api.trackOrder(trackId);
          setTracking(data);
        } else if (userOrders.length > 0) {
          // If no live order, show the most recent order for reference
          const recent = userOrders[0];
          const trackId = recent.display_id || recent._id || recent.id;
          setOrderId(trackId);
          const data = await api.trackOrder(trackId);
          setTracking(data);
        } else {
          setTracking(null);
        }
      }
    } catch (_) {
      // If error occurs, leave tracking as null
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    findAndTrackOrder(route.params?.orderId);
  }, [route.params?.orderId, findAndTrackOrder]);

  // Socket.IO live updates
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
    };

    socket.on('order:status_update', handleStatusUpdate);

    return () => {
      socket.emit('leave:order', tracking.order.id);
      socket.off('order:status_update', handleStatusUpdate);
    };
  }, [socket, tracking?.order?.id]);

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
      Alert.alert('Order Cancelled', 'Your order was successfully cancelled.');
    } catch (err) {
      Alert.alert('Cancellation Failed', err.message || 'Could not cancel order.');
    } finally {
      setCancelling(false);
    }
  }

  function onRefresh() {
    setRefreshing(true);
    findAndTrackOrder(orderId);
  }

  const styles = createStyles(colors, isDark);

  return (
    <View style={styles.container}>
      {/* Top Header Bar */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MainTabs')}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.topHeaderTitle}>Live Order Tracking</Text>
        <View style={{ width: 40 }} />
      </View>

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
        {/* Order Search / Input Pill */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.textLight} />
          <TextInput
            style={styles.searchInput}
            value={orderId}
            onChangeText={setOrderId}
            placeholder="Search by Order ID (e.g. NVD-12345)"
            placeholderTextColor={colors.textLight}
            autoCapitalize="characters"
          />
          <TouchableOpacity
            style={styles.searchBtn}
            onPress={() => findAndTrackOrder(orderId)}
            activeOpacity={0.8}
          >
            <Text style={styles.searchBtnText}>Track</Text>
          </TouchableOpacity>
        </View>

        {/* If user has multiple active orders, show horizontal switcher */}
        {activeOrders.length > 1 && (
          <View style={styles.activeOrdersSwitcher}>
            <Text style={styles.activeOrdersLabel}>Active Orders ({activeOrders.length})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {activeOrders.map(ord => {
                const isSelected = (ord.display_id || ord._id) === orderId;
                return (
                  <TouchableOpacity
                    key={ord._id}
                    style={[styles.orderChip, isSelected && styles.orderChipActive]}
                    onPress={() => findAndTrackOrder(ord.display_id || ord._id)}
                  >
                    <Text style={[styles.orderChipText, isSelected && styles.orderChipTextActive]}>
                      {ord.display_id} · {ord.status}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Loading Spinner */}
        {loading && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.saffron} />
            <Text style={styles.loadingText}>Fetching order status...</Text>
          </View>
        )}

        {/* Live Tracking Card */}
        {!loading && tracking && (
          <View style={styles.trackingCard}>
            {/* Header: ID + Live Status */}
            <View style={styles.orderHeader}>
              <View>
                <View style={styles.orderIdRow}>
                  <Text style={styles.orderId}>{tracking.order.display_id || 'Order'}</Text>
                  {['placed', 'confirmed', 'preparing', 'out_for_delivery'].includes(tracking.order.status) && (
                    <View style={styles.liveBadge}>
                      <View style={styles.liveDot} />
                      <Text style={styles.liveText}>LIVE</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.orderDate}>
                  {new Date(tracking.order.created_at || Date.now()).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                  })}
                </Text>
              </View>

              <StatusPill status={tracking.order.status} />
            </View>

            {/* ETA Banner */}
            {tracking.estimated_delivery && ['placed', 'confirmed', 'preparing', 'out_for_delivery'].includes(tracking.order.status) && (
              <View style={styles.etaBanner}>
                <Ionicons name="timer" size={20} color={colors.turmeric} />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.etaLabel}>Estimated Arrival</Text>
                  <Text style={styles.etaTime}>
                    {new Date(tracking.estimated_delivery).toLocaleTimeString('en-IN', {
                      hour: '2-digit', minute: '2-digit'
                    })} (30-40 min)
                  </Text>
                </View>
              </View>
            )}

            {/* Steps Timeline */}
            <View style={styles.timelineSection}>
              <Text style={styles.sectionHeader}>Delivery Status</Text>

              {tracking.steps.map((step, idx) => {
                const isLast = idx === tracking.steps.length - 1;
                const iconName = STEP_ICONS[step.key] || 'ellipse-outline';

                return (
                  <View key={step.key} style={styles.stepRow}>
                    <View style={styles.stepLeftCol}>
                      <View style={[
                        styles.stepDot,
                        step.done   && styles.stepDotDone,
                        step.active && styles.stepDotActive,
                      ]}>
                        {step.done ? (
                          <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                        ) : step.active ? (
                          <Ionicons name={iconName} size={14} color="#FFFFFF" />
                        ) : (
                          <Text style={styles.stepNum}>{idx + 1}</Text>
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
                      <Text style={[
                        styles.stepTitle,
                        (step.done || step.active) && { color: colors.text, ...FONTS.bold }
                      ]}>
                        {step.label}
                      </Text>

                      {(step.done || step.active) && (
                        <Text style={styles.stepDesc}>{step.desc}</Text>
                      )}

                      {step.active && step.eta && (
                        <View style={styles.stepEtaPill}>
                          <Ionicons name="time" size={11} color={colors.turmeric} />
                          <Text style={styles.stepEtaText}>ETA: {step.eta}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Delivering Address Card */}
            <View style={styles.addressBox}>
              <Ionicons name="location" size={18} color={colors.saffron} />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.addressBoxLabel}>Delivery Address</Text>
                <Text style={styles.addressBoxText}>{tracking.order.address}</Text>
              </View>
            </View>

            {/* Ordered Items Summary */}
            <View style={styles.itemsSummary}>
              <Text style={styles.sectionHeader}>Items Ordered</Text>
              {tracking.order.items.map((i, idx) => (
                <View key={idx} style={styles.itemRow}>
                  <Text style={styles.itemName} numberOfLines={1}>{i.item_name}</Text>
                  <Text style={styles.itemQty}>x{i.quantity}</Text>
                </View>
              ))}

              <View style={styles.divider} />

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Paid</Text>
                <Text style={styles.totalValue}>₹{tracking.order.total || tracking.order.grand_total}</Text>
              </View>
            </View>

            {/* Action Buttons */}
            {tracking.order.status === 'delivered' && (
              <TouchableOpacity
                style={styles.primaryActionBtn}
                onPress={() => navigation.navigate('OrderRating', {
                  orderId: tracking.order.id,
                  displayId: tracking.order.display_id,
                  orderedItems: (tracking.order.items || []).map((item) => ({
                    id: item._id || item.id,
                    name: item.item_name || 'Item',
                    emoji: '🍽️',
                    quantity: item.quantity || 1,
                  })),
                })}
                activeOpacity={0.88}
              >
                <Ionicons name="star" size={18} color="#FFFFFF" />
                <Text style={styles.primaryActionText}>Rate Your Order</Text>
              </TouchableOpacity>
            )}

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
          </View>
        )}

        {/* Empty state if user has no orders at all */}
        {!loading && !tracking && (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyCircle}>
              <Ionicons name="bag-handle-outline" size={54} color={colors.saffron} />
            </View>
            <Text style={styles.emptyTitle}>No Active Delivery</Text>
            <Text style={styles.emptySubtitle}>
              You don't have any ongoing orders right now. Craving authentic food? Order now from our fresh menu!
            </Text>
            <TouchableOpacity
              style={styles.browseMenuBtn}
              onPress={() => navigation.navigate('Menu')}
            >
              <Text style={styles.browseMenuText}>Browse Menu</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Cancellation Modal */}
      <Modal
        visible={cancelModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCancelModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cancel Order</Text>
              <TouchableOpacity onPress={() => setCancelModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.textLight} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              Select a reason for cancelling {tracking?.order?.display_id || 'your order'}:
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
                <Ionicons name="radio-button-off" size={16} color={colors.saffron} style={{ marginRight: 8 }} />
                <Text style={styles.reasonText}>{reasonText}</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.textLight} />
              </TouchableOpacity>
            ))}

            {cancelling && (
              <ActivityIndicator size="small" color={colors.saffron} style={{ marginTop: 12 }} />
            )}
          </View>
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
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 46,
    paddingBottom: 14,
    backgroundColor: colors.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream,
  },
  topHeaderTitle: {
    fontSize: 18,
    ...FONTS.heavy,
    color: colors.text,
  },
  screen: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
    ...SHADOW.small,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: colors.text,
    paddingVertical: 0,
  },
  searchBtn: {
    backgroundColor: colors.saffron,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  searchBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    ...FONTS.bold,
  },
  activeOrdersSwitcher: {
    gap: 6,
  },
  activeOrdersLabel: {
    fontSize: 12,
    ...FONTS.bold,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  orderChip: {
    backgroundColor: colors.cardBg,
    borderRadius: RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  orderChipActive: {
    backgroundColor: colors.saffronPale,
    borderColor: colors.saffron,
  },
  orderChipText: {
    fontSize: 12,
    color: colors.textMuted,
    ...FONTS.semibold,
  },
  orderChipTextActive: {
    color: colors.saffron,
    ...FONTS.bold,
  },
  center: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    color: colors.textMuted,
    marginTop: 12,
    fontSize: 14,
  },
  trackingCard: {
    backgroundColor: colors.cardBg,
    borderRadius: RADIUS.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    ...SHADOW.medium,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  orderIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderId: {
    fontSize: 18,
    ...FONTS.heavy,
    color: colors.text,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? '#052E16' : '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  liveText: {
    fontSize: 9,
    ...FONTS.heavy,
    color: '#16A34A',
  },
  orderDate: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  etaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.creamDark,
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  etaLabel: {
    fontSize: 11.5,
    color: colors.textMuted,
  },
  etaTime: {
    fontSize: 14.5,
    ...FONTS.bold,
    color: colors.turmeric,
  },
  timelineSection: {
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 14,
    ...FONTS.heavy,
    color: colors.text,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 12,
  },
  stepLeftCol: {
    alignItems: 'center',
    width: 26,
  },
  stepDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.creamDark,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotDone: {
    backgroundColor: colors.saffron,
    borderColor: colors.saffron,
  },
  stepDotActive: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  stepNum: {
    fontSize: 11,
    ...FONTS.bold,
    color: colors.textMuted,
  },
  stepLine: {
    flex: 1,
    width: 2,
    backgroundColor: colors.border,
    marginVertical: 4,
    minHeight: 26,
  },
  stepLineDone: {
    backgroundColor: colors.saffron,
  },
  stepBody: {
    flex: 1,
    paddingBottom: 18,
    paddingTop: 2,
  },
  stepTitle: {
    fontSize: 14,
    ...FONTS.semibold,
    color: colors.textMuted,
  },
  stepDesc: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  stepEtaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  stepEtaText: {
    fontSize: 11,
    ...FONTS.bold,
    color: colors.turmeric,
  },
  addressBox: {
    flexDirection: 'row',
    backgroundColor: colors.creamDark,
    borderRadius: RADIUS.md,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  addressBoxLabel: {
    fontSize: 11.5,
    color: colors.textMuted,
  },
  addressBoxText: {
    fontSize: 13,
    ...FONTS.medium,
    color: colors.text,
    marginTop: 2,
  },
  itemsSummary: {
    backgroundColor: colors.creamDark,
    borderRadius: RADIUS.md,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  itemName: {
    fontSize: 13,
    color: colors.text,
    flex: 1,
  },
  itemQty: {
    fontSize: 13,
    ...FONTS.bold,
    color: colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 13.5,
    color: colors.textMuted,
  },
  totalValue: {
    fontSize: 16,
    ...FONTS.heavy,
    color: colors.saffron,
  },
  primaryActionBtn: {
    backgroundColor: colors.saffron,
    borderRadius: RADIUS.lg,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...SHADOW.small,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 15,
    ...FONTS.heavy,
  },
  cancelBtn: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: isDark ? '#7F1D1D' : '#FCA5A5',
    backgroundColor: colors.errorPale,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  cancelBtnText: {
    color: colors.error,
    ...FONTS.bold,
    fontSize: 13.5,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  emptyCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.saffronPale,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 19,
    ...FONTS.heavy,
    color: colors.text,
  },
  emptySubtitle: {
    fontSize: 13.5,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
  },
  browseMenuBtn: {
    backgroundColor: colors.saffron,
    borderRadius: RADIUS.md,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 20,
  },
  browseMenuText: {
    color: '#FFFFFF',
    fontSize: 14,
    ...FONTS.bold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.cardBg,
    borderRadius: RADIUS.xl,
    padding: 20,
    ...SHADOW.large,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 17,
    ...FONTS.heavy,
    color: colors.text,
  },
  modalSub: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 14,
    lineHeight: 18,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.creamDark,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reasonText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
  },
});
