// src/screens/SearchScreen.js — Glassmorphic Search & Filter Experience
import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, ScrollView, Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { FONTS, RADIUS, SHADOW } from '../theme';
import { VegBadge, GlassCard, AmbientGlow } from '../components';
import SearchBar from '../components/SearchBar';
import EmptyState from '../components/EmptyState';
import { api } from '../api/client';
import { useCart } from '../context/CartContext';

const RECENT_SEARCHES_KEY = '@navedyam_recent_searches';
const MAX_RECENT_SEARCHES = 8;

const POPULAR_SEARCHES = ['Thali', 'Dal Makhani', 'Paneer', 'Roti', 'Biryani', 'Lassi'];

const PRICE_FILTERS = [
  { label: 'Under ₹100', min: 0,   max: 100 },
  { label: '₹100-200',   min: 100, max: 200 },
  { label: '₹200+',      min: 200, max: null },
];

const SORT_OPTIONS = [
  { label: 'Relevance',   value: 'relevance',  icon: 'sparkles-outline' },
  { label: 'Price: Low',  value: 'price_asc',  icon: 'arrow-down-outline' },
  { label: 'Price: High', value: 'price_desc', icon: 'arrow-up-outline' },
  { label: 'Rating',      value: 'rating',     icon: 'star-outline' },
];

