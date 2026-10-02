// src/screens/MenuScreen.js — Craving Mood Menu Screen
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/client';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { ItemDetailModal, ActiveOrderTracker, Plate } from '../components';
import { FONTS, RADIUS, SHADOW, MOODS } from '../theme';

const MOOD_TABS = [
  { id: 'comfort', name: 'Comfort', subtitle: 'Warm, slow, heavy.', color: '#F5B042', blobColor: '#FFD998', textColor: '#2B1A05' },
  { id: 'fresh',   name: 'Fresh',   subtitle: 'Light, crisp, bright.', color: '#8FE0A0', blobColor: '#BFF0CA', textColor: '#0F2A10' },
  { id: 'fire',    name: 'Fire',    subtitle: 'Spicy, smoky, bold.', color: '#EE5F45', blobColor: '#FF9783', textColor: '#FFFFFF' },
  { id: 'sweet',   name: 'Sweet',   subtitle: 'Dessert, treat, joy.', color: '#F6BDD3', blobColor: '#FDE0EC', textColor: '#3A0F25' },
];

export default function MenuScreen({ route, navigation }) {
  const { mood: initialMood = 'comfort', autoOpenId } = route.params || {};
  const { addItem, removeItem, getQty, itemCount, itemTotal } = useCart();
  const { colors, isDark } = useTheme();

  const [activeMood, setActiveMood] = useState(initialMood);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const currentMoodConfig = MOODS[activeMood] || MOODS.comfort;

  // Header options: back button + search
  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: '',
      headerStyle: { backgroundColor: '#121A16' },
      headerTintColor: '#FFFFFF',
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles_static.backBtnCircle}
          activeOpacity={0.8}
          accessibilityLabel="Back"
        >
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('Search')}
          style={styles_static.searchBtnCircle}
          activeOpacity={0.8}
        >
          <Ionicons name="search" size={19} color="#FFFFFF" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  // Load items
  const loadItems = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const data = await api.getMenuItems();
      setItems(data.items || []);

      if (autoOpenId && data.items) {
        const found = data.items.find((i) => (i._id || i.id) === autoOpenId);
        if (found) {
          setSelectedItem(found);
          setShowDetailModal(true);
        }
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [autoOpenId]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  function onRefresh() {
    setRefreshing(true);
    loadItems(true);
  }

  // Filter items loosely per mood or distribute smartly
  const filteredDishes = items.filter((item) => {
    if (activeMood === 'comfort') {
      return (
        item.category === 'dal-sabzi' ||
        item.category === 'thali' ||
        item.category === 'roti' ||
        (item.name && /dal|thali|paneer|butter|kofta/i.test(item.name))
      );
    }
    if (activeMood === 'fresh') {
      return (
        item.category === 'snacks' ||
        (item.name && /salad|raita|soup|steamed|green|fresh/i.test(item.name))
      );
    }
    if (activeMood === 'fire') {
      return (
        (item.name && /spicy|chilli|masala|kadai|tandoori|fire/i.test(item.name)) ||
        item.spice_level === 'High'
      );
    }
    if (activeMood === 'sweet') {
      return (
        item.category === 'dessert' ||
        (item.name && /halwa|jamun|kheer|rasgulla|sweet|ice/i.test(item.name))
      );
    }
    return true;
  });

  // Fallback to all items if filtered category is sparse
  const displayedItems = filteredDishes.length > 0 ? filteredDishes : items;

  const styles = createStyles(currentMoodConfig);

  function renderDishRow({ item }) {
    const itemId = item._id || item.id;
    const qty = getQty(itemId);

    return (
      <TouchableOpacity
        style={styles.dishCard}
        onPress={() => {
          setSelectedItem(item);
          setShowDetailModal(true);
        }}
        activeOpacity={0.9}
      >
        {/* Plate component with mood radial gradient */}
        <Plate
          imageUrl={item.image_url}
          mood={activeMood}
          size={74}
        />

        {/* Dish Title & Cook Time / Price */}
        <View style={styles.dishDetails}>
          <Text style={styles.dishName} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.dishMeta}>
            {item.cook_time || 18} min · ₹{item.price}
          </Text>
        </View>

        {/* 44px Round '+' Add Button in Active Mood Color */}
        <TouchableOpacity
          style={[styles.addRoundBtn, { backgroundColor: currentMoodConfig.color }]}
          onPress={(e) => {
            e?.stopPropagation?.();
            addItem({ ...item, id: itemId });
          }}
          activeOpacity={0.85}
          accessibilityLabel={`Add ${item.name}`}
        >
          <Ionicons name="add" size={24} color={currentMoodConfig.textColor} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Mood Selector Tabs */}
      <View style={styles.moodTabsRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.moodTabsScroll}
        >
          {MOOD_TABS.map((mood) => {
            const isActive = activeMood === mood.id;
            return (
              <TouchableOpacity
                key={mood.id}
                style={[
                  styles.moodTabPill,
                  isActive && { backgroundColor: mood.color, borderColor: mood.color },
                ]}
                onPress={() => setActiveMood(mood.id)}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.moodTabPillText,
                    isActive && { color: mood.textColor, ...FONTS.heavy },
                  ]}
                >
                  {mood.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main List with Huge Bold Mood Header Card matching PDF Page 2 */}
      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={currentMoodConfig.color} />
          <Text style={styles.loadingText}>Loading {currentMoodConfig.name} crave list...</Text>
        </View>
      ) : (
        <FlatList
          data={displayedItems}
          keyExtractor={(i) => i._id || i.id}
          renderItem={renderDishRow}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[currentMoodConfig.color]}
              tintColor={currentMoodConfig.color}
            />
          }
          ListHeaderComponent={
            <View
              style={[
                styles.moodHeaderCard,
                { backgroundColor: currentMoodConfig.color },
              ]}
            >
              {/* Offset Corner Blob Circle matching PDF Page 2 */}
              <View
                style={[
                  styles.headerBlobCircle,
                  { backgroundColor: currentMoodConfig.blobColor },
                ]}
              />

              <View style={styles.headerContent}>
                <Text style={[styles.headerTitle, { color: currentMoodConfig.textColor }]}>
                  {currentMoodConfig.name}
                </Text>
                <Text style={[styles.headerSubtitle, { color: currentMoodConfig.textColor }]}>
                  {currentMoodConfig.subtitle}
                </Text>
              </View>
            </View>
          }
        />
      )}

      {/* Item Detail Modal */}
      <ItemDetailModal
        visible={showDetailModal}
        item={selectedItem}
        mood={activeMood}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedItem(null);
        }}
        navigation={navigation}
      />

      {/* Dynamic Floating Bottom Bar (Sliding Live Order Tracking & Cart) */}
      <ActiveOrderTracker navigation={navigation} />
    </View>
  );
}

