// src/screens/PaymentScreen.js — Enhanced with Razorpay integration
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, TextInput, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { FONTS, RADIUS, SHADOW } from '../theme';
import { Divider } from '../components';
import { api } from '../api/client';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

// Import Razorpay - will need expo prebuild for native module
let RazorpayCheckout;
try {
  RazorpayCheckout = require('react-native-razorpay').default;
} catch (e) {
  // Razorpay not available (running in Expo Go)
  RazorpayCheckout = null;
}

const UPI_ID = 'navedyam@upi'; // Restaurant's UPI ID

export default function PaymentScreen({ navigation, route }) {
  const { orderSummary, orderParams } = route.params || {};
  const { clearCart } = useCart();
  const { colors } = useTheme();
  const { user } = useAuth();

  const [method, setMethod]   = useState('cod');
  const [placing, setPlacing] = useState(false);
  const [upiId, setUpiId]     = useState('');
  const [showUpiInput, setShowUpiInput] = useState(false);

  const summary = orderSummary || {
    itemTotal:   0,
    deliveryFee: 30,
    gst:         0,
    discount:    0,
    grandTotal:  0,
  };

  function generateUpiDeepLink() {
    const amount = summary.grandTotal;
    const note = 'Navedyam Food Order';
    return `upi://pay?pa=${UPI_ID}&pn=Navedyam&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;
  }

  async function handlePlaceOrder() {
    setPlacing(true);
    try {
      const payload = { ...(orderParams || {}), payment_method: method };
      const data = await api.placeOrder(payload);
      const orderId = data.order?._id || data.order?.id || data.orderId;
      const displayId = data.order?.display_id;
      const estimatedMinutes = data.order?.estimated_minutes || 35;

      const navigateToSuccess = () => {
        clearCart();
        navigation.replace('OrderSuccess', {
          orderId,
          displayId,
          grandTotal: summary.grandTotal,
          estimatedMinutes,
        });
      };

      if (method === 'upi') {
        // Open UPI app
        const upiLink = generateUpiDeepLink();
        const canOpen = await Linking.canOpenURL(upiLink);

        if (canOpen) {
          Alert.alert(
            'Complete UPI Payment',
            `Pay ₹${summary.grandTotal} via UPI to complete your order`,
            [
              {
                text: 'Open UPI App',
                onPress: async () => {
                  await Linking.openURL(upiLink);
                  navigateToSuccess();
                },
              },
              {
                text: 'Already Paid',
                onPress: navigateToSuccess,
              },
            ]
          );
        } else {
          Alert.alert(
            'UPI Payment',
            `Pay ₹${summary.grandTotal} to UPI ID: ${UPI_ID}\n\nAfter payment, your order will be processed.`,
            [{
              text: 'Done',
              onPress: navigateToSuccess,
            }]
          );
        }
      } else if (method === 'razorpay') {
        // Create Razorpay order
        const paymentData = await api.createPaymentOrder(orderId);

        if (!RazorpayCheckout) {
          // Fallback for Expo Go (no native module)
          Alert.alert(
            'Razorpay Not Available',
            'Razorpay requires a development build. For testing, use COD or UPI.',
            [{ text: 'OK', onPress: navigateToSuccess }]
          );
          return;
        }

        // Open Razorpay checkout
        const options = {
          description: 'Navedyam Food Order',
          image: 'https://i.imgur.com/3g7nmJC.png', // Your logo URL
          currency: 'INR',
          key: paymentData.key_id,
          amount: paymentData.amount,
          order_id: paymentData.razorpay_order_id,
          name: 'Navedyam',
          prefill: {
            email: user?.email || 'customer@navedyam.com',
            contact: user?.phone || '9999999999',
            name: user?.name || 'Customer',
          },
          theme: { color: colors.saffron },
        };

        try {
          const razorpayResponse = await RazorpayCheckout.open(options);

          // Verify payment with backend
          await api.verifyPayment({
            razorpay_order_id: razorpayResponse.razorpay_order_id,
            razorpay_payment_id: razorpayResponse.razorpay_payment_id,
            razorpay_signature: razorpayResponse.razorpay_signature,
          });

          Alert.alert('Payment Successful!', 'Your payment has been verified.', [
            { text: 'View Order', onPress: navigateToSuccess },
          ]);
        } catch (razorpayError) {
          // Payment failed or cancelled
          Alert.alert(
            'Payment Failed',
            razorpayError.description || razorpayError.message || 'Payment was cancelled or failed.',
            [{ text: 'Try Again' }]
          );
        }
      } else {
        // COD - go directly to success
        navigateToSuccess();
      }
    } catch (err) {
      Alert.alert('Order Failed', err.message || 'Could not place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  }

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Order summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Item Total</Text>
              <Text style={styles.rowValue}>₹{summary.itemTotal}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Delivery Fee</Text>
              <Text style={styles.rowValue}>₹{summary.deliveryFee}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>GST (5%)</Text>
              <Text style={styles.rowValue}>₹{summary.gst}</Text>
            </View>
            {summary.discount > 0 && (
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Discount</Text>
                <Text style={[styles.rowValue, styles.discount]}>-₹{summary.discount}</Text>
              </View>
            )}
            <Divider style={{ marginVertical: 10 }} />
            <View style={styles.row}>
              <Text style={styles.totalLabel}>Grand Total</Text>
              <Text style={styles.totalValue}>₹{summary.grandTotal}</Text>
            </View>
          </View>
        </View>

        {/* Payment method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>

          {/* COD */}
          <TouchableOpacity
            style={[styles.methodCard, method === 'cod' && styles.methodCardActive]}
            onPress={() => setMethod('cod')}
            activeOpacity={0.8}
          >
            <View style={styles.methodLeft}>
              <View style={[styles.methodIconWrap, { backgroundColor: colors.saffronPale }]}>
                <Ionicons name="cash-outline" size={22} color={colors.saffron} />
              </View>
              <View>
                <Text style={styles.methodTitle}>Cash on Delivery</Text>
                <Text style={styles.methodSub}>Pay when your order arrives</Text>
              </View>
            </View>
            <View style={[styles.radio, method === 'cod' && styles.radioActive]}>
              {method === 'cod' && <View style={styles.radioDot} />}
            </View>
          </TouchableOpacity>

          {/* UPI */}
          <TouchableOpacity
            style={[styles.methodCard, method === 'upi' && styles.methodCardActive]}
            onPress={() => setMethod('upi')}
            activeOpacity={0.8}
          >
            <View style={styles.methodLeft}>
              <View style={[styles.methodIconWrap, { backgroundColor: colors.saffronPale }]}>
                <Ionicons name="phone-portrait-outline" size={22} color={colors.saffronLight} />
              </View>
              <View>
                <Text style={styles.methodTitle}>UPI Payment</Text>
                <Text style={styles.methodSub}>Google Pay, PhonePe, Paytm</Text>
              </View>
            </View>
            <View style={[styles.radio, method === 'upi' && styles.radioActive]}>
              {method === 'upi' && <View style={styles.radioDot} />}
            </View>
          </TouchableOpacity>

          {/* UPI ID display when selected */}
          {method === 'upi' && (
            <View style={styles.upiInfo}>
              <Ionicons name="information-circle-outline" size={18} color={colors.saffron} />
              <Text style={styles.upiInfoText}>
                UPI ID: <Text style={styles.upiId}>{UPI_ID}</Text>
              </Text>
            </View>
          )}

          {/* Razorpay */}
          <TouchableOpacity
            style={[styles.methodCard, method === 'razorpay' && styles.methodCardActive]}
            onPress={() => setMethod('razorpay')}
            activeOpacity={0.8}
          >
            <View style={styles.methodLeft}>
              <View style={[styles.methodIconWrap, { backgroundColor: colors.saffronPale }]}>
                <Ionicons name="card-outline" size={22} color={colors.saffronDeep} />
              </View>
              <View>
                <Text style={styles.methodTitle}>Card / Net Banking</Text>
                <Text style={styles.methodSub}>Pay securely via Razorpay</Text>
              </View>
            </View>
            <View style={[styles.radio, method === 'razorpay' && styles.radioActive]}>
              {method === 'razorpay' && <View style={styles.radioDot} />}
            </View>
          </TouchableOpacity>
        </View>

        {/* Security badge */}
        <View style={styles.securityBadge}>
          <Ionicons name="shield-checkmark-outline" size={18} color={colors.green} />
          <Text style={styles.securityText}>100% Secure Payments</Text>
        </View>
      </ScrollView>

      {/* Place Order button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.placeBtn, placing && { opacity: 0.75 }]}
          onPress={handlePlaceOrder}
          disabled={placing}
          activeOpacity={0.85}
        >
          {placing
            ? <ActivityIndicator color={colors.white} />
            : <Text style={styles.placeBtnText}>Place Order · ₹{summary.grandTotal}</Text>
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    padding: 4,
  },
  backIcon: {
    fontSize: 22,
    color: colors.saffron,
    ...FONTS.bold,
  },
  headerTitle: {
    ...FONTS.bold,
    fontSize: 20,
    color: colors.text,
  },
  scroll: {
    padding: 20,
    paddingBottom: 120,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    ...FONTS.bold,
    fontSize: 17,
    color: colors.text,
    marginBottom: 14,
  },
  summaryCard: {
    backgroundColor: colors.cardBg,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: 16,
    ...SHADOW.small,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  rowLabel: {
    ...FONTS.regular,
    fontSize: 14,
    color: colors.textMuted,
  },
  rowValue: {
    ...FONTS.medium,
    fontSize: 14,
    color: colors.text,
  },
  discount: {
    color: colors.green,
  },
  totalLabel: {
    ...FONTS.bold,
    fontSize: 16,
    color: colors.text,
  },
  totalValue: {
    ...FONTS.heavy,
    fontSize: 18,
    color: colors.saffron,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cardBg,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
    ...SHADOW.small,
  },
  methodCardActive: {
    borderColor: colors.saffron,
    backgroundColor: colors.saffronPale,
  },
  methodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  methodIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodTitle: {
    ...FONTS.semibold,
    fontSize: 15,
    color: colors.text,
    marginBottom: 2,
  },
  methodSub: {
    ...FONTS.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  upiInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.creamDark,
    padding: 12,
    borderRadius: RADIUS.md,
    marginTop: -4,
    marginBottom: 12,
  },
  upiInfoText: {
    ...FONTS.medium,
    fontSize: 13,
    color: colors.text,
  },
  upiId: {
    ...FONTS.bold,
    color: colors.saffron,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  securityText: {
    ...FONTS.medium,
    fontSize: 13,
    color: colors.green,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: colors.saffron,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.saffron,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 32,
    backgroundColor: colors.cardBg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...SHADOW.medium,
  },
  placeBtn: {
    backgroundColor: colors.saffron,
    borderRadius: RADIUS.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
  placeBtnText: {
    ...FONTS.bold,
    fontSize: 16,
    color: colors.white,
    letterSpacing: 0.3,
  },
});