export default function SearchScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const [query, setQuery]         = useState('');
  const [vegOnly, setVegOnly]     = useState(false);
  const [priceFilter, setPriceFilter] = useState(null);
  const [sort, setSort]           = useState('relevance');
  const [showSort, setShowSort]   = useState(false);
  const [results, setResults]     = useState([]);
  const [loading, setLoading]     = useState(false);
  const [searched, setSearched]   = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);

  const { addItem, getQty, removeItem } = useCart();

  useEffect(() => { loadRecentSearches(); }, []);

  async function loadRecentSearches() {
    try {
      const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch (_) {}
  }

  async function saveRecentSearch(searchTerm) {
    if (!searchTerm.trim()) return;
    try {
      const updated = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, MAX_RECENT_SEARCHES);
      setRecentSearches(updated);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (_) {}
  }

  async function clearRecentSearches() {
    setRecentSearches([]);
    await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
  }

  useEffect(() => {
    const timer = setTimeout(() => { runSearch(); }, 400);
    return () => clearTimeout(timer);
  }, [query, vegOnly, priceFilter, sort]);

  async function runSearch() {
    if (!query.trim() && !vegOnly && !priceFilter) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    if (query.trim()) saveRecentSearch(query.trim());

    try {
      const params = { search: query.trim() };
      if (vegOnly) params.veg = true;
      if (priceFilter) {
        params.minPrice = priceFilter.min;
        if (priceFilter.max !== null) params.maxPrice = priceFilter.max;
      }
      if (sort !== 'relevance') params.sort = sort;

      const data = await api.getMenuItems(params);
      setResults(data.items || []);
    } catch (_) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function handleRecentSearch(term) { setQuery(term); }

  function togglePriceFilter(filter) {
    setPriceFilter(prev => (prev?.label === filter.label ? null : filter));
  }

  const styles = createStyles(colors, isDark);

  function renderItem({ item }) {
    const itemId = item._id || item.id;
    const qty = getQty(itemId);

    return (
      <GlassCard style={styles.itemCard} padding={12}>
        <View style={styles.itemLeft}>
          <View style={styles.thumbContainer}>
            {item.image_url ? (
              <Image
                source={{ uri: item.image_url }}
                style={styles.itemImage}
                resizeMode="cover"
              />
            ) : (
              <Text style={{ fontSize: 26 }}>{item.emoji || '🍽️'}</Text>
            )}
          </View>

          <View style={styles.itemInfo}>
            <View style={styles.itemNameRow}>
              <VegBadge isVeg={item.is_veg === true || item.is_veg === 1} />
              <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
            </View>

            {item.description ? (
              <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>
            ) : null}

            <Text style={styles.itemPrice}>₹{item.price}</Text>
          </View>
        </View>

        <View style={styles.itemRight}>
          {qty === 0 ? (
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => addItem({ ...item, id: itemId })}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={14} color="#FFFFFF" />
              <Text style={styles.addBtnText}>ADD</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.qtyRow}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => removeItem(itemId)}
                activeOpacity={0.7}
              >
                <Ionicons name="remove" size={14} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.qtyNum}>{qty}</Text>
              <TouchableOpacity
                style={[styles.qtyBtn, styles.qtyBtnAdd]}
                onPress={() => addItem({ ...item, id: itemId })}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </GlassCard>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <AmbientGlow />

      {/* Header with Back & SearchBar */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.searchBarWrap}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder="Search thali, roti, dal, sweets..."
            onSubmit={runSearch}
            style={styles.searchBar}
          />
        </View>
      </View>

      {/* Horizontal Filter Chips */}
      <View style={styles.filterOuter}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          <TouchableOpacity
            style={[styles.chip, vegOnly && styles.chipActive]}
            onPress={() => setVegOnly(v => !v)}
            activeOpacity={0.8}
          >
            <Ionicons name="leaf" size={13} color={vegOnly ? '#FFFFFF' : colors.green} style={{ marginRight: 4 }} />
            <Text style={[styles.chipText, vegOnly && styles.chipTextActive]}>Pure Veg</Text>
          </TouchableOpacity>

          {PRICE_FILTERS.map(f => (
            <TouchableOpacity
              key={f.label}
              style={[styles.chip, priceFilter?.label === f.label && styles.chipActive]}
              onPress={() => togglePriceFilter(f)}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, priceFilter?.label === f.label && styles.chipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={[styles.chip, showSort && styles.chipActive]}
            onPress={() => setShowSort(v => !v)}
            activeOpacity={0.8}
          >
            <Ionicons name="swap-vertical" size={13} color={showSort ? '#FFFFFF' : colors.textLight} style={{ marginRight: 4 }} />
            <Text style={[styles.chipText, showSort && styles.chipTextActive]}>
              {SORT_OPTIONS.find(s => s.value === sort)?.label}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {showSort && (
          <GlassCard elevated style={styles.sortMenu} padding={6}>
            {SORT_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.sortOption, sort === opt.value && styles.sortOptionActive]}
                onPress={() => { setSort(opt.value); setShowSort(false); }}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={opt.icon}
                  size={15}
                  color={sort === opt.value ? colors.saffron : colors.textMuted}
                  style={{ marginRight: 8 }}
                />
                <Text style={[styles.sortOptionText, sort === opt.value && styles.sortOptionTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </GlassCard>
        )}
      </View>

      {/* Main Content Area */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.saffron} />
          <Text style={{ color: colors.textMuted, marginTop: 12, fontSize: 14 }}>Searching dishes...</Text>
        </View>
      ) : searched && results.length === 0 ? (
        <EmptyState
          icon="search-outline"
          title="No dishes found"
          subtitle={`No matching items for "${query}". Try searching for thali, paneer, or dal.`}
        />
      ) : !searched ? (
        <ScrollView style={styles.suggestionsContainer} showsVerticalScrollIndicator={false}>
          {recentSearches.length > 0 && (
            <View style={styles.suggestionSection}>
              <View style={styles.suggestionHeader}>
                <Text style={styles.suggestionTitle}>Recent Searches</Text>
                <TouchableOpacity onPress={clearRecentSearches}>
                  <Text style={styles.clearBtn}>Clear</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.suggestionTags}>
                {recentSearches.map((term, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.suggestionTag}
                    onPress={() => handleRecentSearch(term)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="time-outline" size={13} color={colors.textLight} />
                    <Text style={styles.suggestionTagText}>{term}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={styles.suggestionSection}>
            <Text style={styles.suggestionTitle}>Popular Searches</Text>
            <View style={styles.suggestionTags}>
              {POPULAR_SEARCHES.map((term, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.suggestionTag, styles.popularTag]}
                  onPress={() => handleRecentSearch(term)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="trending-up" size={13} color={colors.saffron} />
                  <Text style={[styles.suggestionTagText, styles.popularTagText]}>{term}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={results}
          keyExtractor={item => item._id || item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.glass?.pill || (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'),
    borderWidth: 1,
    borderColor: colors.glass?.pillBorder || 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBarWrap: {
    flex: 1,
  },
  searchBar: {
    marginBottom: 0,
  },
  filterOuter: {
    paddingVertical: 8,
    zIndex: 10,
  },
  filterRow: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6.5,
    borderRadius: RADIUS.full,
    backgroundColor: colors.glass?.pill || (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.85)'),
    borderWidth: 1,
    borderColor: colors.glass?.pillBorder || 'rgba(255,255,255,0.1)',
  },
  chipActive: {
    backgroundColor: colors.glass?.pillActive || (isDark ? 'rgba(245,158,11,0.2)' : 'rgba(22,163,74,0.16)'),
    borderColor: colors.glass?.pillActiveBorder || colors.saffron,
  },
  chipText: {
    ...FONTS.semibold,
    fontSize: 12.5,
    color: colors.textMuted,
  },
  chipTextActive: {
    color: colors.saffron,
    ...FONTS.bold,
  },
  sortMenu: {
    position: 'absolute',
    top: 48,
    right: 16,
    borderRadius: RADIUS.lg,
    zIndex: 20,
    minWidth: 160,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
  },
  sortOptionActive: {
    backgroundColor: isDark ? 'rgba(245,158,11,0.15)' : 'rgba(22,163,74,0.1)',
  },
  sortOptionText: {
    ...FONTS.regular,
    fontSize: 13,
    color: colors.text,
  },
  sortOptionTextActive: {
    ...FONTS.bold,
    color: colors.saffron,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  list: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.lg,
  },
  itemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbContainer: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: 12,
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemInfo: {
    flex: 1,
  },
  itemNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  itemName: {
    ...FONTS.semibold,
    fontSize: 14.5,
    color: colors.text,
    flex: 1,
  },
  itemDesc: {
    fontSize: 11.5,
    color: colors.textMuted,
    lineHeight: 16,
    marginBottom: 4,
  },
  itemPrice: {
    ...FONTS.heavy,
    fontSize: 15,
    color: colors.saffron,
  },
  itemRight: {
    marginLeft: 10,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.saffron,
    borderRadius: RADIUS.full,
    paddingHorizontal: 14,
    paddingVertical: 7,
    ...SHADOW.small,
  },
  addBtnText: {
    ...FONTS.bold,
    fontSize: 12,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass?.card || (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'),
    borderRadius: RADIUS.full,
    padding: 2.5,
    borderWidth: 1,
    borderColor: colors.glass?.border || 'rgba(255,255,255,0.12)',
  },
  qtyBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnAdd: {
    backgroundColor: colors.saffron,
  },
  qtyNum: {
    ...FONTS.bold,
    fontSize: 13.5,
    color: colors.text,
    minWidth: 22,
    textAlign: 'center',
  },
  suggestionsContainer: {
    flex: 1,
    padding: 16,
  },
  suggestionSection: {
    marginBottom: 24,
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  suggestionTitle: {
    ...FONTS.bold,
    fontSize: 15,
    color: colors.text,
    letterSpacing: -0.2,
  },
  clearBtn: {
    ...FONTS.semibold,
    fontSize: 12.5,
    color: colors.saffron,
  },
  suggestionTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.glass?.pill || (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
    borderRadius: RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: colors.glass?.pillBorder || 'rgba(255,255,255,0.1)',
  },
  suggestionTagText: {
    ...FONTS.medium,
    fontSize: 12.5,
    color: colors.textMuted,
  },
  popularTag: {
    borderColor: isDark ? 'rgba(245,158,11,0.3)' : 'rgba(22,163,74,0.25)',
    backgroundColor: isDark ? 'rgba(245,158,11,0.12)' : 'rgba(22,163,74,0.1)',
  },
  popularTagText: {
    color: colors.saffron,
    ...FONTS.semibold,
  },
});
