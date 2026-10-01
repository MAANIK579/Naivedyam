// src/screens/SearchScreen.js — Enhanced with theme support
import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, ScrollView,
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
    } catch (err) {}
  }

  async function saveRecentSearch(searchTerm) {
    if (!searchTerm.trim()) return;
    try {
      const updated = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, MAX_RECENT_SEARCHES);
      setRecentSearches(updated);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (err) {}
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
    } catch (err) {
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
    const qty = getQty(item._id || item.id);
    return (
      <View style={styles.itemCard}>
        <View style={styles.itemLeft}>
          <Text style={styles.itemEmoji}>{item.emoji || '🍽️'}</Text>
          <View style={styles.itemInfo}>
            <View style={styles.itemNameRow}>
              <VegBadge isVeg={item.is_veg} />
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
              onPress={() => addItem({ ...item, id: item._id || item.id })}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={14} color={colors.white} />
              <Text style={styles.addBtnText}>ADD</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.qtyRow}>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => removeItem(item._id || item.id)}>
                <Ionicons name="remove" size={16} color={colors.white} />
              </TouchableOpacity>
              <Text style={styles.qtyNum}>{qty}</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => addItem({ ...item, id: item._id || item.id })}>
                <Ionicons name="add" size={16} color={colors.white} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.saffron} />
        </TouchableOpacity>
        <View style={styles.searchBarWrap}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder="Search dishes, categories..."
            onSubmit={runSearch}
            style={styles.searchBar}
          />
        </View>
      </View>

      <View style={styles.filterOuter}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          <TouchableOpacity
            style={[styles.chip, vegOnly && styles.chipActive]}
            onPress={() => setVegOnly(v => !v)}
            activeOpacity={0.8}
          >
            <Ionicons name="leaf-outline" size={14} color={vegOnly ? colors.white : colors.green} style={{ marginRight: 4 }} />
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
            <Ionicons name="swap-vertical-outline" size={14} color={showSort ? colors.white : colors.text} style={{ marginRight: 4 }} />
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
                <Ionicons name={opt.icon} size={16} color={sort === opt.value ? colors.saffron : colors.textMuted} style={{ marginRight: 8 }} />
                <Text style={[styles.sortOptionText, sort === opt.value && styles.sortOptionTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.saffron} />
        </View>
      ) : searched && results.length === 0 ? (
        <EmptyState
          iconName="search-outline"
          title="No results found"
          subtitle="Try a different search term or adjust your filters"
        />
      ) : !searched ? (
        <ScrollView style={styles.suggestionsContainer} showsVerticalScrollIndicator={false}>
          {recentSearches.length > 0 && (
            <View style={styles.suggestionSection}>
              <View style={styles.suggestionHeader}>
                <Text style={styles.suggestionTitle}>Recent Searches</Text>
                <TouchableOpacity onPress={clearRecentSearches}>
                  <Text style={styles.clearBtn}>Clear all</Text>
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
                    <Ionicons name="time-outline" size={14} color={colors.textMuted} />
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
                  <Ionicons name="trending-up-outline" size={14} color={colors.saffron} />
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
  safeArea: { flex: 1, backgroundColor: colors.cream },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: colors.cardBg, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: { marginRight: 10, padding: 4 },
  searchBarWrap: { flex: 1 },
  searchBar: { marginBottom: 0 },
  filterOuter: {
    backgroundColor: colors.cardBg, borderBottomWidth: 1, borderBottomColor: colors.border, zIndex: 10,
  },
  filterRow: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, flexDirection: 'row' },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: colors.creamDark, marginRight: 6,
  },
  chipActive: { backgroundColor: colors.saffron, borderColor: colors.saffron },
  chipText: { ...FONTS.medium, fontSize: 13, color: colors.text },
  chipTextActive: { color: colors.white },
  sortMenu: {
    position: 'absolute', top: 50, right: 16,
    backgroundColor: colors.cardBg, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: colors.border,
    ...SHADOW.medium, zIndex: 20, minWidth: 160,
  },
  sortOption: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  sortOptionActive: { backgroundColor: colors.saffronPale },
  sortOptionText: { ...FONTS.regular, fontSize: 14, color: colors.text },
  sortOptionTextActive: { ...FONTS.semibold, color: colors.saffron },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16 },
  itemCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.cardBg, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: colors.border,
    padding: 12, marginBottom: 10, ...SHADOW.small,
  },
  itemLeft: { flex: 1, flexDirection: 'row', alignItems: 'flex-start' },
  itemEmoji: { fontSize: 32, marginRight: 12 },
  itemInfo: { flex: 1 },
  itemNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  itemName: { ...FONTS.semibold, fontSize: 15, color: colors.text, flex: 1 },
  itemDesc: { ...FONTS.regular, fontSize: 12, color: colors.textMuted, lineHeight: 17, marginBottom: 4 },
  itemPrice: { ...FONTS.bold, fontSize: 15, color: colors.saffronDeep },
  itemRight: { marginLeft: 8, alignItems: 'center' },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.saffron, borderRadius: RADIUS.md,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  addBtnText: { ...FONTS.bold, fontSize: 12, color: colors.white },
  qtyRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.saffron, borderRadius: RADIUS.md },
  qtyBtn: { paddingHorizontal: 10, paddingVertical: 8 },
  qtyNum: { ...FONTS.bold, fontSize: 14, color: colors.white, minWidth: 20, textAlign: 'center' },
  suggestionsContainer: { flex: 1, padding: 16 },
  suggestionSection: { marginBottom: 24 },
  suggestionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  suggestionTitle: { ...FONTS.bold, fontSize: 16, color: colors.text },
  clearBtn: { ...FONTS.medium, fontSize: 13, color: colors.saffron },
  suggestionTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  suggestionTag: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.cardBg, borderRadius: RADIUS.full,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: colors.border,
  },
  suggestionTagText: { ...FONTS.medium, fontSize: 13, color: colors.textMuted },
  popularTag: { borderColor: colors.saffron + '40', backgroundColor: colors.saffronPale },
  popularTagText: { color: colors.saffron },
});
