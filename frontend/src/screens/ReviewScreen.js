// src/screens/ReviewScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  SafeAreaView, Alert, ActivityIndicator,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { FONTS, RADIUS, SHADOW } from '../theme';
import StarRating from '../components/StarRating';
import { api } from '../api/client';

export default function ReviewScreen({ navigation, route }) {
  const { orderId, orderedItems = [] } = route.params || {};
  const { colors } = useTheme();

  const [selectedItemId, setSelectedItemId] = useState(
    orderedItems.length > 0 ? (orderedItems[0]._id || orderedItems[0].id) : null
  );
  const [rating, setRating]     = useState(0);
  const [comment, setComment]   = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!orderId) {
      Alert.alert('Order Missing', 'Unable to find order for this review.');
      return;
    }
    if (!selectedItemId) {
      Alert.alert('Item Missing', 'Please select an item to review.');
      return;
    }
    if (!rating) {
      Alert.alert('Please rate', 'Select at least 1 star before submitting');
      return;
    }
    setSubmitting(true);
    try {
      await api.submitReview({
        order_id:  orderId,
        menu_item_id: selectedItemId,
        rating,
        comment:   comment.trim(),
      });
      Alert.alert(
        'Thank you!',
        'Thank you for your review!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not submit review');
    } finally {
      setSubmitting(false);
    }
  }

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rate Your Order</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Item selector */}
        {orderedItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Which item are you rating?</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.itemScroll}>
              {orderedItems.map(item => {
                const id = item._id || item.id;
                const active = selectedItemId === id;
                return (
                  <TouchableOpacity
                    key={id}
                    style={[styles.itemChip, active && styles.itemChipActive]}
                    onPress={() => setSelectedItemId(id)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.itemChipEmoji}>{item.emoji || '🍽️'}</Text>
                    <Text style={[styles.itemChipText, active && styles.itemChipTextActive]} numberOfLines={1}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Star rating */}
        <View style={styles.ratingCard}>
          <Text style={styles.ratingPrompt}>How was your experience?</Text>
          <View style={styles.starsWrap}>
            <StarRating
              rating={rating}
              size={42}
              interactive
              onRate={setRating}
            />
          </View>
          <Text style={styles.ratingLabel}>
            {rating === 0 ? 'Tap to rate' :
             rating === 1 ? 'Poor' :
             rating === 2 ? 'Fair' :
             rating === 3 ? 'Good' :
             rating === 4 ? 'Great' :
             'Excellent!'}
          </Text>
        </View>

        {/* Comment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Write a review (optional)</Text>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Tell us what you liked or what could be better..."
            placeholderTextColor={colors.textMuted}
            style={styles.commentInput}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, (!rating || submitting) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!rating || !selectedItemId || submitting}
          activeOpacity={0.85}
        >
          {submitting
            ? <ActivityIndicator color={colors.white} />
            : <Text style={styles.submitBtnText}>Submit Review</Text>
          }
        </TouchableOpacity>
      </ScrollView>
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
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    ...FONTS.semibold,
    fontSize: 15,
    color: colors.text,
    marginBottom: 12,
  },
  itemScroll: {
    gap: 10,
    paddingBottom: 4,
  },
  itemChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.creamDark,
    maxWidth: 160,
    marginRight: 8,
  },
  itemChipActive: {
    backgroundColor: colors.saffron,
    borderColor: colors.saffron,
  },
  itemChipEmoji: {
    fontSize: 18,
  },
  itemChipText: {
    ...FONTS.medium,
    fontSize: 13,
    color: colors.text,
    flexShrink: 1,
  },
  itemChipTextActive: {
    color: colors.white,
    ...FONTS.semibold,
  },
  ratingCard: {
    backgroundColor: colors.cardBg,
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    ...SHADOW.small,
  },
  ratingPrompt: {
    ...FONTS.semibold,
    fontSize: 16,
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  starsWrap: {
    marginBottom: 12,
  },
  ratingLabel: {
    ...FONTS.bold,
    fontSize: 15,
    color: colors.saffron,
    textAlign: 'center',
  },
  commentInput: {
    backgroundColor: colors.creamDark,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: RADIUS.lg,
    padding: 14,
    fontSize: 15,
    color: colors.text,
    ...FONTS.regular,
    minHeight: 110,
  },
  submitBtn: {
    backgroundColor: colors.saffron,
    borderRadius: RADIUS.lg,
    paddingVertical: 16,
    alignItems: 'center',
    ...SHADOW.small,
  },
  submitBtnDisabled: {
    backgroundColor: colors.border,
  },
  submitBtnText: {
    ...FONTS.bold,
    fontSize: 16,
    color: colors.white,
    letterSpacing: 0.3,
  },
});
