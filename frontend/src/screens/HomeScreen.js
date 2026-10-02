// src/screens/HomeScreen.js — Craving Mobile-First Cloud Kitchen Home Screen
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, StatusBar, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { ActiveOrderTracker, Plate } from '../components';
import { FONTS, RADIUS, SHADOW, MOODS } from '../theme';
import api from '../api/client';

const MOOD_LIST = [
  {
    id: 'comfort',
    name: 'Comfort',
    subtitle: 'Warm, slow, heavy.',
    color: '#F5B042',
    blobColor: '#FFD998',
    textColor: '#2B1A05',
  },
  {
    id: 'fresh',
    name: 'Fresh',
    subtitle: 'Light, crisp, bright.',
    color: '#8FE0A0',
    blobColor: '#BFF0CA',
    textColor: '#0F2A10',
  },
  {
    id: 'fire',
    name: 'Fire',
    subtitle: 'Spicy, smoky, bold.',
    color: '#EE5F45',
    blobColor: '#FF9783',
    textColor: '#FFFFFF',
  },
  {
    id: 'sweet',
    name: 'Sweet',
    subtitle: 'Dessert, treat, joy.',
    color: '#F6BDD3',
    blobColor: '#FDE0EC',
    textColor: '#3A0F25',
  },
];

