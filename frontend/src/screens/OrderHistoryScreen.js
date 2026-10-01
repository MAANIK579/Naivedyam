import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api/client';
import { useTheme } from '../context/ThemeContext';
import { StatusPill, Card, Divider } from '../components';
import { FONTS, RADIUS, SHADOW } from '../theme';

export default function OrderHistoryScreen({ navigation }) {
  const { colors } = useTheme();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = useCallback(async () => {
    try {
      const data = await api.getMyOrders();
      setOrders(data.orders || []);
    } catch (_) {
      // Keep UI responsive even if fetch fails.
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  function onRefresh() {
    setRefreshing(true);
    loadOrders();
  }

  async function handleReorder(order) {
    try {
      const data = await api.reorder(order._id || order.id);
      Alert.alert('Reordered!', 'New order placed successfully.');
      navigation.navigate('MainTabs', {
        screen: 'Track',
        params: { orderId: data?.order?.id || '' },
      });
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not reorder this order');
    }
  }

  const styles = createStyles(colors);

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
        {loading ? (
          <View style={styles.center}><ActivityIndicator color={colors.saffron} /></View>
        ) : orders.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="receipt-outline" size={36} color={colors.border} />
            <Text style={styles.emptyTxt}>No orders yet. Go order some food!</Text>
          </Card>
        ) : (
          orders.map((order) => (
            <TouchableOpacity
              key={order._id || order.id}
              style={styles.orderCard}
              onPress={() => navigation.navigate('OrderDetail', { orderId: order._id || order.id })}
              activeOpacity={0.8}
            >
              <View style={styles.orderTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.orderId}>{order.display_id || 'Order'}</Text>
                  <Text style={styles.orderDate}>
                    {new Date(order.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <Text style={styles.orderTotal}>Rs.{order.grand_total || order.total}</Text>
                  <StatusPill status={order.status} />
                </View>
              </View>

              {order.items?.length > 0 && (
                <>
                  <Divider />
                  <View style={styles.orderFooter}>
                    <Text style={styles.orderItemsList} numberOfLines={1}>
                      {order.items.map((i) => `${i.item_name} x${i.quantity}`).join('  |  ')}
                    </Text>
                    <TouchableOpacity
                      style={styles.reorderBtn}
                      onPress={(e) => {
                        e.stopPropagation && e.stopPropagation();
                        handleReorder(order);
                      }}
                    >
                      <Ionicons name="refresh-outline" size={12} color={colors.white} />
                      <Text style={styles.reorderTxt}>Reorder</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  body: { padding: 16 },
  center: { alignItems: 'center', paddingVertical: 24 },
  emptyCard: { alignItems: 'center', padding: 24 },
  emptyTxt: { color: colors.textMuted, fontSize: 14, marginTop: 8, textAlign: 'center' },
  orderCard: {
    backgroundColor: colors.cardBg, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: colors.borderLight, padding: 14, marginBottom: 10, ...SHADOW.small,
  },
  orderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderId: { fontSize: 14, ...FONTS.bold, color: colors.text },
  orderDate: { fontSize: 11, color: colors.textMuted, marginTop: 3 },
  orderTotal: { fontSize: 17, ...FONTS.bold, color: colors.saffronDeep },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderItemsList: { fontSize: 12, color: colors.textMuted, flex: 1 },
  reorderBtn: {
    backgroundColor: colors.saffron, borderRadius: RADIUS.sm,
    paddingHorizontal: 10, paddingVertical: 5,
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  reorderTxt: { color: colors.white, fontSize: 11, ...FONTS.bold },
});
