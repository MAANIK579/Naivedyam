import React, { useState } from 'react';
import {
  View, Text, StyleSheet,
  TouchableOpacity, Alert, ScrollView, TextInput, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Button, GlassCard, AmbientGlow } from '../components';
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
        <AmbientGlow />
        <GlassCard style={styles.emptyCard} padding={32} elevated>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="cart-outline" size={48} color={colors.saffron} />
          </View>
          <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
          <Text style={styles.emptySub}>Explore our fresh home-cooked thalis, dal makhani, and breads.</Text>
          <Button
            title="Browse Menu"
            icon="restaurant-outline"
            onPress={() => navigation.navigate('Menu')}
            style={{ marginTop: 24, paddingHorizontal: 32 }}
          />
        </GlassCard>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AmbientGlow />

      <ScrollView style={styles.screen} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Items Section */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.titleWithBadge}>
            <Text style={styles.sectionTitle}>Your Items</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{cartItems.length}</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => Alert.alert('Clear Cart', 'Remove all items from your cart?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Clear All', style: 'destructive', onPress: clearCart },
            ])}
            style={styles.clearBtn}
          >
            <Ionicons name="trash-outline" size={14} color={colors.error} />
            <Text style={styles.clearBtnText}>Clear All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.itemsList}>
          {cartItems.map(({ item, qty }) => {
            const itemId = item.id || item._id;
            return (
              <GlassCard key={itemId} style={styles.cartItemCard} padding={12}>
                <View style={styles.itemThumbWrap}>
                  {item.image_url ? (
                    <Image
                      source={{ uri: item.image_url }}
                      style={styles.cartItemThumb}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={{ fontSize: 26 }}>{item.emoji || '🍛'}</Text>
                  )}
                </View>

                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.itemPrice}>₹{item.price * qty}</Text>
                </View>

                <View style={styles.qtyCtrl}>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => removeItem(itemId)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="remove" size={14} color={colors.text} />
                  </TouchableOpacity>

                  <Text style={styles.qtyNum}>{qty}</Text>

                  <TouchableOpacity
                    style={[styles.qtyBtn, styles.qtyBtnAdd]}
                    onPress={() => addItem(item)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add" size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </GlassCard>
            );
          })}
        </View>

        {/* Delivery Address Section */}
        <View style={styles.sectionMargin}>
          <GlassCard padding={16}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderLeft}>
                <View style={styles.iconCircle}>
                  <Ionicons name="location-outline" size={18} color={colors.saffron} />
                </View>
                <Text style={styles.cardHeaderTitle}>Delivery Address</Text>
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
                style={styles.savedAddrBtn}
              >
                <Ionicons name="bookmark-outline" size={13} color={colors.saffron} />
                <Text style={styles.savedAddrText}>Saved</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.textArea}
              value={address}
              onChangeText={setAddress}
              placeholder="Enter full address, street, house no. in Bhiwani"
              placeholderTextColor={colors.textLight}
              multiline
              numberOfLines={2}
            />

            <TextInput
              style={[styles.textArea, { marginTop: 10, minHeight: 42 }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Delivery instructions (e.g. Ring the bell, leave at door)"
              placeholderTextColor={colors.textLight}
            />
          </GlassCard>
        </View>

        {/* Coupon Voucher Section */}
        <View style={styles.sectionMargin}>
          <GlassCard padding={16}>
            {appliedCoupon ? (
              <View style={styles.couponAppliedCard}>
                <View style={styles.couponAppliedLeft}>
                  <View style={styles.couponIconCircle}>
                    <Ionicons name="checkmark-circle" size={20} color={colors.green} />
                  </View>
                  <View>
                    <Text style={styles.appliedCode}>{appliedCoupon.code}</Text>
                    <Text style={styles.appliedSavings}>You saved ₹{appliedCoupon.discount} on this order</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={removeCoupon} style={styles.removeCouponBtn}>
                  <Ionicons name="close-circle" size={22} color={colors.error} />
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.couponTriggerRow}
                  onPress={() => setShowCoupon(s => !s)}
                  activeOpacity={0.8}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={styles.couponIconCircle}>
                      <Ionicons name="pricetag-outline" size={16} color={colors.saffron} />
                    </View>
                    <Text style={styles.couponTriggerText}>Apply Discount Coupon</Text>
                  </View>
                  <Ionicons
                    name={showCoupon ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={colors.saffron}
                  />
                </TouchableOpacity>

                {showCoupon && (
                  <View style={styles.couponExpandArea}>
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
                        style={styles.couponApplyBtn}
                        onPress={() => {
                          if (couponInput.trim()) {
                            applyCoupon(couponInput.trim());
                            setShowCoupon(false);
                          }
                        }}
                        disabled={couponLoading}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.couponApplyText}>{couponLoading ? '...' : 'Apply'}</Text>
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
                      <Text style={styles.browseCouponsText}>Browse available offers</Text>
                      <Ionicons name="arrow-forward" size={14} color={colors.saffron} />
                    </TouchableOpacity>
                  </View>
                )}

                {!!couponError && <Text style={styles.couponErrorText}>{couponError}</Text>}
              </>
            )}
          </GlassCard>
        </View>

        {/* Payment Preview Option */}
        <View style={styles.sectionMargin}>
          <GlassCard
            onPress={handleProceedToPayment}
            padding={16}
            style={styles.paymentMethodCard}
          >
            <View style={styles.paymentLeft}>
              <View style={styles.iconCircle}>
                <Ionicons name="wallet-outline" size={18} color={colors.saffron} />
              </View>
              <View>
                <Text style={styles.paymentTitle}>Payment Method</Text>
                <Text style={styles.paymentSub}>COD · UPI · Cards · NetBanking</Text>
              </View>
            </View>
            <View style={styles.chevronWrap}>
              <Ionicons name="chevron-forward" size={16} color={colors.saffron} />
            </View>
          </GlassCard>
        </View>

        {/* Bill Receipt Summary */}
        <View style={styles.sectionMargin}>
          <GlassCard elevated padding={20} style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Ionicons name="receipt-outline" size={18} color={colors.saffron} />
              <Text style={styles.summaryTitle}>Bill Details</Text>
            </View>

            <View style={styles.receiptLine}>
              <Text style={styles.receiptLabel}>Item Total</Text>
              <Text style={styles.receiptVal}>₹{itemTotal}</Text>
            </View>

            <View style={styles.receiptLine}>
              <Text style={styles.receiptLabel}>Delivery Fee</Text>
              <Text style={[styles.receiptVal, deliveryFee === 0 && { color: colors.green }]}>
                {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
              </Text>
            </View>

            <View style={styles.receiptLine}>
              <Text style={styles.receiptLabel}>Taxes & GST (5%)</Text>
              <Text style={styles.receiptVal}>₹{gst}</Text>
            </View>

            {discount > 0 && (
              <View style={styles.receiptLine}>
                <Text style={[styles.receiptLabel, { color: colors.green }]}>Coupon Discount</Text>
                <Text style={[styles.receiptVal, { color: colors.green, ...FONTS.bold }]}>-₹{discount}</Text>
              </View>
            )}

            <View style={styles.totalDivider} />

            <View style={styles.totalRow}>
              <View>
                <Text style={styles.totalLabel}>To Pay</Text>
                <Text style={styles.inclusiveText}>Inclusive of all taxes</Text>
              </View>
              <Text style={styles.totalVal}>₹{grandTotal}</Text>
            </View>

            <TouchableOpacity
              style={styles.checkoutBtn}
              onPress={handleProceedToPayment}
              activeOpacity={0.88}
            >
              <Ionicons name="shield-checkmark" size={18} color="#FFFFFF" />
              <Text style={styles.checkoutBtnText}>Proceed to Payment · ₹{grandTotal}</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </GlassCard>
        </View>
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
    paddingTop: 18,
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: colors.cream,
  },
  emptyCard: {
    width: '100%',
    alignItems: 'center',
    borderRadius: RADIUS.xl,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: isDark ? 'rgba(245,158,11,0.14)' : 'rgba(22,163,74,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    ...FONTS.heavy,
    color: colors.text,
    letterSpacing: -0.3,
  },
  emptySub: {
    fontSize: 13.5,
    color: colors.textMuted,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    ...FONTS.bold,
    color: colors.text,
    letterSpacing: -0.2,
  },
  countBadge: {
    backgroundColor: isDark ? 'rgba(245,158,11,0.2)' : 'rgba(22,163,74,0.15)',
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(245,158,11,0.4)' : 'rgba(22,163,74,0.3)',
  },
  countBadgeText: {
    fontSize: 11,
    ...FONTS.bold,
    color: colors.saffron,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearBtnText: {
    fontSize: 12.5,
    color: colors.error,
    ...FONTS.semibold,
  },
  itemsList: {
    gap: 10,
  },
  cartItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.lg,
  },
  itemThumbWrap: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cartItemThumb: {
    width: '100%',
    height: '100%',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 14.5,
    ...FONTS.semibold,
    color: colors.text,
  },
  itemPrice: {
    fontSize: 15,
    ...FONTS.heavy,
    color: colors.saffron,
    marginTop: 3,
  },
  qtyCtrl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass?.card || (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'),
    borderRadius: RADIUS.full,
    padding: 2.5,
    borderWidth: 1,
    borderColor: colors.glass?.border || 'rgba(255,255,255,0.14)',
  },
  qtyBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnAdd: {
    backgroundColor: colors.saffron,
  },
  qtyNum: {
    fontSize: 13.5,
    ...FONTS.bold,
    color: colors.text,
    minWidth: 24,
    textAlign: 'center',
  },
  sectionMargin: {
    marginTop: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: isDark ? 'rgba(245,158,11,0.18)' : 'rgba(22,163,74,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderTitle: {
    fontSize: 15,
    ...FONTS.bold,
    color: colors.text,
  },
  savedAddrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    backgroundColor: colors.glass?.pill || (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
    borderWidth: 1,
    borderColor: colors.glass?.pillBorder || 'rgba(255,255,255,0.1)',
  },
  savedAddrText: {
    fontSize: 11.5,
    ...FONTS.semibold,
    color: colors.saffron,
  },
  textArea: {
    backgroundColor: colors.glass?.card || (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.8)'),
    borderWidth: 1,
    borderColor: colors.glass?.border || (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'),
    borderTopColor: colors.glass?.highlight || 'rgba(255,255,255,0.2)',
    borderRadius: RADIUS.md,
    padding: 12,
    fontSize: 13.5,
    color: colors.text,
    minHeight: 52,
    textAlignVertical: 'top',
  },
  couponAppliedCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  couponAppliedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  appliedCode: {
    fontSize: 14.5,
    ...FONTS.bold,
    color: colors.green,
    letterSpacing: 0.5,
  },
  appliedSavings: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },
  removeCouponBtn: {
    padding: 4,
  },
  couponTriggerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  couponIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: isDark ? 'rgba(245,158,11,0.18)' : 'rgba(22,163,74,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  couponTriggerText: {
    fontSize: 14.5,
    ...FONTS.semibold,
    color: colors.text,
  },
  couponExpandArea: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.glass?.borderSubtle || (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
  },
  couponInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  couponInput: {
    flex: 1,
    backgroundColor: colors.glass?.card || (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.8)'),
    borderWidth: 1,
    borderColor: colors.glass?.border || (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'),
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13.5,
    color: colors.text,
    letterSpacing: 1,
  },
  couponApplyBtn: {
    backgroundColor: colors.saffron,
    borderRadius: RADIUS.md,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  couponApplyText: {
    color: '#FFFFFF',
    fontSize: 13,
    ...FONTS.bold,
  },
  browseCouponsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
  },
  browseCouponsText: {
    fontSize: 12,
    color: colors.saffron,
    ...FONTS.semibold,
  },
  couponErrorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 8,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: RADIUS.lg,
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  paymentTitle: {
    fontSize: 14.5,
    ...FONTS.semibold,
    color: colors.text,
  },
  paymentSub: {
    fontSize: 11.5,
    color: colors.textMuted,
    marginTop: 2,
  },
  chevronWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.glass?.pill || (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCard: {
    borderRadius: RADIUS.xl,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  summaryTitle: {
    fontSize: 16,
    ...FONTS.bold,
    color: colors.text,
  },
  receiptLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  receiptLabel: {
    color: colors.textMuted,
    fontSize: 13.5,
  },
  receiptVal: {
    color: colors.text,
    fontSize: 13.5,
    ...FONTS.semibold,
  },
  totalDivider: {
    height: 1,
    backgroundColor: colors.glass?.border || (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'),
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  totalLabel: {
    fontSize: 16.5,
    ...FONTS.heavy,
    color: colors.text,
  },
  inclusiveText: {
    fontSize: 10.5,
    color: colors.textMuted,
    marginTop: 2,
  },
  totalVal: {
    fontSize: 22,
    ...FONTS.heavy,
    color: colors.saffron,
    letterSpacing: -0.4,
  },
  checkoutBtn: {
    backgroundColor: colors.saffron,
    borderRadius: RADIUS.lg,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    ...SHADOW.glassGlow,
  },
  checkoutBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    ...FONTS.bold,
  },
});
