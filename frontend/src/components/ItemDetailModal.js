// src/components/ItemDetailModal.js — Clean, Modern Food Detail Sheet
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  ScrollView, Animated, Dimensions, ActivityIndicator, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { FONTS, RADIUS, SHADOW } from '../theme';
import HeartButton from './HeartButton';
import StarRating from './StarRating';
import VegBadge from './VegBadge';
import { useCart } from '../context/CartContext';
import api from '../api/client';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ItemDetailModal({ visible, onClose, item, navigation }) {
  const { colors, isDark } = useTheme();
  const { addItem, removeItem, getQty } = useCart();
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const slideAnim = React.useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  const itemId = item?._id || item?.id;
  const qty = getQty(itemId);

  useEffect(() => {
    if (visible && item) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
      loadReviews();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, item]);

  async function loadReviews() {
    if (!itemId) return;
    setLoadingReviews(true);
    try {
      const data = await api.getItemReviews(itemId, 1);
      setReviews(data?.reviews?.slice(0, 6) || []);
    } catch (_) {}
    setLoadingReviews(false);
  }

  function handleClose() {
    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 220,
      useNativeDriver: true,
    }).start(() => onClose());
  }

  if (!item) return null;

  const styles = createStyles(colors, isDark);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={handleClose} activeOpacity={1} />

        <Animated.View
          style={[
            styles.sheet,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Header Drag Handle */}
          <View style={styles.handleBarWrap}>
            <View style={styles.handleBar} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            {/* Dish Photo or Fallback */}
            <View style={styles.heroMedia}>
              {item.image_url ? (
                <Image
                  source={{ uri: item.image_url }}
                  style={styles.heroImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.emojiFallback}>
                  <Text style={{ fontSize: 72 }}>{item.emoji || '🍛'}</Text>
                </View>
              )}

              {/* Close Button */}
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={handleClose}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </TouchableOpacity>

              {/* Heart Button */}
              <View style={styles.heartBtnWrap}>
                <HeartButton itemId={itemId} size={20} />
              </View>
            </View>

            <View style={styles.content}>
              <View style={styles.titleRow}>
                <View style={{ flex: 1 }}>
                  <View style={styles.vegBadgeRow}>
                    <VegBadge isVeg={item.is_veg === true || item.is_veg === 1} />
                    <Text style={styles.vegLabelText}>
                      {item.is_veg === true || item.is_veg === 1 ? 'Pure Vegetarian' : 'Non-Vegetarian'}
                    </Text>
                  </View>
                  <Text style={styles.dishName}>{item.name}</Text>
                </View>
                <Text style={styles.dishPrice}>₹{item.price}</Text>
              </View>

              {/* Info Badges */}
              <View style={styles.badgesRow}>
                {item.avg_rating > 0 && (
                  <View style={styles.badgePill}>
                    <Ionicons name="star" size={13} color="#FBBF24" />
                    <Text style={styles.badgeText}>{item.avg_rating.toFixed(1)}</Text>
                    <Text style={styles.badgeSubText}>({item.rating_count || 1})</Text>
                  </View>
                )}

                <View style={styles.badgePill}>
                  <Ionicons name="timer-outline" size={14} color={colors.saffron} />
                  <Text style={styles.badgeText}>25-35 mins</Text>
                </View>

                <View style={styles.badgePill}>
                  <Ionicons name="flame-outline" size={14} color={colors.error} />
                  <Text style={styles.badgeText}>{item.spice_level || 'Medium'} Spice</Text>
                </View>
              </View>

              {/* Description */}
              <View style={styles.descSection}>
                <Text style={styles.sectionHeader}>About This Dish</Text>
                <Text style={styles.description}>
                  {item.description || 'Prepared fresh with pure desi ghee and hand-ground spices in our Bhiwani kitchen.'}
                </Text>
              </View>

              {/* Customer Reviews */}
              {reviews.length > 0 && (
                <View style={styles.reviewsSection}>
                  <Text style={styles.sectionHeader}>Customer Reviews</Text>
                  {reviews.map((review, i) => (
                    <View key={i} style={styles.reviewCard}>
                      <View style={styles.reviewHeader}>
                        <View style={styles.avatarWrap}>
                          <Text style={styles.avatarInitial}>
                            {(review.user?.name?.[0] || 'U').toUpperCase()}
                          </Text>
                        </View>
                        <View style={{ flex: 1, marginLeft: 8 }}>
                          <Text style={styles.reviewerName}>{review.user?.name || 'Customer'}</Text>
                          <StarRating rating={review.rating} size={11} />
                        </View>
                      </View>
                      {review.comment ? (
                        <Text style={styles.reviewText}>"{review.comment}"</Text>
                      ) : null}
                    </View>
                  ))}
                </View>
              )}

              {loadingReviews && (
                <ActivityIndicator size="small" color={colors.saffron} style={{ marginVertical: 14 }} />
              )}
            </View>
          </ScrollView>

          {/* Bottom Action Footer */}
          <View style={styles.footer}>
            {qty === 0 ? (
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => addItem({ ...item, id: itemId })}
                activeOpacity={0.88}
              >
                <Ionicons name="cart-outline" size={20} color="#FFFFFF" />
                <Text style={styles.addBtnText}>Add Item to Cart · ₹{item.price}</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.qtyFooter}>
                <View style={styles.qtyStepper}>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => removeItem(itemId)}
                  >
                    <Ionicons name="remove" size={18} color={colors.text} />
                  </TouchableOpacity>
                  <Text style={styles.stepperQty}>{qty}</Text>
                  <TouchableOpacity
                    style={[styles.stepperBtn, styles.stepperBtnAdd]}
                    onPress={() => addItem({ ...item, id: itemId })}
                  >
                    <Ionicons name="add" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.checkoutBtn}
                  onPress={() => {
                    handleClose();
                    navigation?.navigate('Cart');
                  }}
                  activeOpacity={0.88}
                >
                  <Text style={styles.checkoutBtnText}>View Cart · ₹{item.price * qty}</Text>
                  <Ionicons name="arrow-forward" size={17} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  sheet: {
    backgroundColor: colors.cardBg,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: SCREEN_HEIGHT * 0.88,
    ...SHADOW.large,
  },
  handleBarWrap: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderLight,
  },
  heroMedia: {
    width: '100%',
    height: 220,
    backgroundColor: colors.creamDark,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  emojiFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    left: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartBtnWrap: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 20,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  vegBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  vegLabelText: {
    fontSize: 12,
    ...FONTS.semibold,
    color: colors.textMuted,
  },
  dishName: {
    fontSize: 20,
    ...FONTS.heavy,
    color: colors.text,
  },
  dishPrice: {
    fontSize: 22,
    ...FONTS.heavy,
    color: colors.saffron,
    marginLeft: 12,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.creamDark,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    ...FONTS.bold,
    color: colors.text,
  },
  badgeSubText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  descSection: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 14,
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 14,
    ...FONTS.bold,
    color: colors.text,
    marginBottom: 6,
  },
  description: {
    fontSize: 13.5,
    color: colors.textMuted,
    lineHeight: 20,
  },
  reviewsSection: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 14,
  },
  reviewCard: {
    backgroundColor: colors.creamDark,
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  avatarWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.saffronPale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 12,
    ...FONTS.heavy,
    color: colors.saffron,
  },
  reviewerName: {
    fontSize: 13,
    ...FONTS.bold,
    color: colors.text,
  },
  reviewText: {
    fontSize: 12.5,
    color: colors.textMuted,
    lineHeight: 17,
  },
  footer: {
    padding: 16,
    paddingBottom: 24,
    backgroundColor: colors.cardBg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  addBtn: {
    backgroundColor: colors.saffron,
    borderRadius: RADIUS.lg,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...SHADOW.medium,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    ...FONTS.heavy,
  },
  qtyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  qtyStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.creamDark,
    borderRadius: RADIUS.md,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: colors.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnAdd: {
    backgroundColor: colors.saffron,
  },
  stepperQty: {
    fontSize: 15,
    ...FONTS.heavy,
    color: colors.text,
    minWidth: 32,
    textAlign: 'center',
  },
  checkoutBtn: {
    flex: 1,
    backgroundColor: colors.saffron,
    borderRadius: RADIUS.md,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...SHADOW.medium,
  },
  checkoutBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    ...FONTS.bold,
  },
});
