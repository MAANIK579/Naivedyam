// src/screens/MenuScreen.js — Modern High-Contrast Menu & Dish Ordering Screen
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, Alert, RefreshControl, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/client';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { VegBadge, ItemDetailModal, ActiveOrderTracker } from '../components';
import { FONTS, RADIUS, SHADOW } from '../theme';

export default function MenuScreen({ route, navigation }) {
  const { category: initialCat } = route.params || {};
  const { addItem, removeItem, getQty, itemCount, itemTotal } = useCart();
  const { colors, isDark } = useTheme();

  const [categories, setCategories] = useState([]);
  const [items,      setItems]      = useState([]);
  const [activeCat,  setActiveCat]  = useState(initialCat || 'all');
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Load categories once
  useEffect(() => {
    api.getCategories()
      .then(d => setCategories([{ _id: 'all', name: 'All Dishes' }, ...(d.categories || [])]))
      .catch(() => {});
  }, []);

  // Header search button
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('Search')}
          style={{ marginRight: 16 }}
          activeOpacity={0.8}
        >
          <Ionicons name="search" size={22} color={colors.white} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, colors]);

  // Load items when category changes
  const loadItems = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const params = activeCat !== 'all' ? { category: activeCat } : {};
      const data = await api.getMenuItems(params);
      setItems(data.items || []);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeCat]);

  useEffect(() => { loadItems(); }, [loadItems]);

  function onRefresh() {
    setRefreshing(true);
    loadItems(true);
  }

  const styles = createStyles(colors, isDark);

  function renderItem({ item }) {
    const itemId = item._id || item.id;
    const qty    = getQty(itemId);

    return (
      <TouchableOpacity
        style={styles.dishCard}
        onPress={() => {
          setSelectedItem(item);
          setShowDetailModal(true);
        }}
        activeOpacity={0.92}
      >
        {/* Left Column: Details */}
        <View style={styles.dishDetails}>
          <View style={styles.vegRow}>
            <VegBadge isVeg={item.is_veg === true || item.is_veg === 1} />
            {item.tags?.[0] && (
              <View style={styles.tagPill}>
                <Text style={styles.tagPillText}>{item.tags[0]}</Text>
              </View>
            )}
          </View>

          <Text style={styles.dishName}>{item.name}</Text>
          <Text style={styles.dishPrice}>₹{item.price}</Text>

          {item.avg_rating > 0 && (
            <View style={styles.ratingRow}>
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={10} color="#FFFFFF" />
                <Text style={styles.ratingText}>{item.avg_rating.toFixed(1)}</Text>
              </View>
              {item.rating_count > 0 && (
                <Text style={styles.ratingCount}>({item.rating_count})</Text>
              )}
            </View>
          )}

          <Text style={styles.dishDesc} numberOfLines={2}>
            {item.description || 'Cooked fresh with pure ingredients and traditional recipe.'}
          </Text>
        </View>

        {/* Right Column: Photo + Overlapping Add Button */}
        <View style={styles.dishMediaCol}>
          <View style={styles.dishImageWrap}>
            {item.image_url ? (
              <Image
                source={{ uri: item.image_url }}
                style={styles.dishImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.emojiFallback}>
                <Text style={{ fontSize: 48 }}>{item.emoji || '🥘'}</Text>
              </View>
            )}
          </View>

          {/* Overlapping Add / Stepper Button */}
          <View style={styles.addBtnContainer}>
            {qty === 0 ? (
              <TouchableOpacity
                style={styles.addBtn}
                onPress={(e) => {
                  e?.stopPropagation?.();
                  addItem({ ...item, id: itemId });
                }}
                activeOpacity={0.85}
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
  }

  return (
    <View style={styles.screen}>
      {/* Category Horizontal Filter Bar */}
      <View style={styles.filterBarContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterBarContent}
        >
          {categories.map((cat) => {
            const catId = cat._id || cat.id;
            const isActive = activeCat === catId;
            return (
              <TouchableOpacity
                key={catId}
                style={[
                  styles.catBtn,
                  isActive && styles.catBtnActive,
                ]}
                onPress={() => setActiveCat(catId)}
                activeOpacity={0.8}
              >
                {cat.emoji && catId !== 'all' ? (
                  <Text style={styles.catEmoji}>{cat.emoji}</Text>
                ) : null}
                <Text style={[styles.catLabel, isActive && styles.catLabelActive]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Items List */}
      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.saffron} />
          <Text style={styles.loadingText}>Fetching freshly prepared menu...</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={i => i._id || i.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.saffron]}
              tintColor={colors.saffron}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="restaurant-outline" size={48} color={colors.border} />
              <Text style={styles.emptyTitle}>No dishes found</Text>
              <Text style={styles.emptySubtitle}>Try choosing another category above.</Text>
            </View>
          }
        />
      )}

      {/* Item Detail Modal */}
      <ItemDetailModal
        visible={showDetailModal}
        item={selectedItem}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedItem(null);
        }}
        navigation={navigation}
      />

      {/* Dynamic Floating Bottom Bar (Cart & Live Order Tracking) */}
      <ActiveOrderTracker navigation={navigation} />
    </View>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  filterBarContainer: {
    backgroundColor: colors.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 10,
  },
  filterBarContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  catBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: colors.creamDark,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  catBtnActive: {
    backgroundColor: colors.saffron,
    borderColor: colors.saffron,
  },
  catEmoji: {
    fontSize: 14,
  },
  catLabel: {
    fontSize: 13,
    ...FONTS.semibold,
    color: colors.textMuted,
  },
  catLabelActive: {
    color: '#FFFFFF',
    ...FONTS.bold,
  },
  list: {
    padding: 16,
    paddingBottom: 130,
  },
  itemSeparator: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 14,
  },
  dishCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.cardBg,
    borderRadius: RADIUS.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    ...SHADOW.small,
  },
  dishDetails: {
    flex: 1,
    paddingRight: 14,
  },
  vegRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  tagPill: {
    backgroundColor: colors.saffronPale,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagPillText: {
    fontSize: 10,
    ...FONTS.bold,
    color: colors.saffron,
    textTransform: 'uppercase',
  },
  dishName: {
    fontSize: 16,
    ...FONTS.bold,
    color: colors.text,
    marginBottom: 4,
  },
  dishPrice: {
    fontSize: 16,
    ...FONTS.heavy,
    color: colors.text,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#15803D',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  ratingText: {
    fontSize: 11,
    ...FONTS.bold,
    color: '#FFFFFF',
  },
  ratingCount: {
    fontSize: 11,
    color: colors.textMuted,
  },
  dishDesc: {
    fontSize: 12.5,
    color: colors.textMuted,
    lineHeight: 17,
  },
  dishMediaCol: {
    width: 110,
    alignItems: 'center',
  },
  dishImageWrap: {
    width: 110,
    height: 100,
    borderRadius: RADIUS.md,
    backgroundColor: colors.creamDark,
    overflow: 'hidden',
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
  addBtnContainer: {
    marginTop: -16,
    ...SHADOW.medium,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderColor: colors.saffron,
    borderWidth: 1.5,
    borderRadius: RADIUS.md,
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 4,
  },
  addBtnText: {
    fontSize: 13,
    ...FONTS.heavy,
    color: colors.saffron,
    letterSpacing: 0.3,
  },
  qtyCtrl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.saffron,
    borderRadius: RADIUS.md,
    paddingHorizontal: 6,
    paddingVertical: 5,
  },
  qtyBtn: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyNum: {
    fontSize: 13.5,
    ...FONTS.heavy,
    color: '#FFFFFF',
    minWidth: 24,
    textAlign: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    color: colors.textMuted,
    marginTop: 12,
    fontSize: 14,
  },
  emptyTitle: {
    fontSize: 16,
    ...FONTS.bold,
    color: colors.text,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
  floatingCart: {
    position: 'absolute',
    bottom: 18,
    left: 16,
    right: 16,
    backgroundColor: colors.saffron,
    borderRadius: RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...SHADOW.large,
  },
  cartLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cartBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    ...FONTS.heavy,
    fontSize: 13,
    color: '#FFFFFF',
  },
  cartItemText: {
    fontSize: 10,
    ...FONTS.bold,
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 0.5,
  },
  cartPriceText: {
    fontSize: 16,
    ...FONTS.heavy,
    color: '#FFFFFF',
  },
  cartRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  viewCartText: {
    fontSize: 14,
    ...FONTS.heavy,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
