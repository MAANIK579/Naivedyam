// src/screens/ProfileScreen.js — Clean, Modern Profile & Account Screen
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Alert, RefreshControl, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../api/client';
import { Button, Input } from '../components';
import { FONTS, RADIUS, SHADOW } from '../theme';

export default function ProfileScreen({ navigation }) {
  const { user, logout, updateProfile } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const [orders,     setOrders]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editing,    setEditing]    = useState(false);
  const [name,       setName]       = useState(user?.name || '');
  const [saving,     setSaving]     = useState(false);

  const loadOrders = useCallback(async () => {
    try {
      const d = await api.getMyOrders();
      setOrders(d.orders || []);
    } catch (_) {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  function onRefresh() {
    setRefreshing(true);
    loadOrders();
  }

  async function handleSave() {
    try {
      setSaving(true);
      await updateProfile({ name });
      setEditing(false);
      Alert.alert('Saved', 'Profile updated successfully!');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    Alert.alert('Log Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  }

  const initials = (user?.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const QUICK_LINKS = [
    { icon: 'receipt-outline',       label: 'Order History',   screen: 'OrderHistory', color: colors.saffron },
    { icon: 'location-outline',      label: 'Saved Addresses', screen: 'Addresses',    color: colors.saffron },
    { icon: 'heart-outline',         label: 'My Favorites',    screen: 'Favorites',    color: colors.error },
    { icon: 'notifications-outline', label: 'Notifications',   screen: 'Notifications', color: colors.turmeric },
    { icon: 'star-outline',          label: 'My Reviews',      screen: 'MyReviews',    color: colors.turmeric },
    { icon: 'help-circle-outline',   label: 'Help & Support',  screen: 'Help',         color: colors.green },
  ];

  const styles = createStyles(colors, isDark);

  return (
    <View style={styles.container}>
      {/* Top Header Bar */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MainTabs')}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.topHeaderTitle}>My Account</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.saffron]} tintColor={colors.saffron} />
        }
      >
        {/* Profile Card Header */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{user?.name}</Text>
            <View style={styles.phoneRow}>
              <Ionicons name="call-outline" size={13} color={colors.textMuted} />
              <Text style={styles.userPhone}>{user?.phone}</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => setEditing(e => !e)}
            style={styles.editBtn}
            activeOpacity={0.8}
          >
            <Ionicons name={editing ? 'close' : 'create-outline'} size={15} color={colors.text} />
            <Text style={styles.editBtnText}>{editing ? 'Cancel' : 'Edit'}</Text>
          </TouchableOpacity>
        </View>

        {editing && (
          <View style={styles.editBox}>
            <Text style={styles.sectionHeader}>Edit Profile</Text>
            <Input
              label="Full Name"
              leftIcon="person-outline"
              value={name}
              onChangeText={setName}
              placeholder="Your name"
            />
            <Button
              title="Save Changes"
              icon="checkmark-outline"
              onPress={handleSave}
              loading={saving}
            />
          </View>
        )}

        {/* Order Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{orders.length}</Text>
            <Text style={styles.statLabel}>Total Orders</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: colors.green }]}>
              {orders.filter(o => o.status === 'delivered').length}
            </Text>
            <Text style={styles.statLabel}>Delivered</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: colors.saffron }]}>
              {orders.filter(o => ['placed', 'confirmed', 'preparing', 'out_for_delivery'].includes(o.status)).length}
            </Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
        </View>

        {/* Theme Mode Toggle */}
        <View style={styles.card}>
          <View style={styles.themeRow}>
            <View style={styles.themeLeft}>
              <Ionicons name={isDark ? 'moon' : 'sunny'} size={20} color={colors.saffron} />
              <View>
                <Text style={styles.themeTitle}>Dark Mode</Text>
                <Text style={styles.themeSub}>
                  {isDark ? 'Switch to light theme' : 'Switch to dark theme'}
                </Text>
              </View>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.saffronPale }}
              thumbColor={isDark ? colors.saffron : colors.saffronLight}
            />
          </View>
        </View>

        {/* Quick Menu Links */}
        <View style={styles.menuCard}>
          {QUICK_LINKS.map(({ icon, label, screen, color }, idx) => {
            const isLast = idx === QUICK_LINKS.length - 1;
            return (
              <TouchableOpacity
                key={screen}
                style={[styles.menuItem, !isLast && styles.menuItemBorder]}
                onPress={() => navigation.navigate(screen)}
                activeOpacity={0.75}
              >
                <View style={[styles.menuIconWrap, { backgroundColor: isDark ? '#27272A' : '#F1F5F9' }]}>
                  <Ionicons name={icon} size={18} color={color} />
                </View>
                <Text style={styles.menuLabel}>{label}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.88}>
          <Ionicons name="log-out-outline" size={18} color={colors.error} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 46,
    paddingBottom: 14,
    backgroundColor: colors.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream,
  },
  topHeaderTitle: {
    fontSize: 18,
    ...FONTS.heavy,
    color: colors.text,
  },
  screen: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingTop: 16,
    paddingBottom: 40,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderRadius: RADIUS.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 14,
    ...SHADOW.small,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.saffron,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    ...FONTS.heavy,
  },
  userName: {
    fontSize: 17,
    ...FONTS.heavy,
    color: colors.text,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  userPhone: {
    fontSize: 13,
    color: colors.textMuted,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.creamDark,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  editBtnText: {
    fontSize: 12,
    ...FONTS.semibold,
    color: colors.text,
  },
  editBox: {
    backgroundColor: colors.cardBg,
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeader: {
    fontSize: 15,
    ...FONTS.heavy,
    color: colors.text,
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.cardBg,
    borderRadius: RADIUS.lg,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...SHADOW.small,
  },
  statNum: {
    fontSize: 20,
    ...FONTS.heavy,
    color: colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    ...SHADOW.small,
  },
  themeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  themeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  themeTitle: {
    fontSize: 14.5,
    ...FONTS.bold,
    color: colors.text,
  },
  themeSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },
  menuCard: {
    backgroundColor: colors.cardBg,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...SHADOW.small,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuLabel: {
    flex: 1,
    fontSize: 14,
    ...FONTS.semibold,
    color: colors.text,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardBg,
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: isDark ? '#7F1D1D' : '#FCA5A5',
    gap: 8,
  },
  logoutText: {
    fontSize: 14,
    ...FONTS.bold,
    color: colors.error,
  },
});
