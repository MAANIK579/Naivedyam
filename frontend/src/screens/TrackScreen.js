import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator, TouchableOpacity, Alert, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api/client';
import { useTheme } from '../context/ThemeContext';
import { useSocket } from '../context/SocketContext';
import { Input, Button, StatusPill } from '../components';
import { FONTS, RADIUS, SHADOW } from '../theme';

const STEP_ICONS = {
  placed:           'receipt-outline',
  confirmed:        'checkmark-circle-outline',
  preparing:        'flame-outline',
  out_for_delivery: 'bicycle-outline',
  delivered:        'checkmark-done-outline',
};

const FINAL_ORDER_STATUSES = ['delivered', 'cancelled'];

export default function TrackScreen({ route, navigation }) {
  const { colors, isDark } = useTheme();
  const { socket } = useSocket();
  const [orderId,  setOrderId]  = useState(route.params?.orderId || '');
  const [tracking, setTracking] = useState(null);
  const [trackNotice, setTrackNotice] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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
    if (!trackId.trim()) return Alert.alert('Enter Order ID', 'Please paste your order ID.');
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
    } catch (err) {
      Alert.alert('Not Found', 'Order not found. Please check the ID.');
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
      // silent fail on refresh
    } finally {
      setRefreshing(false);
    }
  }

  const styles = createStyles(colors, isDark);

  return (
    <ScrollView
      style={styles.screen}
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
      <View style={styles.body}>
        <View style={styles.searchRow}>
          <Input
            value={orderId}
            onChangeText={setOrderId}
            placeholder="Paste your Order ID here"
            leftIcon="search-outline"
            style={{ flex: 1, marginBottom: 0 }}
          />
          <TouchableOpacity style={styles.searchBtn} onPress={() => doTrack()} activeOpacity={0.8}>
            <Ionicons name="navigate" size={18} color={colors.white} />
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.saffron} />
            <Text style={{ color: colors.textMuted, marginTop: 10 }}>Fetching order...</Text>
          </View>
        )}

        {!loading && tracking && (
          <View style={styles.trackCard}>
            {/* Header */}
            <View style={styles.orderHeader}>
              <View>
                <Text style={styles.orderId}>{tracking.order.display_id || 'Order'}</Text>
                <Text style={styles.orderIdSub} numberOfLines={1} ellipsizeMode="middle">
                  {tracking.order.id}
                </Text>
              </View>
              <StatusPill status={tracking.order.status} />
            </View>

            {/* ETA */}
            {tracking.estimated_delivery && (
              <View style={styles.etaBanner}>
                <Ionicons name="time-outline" size={16} color={isDark ? colors.text : colors.brown} style={{ marginRight: 6 }} />
                <Text style={styles.etaText}>
                  ETA: {new Date(tracking.estimated_delivery).toLocaleTimeString('en-IN', {
                    hour: '2-digit', minute: '2-digit',
                  })}
                </Text>
              </View>
            )}

            {/* Items */}
            <View style={styles.itemsList}>
              {tracking.order.items.map((i, idx) => (
                <View key={idx} style={styles.trackItem}>
                  <Text style={styles.trackItemName}>{i.item_name}</Text>
                  <Text style={styles.trackItemQty}>x {i.quantity}</Text>
                </View>
              ))}
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLbl}>Total Paid</Text>
              <Text style={styles.totalVal}>₹{tracking.order.total || tracking.order.grand_total}</Text>
            </View>

            {/* Steps */}
            <View style={{ marginTop: 20 }}>
              {tracking.steps.map((step, idx) => {
                const stepIcon = STEP_ICONS[step.key] || 'ellipse-outline';
                return (
                  <View key={step.key} style={styles.step}>
                    <View style={styles.stepLeft}>
                      <View style={[
                        styles.stepDot,
                        step.done   && styles.stepDotDone,
                        step.active && styles.stepDotActive,
                      ]}>
                        {step.done ? (
                          <Ionicons name="checkmark" size={16} color={colors.white} />
                        ) : step.active ? (
                          <Ionicons name={stepIcon} size={14} color={colors.white} />
                        ) : (
                          <Text style={styles.stepDotTxt}>{idx + 1}</Text>
                        )}
                      </View>
                      {idx < tracking.steps.length - 1 && (
                        <View style={[styles.stepLine, step.done && styles.stepLineDone]} />
                      )}
                    </View>
                    <View style={styles.stepBody}>
                      <Text style={[styles.stepName, (step.done || step.active) && { color: colors.text }]}>
                        {step.label}
                      </Text>
                      {(step.done || step.active) && (
                        <Text style={styles.stepDesc}>{step.desc}</Text>
                      )}
                      {step.active && step.eta && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
                          <Ionicons name="time-outline" size={12} color={colors.turmeric} />
                          <Text style={styles.stepEta}>ETA: {step.eta}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>

            <View style={styles.deliveryAddr}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                <Ionicons name="location-outline" size={14} color={colors.textMuted} />
                <Text style={styles.addrLabel}>Delivering to</Text>
              </View>
              <Text style={styles.addrVal}>{tracking.order.address}</Text>
            </View>

            {/* Rate Order Button - shows when delivered */}
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
                activeOpacity={0.85}
              >
                <Ionicons name="star-outline" size={20} color={colors.white} />
                <Text style={styles.rateBtnText}>Rate Your Order</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {!loading && !tracking && (
          <View style={styles.center}>
            <Ionicons name="cube-outline" size={56} color={colors.border} />
            <Text style={styles.emptyTitle}>Track your order</Text>
            <Text style={styles.emptySub}>{trackNotice || 'Enter your order ID above and tap Track'}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  body:   { padding: 20 },
  searchRow: { flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 20 },
  searchBtn: {
    backgroundColor: colors.saffron, borderRadius: RADIUS.md,
    width: 48, height: 48, alignItems: 'center', justifyContent: 'center',
    ...SHADOW.small,
  },
  center: { alignItems: 'center', paddingVertical: 48 },
  trackCard: {
    backgroundColor: colors.cardBg, borderRadius: RADIUS.xl,
    borderWidth: 1, borderColor: colors.border,
    padding: 20, ...SHADOW.medium,
  },
  orderHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 14,
  },
  orderId:    { fontSize: 18, ...FONTS.bold, color: colors.text },
  orderIdSub: { fontSize: 12, color: colors.textMuted, marginTop: 2, maxWidth: 200 },
  etaBanner: {
    backgroundColor: colors.creamDark, borderRadius: RADIUS.md,
    padding: 10, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  etaText:   { fontSize: 14, ...FONTS.bold, color: isDark ? colors.text : colors.brown },
  itemsList: { backgroundColor: colors.creamDark, borderRadius: RADIUS.md, padding: 12, gap: 6 },
  trackItem: { flexDirection: 'row', justifyContent: 'space-between' },
  trackItemName: { fontSize: 13, color: colors.text, ...FONTS.medium },
  trackItemQty:  { fontSize: 13, color: colors.textMuted },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  totalLbl: { fontSize: 14, color: colors.textMuted },
  totalVal: { fontSize: 16, ...FONTS.bold, color: colors.saffronDeep },
  step:     { flexDirection: 'row', gap: 12, marginBottom: 0 },
  stepLeft: { alignItems: 'center', width: 32 },
  stepDot: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: colors.creamDark,
    borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  stepDotDone:   { backgroundColor: colors.saffron, borderColor: colors.saffron },
  stepDotActive: { backgroundColor: colors.green, borderColor: colors.green },
  stepDotTxt:    { fontSize: 12, ...FONTS.bold, color: colors.textMuted },
  stepLine:      { flex: 1, width: 2, backgroundColor: colors.border, marginVertical: 3, minHeight: 24 },
  stepLineDone:  { backgroundColor: colors.saffron },
  stepBody:      { flex: 1, paddingBottom: 20, paddingTop: 4 },
  stepName:      { fontSize: 14, ...FONTS.semibold, color: colors.textMuted },
  stepDesc:      { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  stepEta:       { fontSize: 12, color: colors.turmeric, ...FONTS.bold },
  deliveryAddr:  { marginTop: 16, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 },
  addrLabel:     { fontSize: 12, color: colors.textMuted },
  addrVal:       { fontSize: 14, color: colors.text, ...FONTS.medium, marginLeft: 18 },
  rateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.saffron, borderRadius: RADIUS.lg,
    paddingVertical: 14, marginTop: 20, ...SHADOW.medium,
  },
  rateBtnText: { fontSize: 15, ...FONTS.bold, color: colors.white },
  emptyTitle:    { fontSize: 20, ...FONTS.bold, color: colors.text, marginTop: 12 },
  emptySub:      { fontSize: 13, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
});
