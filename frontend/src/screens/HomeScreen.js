// src/screens/HomeScreen.js — Modern High-Contrast Food Delivery Home Screen
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, StatusBar, RefreshControl, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { BannerCarousel, VegBadge, ActiveOrderTracker } from '../components';
import { FONTS, RADIUS, SHADOW } from '../theme';
import api from '../api/client';

const QUICK_CATS = [
  { id: 'all',       label: 'All',       emoji: '🍽️' },
  { id: 'thali',     label: 'Thali',     emoji: '🍱' },
  { id: 'dal-sabzi', label: 'Dal Sabzi', emoji: '🥘' },
  { id: 'roti',      label: 'Breads',    emoji: '🫓' },
  { id: 'snacks',    label: 'Snacks',    emoji: '🥟' },
  { id: 'dessert',   label: 'Desserts',  emoji: '🍨' },
];

export default function HomeScreen({ navigation, route }) {
  const { user } = useAuth();
  const { addItem, removeItem, getQty } = useCart();
  const { colors, isDark } = useTheme();
  const firstName = user?.name?.split(' ')[0] || 'Foodie';
  const initials = (user?.name || 'U')
    .trim()
    .split(/\s+/)
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const [refreshing, setRefreshing] = useState(false);
  const [popularItems, setPopularItems] = useState([]);
  const [selectedCat, setSelectedCat] = useState('all');
  const [openTrackerModal, setOpenTrackerModal] = useState(false);

  useEffect(() => {
    if (route.params?.openTracker) {
      setOpenTrackerModal(true);
    }
  }, [route.params?.openTracker]);

  async function loadData() {
    try {
      const data = await api.getMenuItems({ limit: 6, sort: 'popular' });
      if (data?.items?.length > 0) {
        setPopularItems(data.items);
      }
    } catch (_) {}
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const styles = createStyles(colors, isDark);

  return (
    <View style={styles.container}>
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.cardBg} />

      {/* Top Bar with Location and Zomato-Style Profile Avatar */}
      <View style={styles.topBar}>
        <View style={styles.locationContainer}>
          <View style={styles.locationIconWrap}>
            <Ionicons name="location" size={18} color={colors.saffron} />
          </View>
          <View>
            <View style={styles.locationTitleRow}>
              <Text style={styles.locationTitle}>Bhiwani, Haryana</Text>
              <Ionicons name="chevron-down" size={14} color={colors.text} />
            </View>
            <Text style={styles.locationSub}>Express Delivery (30-40 min)</Text>
          </View>
        </View>

        {/* Zomato-style Top Right Profile Button */}
        <TouchableOpacity
          style={styles.profileAvatarBtn}
          onPress={() => navigation.navigate('Profile')}
          activeOpacity={0.85}
          accessibilityLabel="Account and Profile"
        >
          <View style={styles.profileAvatarCircle}>
            <Text style={styles.profileAvatarText}>{initials}</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.saffron]}
            tintColor={colors.saffron}
          />
        }
      >
        {/* Search Bar Shortcut */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => navigation.navigate('Search')}
          activeOpacity={0.9}
        >
          <Ionicons name="search" size={18} color={colors.saffron} />
          <Text style={styles.searchPlaceholder}>Search "Special Thali, Dal Makhani..."</Text>
          <View style={styles.searchDivider} />
          <Ionicons name="options-outline" size={18} color={colors.textLight} />
        </TouchableOpacity>

        {/* Promo Carousel */}
        <BannerCarousel onBannerPress={() => navigation.navigate('Menu')} />

        {/* Categories Bar */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Explore Menu</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Menu')}>
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {QUICK_CATS.map(cat => {
            const isSelected = selectedCat === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryPill,
                  isSelected && styles.categoryPillActive,
                ]}
                onPress={() => {
                  setSelectedCat(cat.id);
                  navigation.navigate('Menu', { category: cat.id === 'all' ? undefined : cat.id });
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.catEmoji}>{cat.emoji}</Text>
                <Text style={[styles.categoryLabel, isSelected && styles.categoryLabelActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Popular Dishes Section */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Most Ordered Dishes</Text>
            <Text style={styles.sectionSubtitle}>Authentic taste, cooked fresh on order</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Menu')}>
            <Text style={styles.seeAllText}>View menu</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dishGrid}>
          {popularItems.map(item => {
            const itemId = item._id || item.id;
            const qty = getQty(itemId);

            return (
              <TouchableOpacity
                key={itemId}
                style={styles.dishCard}
                onPress={() => navigation.navigate('Menu')}
                activeOpacity={0.9}
              >
                <View style={styles.dishMediaWrap}>
                  {item.image_url ? (
                    <Image
                      source={{ uri: item.image_url }}
                      style={styles.dishImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.emojiFallback}>
                      <Text style={{ fontSize: 50 }}>{item.emoji || '🍛'}</Text>
                    </View>
                  )}

                  <View style={styles.vegBadgePosition}>
                    <VegBadge isVeg={item.is_veg === true || item.is_veg === 1} />
                  </View>

                  {item.avg_rating > 0 && (
                    <View style={styles.ratingBadge}>
                      <Ionicons name="star" size={11} color="#FFFFFF" />
                      <Text style={styles.ratingScore}>{item.avg_rating.toFixed(1)}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.dishBody}>
                  <Text style={styles.dishName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.dishDesc} numberOfLines={2}>
                    {item.description || 'Traditional North Indian recipe prepared with fresh ingredients.'}
                  </Text>

                  <View style={styles.dishBottomRow}>
                    <Text style={styles.dishPrice}>₹{item.price}</Text>

                    {qty === 0 ? (
                      <TouchableOpacity
                        style={styles.addBtn}
                        onPress={(e) => {
                          e?.stopPropagation?.();
                          addItem({ ...item, id: itemId });
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.addBtnText}>ADD</Text>
                        <Ionicons name="add" size={15} color={colors.saffron} />
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.qtyCtrl}>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={(e) => {
                            e?.stopPropagation?.();
                            removeItem(itemId);
                          }}
                        >
                          <Ionicons name="remove" size={14} color="#FFFFFF" />
                        </TouchableOpacity>
                        <Text style={styles.qtyNum}>{qty}</Text>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={(e) => {
                            e?.stopPropagation?.();
                            addItem({ ...item, id: itemId });
                          }}
                        >
                          <Ionicons name="add" size={14} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Quick Shortcuts */}
        <View style={styles.shortcutsRow}>
          <TouchableOpacity
            style={styles.shortcutCard}
            onPress={() => setOpenTrackerModal(true)}
            activeOpacity={0.85}
          >
            <View style={[styles.shortcutIcon, { backgroundColor: isDark ? '#431407' : '#FFEDD5' }]}>
              <Ionicons name="bicycle" size={20} color={colors.saffron} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.shortcutTitle}>Live Tracking</Text>
              <Text style={styles.shortcutSub}>Check active order status</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shortcutCard}
            onPress={() => navigation.navigate('Coupon')}
            activeOpacity={0.85}
          >
            <View style={[styles.shortcutIcon, { backgroundColor: isDark ? '#052E16' : '#DCFCE7' }]}>
              <Ionicons name="pricetag" size={20} color={colors.green} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.shortcutTitle}>Offers & Discounts</Text>
              <Text style={styles.shortcutSub}>Save up to ₹100 on meals</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Floating Bottom Active Order Tracker Capsule & Pop-up Modal */}
      <ActiveOrderTracker
        forceOpen={openTrackerModal}
        onTrackerDismiss={() => setOpenTrackerModal(false)}
        navigation={navigation}
      />
    </View>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    backgroundColor: colors.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  locationIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.saffronPale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationTitle: {
    fontSize: 15,
    ...FONTS.heavy,
    color: colors.text,
  },
  locationSub: {
    fontSize: 12,
    color: colors.textMuted,
  },
  profileAvatarBtn: {
    borderRadius: 22,
    borderWidth: 2,
    borderColor: colors.saffron,
    padding: 2,
  },
  profileAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.saffron,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    ...FONTS.heavy,
    letterSpacing: 0.5,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
    ...SHADOW.small,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 13.5,
    color: colors.textLight,
  },
  searchDivider: {
    width: 1,
    height: 18,
    backgroundColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    marginTop: 18,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    ...FONTS.heavy,
    color: colors.text,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  seeAllText: {
    fontSize: 13,
    ...FONTS.bold,
    color: colors.saffron,
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 10,
    paddingBottom: 4,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  categoryPillActive: {
    backgroundColor: colors.saffronPale,
    borderColor: colors.saffron,
  },
  catEmoji: {
    fontSize: 15,
  },
  categoryLabel: {
    fontSize: 13,
    ...FONTS.semibold,
    color: colors.text,
  },
  categoryLabelActive: {
    color: colors.saffron,
    ...FONTS.bold,
  },
  dishGrid: {
    paddingHorizontal: 16,
    gap: 14,
  },
  dishCard: {
    flexDirection: 'row',
    backgroundColor: colors.cardBg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...SHADOW.small,
  },
  dishMediaWrap: {
    width: 120,
    height: 125,
    position: 'relative',
    backgroundColor: colors.creamDark,
  },
  dishImage: {
    width: '100%',
    height: '100%',
  },
  emojiFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vegBadgePosition: {
    position: 'absolute',
    top: 8,
    left: 8,
  },
  ratingBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#15803D',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  ratingScore: {
    fontSize: 11,
    ...FONTS.bold,
    color: '#FFFFFF',
  },
  dishBody: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  dishName: {
    fontSize: 15,
    ...FONTS.bold,
    color: colors.text,
  },
  dishDesc: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
    marginVertical: 4,
  },
  dishBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  dishPrice: {
    fontSize: 16,
    ...FONTS.heavy,
    color: colors.text,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderColor: colors.saffron,
    borderWidth: 1.5,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 5,
    gap: 4,
    ...SHADOW.small,
  },
  addBtnText: {
    fontSize: 12.5,
    ...FONTS.heavy,
    color: colors.saffron,
  },
  qtyCtrl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.saffron,
    borderRadius: RADIUS.md,
    paddingHorizontal: 4,
    paddingVertical: 3,
  },
  qtyBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyNum: {
    fontSize: 13,
    ...FONTS.heavy,
    color: '#FFFFFF',
    minWidth: 22,
    textAlign: 'center',
  },
  shortcutsRow: {
    paddingHorizontal: 16,
    marginTop: 20,
    gap: 10,
  },
  shortcutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
    ...SHADOW.small,
  },
  shortcutIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutTitle: {
    fontSize: 14,
    ...FONTS.bold,
    color: colors.text,
  },
  shortcutSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },
});
