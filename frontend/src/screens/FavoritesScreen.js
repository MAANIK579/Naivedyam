// src/screens/FavoritesScreen.js — Enhanced with theme support
import React from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { FONTS, RADIUS, SHADOW } from '../theme';
import { VegBadge } from '../components';
import HeartButton from '../components/HeartButton';
import EmptyState from '../components/EmptyState';
import { useFavorites } from '../context/FavoritesContext';
import { useCart } from '../context/CartContext';

export default function FavoritesScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { favorites, loading } = useFavorites();
  const { addItem, getQty, removeItem } = useCart();

  const styles = createStyles(colors, isDark);

  function renderItem({ item }) {
    const id  = item._id || item.id;
    const qty = getQty(id);

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <Text style={styles.emoji}>{item.emoji || '🍽️'}</Text>
          <View style={styles.info}>
            <View style={styles.nameRow}>
              <VegBadge isVeg={item.is_veg} />
              <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
              <HeartButton itemId={id} style={styles.heart} />
            </View>
            {!!item.description && (
              <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
            )}
            <Text style={styles.price}>₹{item.price}</Text>
          </View>
        </View>

        <View style={styles.cartRow}>
          {qty === 0 ? (
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => addItem({ ...item, id })}
              activeOpacity={0.8}
            >
              <Ionicons name="cart-outline" size={14} color={colors.white} style={{ marginRight: 6 }} />
              <Text style={styles.addBtnText}>Add to Cart</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.qtyRow}>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => removeItem(id)} activeOpacity={0.8}>
                <Ionicons name="remove" size={16} color={colors.white} />
              </TouchableOpacity>
              <Text style={styles.qtyNum}>{qty}</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => addItem({ ...item, id })} activeOpacity={0.8}>
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
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.saffron} />
        </View>
      ) : favorites.length === 0 ? (
        <EmptyState
          iconName="heart-outline"
          title="No favourites yet"
          subtitle="Browse our menu and tap the heart icon to save your favourite dishes"
          action={{ label: 'Explore Menu', onPress: () => navigation.navigate('Menu') }}
        />
      ) : (
        <FlatList
          data={favorites}
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
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16 },
  card: {
    backgroundColor: colors.cardBg, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: colors.border,
    padding: 14, marginBottom: 12, ...SHADOW.small,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  emoji: { fontSize: 40, marginRight: 12 },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  name: { ...FONTS.semibold, fontSize: 15, color: colors.text, flex: 1 },
  heart: { padding: 2 },
  desc: { ...FONTS.regular, fontSize: 12, color: colors.textMuted, lineHeight: 17, marginBottom: 6 },
  price: { ...FONTS.bold, fontSize: 15, color: colors.saffronDeep },
  cartRow: { marginTop: 12, alignItems: 'flex-end' },
  addBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.saffron, borderRadius: RADIUS.md,
    paddingHorizontal: 16, paddingVertical: 9,
  },
  addBtnText: { ...FONTS.bold, fontSize: 13, color: colors.white },
  qtyRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.saffron, borderRadius: RADIUS.md,
  },
  qtyBtn: { paddingHorizontal: 14, paddingVertical: 9 },
  qtyNum: { ...FONTS.bold, fontSize: 14, color: colors.white, minWidth: 24, textAlign: 'center' },
});
