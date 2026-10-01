// src/screens/CartScreen.js — Clean, Solid Checkout & Cart Screen
import React, { useState } from 'react';
import {
  View, Text, StyleSheet,
  TouchableOpacity, Alert, ScrollView, TextInput, Image,
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

  const [selectedAddress, setSelectedAddress] = useState(user?.addresses?.[0] || null);
  const [address,     setAddress]     = useState(user?.addresses?.[0]?.full_address || '');
  const [notes,       setNotes]       = useState(user?.addresses?.[0]?.delivery_instructions || '');
  const [couponInput, setCouponInput] = useState('');
  const [showCoupon,  setShowCoupon]  = useState(false);

  const styles = createStyles(colors, isDark);

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
        <View style={styles.emptyCircle}>
          <Ionicons name="cart-outline" size={54} color={colors.saffron} />
        </View>
        <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
        <Text style={styles.emptySubtitle}>
          Good food is always cooking! Add fresh thalis, dal makhani, and hot rotis from our menu.
        </Text>
        <Button
          title="Browse Menu"
          icon="restaurant-outline"
          onPress={() => navigation.navigate('Menu')}
          style={{ marginTop: 24, paddingHorizontal: 32 }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.screen} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Items Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Your Items ({cartItems.length})</Text>
            <TouchableOpacity
              onPress={() => Alert.alert('Clear Cart', 'Remove all items from your cart?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Clear All', style: 'destructive', onPress: clearCart },
              ])}
            >
              <Text style={styles.clearText}>Clear All</Text>
            </TouchableOpacity>
          </View>

          {cartItems.map(({ item, qty }) => {
            const itemId = item.id || item._id;
            return (
              <View key={itemId} style={styles.itemRow}>
                <View style={styles.itemThumbWrap}>
                  {item.image_url ? (
                    <Image
                      source={{ uri: item.image_url }}
                      style={styles.itemThumb}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={{ fontSize: 24 }}>{item.emoji || '🥘'}</Text>
                  )}
                </View>

                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.itemPrice}>₹{item.price * qty}</Text>
                </View>

                {/* Quantity Stepper */}
                <View style={styles.qtyStepper}>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => removeItem(itemId)}
                  >
                    <Ionicons name="remove" size={14} color={colors.text} />
                  </TouchableOpacity>
                  <Text style={styles.stepperQty}>{qty}</Text>
                  <TouchableOpacity
                    style={[styles.stepperBtn, styles.stepperBtnAdd]}
                    onPress={() => addItem(item)}
                  >
                    <Ionicons name="add" size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>

        {/* Delivery Address Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleWithIcon}>
              <Ionicons name="location" size={18} color={colors.saffron} />
              <Text style={styles.cardTitle}>Delivery Address</Text>
            </View>

            <TouchableOpacity
              onPress={() => navigation.navigate('Addresses', {
                selectMode: true,
                onSelect: (addr) => {
                  setSelectedAddress(addr);
                  setAddress(addr.full_address || '');
                  if (addr.delivery_instructions) {
                    setNotes(addr.delivery_instructions);
                  }
                },
              })}
            >
              <Text style={styles.actionLink}>Change</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.textInputArea}
            value={address}
            onChangeText={setAddress}
            placeholder="Enter street, house no., area in Bhiwani"
            placeholderTextColor={colors.textLight}
            multiline
            numberOfLines={2}
          />

          <TextInput
            style={[styles.textInputArea, { marginTop: 8, minHeight: 40 }]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Special instructions (e.g. Ring the bell)"
            placeholderTextColor={colors.textLight}
          />
        </View>

        {/* Coupons & Offers Section */}
        <View style={styles.card}>
          {appliedCoupon ? (
            <View style={styles.couponAppliedRow}>
              <View style={styles.couponAppliedLeft}>
                <Ionicons name="checkmark-circle" size={20} color={colors.green} />
                <View>
                  <Text style={styles.couponAppliedCode}>{appliedCoupon.code}</Text>
                  <Text style={styles.couponAppliedDesc}>₹{appliedCoupon.discount} saved on this order</Text>
                </View>
              </View>
              <TouchableOpacity onPress={removeCoupon}>
                <Text style={styles.removeCouponText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <TouchableOpacity
                style={styles.couponToggleRow}
                onPress={() => setShowCoupon(s => !s)}
                activeOpacity={0.8}
              >
                <View style={styles.cardTitleWithIcon}>
                  <Ionicons name="pricetag" size={16} color={colors.saffron} />
                  <Text style={styles.cardTitle}>Apply Coupon</Text>
                </View>
                <Ionicons
                  name={showCoupon ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={colors.textMuted}
                />
              </TouchableOpacity>

              {showCoupon && (
                <View style={styles.couponInputWrapper}>
                  <View style={styles.couponInputRow}>
                    <TextInput
                      style={styles.couponInput}
                      value={couponInput}
                      onChangeText={t => setCouponInput(t.toUpperCase())}
                      placeholder="ENTER CODE"
                      placeholderTextColor={colors.textLight}
                      autoCapitalize="characters"
                    />
                    <TouchableOpacity
                      style={styles.applyBtn}
                      onPress={() => {
                        if (couponInput.trim()) {
                          applyCoupon(couponInput.trim());
                          setShowCoupon(false);
                        }
                      }}
                      disabled={couponLoading}
                    >
                      <Text style={styles.applyBtnText}>{couponLoading ? '...' : 'APPLY'}</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    onPress={() => navigation.navigate('Coupon', {
                      cartTotal: itemTotal,
                      onApply: ({ code }) => {
                        applyCoupon(code);
                        setShowCoupon(false);
                      },
                    })}
                    style={styles.browseCouponsRow}
                  >
                    <Text style={styles.browseCouponsText}>View available coupons</Text>
                    <Ionicons name="arrow-forward" size={13} color={colors.saffron} />
                  </TouchableOpacity>
                </View>
              )}

              {!!couponError && <Text style={styles.couponErrorText}>{couponError}</Text>}
            </>
          )}
        </View>

        {/* Bill Summary */}
        <View style={styles.card}>
          <Text style={[styles.cardTitle, { marginBottom: 12 }]}>Bill Summary</Text>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Item Total</Text>
            <Text style={styles.billValue}>₹{itemTotal}</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Fee</Text>
            <Text style={[styles.billValue, deliveryFee === 0 && { color: colors.green }]}>
              {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
            </Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>GST & Restaurant Taxes (5%)</Text>
            <Text style={styles.billValue}>₹{gst}</Text>
          </View>

          {discount > 0 && (
            <View style={styles.billRow}>
              <Text style={[styles.billLabel, { color: colors.green }]}>Coupon Discount</Text>
              <Text style={[styles.billValue, { color: colors.green, ...FONTS.bold }]}>-₹{discount}</Text>
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <View>
              <Text style={styles.totalLabel}>To Pay</Text>
              <Text style={styles.taxesIncluded}>Inclusive of all taxes</Text>
            </View>
            <Text style={styles.totalAmount}>₹{grandTotal}</Text>
          </View>
        </View>

        {/* Full-width Checkout CTA */}
        <TouchableOpacity
          style={styles.checkoutBtn}
          onPress={handleProceedToPayment}
          activeOpacity={0.88}
        >
          <View style={styles.checkoutLeft}>
            <Text style={styles.checkoutPrice}>₹{grandTotal}</Text>
            <Text style={styles.checkoutSub}>TOTAL</Text>
          </View>

          <View style={styles.checkoutRight}>
            <Text style={styles.checkoutBtnText}>Proceed to Payment</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      </ScrollView>
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
    gap: 14,
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: colors.cream,
  },
  emptyCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.saffronPale,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  emptyTitle: {
    fontSize: 20,
    ...FONTS.heavy,
    color: colors.text,
  },
  emptySubtitle: {
    fontSize: 13.5,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...SHADOW.small,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    ...FONTS.heavy,
    color: colors.text,
  },
  cardTitleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clearText: {
    fontSize: 12.5,
    ...FONTS.bold,
    color: colors.error,
  },
  actionLink: {
    fontSize: 13,
    ...FONTS.bold,
    color: colors.saffron,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: 12,
  },
  itemThumbWrap: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: colors.creamDark,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  itemThumb: {
    width: '100%',
    height: '100%',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    ...FONTS.bold,
    color: colors.text,
  },
  itemPrice: {
    fontSize: 14.5,
    ...FONTS.heavy,
    color: colors.text,
    marginTop: 2,
  },
  qtyStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.creamDark,
    borderRadius: RADIUS.md,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepperBtn: {
    width: 26,
    height: 26,
    borderRadius: 4,
    backgroundColor: colors.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnAdd: {
    backgroundColor: colors.saffron,
  },
  stepperQty: {
    fontSize: 13.5,
    ...FONTS.bold,
    color: colors.text,
    minWidth: 26,
    textAlign: 'center',
  },
  textInputArea: {
    backgroundColor: colors.creamDark,
    borderRadius: RADIUS.md,
    padding: 10,
    fontSize: 13.5,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 48,
    textAlignVertical: 'top',
  },
  couponToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  couponInputWrapper: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 12,
  },
  couponInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  couponInput: {
    flex: 1,
    backgroundColor: colors.creamDark,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    letterSpacing: 1,
  },
  applyBtn: {
    backgroundColor: colors.saffron,
    borderRadius: RADIUS.md,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    fontSize: 12,
    ...FONTS.heavy,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  browseCouponsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  browseCouponsText: {
    fontSize: 12,
    ...FONTS.bold,
    color: colors.saffron,
  },
  couponErrorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 6,
  },
  couponAppliedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  couponAppliedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  couponAppliedCode: {
    fontSize: 14,
    ...FONTS.heavy,
    color: colors.green,
  },
  couponAppliedDesc: {
    fontSize: 11.5,
    color: colors.textMuted,
  },
  removeCouponText: {
    fontSize: 12,
    ...FONTS.bold,
    color: colors.error,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  billLabel: {
    fontSize: 13,
    color: colors.textMuted,
  },
  billValue: {
    fontSize: 13,
    ...FONTS.semibold,
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 15,
    ...FONTS.heavy,
    color: colors.text,
  },
  taxesIncluded: {
    fontSize: 11,
    color: colors.textMuted,
  },
  totalAmount: {
    fontSize: 20,
    ...FONTS.heavy,
    color: colors.saffron,
  },
  checkoutBtn: {
    backgroundColor: colors.saffron,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    ...SHADOW.medium,
  },
  checkoutLeft: {
    justifyContent: 'center',
  },
  checkoutPrice: {
    fontSize: 18,
    ...FONTS.heavy,
    color: '#FFFFFF',
  },
  checkoutSub: {
    fontSize: 10,
    ...FONTS.bold,
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 0.5,
  },
  checkoutRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  checkoutBtnText: {
    fontSize: 15,
    ...FONTS.heavy,
    color: '#FFFFFF',
  },
});
