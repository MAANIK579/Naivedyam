// src/screens/AddressesScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, Alert,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { FONTS, RADIUS, SHADOW } from '../theme';
import AddressCard from '../components/AddressCard';
import EmptyState from '../components/EmptyState';
import { api } from '../api/client';

export default function AddressesScreen({ navigation, route }) {
  const selectMode = route.params?.selectMode ?? false;
  const onSelect   = route.params?.onSelect;
  const { colors } = useTheme();

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState(null);

  const loadAddresses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getAddresses();
      const list = data.addresses || data || [];
      setAddresses(list);
      const def = list.find(a => a.is_default);
      if (def) setSelected(def._id || def.id);
    } catch (err) {
      console.warn('Failed to load addresses:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  // Refresh when coming back from AddAddressScreen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadAddresses);
    return unsubscribe;
  }, [navigation, loadAddresses]);

  async function handleDelete(address) {
    const id = address._id || address.id;
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteAddress(id);
              setAddresses(prev => prev.filter(a => (a._id || a.id) !== id));
            } catch (err) {
              Alert.alert('Error', err.message || 'Could not delete address');
            }
          },
        },
      ]
    );
  }

  function handleSelect(address) {
    const id = address._id || address.id;
    setSelected(id);
    if (selectMode && onSelect) {
      onSelect(address);
      navigation.goBack();
    }
  }

  const styles = createStyles(colors);

  function renderItem({ item }) {
    const id = item._id || item.id;
    return (
      <View style={styles.itemWrap}>
        <View style={styles.cardContainer}>
          <AddressCard
            address={item}
            onPress={() => handleSelect(item)}
            selected={selected === id}
          />
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => navigation.navigate('AddAddress', { address: item })}
            activeOpacity={0.8}
          >
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDelete(item)}
            activeOpacity={0.8}
          >
            <Text style={styles.deleteBtnText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {selectMode ? 'Select Address' : 'Saved Addresses'}
        </Text>
        <View style={{ width: 32 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.saffron} />
        </View>
      ) : addresses.length === 0 ? (
        <EmptyState
          emoji="📍"
          title="No saved addresses"
          subtitle="Add your delivery address to get started"
          action={{
            label: '+ Add New Address',
            onPress: () => navigation.navigate('AddAddress', {}),
          }}
        />
      ) : (
        <>
          <FlatList
            data={addresses}
            keyExtractor={item => item._id || item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />

          {/* FAB */}
          <TouchableOpacity
            style={styles.fab}
            onPress={() => navigation.navigate('AddAddress', {})}
            activeOpacity={0.85}
          >
            <Text style={styles.fabText}>+ Add New Address</Text>
          </TouchableOpacity>
        </>
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    padding: 4,
  },
  backIcon: {
    fontSize: 22,
    color: colors.saffron,
    ...FONTS.bold,
  },
  headerTitle: {
    ...FONTS.bold,
    fontSize: 20,
    color: colors.text,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  itemWrap: {
    marginBottom: 4,
  },
  cardContainer: {
    marginBottom: 0,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  editBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: colors.saffron,
    backgroundColor: 'transparent',
  },
  editBtnText: {
    ...FONTS.medium,
    fontSize: 13,
    color: colors.saffron,
  },
  deleteBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: colors.error,
    backgroundColor: 'transparent',
  },
  deleteBtnText: {
    ...FONTS.medium,
    fontSize: 13,
    color: colors.error,
  },
  fab: {
    position: 'absolute',
    bottom: 28,
    left: 24,
    right: 24,
    backgroundColor: colors.saffron,
    borderRadius: RADIUS.lg,
    paddingVertical: 16,
    alignItems: 'center',
    ...SHADOW.medium,
  },
  fabText: {
    ...FONTS.bold,
    fontSize: 15,
    color: colors.white,
    letterSpacing: 0.3,
  },
});
