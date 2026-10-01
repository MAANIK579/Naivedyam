// src/components/ItemDetailModal.js — Swiggy-like item detail bottom sheet with theme support
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  ScrollView, Animated, Dimensions, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { FONTS, RADIUS, SHADOW } from '../theme';
import HeartButton from './HeartButton';
import StarRating from './StarRating';
import { useCart } from '../context/CartContext';
import api from '../api/client';

// Local VegBadge to avoid circular dependency with ./index
function VegBadge({ isVeg }) {
  const { colors } = useTheme();
  const color = isVeg ? colors.green : colors.error;
  return (
    <View style={{ width: 18, height: 18, borderWidth: 2, borderRadius: 3, borderColor: color, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
    </View>
  );
}

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
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, item]);

  async function loadReviews() {
    if (!itemId) return;
    setLoadingReviews(true);
    try {
      const data = await api.getItemReviews(itemId, 1);
      setReviews(data.reviews?.slice(0, 8) || []);
    } catch (err) {}
    setLoadingReviews(false);
  }

  function handleClose() {
    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
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
          <View style={styles.handleBar} />

          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            <View style={styles.header}>
              <View style={styles.emojiContainer}>
                <Text style={styles.emoji}>{item.emoji}</Text>
              </View>
              <View style={styles.badges}>
                <VegBadge isVeg={item.is_veg} />
                <HeartButton itemId={itemId} size={24} />
              </View>
            </View>

            <View style={styles.content}>
              <Text style={styles.name}>{item.name}</Text>

              {item.avg_rating > 0 && (
                <View style={styles.ratingRow}>
                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={12} color={colors.white} />
                    <Text style={styles.ratingText}>{item.avg_rating.toFixed(1)}</Text>
                  </View>
                  <Text style={styles.ratingCount}>
                    {item.rating_count} rating{item.rating_count !== 1 ? 's' : ''}
                  </Text>
                  <View style={styles.dot} />
                  <Text style={styles.cuisine}>{item.cuisine_type || 'North Indian'}</Text>
                </View>
              )}

              <Text style={styles.price}>₹{item.price}</Text>

              <Text style={styles.description}>
                {item.description || 'Delicious homemade preparation with authentic Haryanvi flavors. Made fresh daily with pure ingredients.'}
              </Text>

              {item.tags && item.tags.length > 0 && (
                <View style={styles.tagsRow}>
                  {item.tags.map((tag, i) => (
                    <View key={i} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Ionicons name="time-outline" size={18} color={colors.saffron} />
                  <Text style={styles.infoText}>20-30 min</Text>
                </View>
                <View style={styles.infoItem}>
                  <Ionicons name="flame-outline" size={18} color={colors.saffron} />
                  <Text style={styles.infoText}>
                    {item.spice_level || 'Medium'} spice
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Ionicons name="heart-outline" size={18} color={colors.saffron} />
                  <Text style={styles.infoText}>Best Seller</Text>
                </View>
              </View>

              {reviews.length > 0 && (
                <View style={styles.reviewsSection}>
                  <View style={styles.reviewsHeader}>
                    <Text style={styles.sectionTitle}>Customer Reviews</Text>
                  </View>
                  {reviews.map((review, i) => (
                    <View key={i} style={styles.reviewCard}>
                      <View style={styles.reviewHeader}>
                        <View style={styles.reviewerInfo}>
                          <View style={styles.reviewerAvatar}>
                            <Text style={styles.reviewerInitial}>
                              {review.user?.name?.[0] || 'U'}
                            </Text>
                          </View>
                          <Text style={styles.reviewerName}>
                            {review.user?.name || 'User'}
                          </Text>
                        </View>
                        <StarRating rating={review.rating} size={12} />
                      </View>
                      <Text style={styles.reviewComment} numberOfLines={2}>
                        {review.comment}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
              {loadingReviews && (
                <ActivityIndicator size="small" color={colors.saffron} style={{ marginTop: 16 }} />
              )}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            {qty === 0 ? (
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => addItem({ ...item, id: itemId })}
                activeOpacity={0.85}
              >
                <Ionicons name="add-circle-outline" size={22} color={colors.white} />
                <Text style={styles.addButtonText}>Add to Cart · ₹{item.price}</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.qtyFooter}>
                <View style={styles.qtyControls}>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => removeItem(itemId)}
                  >
                    <Ionicons name="remove" size={20} color={colors.text} />
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{qty}</Text>
                  <TouchableOpacity
                    style={[styles.qtyBtn, styles.qtyBtnAdd]}
                    onPress={() => addItem({ ...item, id: itemId })}
                  >
                    <Ionicons name="add" size={20} color={colors.white} />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={styles.viewCartBtn}
                  onPress={() => {
                    handleClose();
                    navigation?.navigate('Cart');
                  }}
                >
                  <Text style={styles.viewCartText}>View Cart · ₹{item.price * qty}</Text>
                  <Ionicons name="arrow-forward" size={18} color={colors.white} />
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
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: colors.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.85,
    ...SHADOW.large,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: colors.creamDark,
  },
  emojiContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: isDark ? colors.cardBg : colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.medium,
  },
  emoji: {
    fontSize: 64,
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    position: 'absolute',
    top: 16,
    right: 16,
  },
  content: {
    padding: 20,
  },
  name: {
    ...FONTS.heavy,
    fontSize: 24,
    color: colors.text,
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.green,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  ratingText: {
    ...FONTS.bold,
    fontSize: 12,
    color: colors.white,
  },
  ratingCount: {
    ...FONTS.medium,
    fontSize: 13,
    color: colors.textMuted,
    marginLeft: 8,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginHorizontal: 8,
  },
  cuisine: {
    ...FONTS.medium,
    fontSize: 13,
    color: colors.textMuted,
  },
  price: {
    ...FONTS.heavy,
    fontSize: 28,
    color: colors.saffronDeep,
    marginBottom: 12,
  },
  description: {
    ...FONTS.regular,
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 22,
    marginBottom: 16,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    backgroundColor: colors.creamDark,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  tagText: {
    ...FONTS.medium,
    fontSize: 12,
    color: colors.text,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.creamDark,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 20,
  },
  infoItem: {
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    ...FONTS.medium,
    fontSize: 12,
    color: colors.text,
  },
  reviewsSection: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 16,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    ...FONTS.bold,
    fontSize: 16,
    color: colors.text,
  },
  reviewCard: {
    backgroundColor: colors.creamDark,
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 10,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.saffron,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewerInitial: {
    ...FONTS.bold,
    fontSize: 12,
    color: colors.white,
  },
  reviewerName: {
    ...FONTS.medium,
    fontSize: 13,
    color: colors.text,
  },
  reviewComment: {
    ...FONTS.regular,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.cardBg,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.saffron,
    borderRadius: RADIUS.lg,
    paddingVertical: 16,
    ...SHADOW.medium,
  },
  addButtonText: {
    ...FONTS.bold,
    fontSize: 16,
    color: colors.white,
  },
  qtyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.creamDark,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  qtyBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnAdd: {
    backgroundColor: colors.saffron,
    borderTopRightRadius: RADIUS.lg - 2,
    borderBottomRightRadius: RADIUS.lg - 2,
  },
  qtyText: {
    ...FONTS.bold,
    fontSize: 18,
    color: colors.text,
    minWidth: 36,
    textAlign: 'center',
  },
  viewCartBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.saffron,
    borderRadius: RADIUS.lg,
    paddingVertical: 14,
    ...SHADOW.medium,
  },
  viewCartText: {
    ...FONTS.bold,
    fontSize: 15,
    color: colors.white,
  },
});
