// src/screens/OrderRatingScreen.js — Rate ordered items with selection
import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, TextInput, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { FONTS, RADIUS, SHADOW } from '../theme';
import { api } from '../api/client';

const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];
const RATING_EMOJIS = ['', '😞', '😐', '🙂', '😊', '🤩'];

const QUICK_TAGS = [
  'Tasty food',
  'Good packaging',
  'On-time delivery',
  'Fresh ingredients',
  'Value for money',
  'Great quantity',
];

export default function OrderRatingScreen({ navigation, route }) {
  const { orderId, displayId, orderedItems = [] } = route.params || {};
  const { colors } = useTheme();

  const [items, setItems] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [loadingItems, setLoadingItems] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;

    function normalizeItems(rawItems = []) {
      return rawItems
        .map((item) => {
          const menuItemObj = typeof item.menu_item === 'object' ? item.menu_item : null;
          const id = item.menu_item_id || menuItemObj?._id || item.menu_item || item._id || item.id;
          if (!id) return null;

          return {
            id: String(id),
            name: item.item_name || item.name || menuItemObj?.name || 'Item',
            emoji: item.emoji || menuItemObj?.emoji || '🍽️',
            quantity: item.quantity || 1,
          };
        })
        .filter(Boolean);
    }

    async function loadItems() {
      try {
        const routeItems = normalizeItems(orderedItems);
        if (routeItems.length > 0) {
          if (!mounted) return;
          setItems(routeItems);
          setSelectedItemId(routeItems[0].id);
          return;
        }

        if (!orderId) {
          if (!mounted) return;
          setItems([]);
          return;
        }

        const data = await api.getOrder(orderId);
        const apiItems = normalizeItems(data?.order?.items || []);
        if (!mounted) return;
        setItems(apiItems);
        setSelectedItemId(apiItems[0]?.id || '');
      } catch (_) {
        if (!mounted) return;
        setItems([]);
      } finally {
        if (mounted) setLoadingItems(false);
      }
    }

    loadItems();

    return () => {
      mounted = false;
    };
  }, [orderId, orderedItems]);

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedItemId),
    [items, selectedItemId]
  );

  function toggleTag(tag) {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  }

  async function handleSubmit() {
    if (!selectedItemId) {
      return Alert.alert('Select Item', 'Please select an item to rate.');
    }

    if (rating === 0) {
      return Alert.alert('Rating Required', 'Please select a rating before submitting.');
    }

    setSubmitting(true);
    try {
      // Combine tags with comment
      const fullComment = [...selectedTags, comment].filter(Boolean).join('. ');

      await api.submitReview({
        order_id: orderId,
        menu_item_id: selectedItemId,
        rating,
        comment: fullComment,
      });

      Alert.alert(
        'Thank You!',
        `Your feedback for ${selectedItem?.name || 'this item'} helps us serve you better.`,
        [{ text: 'Done', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not submit rating');
    } finally {
      setSubmitting(false);
    }
  }

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rate Your Order</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {/* Order ID */}
        <View style={styles.orderInfo}>
          <Ionicons name="receipt-outline" size={20} color={colors.saffron} />
          <Text style={styles.orderText}>Order {displayId || orderId}</Text>
        </View>

        {/* Item selector */}
        <Text style={styles.label}>Which item are you rating?</Text>
        {loadingItems ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="small" color={colors.saffron} />
          </View>
        ) : items.length > 0 ? (
          <View style={styles.itemsWrap}>
            {items.map((item) => {
              const active = selectedItemId === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.itemChip, active && styles.itemChipActive]}
                  onPress={() => setSelectedItemId(item.id)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.itemEmoji}>{item.emoji}</Text>
                  <Text style={[styles.itemName, active && styles.itemNameActive]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={[styles.itemQty, active && styles.itemQtyActive]}>x{item.quantity}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.noItemsWrap}>
            <Text style={styles.noItemsText}>No rateable items found for this order.</Text>
          </View>
        )}

        {selectedItem && (
          <View style={styles.selectedItemCard}>
            <Text style={styles.selectedItemTitle}>Rating: {selectedItem.name}</Text>
          </View>
        )}

        {/* Rating */}
        <Text style={styles.label}>How was this item?</Text>
        <View style={styles.ratingContainer}>
          <Text style={styles.ratingEmoji}>{RATING_EMOJIS[rating] || '🍽️'}</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map(star => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                style={styles.starBtn}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={rating >= star ? 'star' : 'star-outline'}
                  size={40}
                  color={rating >= star ? colors.saffron : colors.border}
                />
              </TouchableOpacity>
            ))}
          </View>
          {rating > 0 && (
            <Text style={styles.ratingLabel}>{RATING_LABELS[rating]}</Text>
          )}
        </View>

        {/* Quick Tags */}
        {rating > 0 && (
          <>
            <Text style={styles.label}>What did you like?</Text>
            <View style={styles.tagsContainer}>
              {QUICK_TAGS.map(tag => (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.tag,
                    selectedTags.includes(tag) && styles.tagSelected,
                  ]}
                  onPress={() => toggleTag(tag)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={selectedTags.includes(tag) ? 'checkmark-circle' : 'add-circle-outline'}
                    size={16}
                    color={selectedTags.includes(tag) ? colors.white : colors.saffron}
                  />
                  <Text
                    style={[
                      styles.tagText,
                      selectedTags.includes(tag) && styles.tagTextSelected,
                    ]}
                  >
                    {tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Comment */}
            <Text style={styles.label}>Additional comments (optional)</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Tell us more about this item..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              value={comment}
              onChangeText={setComment}
              textAlignVertical="top"
            />
          </>
        )}
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitBtn, (rating === 0 || !selectedItemId || loadingItems) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting || rating === 0 || !selectedItemId || loadingItems}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Ionicons name="send-outline" size={20} color={colors.white} />
              <Text style={styles.submitText}>Submit Rating</Text>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.skipBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.skipText}>Skip for now</Text>
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeBtn: {
    padding: 4,
  },
  headerTitle: {
    ...FONTS.bold,
    fontSize: 18,
    color: colors.text,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loaderWrap: {
    backgroundColor: colors.cardBg,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  itemsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  itemChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.cardBg,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: '100%',
  },
  itemChipActive: {
    backgroundColor: colors.saffron,
    borderColor: colors.saffron,
  },
  itemEmoji: { fontSize: 14 },
  itemName: {
    ...FONTS.medium,
    color: colors.text,
    maxWidth: 150,
  },
  itemNameActive: { color: colors.white },
  itemQty: { fontSize: 12, color: colors.textMuted },
  itemQtyActive: { color: colors.white },
  noItemsWrap: {
    backgroundColor: colors.cardBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 16,
  },
  noItemsText: {
    ...FONTS.medium,
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
  selectedItemCard: {
    backgroundColor: colors.creamDark,
    borderRadius: RADIUS.md,
    padding: 10,
    marginBottom: 16,
  },
  selectedItemTitle: {
    ...FONTS.semibold,
    color: colors.text,
    fontSize: 13,
  },
  orderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.creamDark,
    padding: 12,
    borderRadius: RADIUS.md,
    marginBottom: 24,
  },
  orderText: {
    ...FONTS.semibold,
    fontSize: 14,
    color: colors.text,
  },
  label: {
    ...FONTS.semibold,
    fontSize: 15,
    color: colors.text,
    marginBottom: 12,
  },
  ratingContainer: {
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderRadius: RADIUS.xl,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...SHADOW.small,
  },
  ratingEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  starBtn: {
    padding: 4,
  },
  ratingLabel: {
    ...FONTS.bold,
    fontSize: 18,
    color: colors.saffron,
    marginTop: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.cardBg,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: colors.saffron,
  },
  tagSelected: {
    backgroundColor: colors.saffron,
    borderColor: colors.saffron,
  },
  tagText: {
    ...FONTS.medium,
    fontSize: 13,
    color: colors.saffron,
  },
  tagTextSelected: {
    color: colors.white,
  },
  textArea: {
    backgroundColor: colors.cardBg,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: 16,
    fontSize: 14,
    color: colors.text,
    minHeight: 100,
    ...FONTS.regular,
  },
  footer: {
    padding: 20,
    paddingBottom: 32,
    backgroundColor: colors.cardBg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.saffron,
    borderRadius: RADIUS.lg,
    paddingVertical: 16,
    ...SHADOW.medium,
  },
  submitBtnDisabled: {
    backgroundColor: colors.border,
  },
  submitText: {
    ...FONTS.bold,
    fontSize: 16,
    color: colors.white,
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  skipText: {
    ...FONTS.medium,
    fontSize: 14,
    color: colors.textMuted,
  },
});
