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
import GlassCard from './GlassCard';
import { useCart } from '../context/CartContext';
import api from '../api/client';

function VegBadge({ isVeg }) {
  const { colors } = useTheme();
  const color = isVeg ? colors.green : colors.error;
  return (
    <View style={{
      width: 18,
      height: 18,
      borderWidth: 1.5,
      borderRadius: 4,
      borderColor: color,
      backgroundColor: 'rgba(0,0,0,0.5)',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
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
    } catch (_) {}
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
          {/* Frosted Handle */}
          <View style={styles.handleBarWrap}>
            <View style={styles.handleBar} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            {/* Header / Media */}
            <View style={styles.heroMedia}>
              {item.image_url ? (
                <Image
                  source={{ uri: item.image_url }}
                  style={styles.heroImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.emojiFallback}>
                  <Text style={styles.emoji}>{item.emoji || '🍛'}</Text>
                </View>
              )}

              {/* Floating Circular Glass Buttons */}
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={handleClose}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </TouchableOpacity>

              <View style={styles.floatingTopRight}>
                <VegBadge isVeg={item.is_veg === true || item.is_veg === 1} />
                <View style={styles.heartBtnWrap}>
                  <HeartButton itemId={itemId} size={20} />
                </View>
              </View>
            </View>

            <View style={styles.content}>
              <View style={styles.titleRow}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.price}>₹{item.price}</Text>
              </View>

              {/* Glass Metadata Pills */}
              <View style={styles.chipsRow}>
                {item.avg_rating > 0 && (
                  <View style={styles.chip}>
                    <Ionicons name="star" size={13} color={colors.turmeric} />
                    <Text style={styles.chipText}>{item.avg_rating.toFixed(1)}</Text>
                    <Text style={styles.chipSubText}>({item.rating_count || 1})</Text>
                  </View>
                )}

                <View style={styles.chip}>
                  <Ionicons name="time-outline" size={14} color={colors.saffron} />
                  <Text style={styles.chipText}>25-35 mins</Text>
                </View>

                <View style={styles.chip}>
                  <Ionicons name="flame-outline" size={14} color={colors.error} />
                  <Text style={styles.chipText}>{item.spice_level || 'Medium'} Spice</Text>
                </View>

                {item.cuisine_type && (
                  <View style={styles.chip}>
                    <Ionicons name="restaurant-outline" size={13} color={colors.green} />
                    <Text style={styles.chipText}>{item.cuisine_type}</Text>
                  </View>
                )}
              </View>

              {/* Description */}
              <View style={styles.descCard}>
                <Text style={styles.sectionLabel}>About this Dish</Text>
                <Text style={styles.description}>
                  {item.description || 'Delicious homemade preparation with authentic Haryanvi flavors. Made fresh daily with pure desi ghee and hand-ground spices.'}
                </Text>
              </View>

              {/* Tags */}
              {item.tags && item.tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {item.tags.map((tag, i) => (
                    <View key={i} style={styles.tagPill}>
                      <Text style={styles.tagText}>#{tag}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Customer Reviews */}
              {reviews.length > 0 && (
                <View style={styles.reviewsSection}>
                  <View style={styles.reviewsHeader}>
                    <Text style={styles.sectionLabel}>Customer Reviews</Text>
                    <Text style={styles.reviewsCount}>{reviews.length} feedback</Text>
                  </View>

                  {reviews.map((review, i) => (
                    <GlassCard key={i} style={styles.reviewCard} padding={12} subtle>
                      <View style={styles.reviewHeader}>
                        <View style={styles.reviewerInfo}>
                          <View style={styles.avatarRing}>
                            <Text style={styles.avatarLetter}>
                              {review.user?.name?.[0] || 'U'}
                            </Text>
                          </View>
                          <Text style={styles.reviewerName}>
                            {review.user?.name || 'Happy Customer'}
                          </Text>
                        </View>
                        <StarRating rating={review.rating} size={11} />
                      </View>
                      {review.comment ? (
                        <Text style={styles.reviewComment} numberOfLines={3}>
                          "{review.comment}"
                        </Text>
                      ) : null}
                    </GlassCard>
                  ))}
                </View>
              )}

              {loadingReviews && (
                <ActivityIndicator size="small" color={colors.saffron} style={{ marginVertical: 16 }} />
              )}
            </View>
          </ScrollView>

          {/* Frosted Action Footer */}
          <View style={styles.footer}>
            {qty === 0 ? (
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => addItem({ ...item, id: itemId })}
                activeOpacity={0.88}
              >
                <Ionicons name="bag-add-outline" size={20} color="#FFFFFF" />
                <Text style={styles.addButtonText}>Add to Cart · ₹{item.price}</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.qtyFooter}>
                <View style={styles.qtyControls}>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => removeItem(itemId)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="remove" size={18} color={colors.text} />
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{qty}</Text>
                  <TouchableOpacity
                    style={[styles.qtyBtn, styles.qtyBtnAdd]}
                    onPress={() => addItem({ ...item, id: itemId })}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.viewCartBtn}
                  onPress={() => {
                    handleClose();
                    navigation?.navigate('Cart');
                  }}
                  activeOpacity={0.88}
                >
                  <Text style={styles.viewCartText}>View Cart · ₹{item.price * qty}</Text>
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
    backgroundColor: isDark ? 'rgba(18,17,20,0.96)' : 'rgba(255,255,255,0.97)',
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    borderWidth: 1,
    borderColor: colors.glass?.border || (isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.06)'),
    borderTopColor: colors.glass?.highlight || (isDark ? 'rgba(255,255,255,0.3)' : '#FFFFFF'),
    maxHeight: SCREEN_HEIGHT * 0.88,
    ...SHADOW.large,
  },
  handleBarWrap: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  handleBar: {
    width: 44,
    height: 4.5,
    borderRadius: 3,
    backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)',
  },
  heroMedia: {
    width: '100%',
    height: 220,
    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F1F5F9',
    position: 'relative',
    overflow: 'hidden',
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
  emoji: {
    fontSize: 64,
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    left: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingTopRight: {
    position: 'absolute',
    top: 12,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heartBtnWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 20,
    paddingTop: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  name: {
    flex: 1,
    fontSize: 21,
    ...FONTS.heavy,
    color: colors.text,
    letterSpacing: -0.3,
  },
  price: {
    fontSize: 22,
    ...FONTS.heavy,
    color: colors.saffron,
    letterSpacing: -0.4,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5.5,
    borderRadius: RADIUS.full,
    backgroundColor: colors.glass?.pill || (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
    borderWidth: 1,
    borderColor: colors.glass?.pillBorder || 'rgba(255,255,255,0.1)',
    gap: 5,
  },
  chipText: {
    fontSize: 12,
    ...FONTS.semibold,
    color: colors.text,
  },
  chipSubText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  descCard: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.glass?.borderSubtle || (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 15,
    ...FONTS.bold,
    color: colors.text,
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  description: {
    fontSize: 13.5,
    color: colors.textMuted,
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tagPill: {
    backgroundColor: isDark ? 'rgba(245,158,11,0.12)' : 'rgba(22,163,74,0.1)',
    borderRadius: RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(245,158,11,0.25)' : 'rgba(22,163,74,0.2)',
  },
  tagText: {
    fontSize: 11.5,
    ...FONTS.semibold,
    color: colors.saffron,
  },
  reviewsSection: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.glass?.borderSubtle || (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  reviewsCount: {
    fontSize: 12,
    ...FONTS.medium,
    color: colors.textMuted,
  },
  reviewCard: {
    borderRadius: RADIUS.md,
    marginBottom: 10,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarRing: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: isDark ? 'rgba(245,158,11,0.2)' : 'rgba(22,163,74,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 11,
    ...FONTS.bold,
    color: colors.saffron,
  },
  reviewerName: {
    fontSize: 12.5,
    ...FONTS.semibold,
    color: colors.text,
  },
  reviewComment: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
    marginTop: 2,
    fontStyle: 'italic',
  },
  footer: {
    padding: 16,
    paddingBottom: 24,
    backgroundColor: isDark ? 'rgba(18,17,20,0.95)' : 'rgba(255,255,255,0.95)',
    borderTopWidth: 1,
    borderTopColor: colors.glass?.border || (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)'),
  },
  addButton: {
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
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    ...FONTS.bold,
  },
  qtyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass?.card || (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'),
    borderRadius: RADIUS.lg,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.glass?.border || 'rgba(255,255,255,0.14)',
  },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnAdd: {
    backgroundColor: colors.saffron,
  },
  qtyText: {
    fontSize: 16,
    ...FONTS.bold,
    color: colors.text,
    minWidth: 32,
    textAlign: 'center',
  },
  viewCartBtn: {
    flex: 1,
    backgroundColor: colors.saffron,
    borderRadius: RADIUS.lg,
    paddingVertical: 13,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    ...SHADOW.glassGlow,
  },
  viewCartText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    ...FONTS.bold,
  },
});
