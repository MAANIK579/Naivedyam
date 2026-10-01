// src/screens/CouponScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet,
  SafeAreaView, ActivityIndicator, Alert,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { FONTS, RADIUS, SHADOW } from '../theme';
import { api } from '../api/client';

export default function CouponScreen({ navigation, route }) {
  const { cartTotal = 0, onApply } = route.params || {};
  const { colors } = useTheme();

  const [coupons, setCoupons]     = useState([]);
  const [code, setCode]           = useState('');
  const [applying, setApplying]   = useState(false);
  const [loading, setLoading]     = useState(true);
  const [inlineError, setInlineError] = useState('');

  useEffect(() => {
    loadCoupons();
  }, []);

  async function loadCoupons() {
    setLoading(true);
    try {
      const data = await api.getActiveCoupons();
      setCoupons(data.coupons || data || []);
    } catch (err) {
      console.warn('Failed to load coupons:', err);
    } finally {
      setLoading(false);
    }
  }

  async function applyCode(couponCode) {
    const trimmed = (couponCode || code).trim().toUpperCase();
    if (!trimmed) return;

    setInlineError('');
    setApplying(true);
    try {
      const data = await api.validateCoupon(trimmed, cartTotal);
      const discount = data.discount || data.discountAmount || 0;

      if (onApply) {
        onApply({ code: trimmed, discount });
      }
      navigation.goBack();
    } catch (err) {
      setInlineError(err.message || 'Invalid or expired coupon code');
    } finally {
      setApplying(false);
    }
  }

  const styles = createStyles(colors);

  function renderCoupon({ item }) {
    return (
      <TouchableOpacity
        style={styles.couponCard}
        onPress={() => applyCode(item.code)}
        activeOpacity={0.85}
      >
        <View style={styles.couponLeft}>
          <View style={styles.couponCodeBadge}>
            <Text style={styles.couponCode}>{item.code}</Text>
          </View>
          <Text style={styles.couponDesc} numberOfLines={2}>
            {item.description || item.desc || ''}
          </Text>
          <Text style={styles.couponDiscount}>
            {item.discount_type === 'percent'
              ? `${item.discount_value}% off`
              : `₹${item.discount_value} off`}
            {item.min_order ? ` on orders above ₹${item.min_order}` : ''}
          </Text>
        </View>
        <View style={styles.applyBtnSmall}>
          <Text style={styles.applyBtnSmallText}>Apply</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Apply Coupon</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Manual code input */}
      <View style={styles.inputSection}>
        <View style={styles.inputRow}>
          <TextInput
            value={code}
            onChangeText={text => { setCode(text.toUpperCase()); setInlineError(''); }}
            placeholder="Enter coupon code"
            placeholderTextColor={colors.textMuted}
            style={[styles.codeInput, !!inlineError && styles.codeInputError]}
            autoCapitalize="characters"
            returnKeyType="done"
            onSubmitEditing={() => applyCode()}
          />
          <TouchableOpacity
            style={[styles.applyBtn, (!code.trim() || applying) && styles.applyBtnDisabled]}
            onPress={() => applyCode()}
            disabled={!code.trim() || applying}
            activeOpacity={0.85}
          >
            {applying
              ? <ActivityIndicator color={colors.white} size="small" />
              : <Text style={styles.applyBtnText}>Apply</Text>
            }
          </TouchableOpacity>
        </View>
        {!!inlineError && <Text style={styles.errorText}>{inlineError}</Text>}
      </View>

      {/* Available coupons */}
      <View style={styles.listHeader}>
        <Text style={styles.listHeaderText}>Available Coupons</Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.saffron} />
        </View>
      ) : coupons.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No coupons available right now</Text>
        </View>
      ) : (
        <FlatList
          data={coupons}
          keyExtractor={item => item._id || item.code}
          renderItem={renderCoupon}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  inputSection: {
    backgroundColor: colors.cardBg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  codeInput: {
    flex: 1,
    backgroundColor: colors.creamDark,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    ...FONTS.semibold,
    letterSpacing: 1,
  },
  codeInputError: {
    borderColor: colors.error,
  },
  applyBtn: {
    backgroundColor: colors.saffron,
    borderRadius: RADIUS.md,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  applyBtnDisabled: {
    backgroundColor: colors.border,
  },
  applyBtnText: {
    ...FONTS.bold,
    fontSize: 14,
    color: colors.white,
  },
  errorText: {
    ...FONTS.regular,
    fontSize: 12,
    color: colors.error,
    marginTop: 6,
  },
  listHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  listHeaderText: {
    ...FONTS.bold,
    fontSize: 15,
    color: colors.text,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    ...FONTS.regular,
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
  },
  list: {
    padding: 16,
    paddingTop: 8,
  },
  couponCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 12,
    ...SHADOW.small,
  },
  couponLeft: {
    flex: 1,
    marginRight: 10,
  },
  couponCodeBadge: {
    backgroundColor: colors.saffronPale,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.saffron,
  },
  couponCode: {
    ...FONTS.heavy,
    fontSize: 14,
    color: colors.saffron,
    letterSpacing: 1,
  },
  couponDesc: {
    ...FONTS.regular,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: 4,
  },
  couponDiscount: {
    ...FONTS.semibold,
    fontSize: 13,
    color: colors.text,
  },
  applyBtnSmall: {
    backgroundColor: colors.saffron,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  applyBtnSmallText: {
    ...FONTS.bold,
    fontSize: 13,
    color: colors.white,
  },
});
