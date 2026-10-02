// src/screens/CartScreen.js — Craving Cart & Order Screen (PDF Page 4)
import React, { useState } from 'react';
import {
  View, Text, StyleSheet,
  TouchableOpacity, Alert, ScrollView, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Plate } from '../components';
import { FONTS, RADIUS, SHADOW, MOODS } from '../theme';

export default function CartScreen({ navigation }) {
  const {
    cartItems, itemTotal, deliveryFee, gst, grandTotal, discount,
    appliedCoupon, couponError, couponLoading, applyCoupon, removeCoupon,
    addItem, removeItem, clearCart,
  } = useCart();
  const { user } = useAuth();
  const { colors } = useTheme();

  const [selectedAddress, setSelectedAddress] = useState(user?.addresses?.[0] || null);
  const [address, setAddress] = useState(user?.addresses?.[0]?.full_address || 'Flat 402, Green Glen Layout, Bhiwani');
  const [notes, setNotes] = useState(user?.addresses?.[0]?.delivery_instructions || '');
  const [paymentMethod, setPaymentMethod] = useState('UPI / Online Payment');

  function handleProceedToPayment() {
    if (cartItems.length === 0) return Alert.alert('Empty Cart', 'Add some items first!');
    if (!address.trim()) return Alert.alert('Address Required', 'Please enter a delivery address in Bhiwani.');

    const orderSummary = {
      itemTotal,
      deliveryFee,
      gst,
      discount,
      grandTotal,
    };

    const orderParams = {
      items: cartItems.map(({ item, qty }) => ({ item_id: item.id || item._id, quantity: qty })),
      address: selectedAddress ? {
        label: selectedAddress.label || 'Home',
        full_address: address.trim(),
        landmark: selectedAddress.landmark || '',
        delivery_instructions: notes.trim(),
        lat: selectedAddress.lat || 0,
        lng: selectedAddress.lng || 0,
      } : {
        full_address: address.trim(),
        delivery_instructions: notes.trim(),
      },
      notes: notes.trim(),
      coupon_code: appliedCoupon?.code || '',
    };

    navigation.navigate('Payment', { orderSummary, orderParams });
  }

  if (cartItems.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.topHeader}>
          <TouchableOpacity
            style={styles.backCircleBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.topHeaderTitle}>Your order</Text>
        </View>

        <View style={styles.emptyCenterContent}>
          <View style={styles.emptyCircle}>
            <Ionicons name="bag-handle-outline" size={48} color="#A3B5AA" />
          </View>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>
            Explore cravings and select delicious comfort dishes to fill your bag.
          </Text>
          <TouchableOpacity
            style={styles.exploreBtn}
            onPress={() => navigation.navigate('Menu')}
            activeOpacity={0.85}
          >
            <Text style={styles.exploreBtnText}>Explore cravings</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Header matching PDF Page 4: "← Your order" */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.backCircleBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.topHeaderTitle}>Your order</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Cart Item Cards matching PDF Page 4 */}
        <View style={styles.itemsSection}>
          {cartItems.map(({ item, qty }) => {
            const itemId = item.id || item._id;
            const itemMoodKey = item.mood || 'comfort';
            const itemMoodCfg = MOODS[itemMoodKey] || MOODS.comfort;

            return (
              <View key={itemId} style={styles.dishCartCard}>
                {/* Round Plate */}
                <Plate
                  imageUrl={item.image_url}
                  mood={itemMoodKey}
                  size={62}
                />

                <View style={styles.dishCartInfo}>
                  <Text style={styles.dishCartName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.dishCartSub}>
                    {itemMoodCfg.name} · x{qty}
                  </Text>
                </View>

                {/* Price and Quantity controls */}
                <View style={styles.dishCartRight}>
                  <Text style={styles.dishCartPrice}>₹{item.price * qty}</Text>

                  <View style={styles.stepperMini}>
                    <TouchableOpacity
                      style={styles.stepperMiniBtn}
                      onPress={() => removeItem(itemId)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="remove" size={13} color="#A3B5AA" />
                    </TouchableOpacity>
                    <Text style={styles.stepperMiniText}>{qty}</Text>
                    <TouchableOpacity
                      style={styles.stepperMiniBtn}
                      onPress={() => addItem(item)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="add" size={13} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Deliver to Row matching PDF Page 4 */}
        <TouchableOpacity
          style={styles.infoCard}
          onPress={() =>
            navigation.navigate('Addresses', {
              selectMode: true,
              onSelect: (addr) => {
                setSelectedAddress(addr);
                setAddress(addr.full_address || '');
                if (addr.delivery_instructions) {
                  setNotes(addr.delivery_instructions);
                }
              },
            })
          }
          activeOpacity={0.88}
        >
          <View style={styles.infoLeft}>
            <Text style={styles.infoLabel}>Deliver to</Text>
            <Text style={styles.infoValue} numberOfLines={2}>
              {address}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#A3B5AA" />
        </TouchableOpacity>

        {/* Pay with Row matching PDF Page 4 */}
        <View style={styles.infoCard}>
          <View style={styles.infoLeft}>
            <Text style={styles.infoLabel}>Pay with</Text>
            <Text style={styles.infoValue}>{paymentMethod}</Text>
          </View>
          <Ionicons name="card-outline" size={18} color="#F5B042" />
        </View>

        {/* Bill Summary */}
        <View style={styles.billCard}>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Items subtotal</Text>
            <Text style={styles.billVal}>₹{itemTotal}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery partner fee</Text>
            <Text style={styles.billVal}>₹{deliveryFee}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Taxes & charges (5%)</Text>
            <Text style={styles.billVal}>₹{gst}</Text>
          </View>

          {discount > 0 && (
            <View style={styles.billRow}>
              <Text style={[styles.billLabel, { color: '#8FE0A0' }]}>Coupon discount</Text>
              <Text style={[styles.billVal, { color: '#8FE0A0' }]}>-₹{discount}</Text>
            </View>
          )}

          <View style={styles.divider} />

          {/* Total Row matching PDF Page 4: "Total [TOTAL]" */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₹{grandTotal}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Place Order Primary Button matching PDF Page 4 */}
      <View style={styles.bottomCtaContainer}>
        <TouchableOpacity
          style={styles.placeOrderBtn}
          onPress={handleProceedToPayment}
          activeOpacity={0.88}
          accessibilityLabel="Place order"
        >
          <Text style={styles.placeOrderBtnText}>Place order</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121A16',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 16,
    gap: 14,
  },
  backCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1B2620',
    borderWidth: 1,
    borderColor: '#33463C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topHeaderTitle: {
    fontSize: 26,
    ...FONTS.heavy,
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    gap: 14,
  },
  itemsSection: {
    gap: 12,
  },
  dishCartCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1B2620',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#33463C',
    padding: 14,
    gap: 14,
  },
  dishCartInfo: {
    flex: 1,
  },
  dishCartName: {
    fontSize: 16,
    ...FONTS.heavy,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  dishCartSub: {
    fontSize: 13,
    color: '#A3B5AA',
    marginTop: 4,
    ...FONTS.medium,
  },
  dishCartRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  dishCartPrice: {
    fontSize: 16,
    ...FONTS.heavy,
    color: '#FFFFFF',
  },
  stepperMini: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121A16',
    borderWidth: 1,
    borderColor: '#33463C',
    borderRadius: 16,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  stepperMiniBtn: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperMiniText: {
    fontSize: 12,
    ...FONTS.bold,
    color: '#FFFFFF',
    paddingHorizontal: 6,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1B2620',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#33463C',
    padding: 16,
  },
  infoLeft: {
    flex: 1,
    paddingRight: 12,
  },
  infoLabel: {
    fontSize: 12,
    ...FONTS.bold,
    color: '#A3B5AA',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 14.5,
    ...FONTS.bold,
    color: '#FFFFFF',
    marginTop: 3,
  },
  billCard: {
    backgroundColor: '#1B2620',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#33463C',
    padding: 18,
    gap: 10,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billLabel: {
    fontSize: 13.5,
    color: '#A3B5AA',
  },
  billVal: {
    fontSize: 14,
    ...FONTS.bold,
    color: '#FFFFFF',
  },
  divider: {
    height: 1,
    backgroundColor: '#33463C',
    marginVertical: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 18,
    ...FONTS.heavy,
    color: '#FFFFFF',
  },
  totalValue: {
    fontSize: 20,
    ...FONTS.heavy,
    color: '#FFFFFF',
  },
  bottomCtaContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#121A16',
    borderTopWidth: 1,
    borderTopColor: '#1B2620',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
  },
  placeOrderBtn: {
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F5B042',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  placeOrderBtnText: {
    color: '#2B1A05',
    fontSize: 17,
    ...FONTS.heavy,
    letterSpacing: -0.2,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#121A16',
  },
  emptyCenterContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    marginTop: -40,
  },
  emptyCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#1B2620',
    borderWidth: 1,
    borderColor: '#33463C',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    ...FONTS.heavy,
    color: '#FFFFFF',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#A3B5AA',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  exploreBtn: {
    height: 52,
    paddingHorizontal: 28,
    borderRadius: 26,
    backgroundColor: '#F5B042',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exploreBtnText: {
    color: '#2B1A05',
    fontSize: 15,
    ...FONTS.heavy,
  },
});
