import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, StatusBar, RefreshControl, Animated, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { AmbientGlow, GlassCard } from '../components';
import { FONTS, RADIUS, SHADOW } from '../theme';
import api from '../api/client';

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
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
    { id: 'thali',     label: 'Thali',     icon: 'grid-outline',      emoji: '🍛' },
    { id: 'dal-sabzi', label: 'Dal Sabzi', icon: 'leaf-outline',      emoji: '🥘' },
    { id: 'roti',      label: 'Roti',      icon: 'pizza-outline',     emoji: '🫓' },
    { id: 'nonveg',    label: 'Special',   icon: 'flame-outline',     emoji: '🍲' },
    { id: 'snacks',    label: 'Snacks',    icon: 'cafe-outline',      emoji: '🥟' },
    { id: 'dessert',   label: 'Dessert',   icon: 'ice-cream-outline', emoji: '🍨' },
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
          image_url: item.image_url,
          price: item.price,
          tag: item.tags?.[0] || 'Popular',
        })));
      }
    } catch (_) {}
    setRefreshing(false);
  }

  useEffect(() => {
    onRefresh();
  }, []);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.025, duration: 1200, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const styles = createStyles(colors, isDark);

  return (
    <View style={styles.container}>
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor="transparent" translucent />
      <AmbientGlow />

      <ScrollView
        style={styles.screen}
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
        {/* Glassmorphic Hero Banner */}
        <View style={styles.heroWrapper}>
          <GlassCard elevated style={styles.heroGlass}>
            <View style={styles.heroHeader}>
              <View style={{ flex: 1 }}>
                <View style={styles.greetingBadge}>
                  <Ionicons name="sparkles" size={13} color={colors.turmeric} />
                  <Text style={styles.greeting}>Namaskar, {firstName}</Text>
                </View>
                <Text style={styles.heroTitle}>Ghar Ka Swaad,{'\n'}Seedha Aapke Darwaze</Text>
              </View>
              <TouchableOpacity
                style={styles.notifBtn}
                onPress={() => navigation.navigate('Notifications')}
                activeOpacity={0.8}
              >
                <Ionicons name="notifications-outline" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.heroSub}>Authentic Haryanvi home meals · Bhiwani, Haryana</Text>

            {/* Frosted Search Bar */}
            <TouchableOpacity
              style={styles.searchBar}
              onPress={() => navigation.navigate('Search')}
              activeOpacity={0.88}
            >
              <View style={styles.searchIconWrap}>
                <Ionicons name="search-outline" size={16} color={colors.saffron} />
              </View>
              <Text style={styles.searchPlaceholder}>Search for thali, dal makhani, roti...</Text>
              <Ionicons name="options-outline" size={16} color={colors.textLight} />
            </TouchableOpacity>

            {/* Quick Stats Glass Pills */}
            <View style={styles.statsRow}>
              {[
                { icon: 'time-outline',     val: '30-45', lbl: 'Mins' },
                { icon: 'star',             val: '4.8★',  lbl: 'Rating' },
                { icon: 'shield-checkmark', val: '100%',  lbl: 'Pure Veg' },
              ].map(s => (
                <View key={s.lbl} style={styles.statPill}>
                  <Ionicons name={s.icon} size={14} color={colors.saffron} />
                  <Text style={styles.statNum}>{s.val}</Text>
                  <Text style={styles.statLbl}>{s.lbl}</Text>
                </View>
              ))}
            </View>

            {/* Order Now Glowing Button */}
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <TouchableOpacity
                style={styles.orderNowBtn}
                onPress={() => navigation.navigate('Menu')}
                activeOpacity={0.85}
              >
                <Ionicons name="restaurant" size={18} color="#FFFFFF" />
                <Text style={styles.orderNowText}>Order Now</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </Animated.View>
          </GlassCard>
        </View>

        {/* Content Body */}
        <View style={styles.body}>
          {/* Quick Categories */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionLabel}>What are you craving?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Menu')}>
              <Text style={styles.seeAll}>View all</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.catsContainer}
          >
            {QUICK_CATS.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={styles.catCard}
                onPress={() => navigation.navigate('Menu', { category: cat.id })}
                activeOpacity={0.8}
              >
                <View style={styles.catSquircle}>
                  <Text style={styles.catEmoji}>{cat.emoji}</Text>
                </View>
                <Text style={styles.catLabel}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Popular Items Showcase */}
          <View style={styles.popularSection}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionLabel}>Popular Right Now</Text>
                <Text style={styles.sectionSublabel}>Freshly cooked local favorites</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Menu')}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.popularList}
            >
              {popularItems.map(item => (
                <GlassCard
                  key={item.id}
                  style={styles.popularCard}
                  onPress={() => navigation.navigate('Menu')}
                  padding={0}
                >
                  <View style={styles.popularMedia}>
                    {item.image_url ? (
                      <Image
                        source={{ uri: item.image_url }}
                        style={styles.popularImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.emojiFallback}>
                        <Text style={styles.popularEmoji}>{item.emoji}</Text>
                      </View>
                    )}
                    {item.tag && (
                      <View style={styles.popularTagPill}>
                        <Text style={styles.popularTagText}>{item.tag}</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.popularContent}>
                    <Text style={styles.popularName} numberOfLines={1}>{item.name}</Text>
                    <View style={styles.popularBottomRow}>
                      <Text style={styles.popularPrice}>₹{item.price}</Text>
                      <View style={styles.addMiniBtn}>
                        <Ionicons name="add" size={16} color="#FFFFFF" />
                      </View>
                    </View>
                  </View>
                </GlassCard>
              ))}
            </ScrollView>
          </View>

          {/* Quick Actions Frosted Grid */}
          <View style={styles.quickActions}>
            <GlassCard
              style={styles.quickAction}
              onPress={() => navigation.navigate('Profile')}
              padding={12}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: isDark ? 'rgba(245,158,11,0.18)' : 'rgba(22,163,74,0.12)' }]}>
                <Ionicons name="receipt-outline" size={20} color={colors.saffron} />
              </View>
              <Text style={styles.quickActionText}>My Orders</Text>
            </GlassCard>

            <GlassCard
              style={styles.quickAction}
              onPress={() => navigation.navigate('Favorites')}
              padding={12}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: isDark ? 'rgba(239,68,68,0.18)' : 'rgba(239,68,68,0.12)' }]}>
                <Ionicons name="heart" size={20} color={colors.error} />
              </View>
              <Text style={styles.quickActionText}>Favorites</Text>
            </GlassCard>

            <GlassCard
              style={styles.quickAction}
              onPress={() => navigation.navigate('Coupon')}
              padding={12}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: isDark ? 'rgba(34,197,94,0.18)' : 'rgba(34,197,94,0.12)' }]}>
                <Ionicons name="pricetag" size={20} color={colors.green} />
              </View>
              <Text style={styles.quickActionText}>Coupons</Text>
            </GlassCard>
          </View>

          {/* Footer Glass Pill */}
          <GlassCard subtle style={styles.footerCard} padding={16}>
            <View style={styles.footerRow}>
              <View style={styles.leafIconBadge}>
                <Ionicons name="leaf" size={15} color={colors.green} />
              </View>
              <Text style={styles.footerText}>
                Handcrafted with pure desi ghee & fresh local produce.{'\n'}
                Prepared fresh for every single order in Bhiwani.
              </Text>
            </View>
          </GlassCard>
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroWrapper: {
    paddingHorizontal: 16,
    paddingTop: 54,
  },
  heroGlass: {
    borderRadius: RADIUS.xl,
    padding: 20,
    overflow: 'hidden',
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  greetingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  greeting: {
    color: colors.turmeric,
    fontSize: 13,
    ...FONTS.semibold,
    letterSpacing: 0.5,
  },
  heroTitle: {
    color: colors.text,
    fontSize: 24,
    ...FONTS.heavy,
    lineHeight: 32,
    letterSpacing: -0.4,
  },
  heroSub: {
    color: colors.textMuted,
    fontSize: 12.5,
    marginTop: 6,
    marginBottom: 16,
  },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.glass?.pill || (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'),
    borderWidth: 1,
    borderColor: colors.glass?.border || 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass?.card || (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.85)'),
    borderRadius: RADIUS.full,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: colors.glass?.border || 'rgba(255,255,255,0.12)',
    borderTopColor: colors.glass?.highlight || 'rgba(255,255,255,0.25)',
    marginBottom: 16,
    gap: 10,
  },
  searchIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: isDark ? 'rgba(245,158,11,0.15)' : 'rgba(22,163,74,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchPlaceholder: {
    flex: 1,
    color: colors.textLight,
    fontSize: 13.5,
    ...FONTS.regular,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
    gap: 8,
  },
  statPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glass?.pill || (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.65)'),
    borderRadius: RADIUS.full,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.glass?.pillBorder || 'rgba(255,255,255,0.1)',
    gap: 5,
  },
  statNum: {
    color: colors.text,
    fontSize: 12,
    ...FONTS.bold,
  },
  statLbl: {
    color: colors.textMuted,
    fontSize: 10,
    ...FONTS.medium,
  },
  orderNowBtn: {
    backgroundColor: colors.saffron,
    borderRadius: RADIUS.lg,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    ...SHADOW.glassGlow,
  },
  orderNowText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    ...FONTS.bold,
    letterSpacing: 0.3,
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 18,
    ...FONTS.bold,
    color: colors.text,
    letterSpacing: -0.3,
  },
  sectionSublabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  seeAll: {
    fontSize: 13.5,
    ...FONTS.semibold,
    color: colors.saffron,
  },
  catsContainer: {
    paddingRight: 16,
    gap: 14,
    paddingBottom: 22,
  },
  catCard: {
    alignItems: 'center',
    width: 66,
  },
  catSquircle: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: colors.glass?.card || (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.85)'),
    borderWidth: 1,
    borderColor: colors.glass?.border || 'rgba(255,255,255,0.12)',
    borderTopColor: colors.glass?.highlight || 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 7,
    ...SHADOW.small,
  },
  catEmoji: {
    fontSize: 26,
  },
  catLabel: {
    fontSize: 11.5,
    ...FONTS.semibold,
    color: colors.text,
    textAlign: 'center',
  },
  popularSection: {
    marginBottom: 24,
  },
  popularList: {
    paddingVertical: 6,
    paddingRight: 16,
    gap: 14,
  },
  popularCard: {
    width: 172,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  popularMedia: {
    width: '100%',
    height: 116,
    backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F1F5F9',
    position: 'relative',
    overflow: 'hidden',
  },
  popularImage: {
    width: '100%',
    height: '100%',
  },
  emojiFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  popularEmoji: {
    fontSize: 44,
  },
  popularTagPill: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: colors.saffron,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  popularTagText: {
    fontSize: 9,
    ...FONTS.bold,
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  popularContent: {
    padding: 12,
  },
  popularName: {
    fontSize: 14,
    ...FONTS.semibold,
    color: colors.text,
    letterSpacing: -0.2,
  },
  popularBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  popularPrice: {
    fontSize: 16,
    ...FONTS.bold,
    color: colors.saffron,
  },
  addMiniBtn: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: colors.saffron,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.small,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.lg,
    gap: 8,
  },
  actionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionText: {
    fontSize: 12,
    ...FONTS.semibold,
    color: colors.text,
    textAlign: 'center',
  },
  footerCard: {
    borderRadius: RADIUS.xl,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  leafIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: isDark ? 'rgba(34,197,94,0.18)' : 'rgba(22,163,74,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 11.5,
    lineHeight: 17,
  },
});
