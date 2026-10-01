// src/screens/MenuScreen.js — Enhanced with item detail modal and theme support
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/client';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { VegBadge, ItemDetailModal } from '../components';
import HeartButton from '../components/HeartButton';
import StarRating from '../components/StarRating';
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
      .then(d => setCategories([{ _id: 'all', name: 'All' }, ...d.categories]))
      .catch(() => {});
  }, []);

  // Header search button
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => navigation.navigate('Search')} style={{ marginRight: 16 }}>
          <Ionicons name="search-outline" size={22} color={colors.white} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, colors, isDark]);

  // Load items when category changes
  const loadItems = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const params = activeCat !== 'all' ? { category: activeCat } : {};
      const data = await api.getMenuItems(params);
      setItems(data.items);
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
    const qty   = getQty(item._id || item.id);
    const itemId = item._id || item.id;
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => {
          setSelectedItem(item);
          setShowDetailModal(true);
        }}
      >
        <View style={styles.cardEmoji}>
          <Text style={{ fontSize: 48 }}>{item.emoji}</Text>
          <View style={styles.vegOverlay}>
            <VegBadge isVeg={item.is_veg === true || item.is_veg === 1} />
          </View>
          <View style={styles.heartOverlay}>
            <HeartButton itemId={itemId} size={20} />
          </View>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.itemName}>{item.name}</Text>
          {item.avg_rating > 0 && (
            <View style={styles.ratingRow}>
              <StarRating rating={item.avg_rating} size={12} />
              {item.rating_count > 0 && (
                <Text style={styles.ratingCount}>({item.rating_count})</Text>
              )}
            </View>
          )}
          <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>
          <View style={styles.cardFooter}>
            <Text style={styles.price}>₹{item.price}</Text>
            {qty === 0 ? (
              <TouchableOpacity
                style={styles.addBtn}
                onPress={(e) => {
                  e.stopPropagation?.();
                  addItem({ ...item, id: itemId });
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={16} color={colors.white} />
                <Text style={styles.addBtnText}>ADD</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.qtyCtrl}>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => removeItem(itemId)}>
                  <Ionicons name="remove" size={16} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.qtyNum}>{qty}</Text>
                <TouchableOpacity
                  style={[styles.qtyBtn, { backgroundColor: colors.saffron, borderColor: colors.saffron }]}
                  onPress={() => addItem({ ...item, id: itemId })}
                >
                  <Ionicons name="add" size={16} color={colors.white} />
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
      {/* Category filter */}
      <View style={styles.filterBarContainer}>
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          style={styles.filterBar} contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          {categories.map((cat, index) => {
            const isActive = activeCat === (cat._id || cat.id);
            const hasEmoji = cat.emoji && cat._id !== 'all';
            return (
              <TouchableOpacity
                key={cat._id || cat.id}
                style={[
                  styles.catBtn,
                  isActive && styles.catBtnActive,
                  index < categories.length - 1 && { marginRight: 10 }
                ]}
                onPress={() => setActiveCat(cat._id || cat.id)}
                activeOpacity={0.8}
              >
                {hasEmoji ? <Text style={styles.catEmoji}>{cat.emoji}</Text> : null}
                <Text style={[styles.catLabel, isActive && styles.catLabelActive]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.saffron} />
          <Text style={{ color: colors.textMuted, marginTop: 10, fontSize: 14 }}>Loading menu...</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={i => i._id || i.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
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
              <Text style={{ color: colors.textMuted, marginTop: 10, fontSize: 15 }}>No items found</Text>
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

      {/* Floating Cart Button - Swiggy style */}
      {itemCount > 0 && (
        <TouchableOpacity
          style={styles.floatingCart}
          onPress={() => navigation.navigate('Cart')}
          activeOpacity={0.9}
        >
          <View style={styles.floatingCartLeft}>
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{itemCount}</Text>
            </View>
            <View>
              <Text style={styles.floatingCartItems}>{itemCount} item{itemCount > 1 ? 's' : ''}</Text>
              <Text style={styles.floatingCartTotal}>₹{itemTotal}</Text>
            </View>
          </View>
          <View style={styles.floatingCartRight}>
            <Text style={styles.floatingCartCta}>View Cart</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.white} />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  screen:    { flex: 1, backgroundColor: colors.cream },
  filterBarContainer: {
    backgroundColor: colors.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    ...SHADOW.small,
  },
  filterBar: { paddingVertical: 14 },
  catBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    backgroundColor: colors.creamDark,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  catBtnActive: {
    backgroundColor: colors.saffron,
    borderColor: colors.saffron,
    ...SHADOW.small,
  },
  catEmoji: { fontSize: 16, marginRight: 6 },
  catLabel: { fontSize: 13, ...FONTS.semibold, color: colors.textMuted },
  catLabelActive: { color: colors.white },
  list: { padding: 16, gap: 14, paddingBottom: 24 },
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: colors.borderLight,
    overflow: 'hidden', ...SHADOW.small,
  },
  cardEmoji: {
    height: 120, backgroundColor: colors.creamDark,
    alignItems: 'center', justifyContent: 'center',
  },
  vegOverlay: { position: 'absolute', top: 10, left: 10 },
  heartOverlay: { position: 'absolute', top: 8, right: 8 },
  cardBody:   { padding: 14 },
  itemName:   { fontSize: 16, ...FONTS.bold, color: colors.text, marginBottom: 4 },
  ratingRow:  { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  ratingCount: { fontSize: 11, color: colors.textMuted },
  itemDesc:   { fontSize: 13, color: colors.textMuted, lineHeight: 18, marginBottom: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price:      { fontSize: 18, ...FONTS.bold, color: colors.saffronDeep },
  addBtn: {
    backgroundColor: colors.saffron,
    borderRadius: RADIUS.sm, paddingHorizontal: 16, paddingVertical: 8,
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  addBtnText: { color: colors.white, ...FONTS.bold, fontSize: 13 },
  qtyCtrl:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: colors.creamDark,
    borderWidth: 1.5, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  qtyNum:     { fontSize: 16, ...FONTS.bold, color: colors.text, minWidth: 22, textAlign: 'center' },
  center:     { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 48 },
  // Floating cart button
  floatingCart: {
    position: 'absolute', bottom: 20, left: 16, right: 16,
    backgroundColor: colors.saffron, borderRadius: RADIUS.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 14, paddingHorizontal: 18,
    ...SHADOW.large,
  },
  floatingCartLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cartBadge: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.saffronDeep,
    alignItems: 'center', justifyContent: 'center',
  },
  cartBadgeText: { ...FONTS.bold, fontSize: 16, color: colors.white },
  floatingCartItems: { ...FONTS.medium, fontSize: 12, color: colors.textMuted },
  floatingCartTotal: { ...FONTS.bold, fontSize: 17, color: colors.white },
  floatingCartRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  floatingCartCta: { ...FONTS.bold, fontSize: 15, color: colors.white },
});