export default function HomeScreen({ navigation, route }) {
  const { user } = useAuth();
  const { addItem, removeItem, getQty } = useCart();
  const { colors, isDark } = useTheme();

  const initials = (user?.name || 'U')
    .trim()
    .split(/\s+/)
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const [refreshing, setRefreshing] = useState(false);
  const [popularItems, setPopularItems] = useState([]);
  const [openTrackerModal, setOpenTrackerModal] = useState(false);

  useEffect(() => {
    if (route.params?.openTracker) {
      setOpenTrackerModal(true);
    }
  }, [route.params?.openTracker]);

  async function loadData() {
    try {
      const data = await api.getMenuItems({ limit: 8, sort: 'popular' });
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

  function handleSurpriseMe() {
    if (popularItems.length > 0) {
      const randomItem = popularItems[Math.floor(Math.random() * popularItems.length)];
      navigation.navigate('Menu', { category: undefined, autoOpenId: randomItem._id || randomItem.id });
    } else {
      navigation.navigate('Menu');
    }
  }

  const styles = createStyles(colors, isDark);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121A16" />

      {/* Top Header Bar with Location & Zomato-style Profile */}
      <View style={styles.topBar}>
        <View style={styles.locationContainer}>
          <View style={styles.locationIconWrap}>
            <Ionicons name="location" size={17} color="#F5B042" />
          </View>
          <View>
            <View style={styles.locationTitleRow}>
              <Text style={styles.locationTitle}>Bhiwani, Haryana</Text>
              <Ionicons name="chevron-down" size={13} color="#FFFFFF" />
            </View>
            <Text style={styles.locationSub}>Express Kitchen (30-35 min)</Text>
          </View>
        </View>

        {/* Profile Button on Top Right */}
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
            colors={['#F5B042']}
            tintColor="#F5B042"
          />
        }
      >
        {/* Main Heading: What are you craving? */}
        <View style={styles.headingWrap}>
          <Text style={styles.mainHeading}>What are you{'\n'}craving?</Text>
        </View>

        {/* 2x2 Grid of Large Mood Tiles */}
        <View style={styles.moodGrid}>
          {MOOD_LIST.map((mood) => (
            <TouchableOpacity
              key={mood.id}
              style={[styles.moodTile, { backgroundColor: mood.color }]}
              onPress={() => navigation.navigate('Menu', { mood: mood.id, category: mood.id })}
              activeOpacity={0.92}
            >
              {/* Offset Corner Blob Circle */}
              <View
                style={[
                  styles.cornerBlob,
                  { backgroundColor: mood.blobColor },
                ]}
              />

              {/* Title */}
              <Text style={[styles.moodTileTitle, { color: mood.textColor }]}>
                {mood.name}
              </Text>

              {/* Subtitle */}
              <Text style={[styles.moodTileSub, { color: mood.textColor }]}>
                {mood.subtitle.replace('.', '')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Outline Button: Surprise me, chef */}
        <TouchableOpacity
          style={styles.surpriseBtn}
          onPress={handleSurpriseMe}
          activeOpacity={0.85}
        >
          <Ionicons name="sparkles" size={17} color="#F5B042" style={{ marginRight: 8 }} />
          <Text style={styles.surpriseBtnText}>Surprise me, chef</Text>
        </TouchableOpacity>

        {/* Search Bar & Explore Shortcut */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => navigation.navigate('Search')}
          activeOpacity={0.88}
        >
          <Ionicons name="search" size={18} color="#F5B042" />
          <Text style={styles.searchPlaceholder}>Search "Dal Makhani, Special Thali..."</Text>
          <View style={styles.searchDivider} />
          <Ionicons name="options-outline" size={18} color="#A3B5AA" />
        </TouchableOpacity>

        {/* Popular Dishes Row */}
        {popularItems.length > 0 && (
          <View style={styles.popularSection}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Chef's Fresh Specials</Text>
                <Text style={styles.sectionSubtitle}>Handcrafted daily in our cloud kitchen</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Menu')}>
                <Text style={styles.seeAllText}>Full Menu ➔</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dishList}>
              {popularItems.slice(0, 4).map((item) => {
                const itemId = item._id || item.id;
                const qty = getQty(itemId);

                return (
                  <TouchableOpacity
                    key={itemId}
                    style={styles.dishRowCard}
                    onPress={() => navigation.navigate('Menu', { autoOpenId: itemId })}
                    activeOpacity={0.9}
                  >
                    <Plate
                      imageUrl={item.image_url}
                      mood="comfort"
                      size={68}
                    />

                    <View style={styles.dishRowInfo}>
                      <Text style={styles.dishRowName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.dishRowMeta}>
                        {item.cook_time || 18} min · ₹{item.price}
                      </Text>
                    </View>

                    {/* Round Add Button */}
                    <TouchableOpacity
                      style={styles.dishAddRoundBtn}
                      onPress={(e) => {
                        e?.stopPropagation?.();
                        addItem({ ...item, id: itemId });
                      }}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="add" size={20} color="#2B1A05" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
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
    backgroundColor: '#121A16',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 14,
    backgroundColor: '#121A16',
    borderBottomWidth: 1,
    borderBottomColor: '#1B2620',
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
    backgroundColor: '#1B2620',
    borderWidth: 1,
    borderColor: '#33463C',
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
    color: '#FFFFFF',
  },
  locationSub: {
    fontSize: 12,
    color: '#A3B5AA',
  },
  profileAvatarBtn: {
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#F5B042',
    padding: 2,
  },
  profileAvatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F5B042',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    color: '#2B1A05',
    fontSize: 13,
    ...FONTS.heavy,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 120,
  },
  headingWrap: {
    marginBottom: 24,
    marginTop: 8,
  },
  mainHeading: {
    fontSize: 38,
    lineHeight: 42,
    ...FONTS.heavy,
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 14,
  },
  moodTile: {
    width: '47.5%',
    height: 195,
    borderRadius: 28,
    padding: 18,
    justifyContent: 'space-between',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  cornerBlob: {
    position: 'absolute',
    bottom: -24,
    right: -24,
    width: 120,
    height: 120,
    borderRadius: 60,
    opacity: 0.85,
  },
  moodTileTitle: {
    fontSize: 22,
    ...FONTS.heavy,
    letterSpacing: -0.4,
    zIndex: 1,
  },
  moodTileSub: {
    fontSize: 13,
    ...FONTS.medium,
    lineHeight: 18,
    maxWidth: 105,
    opacity: 0.9,
    zIndex: 1,
  },
  surpriseBtn: {
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: '#33463C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
    backgroundColor: 'transparent',
  },
  surpriseBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    ...FONTS.bold,
    letterSpacing: -0.2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1B2620',
    marginTop: 18,
    paddingHorizontal: 16,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#33463C',
    gap: 10,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 13.5,
    color: '#A3B5AA',
  },
  searchDivider: {
    width: 1,
    height: 18,
    backgroundColor: '#33463C',
  },
  popularSection: {
    marginTop: 26,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    ...FONTS.heavy,
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#A3B5AA',
    marginTop: 2,
  },
  seeAllText: {
    fontSize: 13,
    ...FONTS.bold,
    color: '#F5B042',
  },
  dishList: {
    gap: 12,
  },
  dishRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1B2620',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#33463C',
    padding: 14,
    gap: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  dishRowInfo: {
    flex: 1,
  },
  dishRowName: {
    fontSize: 16,
    ...FONTS.heavy,
    color: '#FFFFFF',
  },
  dishRowMeta: {
    fontSize: 13,
    color: '#A3B5AA',
    marginTop: 3,
    ...FONTS.medium,
  },
  dishAddRoundBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5B042',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
});
