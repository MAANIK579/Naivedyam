// src/screens/CartScreen.js — Enhanced with payment screen navigation and theme support
import React, { useState } from 'react';
import {
  View, Text, StyleSheet,
  TouchableOpacity, Alert, ScrollView, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components';
import { FONTS, RADIUS, SHADOW } from '../theme';

export default function CartScreen({ navigation }) {
  const {
    cartItems, itemTotal, deliveryFee, gst, grandTotal, discount,
    appliedCoupon, couponError, couponLoading, applyCoupon, removeCoupon,
    addItem, removeItem, clearCart,
  } = useCart();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();

  const [address,     setAddress]     = useState(user?.addresses?.[0]?.full_address || '');
  const [notes,       setNotes]       = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [showCoupon,  setShowCoupon]  = useState(false);

  const styles = createStyles(colors, isDark);

  function handleProceedToPayment() {
    if (cartItems.length === 0) return Alert.alert('Empty Cart', 'Add some items first!');
    if (!address.trim()) return Alert.alert('Address Required', 'Please enter a delivery address.');

    const orderSummary = {
      itemTotal,
      deliveryFee,
      gst,
      discount,
      grandTotal,
    };

    const orderParams = {
      items: cartItems.map(({ item, qty }) => ({ item_id: item.id || item._id, quantity: qty })),
      address,
      notes,
      coupon_code: appliedCoupon?.code || '',
    };

    navigation.navigate('Payment', { orderSummary, orderParams });
  }

  if (cartItems.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="cart-outline" size={64} color={colors.border} />
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptySub}>Add delicious Haryanvi food from our menu</Text>
        <Button title="Browse Menu" icon="restaurant-outline" onPress={() => navigation.navigate('Menu')} style={{ marginTop: 20, paddingHorizontal: 32 }} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}>

      {/* Items */}
      <View style={styles.section}>
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Your Items ({cartItems.length})</Text>
          <TouchableOpacity onPress={() => Alert.alert('Clear Cart', 'Remove all items?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Clear', style: 'destructive', onPress: clearCart },
          ])}>
            <Text style={{ fontSize: 13, color: colors.error, ...FONTS.medium }}>Clear All</Text>
          </TouchableOpacity>
        </View>
        {cartItems.map(({ item, qty }) => (
          <View key={item.id || item._id} style={styles.cartItem}>
            <Text style={{ fontSize: 32, width: 44, textAlign: 'center' }}>{item.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>₹{item.price * qty}</Text>
            </View>
            <View style={styles.qtyCtrl}>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => removeItem(item.id || item._id)}>
                <Ionicons name="remove" size={14} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.qtyNum}>{qty}</Text>
              <TouchableOpacity
                style={[styles.qtyBtn, { backgroundColor: colors.saffron, borderColor: colors.saffron }]}
                onPress={() => addItem(item)}
              >
                <Ionicons name="add" size={14} color={colors.white} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {/* Delivery address */}
      <View style={styles.section}>
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Addresses', {
            selectMode: true,
            onSelect: (addr) => setAddress(addr.full_address),
          })}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="location-outline" size={14} color={colors.saffron} />
              <Text style={styles.linkText}>Saved</Text>
            </View>
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.textArea}
          value={address}
          onChangeText={setAddress}
          placeholder="Enter full delivery address in Bhiwani"
          placeholderTextColor={colors.textMuted}
          multiline numberOfLines={2}
        />
        <TextInput
          style={[styles.textArea, { marginTop: 10, minHeight: 44 }]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Special instructions (optional)"
          placeholderTextColor={colors.textMuted}
          multiline
        />
      </View>

      {/* Coupon */}
      <View style={styles.section}>
        {appliedCoupon ? (
          <View style={styles.couponApplied}>
            <Ionicons name="pricetag" size={18} color={colors.green} />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.couponCode}>{appliedCoupon.code}</Text>
              <Text style={styles.couponSaved}>You save ₹{appliedCoupon.discount}</Text>
            </View>
            <TouchableOpacity onPress={removeCoupon} style={{ padding: 4 }}>
              <Ionicons name="close-circle" size={20} color={colors.error} />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <TouchableOpacity style={styles.couponRow} onPress={() => setShowCoupon(s => !s)}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="pricetag-outline" size={18} color={colors.text} />
                <Text style={styles.couponLabel}>Apply Coupon</Text>
              </View>
              <Ionicons name={showCoupon ? 'chevron-up' : 'chevron-down'} size={18} color={colors.saffron} />
            </TouchableOpacity>
            {showCoupon && (
              <>
                <View style={styles.couponInput}>
                  <TextInput
                    style={styles.couponField}
                    value={couponInput}
                    onChangeText={t => setCouponInput(t.toUpperCase())}
                    placeholder="Enter coupon code"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="characters"
                  />
                  <TouchableOpacity
                    style={styles.couponApplyBtn}
                    onPress={() => { applyCoupon(couponInput); setShowCoupon(false); }}
                    disabled={couponLoading}
                  >
                    <Text style={styles.couponApplyTxt}>{couponLoading ? '...' : 'Apply'}</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Coupon', {
                    cartTotal: itemTotal,
                    onApply: ({ code }) => { applyCoupon(code); setShowCoupon(false); },
                  })}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 }}
                >
                  <Text style={styles.linkText}>Browse available coupons</Text>
                  <Ionicons name="arrow-forward" size={14} color={colors.saffron} />
                </TouchableOpacity>
              </>
            )}
            {!!couponError && <Text style={styles.couponError}>{couponError}</Text>}
          </>
        )}
      </View>

      {/* Payment options preview */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.paymentPreview}
          onPress={handleProceedToPayment}
          activeOpacity={0.85}
        >
          <View style={styles.paymentLeft}>
            <Ionicons name="wallet-outline" size={22} color={colors.saffron} />
            <View>
              <Text style={styles.paymentTitle}>Choose Payment Method</Text>
              <Text style={styles.paymentSub}>COD · UPI · Razorpay</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.saffron} />
        </TouchableOpacity>
      </View>

      {/* Order Summary */}
      <View style={[styles.section, styles.summaryCard]}>
        <Text style={[styles.sectionTitle, { color: colors.white, marginBottom: 14 }]}>Order Summary</Text>
        {[['Item Total', `₹${itemTotal}`], ['Delivery Fee', `₹${deliveryFee}`], ['GST (5%)', `₹${gst}`]].map(([lbl, val]) => (
          <View key={lbl} style={styles.summaryRow}>
            <Text style={styles.summaryLbl}>{lbl}</Text>
            <Text style={styles.summaryVal}>{val}</Text>
          </View>
        ))}
        {discount > 0 && (
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLbl, { color: colors.saffronLight }]}>Coupon Discount</Text>
            <Text style={[styles.summaryVal, { color: colors.saffronLight }]}>-₹{discount}</Text>
          </View>
        )}
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLbl}>Total</Text>
          <Text style={styles.totalVal}>₹{grandTotal}</Text>
        </View>
        <Button
          title="Proceed to Payment"
          icon="card-outline"
          onPress={handleProceedToPayment}
          style={{ marginTop: 14 }}
        />
      </View>
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  screen:  { flex: 1, backgroundColor: colors.cream },
  empty:   { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: colors.cream },
  emptyTitle: { fontSize: 22, ...FONTS.bold, color: colors.text, marginTop: 16 },
  emptySub: { fontSize: 14, color: colors.textMuted, marginTop: 6, textAlign: 'center' },
  section: { margin: 16, marginBottom: 0 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 17, ...FONTS.bold, color: colors.text },
  linkText: { fontSize: 13, color: colors.saffron, ...FONTS.semibold },
  textArea: {
    backgroundColor: colors.creamDark, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: RADIUS.md, padding: 12, fontSize: 14, color: colors.text,
    minHeight: 52, textAlignVertical: 'top',
  },
  cartItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.cardBg, borderWidth: 1, borderColor: colors.borderLight,
    borderRadius: RADIUS.lg, padding: 12, marginBottom: 10, ...SHADOW.small,
  },
  itemName:  { fontSize: 14, ...FONTS.semibold, color: colors.text },
  itemPrice: { fontSize: 15, ...FONTS.bold, color: colors.saffronDeep, marginTop: 2 },
  qtyCtrl:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: {
    width: 28, height: 28, borderRadius: 8, backgroundColor: colors.creamDark,
    borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  qtyNum:    { fontSize: 15, ...FONTS.bold, color: colors.text, minWidth: 20, textAlign: 'center' },
  couponRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderColor: colors.border,
  },
  couponLabel: { fontSize: 15, ...FONTS.medium, color: colors.text },
  couponInput: { flexDirection: 'row', gap: 8, marginTop: 12 },
  couponField: {
    flex: 1, backgroundColor: colors.creamDark, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: RADIUS.md, padding: 12, fontSize: 14, color: colors.text, letterSpacing: 1,
  },
  couponApplyBtn: {
    backgroundColor: colors.saffron, borderRadius: RADIUS.md,
    paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center',
  },
  couponApplyTxt: { color: colors.white, ...FONTS.bold, fontSize: 14 },
  couponError:    { fontSize: 12, color: colors.error, marginTop: 6 },
  couponApplied: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.saffronPale,
    borderRadius: RADIUS.md, padding: 12, borderWidth: 1, borderColor: colors.saffron,
  },
  couponCode:   { fontSize: 14, ...FONTS.bold, color: colors.saffron },
  couponSaved:  { fontSize: 12, color: colors.saffronLight, marginTop: 2 },
  paymentPreview: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.cardBg, borderRadius: RADIUS.lg,
    padding: 16, borderWidth: 1.5, borderColor: colors.saffron + '40',
    ...SHADOW.small,
  },
  paymentLeft: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  paymentTitle: { fontSize: 15, ...FONTS.semibold, color: colors.text },
  paymentSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  summaryCard: {
    backgroundColor: colors.brown, borderRadius: RADIUS.xl,
    padding: 20, marginTop: 16, ...SHADOW.medium,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLbl: { color: colors.textMuted, fontSize: 14 },
  summaryVal: { color: colors.textMuted, fontSize: 14 },
  totalRow: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, marginTop: 4 },
  totalLbl:  { color: colors.white, fontSize: 17, ...FONTS.bold },
  totalVal:  { color: colors.saffronLight, fontSize: 20, ...FONTS.bold },
});