const styles_static = StyleSheet.create({
  backBtnCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1B2620',
    borderWidth: 1,
    borderColor: '#33463C',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 14,
  },
  searchBtnCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1B2620',
    borderWidth: 1,
    borderColor: '#33463C',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
});

const createStyles = (moodConfig) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: '#121A16',
    },
    moodTabsRow: {
      backgroundColor: '#121A16',
      borderBottomWidth: 1,
      borderBottomColor: '#1B2620',
      paddingVertical: 10,
    },
    moodTabsScroll: {
      paddingHorizontal: 20,
      gap: 10,
    },
    moodTabPill: {
      paddingHorizontal: 18,
      paddingVertical: 8,
      borderRadius: RADIUS.chip,
      backgroundColor: '#1B2620',
      borderWidth: 1,
      borderColor: '#33463C',
    },
    moodTabPillText: {
      fontSize: 14,
      ...FONTS.bold,
      color: '#A3B5AA',
    },
    listContent: {
      paddingHorizontal: 20,
      paddingTop: 14,
      paddingBottom: 130,
      gap: 12,
    },
    moodHeaderCard: {
      height: 165,
      borderRadius: 28,
      padding: 22,
      justifyContent: 'space-between',
      overflow: 'hidden',
      position: 'relative',
      marginBottom: 16,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 6,
    },
    headerBlobCircle: {
      position: 'absolute',
      top: -30,
      right: -30,
      width: 140,
      height: 140,
      borderRadius: 70,
      opacity: 0.85,
    },
    headerContent: {
      flex: 1,
      justifyContent: 'space-between',
      zIndex: 1,
    },
    headerTitle: {
      fontSize: 36,
      ...FONTS.heavy,
      letterSpacing: -1,
    },
    headerSubtitle: {
      fontSize: 14.5,
      ...FONTS.bold,
      opacity: 0.9,
    },
    dishCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#1B2620',
      borderRadius: 26,
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
    dishDetails: {
      flex: 1,
      paddingRight: 6,
    },
    dishName: {
      fontSize: 16.5,
      ...FONTS.heavy,
      color: '#FFFFFF',
      lineHeight: 21,
    },
    dishMeta: {
      fontSize: 13,
      color: '#A3B5AA',
      marginTop: 4,
      ...FONTS.medium,
    },
    addRoundBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 4,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
    },
    loadingText: {
      color: '#A3B5AA',
      marginTop: 12,
      fontSize: 14,
      ...FONTS.medium,
    },
  });
