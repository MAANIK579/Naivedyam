// src/screens/SearchScreen.js — Clean, Fast Search & Filter Experience
import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, ScrollView, Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { FONTS, RADIUS, SHADOW } from '../theme';
import { VegBadge } from '../components';
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
    const timer = setTimeout(() => { runSearch(); }, 350);
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
      <View style={styles.dishCard}>
        <View style={styles.dishMedia}>
          {item.image_url ? (
            <Image source={{ uri: item.image_url }} style={styles.dishThumb} resizeMode="cover" />
          ) : (
            <Text style={{ fontSize: 28 }}>{item.emoji || '🍽️'}</Text>
          )}
        </View>

        <View style={styles.dishInfo}>
          <View style={styles.dishTitleRow}>
            <VegBadge isVeg={item.is_veg === true || item.is_veg === 1} />
            <Text style={styles.dishName} numberOfLines={1}>{item.name}</Text>
          </View>

          {item.description ? (
            <Text style={styles.dishDesc} numberOfLines={1}>{item.description}</Text>
          ) : null}

          <Text style={styles.dishPrice}>₹{item.price}</Text>
        </View>

        <View style={styles.dishAction}>
          {qty === 0 ? (
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => addItem({ ...item, id: itemId })}
              activeOpacity={0.8}
            >
              <Text style={styles.addBtnText}>ADD</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.qtyCtrl}>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => removeItem(itemId)}>
                <Ionicons name="remove" size={14} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.qtyNum}>{qty}</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => addItem({ ...item, id: itemId })}>
                <Ionicons name="add" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
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
            placeholder="Search dishes, thalis, breads..."
            onSubmit={runSearch}
            style={styles.searchBar}
          />
        </View>
      </View>

      {/* Filter Row */}
      <View style={styles.filterOuter}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          <TouchableOpacity
            style={[styles.chip, vegOnly && styles.chipActive]}
            onPress={() => setVegOnly(v => !v)}
            activeOpacity={0.8}
          >
            <Ionicons name="leaf" size={13} color={vegOnly ? '#FFFFFF' : '#16A34A'} style={{ marginRight: 4 }} />
            <Text style={[styles.chipText, vegOnly && styles.chipTextActive]}>Veg Only</Text>
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
            <Ionicons name="swap-vertical" size={13} color={showSort ? '#FFFFFF' : colors.textMuted} style={{ marginRight: 4 }} />
            <Text style={[styles.chipText, showSort && styles.chipTextActive]}>
              {SORT_OPTIONS.find(s => s.value === sort)?.label}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {showSort && (
          <View style={styles.sortMenu}>
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
          </View>
        )}
      </View>

      {/* Results Content */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.saffron} />
          <Text style={{ color: colors.textMuted, marginTop: 12, fontSize: 14 }}>Searching dishes...</Text>
        </View>
      ) : searched && results.length === 0 ? (
        <EmptyState
          icon="search-outline"
          title="No results found"
          subtitle={`No dishes found for "${query}". Try searching for Paneer or Thali.`}
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
          ItemSeparatorComponent={() => <View style={styles.separator} />}
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
    backgroundColor: colors.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 10,
  },
  backBtn: {
    padding: 6,
  },
  searchBarWrap: {
    flex: 1,
  },
  searchBar: {
    marginBottom: 0,
  },
  filterOuter: {
    backgroundColor: colors.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: colors.creamDark,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.saffron,
    borderColor: colors.saffron,
  },
  chipText: {
    fontSize: 12.5,
    ...FONTS.semibold,
    color: colors.textMuted,
  },
  chipTextActive: {
    color: '#FFFFFF',
    ...FONTS.bold,
  },
  sortMenu: {
    position: 'absolute',
    top: 48,
    right: 16,
    backgroundColor: colors.cardBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...SHADOW.medium,
    zIndex: 20,
    minWidth: 160,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  sortOptionActive: {
    backgroundColor: colors.saffronPale,
  },
  sortOptionText: {
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
    paddingBottom: 40,
  },
  separator: {
    height: 10,
  },
  dishCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderRadius: RADIUS.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    ...SHADOW.small,
  },
  dishMedia: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: colors.creamDark,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  dishThumb: {
    width: '100%',
    height: '100%',
  },
  dishInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  dishTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  dishName: {
    fontSize: 14.5,
    ...FONTS.bold,
    color: colors.text,
    flex: 1,
  },
  dishDesc: {
    fontSize: 11.5,
    color: colors.textMuted,
    marginBottom: 4,
  },
  dishPrice: {
    fontSize: 15,
    ...FONTS.heavy,
    color: colors.text,
  },
  dishAction: {
    alignItems: 'center',
  },
  addBtn: {
    backgroundColor: colors.cardBg,
    borderWidth: 1.5,
    borderColor: colors.saffron,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  addBtnText: {
    fontSize: 12,
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
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyNum: {
    fontSize: 13,
    ...FONTS.heavy,
    color: '#FFFFFF',
    minWidth: 20,
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
    backgroundColor: colors.cardBg,
    borderRadius: RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: colors.border,
  },
  suggestionTagText: {
    fontSize: 12.5,
    color: colors.textMuted,
  },
  popularTag: {
    backgroundColor: colors.saffronPale,
    borderColor: colors.saffron + '40',
  },
  popularTagText: {
    color: colors.saffron,
    ...FONTS.semibold,
  },
});
