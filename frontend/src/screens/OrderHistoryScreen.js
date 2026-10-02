// src/screens/OrderHistoryScreen.js — Craving Past Orders Screen (PDF Page 6)
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api/client';
import { Plate } from '../components';
import { FONTS, RADIUS, MOODS } from '../theme';

export default function OrderHistoryScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = useCallback(async () => {
    try {
      const data = await api.getMyOrders();
      setOrders(data.orders || []);
    } catch (_) {
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
      Alert.alert('Reordered!', 'New crave meal placed successfully.');
      navigation.navigate('MainTabs', {
        screen: 'Home',
        params: { openTracker: true, orderId: data?.order?.id || '' },
      });
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not reorder this order');
    }
  }

  // Derive mood styling from items or order index
  function getOrderMood(order, index) {
    const moodKeys = ['comfort', 'fresh', 'sweet', 'fire'];
    const firstItem = order.items?.[0];
    if (firstItem?.item_name && /salad|raita|green|snack/i.test(firstItem.item_name)) return 'fresh';
    if (firstItem?.item_name && /sweet|halwa|jamun|dessert/i.test(firstItem.item_name)) return 'sweet';
    if (firstItem?.item_name && /spicy|chilli|kadai/i.test(firstItem.item_name)) return 'fire';
    return moodKeys[index % moodKeys.length];
  }

  function getOrderTitle(order, moodKey) {
    if (moodKey === 'comfort') return 'Comfort night';
    if (moodKey === 'fresh') return 'Fresh lunch';
    if (moodKey === 'sweet') return 'Sweet treat';
    return 'Fiery feast';
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#F5B042']}
            tintColor="#F5B042"
          />
        }
      >
        {/* Header matching PDF Page 6: "Your orders" */}
        <Text style={styles.heading}>Your orders</Text>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color="#F5B042" size="large" />
          </View>
        ) : orders.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="receipt-outline" size={44} color="#A3B5AA" />
            <Text style={styles.emptyTxt}>No orders yet. Discover your next crave!</Text>
            <TouchableOpacity
              style={styles.exploreBtn}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={styles.exploreBtnText}>Explore cravings</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.orderList}>
            {orders.map((order, index) => {
              const moodKey = getOrderMood(order, index);
              const moodCfg = MOODS[moodKey] || MOODS.comfort;
              const title = getOrderTitle(order, moodKey);
              const formattedDate = new Date(order.created_at || Date.now()).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
              });
              const totalAmount = `₹${order.grand_total || order.total || 380}`;

              return (
                <TouchableOpacity
                  key={order._id || order.id || index}
                  style={[
                    styles.orderCard,
                    { borderTopColor: moodCfg.color },
                  ]}
                  onPress={() => navigation.navigate('OrderDetail', { orderId: order._id || order.id })}
                  activeOpacity={0.88}
                >
                  {/* Plate Component */}
                  <Plate
                    imageUrl={order.items?.[0]?.image_url}
                    mood={moodKey}
                    size={64}
                  />

                  {/* Order Title and Date / Total matching PDF Page 6 */}
                  <View style={styles.orderInfo}>
                    <Text style={styles.orderTitle} numberOfLines={1}>
                      {title}
                    </Text>
                    <Text style={styles.orderMeta}>
                      {formattedDate} · {totalAmount}
                    </Text>
                  </View>

                  {/* Reorder Button with mood accent color matching PDF Page 6 */}
                  <TouchableOpacity
                    style={[
                      styles.reorderBtn,
                      { backgroundColor: moodCfg.color },
                    ]}
                    onPress={(e) => {
                      e?.stopPropagation?.();
                      handleReorder(order);
                    }}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={[
                        styles.reorderTxt,
                        { color: moodCfg.textColor },
                      ]}
                    >
                      Reorder
                    </Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#121A16',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 110,
  },
  heading: {
    fontSize: 36,
    ...FONTS.heavy,
    color: '#FFFFFF',
    letterSpacing: -0.8,
    marginBottom: 24,
  },
  center: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyCard: {
    backgroundColor: '#1B2620',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#33463C',
    alignItems: 'center',
    padding: 32,
    marginTop: 20,
  },
  emptyTxt: {
    color: '#A3B5AA',
    fontSize: 15,
    marginTop: 10,
    marginBottom: 20,
    textAlign: 'center',
  },
  exploreBtn: {
    backgroundColor: '#F5B042',
    paddingHorizontal: 24,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exploreBtnText: {
    color: '#2B1A05',
    ...FONTS.heavy,
    fontSize: 14,
  },
  orderList: {
    gap: 14,
  },
  orderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1B2620',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#33463C',
    borderTopWidth: 4, // Top border in mood accent color matching PDF Page 6
    padding: 16,
    gap: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  orderInfo: {
    flex: 1,
  },
  orderTitle: {
    fontSize: 17,
    ...FONTS.heavy,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  orderMeta: {
    fontSize: 13,
    color: '#A3B5AA',
    marginTop: 4,
    ...FONTS.medium,
  },
  reorderBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  reorderTxt: {
    fontSize: 13.5,
    ...FONTS.heavy,
    letterSpacing: -0.2,
  },
});
