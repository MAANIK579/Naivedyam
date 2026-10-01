// src/screens/HomeScreen.js — Swiggy-like enhanced UI with theme support
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, StatusBar, RefreshControl, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';

import { FONTS, RADIUS, SHADOW } from '../theme';
import api from '../api/client';

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const { applyCoupon } = useCart();
  const { colors, isDark } = useTheme();
  const firstName = user?.name?.split(' ')[0] || 'Guest';
  const [refreshing, setRefreshing] = useState(false);
  const [popularItems, setPopularItems] = useState([
    { id: '1', name: 'Thali Special', emoji: '🍛', price: 149, tag: 'Bestseller' },
    { id: '2', name: 'Dal Makhani', emoji: '🥘', price: 89, tag: 'Must Try' },
    { id: '3', name: 'Butter Roti', emoji: '🫓', price: 15, tag: 'Popular' },
    { id: '4', name: 'Paneer Curry', emoji: '🧀', price: 129, tag: 'Chef Special' },
  ]);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const QUICK_CATS = [
    { id: 'thali',     label: 'Thali',     icon: 'grid-outline',       bg: isDark ? colors.saffronPale : '#DCFCE7' },
    { id: 'dal-sabzi', label: 'Dal Sabzi', icon: 'leaf-outline',       bg: isDark ? colors.saffronPale : '#D1FAE5' },
    { id: 'roti',      label: 'Roti',      icon: 'pizza-outline',      bg: isDark ? colors.saffronPale : '#DCFCE7' },
    { id: 'nonveg',    label: 'Non-Veg',   icon: 'flame-outline',      bg: isDark ? colors.saffronPale : '#FEE2E2' },
    { id: 'snacks',    label: 'Snacks',    icon: 'cafe-outline',       bg: isDark ? colors.saffronPale : '#DCFCE7' },
    { id: 'dessert',   label: 'Dessert',   icon: 'ice-cream-outline',  bg: isDark ? colors.saffronPale : '#DCFCE7' },
  ];

  async function onRefresh() {
    setRefreshing(true);
    try {
      const data = await api.getMenuItems({ limit: 4, sort: 'popular' });
      if (data.items?.length > 0) {
        setPopularItems(data.items.slice(0, 4).map(item => ({
          id: item._id || item.id,
          name: item.name,
          emoji: item.emoji,
          price: item.price,
          tag: item.tags?.[0] || 'Popular',
        })));
      }
    } catch (err) {}
    setRefreshing(false);
  }

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.02, duration: 1000, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const styles = createStyles(colors, isDark);

  return (
    <ScrollView
      style={styles.screen}
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
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.brown} />

      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>Namaskar, {firstName}!</Text>
            <Text style={styles.heroTitle}>Ghar Ka Swaad,{'\n'}Seedha Aapke Darwaze</Text>
          </View>
          <TouchableOpacity
            style={styles.notifBtn}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="notifications-outline" size={22} color={colors.white} />
          </TouchableOpacity>
        </View>

        <Text style={styles.heroSub}>Authentic Haryanvi food · Bhiwani</Text>

        {/* Search Bar */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => navigation.navigate('Search')}
          activeOpacity={0.9}
        >
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <Text style={styles.searchPlaceholder}>Search for thali, dal, roti...</Text>
        </TouchableOpacity>

        <View style={styles.statsRow}>
          {[
            { icon: 'time-outline',        val: '30-45', lbl: 'Min Delivery' },
            { icon: 'star-outline',         val: '4.8',  lbl: 'Rating' },
            { icon: 'bag-check-outline',    val: '2000+', lbl: 'Orders' },
          ].map(s => (
            <View key={s.lbl} style={styles.stat}>
              <Ionicons name={s.icon} size={16} color={colors.saffronLight} style={{ marginBottom: 2 }} />
              <Text style={styles.statNum}>{s.val}</Text>
              <Text style={styles.statLbl}>{s.lbl}</Text>
            </View>
          ))}
        </View>

        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            style={styles.orderNowBtn}
            onPress={() => navigation.navigate('Menu')}
            activeOpacity={0.85}
          >
            <Ionicons name="restaurant-outline" size={20} color={colors.white} />
            <Text style={styles.orderNowText}>Order Now</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.white} />
          </TouchableOpacity>
        </Animated.View>
      </View>

      <View style={styles.body}>
        {/* Quick categories */}
        <Text style={styles.sectionLabel}>What are you craving?</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
          {QUICK_CATS.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={styles.catChip}
              onPress={() => navigation.navigate('Menu', { category: cat.id })}
              activeOpacity={0.8}
            >
              <View style={[styles.catIconWrap, { backgroundColor: cat.bg }]}>
                <Ionicons name={cat.icon} size={22} color={isDark ? colors.green : colors.brown} />
              </View>
              <Text style={styles.catLabel}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Popular Items */}
        <View style={styles.popularSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionLabel}>Popular Right Now</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Menu')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 12, paddingRight: 16 }}
          >
            {popularItems.map(item => (
              <TouchableOpacity
                key={item.id}
                style={styles.popularCard}
                onPress={() => navigation.navigate('Menu')}
                activeOpacity={0.85}
              >
                <View style={styles.popularTag}>
                  <Text style={styles.popularTagText}>{item.tag}</Text>
                </View>
                <Text style={styles.popularEmoji}>{item.emoji}</Text>
                <Text style={styles.popularName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.popularPrice}>₹{item.price}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.quickAction, { backgroundColor: isDark ? colors.saffronPale : '#DCFCE7' }]}
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons name="time-outline" size={24} color={colors.saffron} />
            <Text style={styles.quickActionText}>Order History</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickAction, { backgroundColor: isDark ? colors.saffronPale : '#D1FAE5' }]}
            onPress={() => navigation.navigate('Favorites')}
          >
            <Ionicons name="heart-outline" size={24} color={colors.saffron} />
            <Text style={styles.quickActionText}>Favorites</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickAction, { backgroundColor: isDark ? colors.saffronPale : '#DCFCE7' }]}
            onPress={() => navigation.navigate('Coupon')}
          >
            <Ionicons name="pricetag-outline" size={24} color={colors.saffron} />
            <Text style={styles.quickActionText}>Coupons</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Ionicons name="leaf-outline" size={16} color={colors.green} style={{ marginBottom: 6 }} />
          <Text style={styles.footerText}>Pure ingredients · Made fresh daily · Bhiwani, Haryana</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  hero: {
    backgroundColor: colors.brown,
    padding: 24, paddingTop: 52, paddingBottom: 28,
  },
  heroHeader: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
  },
  greeting: { color: colors.turmeric, fontSize: 14, ...FONTS.medium, letterSpacing: 0.5 },
  heroTitle: { color: colors.white, fontSize: 26, ...FONTS.heavy, marginTop: 6, lineHeight: 34 },
  heroSub:   { color: isDark ? colors.textMuted : colors.greenPale, fontSize: 13, marginTop: 4, marginBottom: 18 },
  notifBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: isDark ? colors.borderLight : 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: isDark ? colors.border : 'rgba(255,255,255,0.1)',
    borderRadius: RADIUS.md, padding: 14,
    borderWidth: 1, borderColor: isDark ? colors.borderLight : 'rgba(255,255,255,0.12)',
    marginBottom: 20,
  },
  searchPlaceholder: { color: colors.textLight, fontSize: 14, ...FONTS.regular },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 22 },
  stat:     { alignItems: 'center' },
  statNum:  { color: colors.saffronLight, fontSize: 20, ...FONTS.bold },
  statLbl:  { color: colors.textMuted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginTop: 1 },
  orderNowBtn: {
    backgroundColor: colors.saffron, borderRadius: RADIUS.md,
    paddingVertical: 14, alignItems: 'center', ...SHADOW.medium,
    flexDirection: 'row', justifyContent: 'center', gap: 10,
  },
  orderNowText: { color: colors.white, fontSize: 16, ...FONTS.bold },
  body: { padding: 20, paddingTop: 24 },
  sectionLabel: { fontSize: 18, ...FONTS.bold, color: colors.text, marginBottom: 14 },
  sectionHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14,
  },
  seeAll: { fontSize: 14, ...FONTS.semibold, color: colors.saffron },
  catChip: {
    alignItems: 'center',
    marginRight: 12, minWidth: 72,
  },
  catIconWrap: {
    width: 56, height: 56, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 6, ...SHADOW.small,
  },
  catLabel: { fontSize: 12, ...FONTS.semibold, color: colors.text },
  popularSection: { marginBottom: 24 },
  popularCard: {
    width: 140, backgroundColor: colors.cardBg, borderRadius: RADIUS.lg,
    padding: 14, marginRight: 16, alignItems: 'center',
    borderWidth: 1, borderColor: colors.border, ...SHADOW.small,
  },
  popularTag: {
    position: 'absolute', top: 8, left: 8,
    backgroundColor: colors.saffron, paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  popularTagText: { fontSize: 9, ...FONTS.bold, color: colors.white, textTransform: 'uppercase' },
  popularEmoji: { fontSize: 36, marginTop: 16, marginBottom: 8 },
  popularName: { fontSize: 13, ...FONTS.semibold, color: colors.text, textAlign: 'center' },
  popularPrice: { fontSize: 15, ...FONTS.bold, color: colors.saffronDeep, marginTop: 4 },
  quickActions: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, gap: 10,
  },
  quickAction: {
    flex: 1, alignItems: 'center', padding: 16, borderRadius: RADIUS.lg,
    gap: 8,
  },
  quickActionText: { fontSize: 11, ...FONTS.semibold, color: colors.text, textAlign: 'center' },
  footer: {
    marginTop: 8, padding: 16,
    backgroundColor: colors.creamDark, borderRadius: RADIUS.lg, alignItems: 'center',
  },
  footerText: { color: colors.textMuted, fontSize: 12, textAlign: 'center', lineHeight: 18 },
});
