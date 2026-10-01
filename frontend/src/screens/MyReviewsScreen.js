import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api/client';
import { useTheme } from '../context/ThemeContext';
import { Card } from '../components';
import { FONTS, RADIUS, SHADOW } from '../theme';

function Stars({ rating, colors }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          name={star <= rating ? 'star' : 'star-outline'}
          size={13}
          color={star <= rating ? colors.saffron : colors.border}
        />
      ))}
    </View>
  );
}

export default function MyReviewsScreen() {
  const { colors } = useTheme();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadReviews = useCallback(async () => {
    try {
      const data = await api.getMyReviews();
      setReviews(data.reviews || []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  function onRefresh() {
    setRefreshing(true);
    loadReviews();
  }

  const styles = createStyles(colors);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.saffron]}
          tintColor={colors.saffron}
        />
      }
    >
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.saffron} />
        </View>
      ) : reviews.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Ionicons name="chatbubble-ellipses-outline" size={34} color={colors.border} />
          <Text style={styles.emptyTitle}>No reviews yet</Text>
          <Text style={styles.emptySub}>Your submitted item reviews will appear here.</Text>
        </Card>
      ) : (
        reviews.map((review) => (
          <Card key={review._id} style={styles.reviewCard}>
            <View style={styles.topRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{review.menu_item?.emoji || '🍽️'} {review.menu_item?.name || 'Menu Item'}</Text>
                <Text style={styles.dateText}>
                  {new Date(review.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </Text>
              </View>
              <Stars rating={review.rating || 0} colors={colors} />
            </View>
            {!!review.comment && <Text style={styles.commentText}>{review.comment}</Text>}
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { padding: 16, paddingBottom: 30 },
  center: { alignItems: 'center', paddingVertical: 40 },
  emptyCard: { alignItems: 'center', paddingVertical: 28 },
  emptyTitle: { marginTop: 10, ...FONTS.bold, fontSize: 16, color: colors.text },
  emptySub: { marginTop: 4, ...FONTS.regular, fontSize: 13, color: colors.textMuted },
  reviewCard: {
    marginBottom: 10,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...SHADOW.small,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: { ...FONTS.bold, fontSize: 14, color: colors.text },
  dateText: { ...FONTS.regular, fontSize: 12, color: colors.textMuted, marginTop: 2 },
  commentText: { ...FONTS.regular, fontSize: 13, color: colors.text },
});
