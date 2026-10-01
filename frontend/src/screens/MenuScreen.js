import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, Alert, RefreshControl, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/client';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { VegBadge, ItemDetailModal, AmbientGlow, GlassCard } from '../components';
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
      .then(d => setCategories([{ _id: 'all', name: 'All' }, ...(d.categories || [])]))
      .catch(() => {});
  }, []);

  // Header search button
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('Search')}
          style={{
            marginRight: 16,
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
            borderWidth: 1,
            borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="search-outline" size={19} color={colors.text} />
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
      <GlassCard
        style={styles.card}
        padding={0}
        onPress={() => {
          setSelectedItem(item);
          setShowDetailModal(true);
        }}
      >
        <View style={styles.cardMedia}>
          {item.image_url ? (
            <Image
              source={{ uri: item.image_url }}
              style={styles.cardImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.emojiContainer}>
              <Text style={{ fontSize: 52 }}>{item.emoji || '🍲'}</Text>
            </View>
          )}

          {/* Frosted Badges Overlay */}
          <View style={styles.vegOverlay}>
            <VegBadge isVeg={item.is_veg === true || item.is_veg === 1} />
          </View>

          <View style={styles.heartOverlay}>
            <HeartButton itemId={itemId} size={18} />
          </View>

          {item.tags && item.tags.length > 0 && (
            <View style={styles.dishTagBadge}>
              <Text style={styles.dishTagText}>{item.tags[0]}</Text>
            </View>
          )}
        </View>

        <View style={styles.cardBody}>
          <View style={styles.headerRow}>
            <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
          </View>

          {item.avg_rating > 0 && (
            <View style={styles.ratingRow}>
              <StarRating rating={item.avg_rating} size={12} />
              <Text style={styles.ratingScore}>{item.avg_rating.toFixed(1)}</Text>
              {item.rating_count > 0 && (
                <Text style={styles.ratingCount}>({item.rating_count})</Text>
              )}
            </View>
          )}

          <Text style={styles.itemDesc} numberOfLines={2}>
            {item.description || 'Prepared fresh daily with traditional homestyle recipes.'}
          </Text>

          <View style={styles.cardFooter}>
            <View>
              <Text style={styles.priceLabel}>Price</Text>
              <Text style={styles.price}>₹{item.price}</Text>
            </View>

            {qty === 0 ? (
              <TouchableOpacity
                style={styles.addBtn}
                onPress={(e) => {
                  e?.stopPropagation?.();
                  addItem({ ...item, id: itemId });
                }}
                activeOpacity={0.82}
              >
                <Ionicons name="add" size={16} color="#FFFFFF" />
                <Text style={styles.addBtnText}>ADD</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.qtyCtrl}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={(e) => {
                    e?.stopPropagation?.();
                    removeItem(itemId);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="remove" size={15} color={colors.text} />
                </TouchableOpacity>

                <Text style={styles.qtyNum}>{qty}</Text>

                <TouchableOpacity
                  style={[styles.qtyBtn, styles.qtyBtnAdd]}
                  onPress={(e) => {
                    e?.stopPropagation?.();
                    addItem({ ...item, id: itemId });
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={15} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </GlassCard>
    );
  }

  return (
    <View style={styles.screen}>
      <AmbientGlow />

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
            const hasEmoji = cat.emoji && catId !== 'all';

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
                {hasEmoji ? <Text style={styles.catEmoji}>{cat.emoji}</Text> : null}
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
          <Text style={{ color: colors.textMuted, marginTop: 12, fontSize: 14, ...FONTS.medium }}>
            Loading wholesome menu...
          </Text>
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
              <View style={styles.emptyIconWrap}>
                <Ionicons name="restaurant-outline" size={40} color={colors.textLight} />
              </View>
              <Text style={{ color: colors.text, marginTop: 14, fontSize: 16, ...FONTS.semibold }}>
                No dishes in this category
              </Text>
              <Text style={{ color: colors.textMuted, marginTop: 4, fontSize: 13, textAlign: 'center' }}>
                Try selecting "All" to browse our complete selection.
              </Text>
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

      {/* Floating Glassmorphic Cart Capsule */}
      {itemCount > 0 && (
        <TouchableOpacity
          style={styles.floatingCart}
          onPress={() => navigation.navigate('Cart')}
          activeOpacity={0.92}
        >
          <View style={styles.floatingCartLeft}>
            <View style={styles.cartCountPill}>
              <Ionicons name="bag-handle" size={15} color="#FFFFFF" />
              <Text style={styles.cartBadgeText}>{itemCount}</Text>
            </View>
            <View>
              <Text style={styles.floatingCartItems}>{itemCount} dish{itemCount > 1 ? 'es' : ''} added</Text>
              <Text style={styles.floatingCartTotal}>₹{itemTotal}</Text>
            </View>
          </View>
          <View style={styles.floatingCartRight}>
            <Text style={styles.floatingCartCta}>View Cart</Text>
            <View style={styles.cartArrowWrap}>
              <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
            </View>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  filterBarContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.glass?.borderSubtle || (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
    backgroundColor: isDark ? 'rgba(9,9,11,0.75)' : 'rgba(248,250,248,0.75)',
  },
  filterBarContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  catBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8.5,
    borderRadius: RADIUS.full,
    backgroundColor: colors.glass?.pill || (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.85)'),
    borderWidth: 1,
    borderColor: colors.glass?.pillBorder || 'rgba(255,255,255,0.1)',
  },
  catBtnActive: {
    backgroundColor: colors.glass?.pillActive || (isDark ? 'rgba(245,158,11,0.2)' : 'rgba(22,163,74,0.15)'),
    borderColor: colors.glass?.pillActiveBorder || colors.saffron,
    borderTopColor: colors.saffronLight,
    ...SHADOW.small,
  },
  catEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  catLabel: {
    fontSize: 13,
    ...FONTS.semibold,
    color: colors.textMuted,
  },
  catLabelActive: {
    color: colors.saffron,
    ...FONTS.bold,
  },
  list: {
    padding: 16,
    gap: 16,
    paddingBottom: 90,
  },
  card: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
  },
  cardMedia: {
    width: '100%',
    height: 160,
    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F1F5F9',
    position: 'relative',
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  emojiContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vegOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    borderRadius: 6,
    padding: 4,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  heartOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dishTagBadge: {
    position: 'absolute',
    bottom: 10,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  dishTagText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    ...FONTS.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  cardBody: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 16.5,
    ...FONTS.bold,
    color: colors.text,
    letterSpacing: -0.2,
    flex: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 8,
  },
  ratingScore: {
    fontSize: 11.5,
    ...FONTS.bold,
    color: colors.text,
  },
  ratingCount: {
    fontSize: 11,
    color: colors.textMuted,
  },
  itemDesc: {
    fontSize: 12.5,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: 14,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: 10.5,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  price: {
    fontSize: 18,
    ...FONTS.heavy,
    color: colors.saffron,
    letterSpacing: -0.3,
  },
  addBtn: {
    backgroundColor: colors.saffron,
    borderRadius: RADIUS.full,
    paddingHorizontal: 20,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    ...SHADOW.small,
  },
  addBtnText: {
    color: '#FFFFFF',
    ...FONTS.bold,
    fontSize: 13,
    letterSpacing: 0.5,
  },
  qtyCtrl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass?.card || (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'),
    borderRadius: RADIUS.full,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.glass?.border || 'rgba(255,255,255,0.14)',
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnAdd: {
    backgroundColor: colors.saffron,
  },
  qtyNum: {
    fontSize: 14,
    ...FONTS.bold,
    color: colors.text,
    minWidth: 28,
    textAlign: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.glass?.card || (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
    borderWidth: 1,
    borderColor: colors.glass?.border || 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingCart: {
    position: 'absolute',
    bottom: 22,
    left: 16,
    right: 16,
    backgroundColor: colors.saffron,
    borderRadius: RADIUS.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    ...SHADOW.glassGlow,
  },
  floatingCartLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cartCountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.22)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  cartBadgeText: {
    ...FONTS.bold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  floatingCartItems: {
    ...FONTS.medium,
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.9)',
  },
  floatingCartTotal: {
    ...FONTS.bold,
    fontSize: 16.5,
    color: '#FFFFFF',
  },
  floatingCartRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  floatingCartCta: {
    ...FONTS.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  cartArrowWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
