// src/screens/ProfileScreen.js — Enhanced UI with theme toggle
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Alert, RefreshControl, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../api/client';
import { Button, Input, Card } from '../components';
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
      Alert.alert('Saved', 'Profile updated!');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  }

  const initials = (user?.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const QUICK_LINKS = [
    { icon: 'receipt-outline',       label: 'Order History',   screen: 'OrderHistory', color: colors.saffronDeep },
    { icon: 'location-outline',      label: 'Saved Addresses', screen: 'Addresses',    color: colors.saffron },
    { icon: 'heart-outline',         label: 'My Favourites',   screen: 'Favorites',    color: colors.saffronLight },
    { icon: 'notifications-outline', label: 'Notifications',   screen: 'Notifications', color: colors.saffron },
    { icon: 'star-outline',          label: 'My Reviews',      screen: 'MyReviews',    color: colors.turmeric },
    { icon: 'help-circle-outline',   label: 'Help & Support',  screen: 'Help',         color: colors.saffronDeep },
  ];

  const styles = createStyles(colors, isDark);

  return (
    <ScrollView
      style={styles.screen}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.saffron]} tintColor={colors.saffron} />
      }
    >
      {/* Header */}
      <View style={styles.hero}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.userName}>{user?.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
            <Ionicons name="call-outline" size={12} color={colors.textMuted} />
            <Text style={styles.userPhone}>{user?.phone}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => setEditing(e => !e)} style={styles.editBtn}>
          <Ionicons name={editing ? 'close' : 'create-outline'} size={16} color={colors.white} />
          <Text style={styles.editBtnTxt}>{editing ? 'Cancel' : 'Edit'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        {editing && (
          <Card style={{ marginBottom: 20 }}>
            <Text style={styles.sectionTitle}>Edit Profile</Text>
            <Input label="Name" leftIcon="person-outline" value={name} onChangeText={setName} placeholder="Your full name" />
            <Button title="Save Changes" icon="checkmark-outline" onPress={handleSave} loading={saving} />
          </Card>
        )}

        {/* Theme Toggle */}
        <View style={styles.themeToggleCard}>
          <View style={styles.themeToggleRow}>
            <View style={[styles.themeIconWrap, { backgroundColor: colors.saffronPale }]}>
              <Ionicons name={isDark ? 'moon' : 'sunny'} size={20} color={colors.saffron} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.themeToggleLabel}>Dark Mode</Text>
              <Text style={styles.themeToggleSub}>
                {isDark ? 'Switch to light theme' : 'Switch to dark theme'}
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.saffronPale }}
              thumbColor={isDark ? colors.saffron : colors.saffronLight}
            />
          </View>
        </View>

        {/* Quick links */}
        <View style={styles.quickLinks}>
          {QUICK_LINKS.map(({ icon, label, screen, color }) => (
            <TouchableOpacity
              key={screen}
              style={styles.quickLink}
              onPress={() => navigation.navigate(screen)}
            >
              <View style={[styles.quickLinkIcon, { backgroundColor: color + '15' }]}>
                <Ionicons name={icon} size={20} color={color} />
              </View>
              <Text style={styles.quickLinkLabel}>{label}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { icon: 'bag-outline',            val: orders.length, lbl: 'Total Orders', color: colors.saffron },
            { icon: 'checkmark-done-outline',  val: orders.filter(o => o.status === 'delivered').length, lbl: 'Delivered', color: colors.green },
            { icon: 'close-circle-outline',    val: orders.filter(o => o.status === 'cancelled').length, lbl: 'Cancelled', color: colors.error },
          ].map(({ icon, val, lbl, color }) => (
            <View key={lbl} style={styles.statCard}>
              <Ionicons name={icon} size={20} color={color} />
              <Text style={styles.statNum}>{val}</Text>
              <Text style={styles.statLbl}>{lbl}</Text>
            </View>
          ))}
        </View>

        {/* Order History entry */}
        <Card style={styles.historyCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={styles.historyIconWrap}>
              <Ionicons name="time-outline" size={18} color={colors.saffronDeep} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.historyTitle}>View your full order history</Text>
              <Text style={styles.historySub}>Tap to see all your past orders and reorder quickly.</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.historyBtn}
            onPress={() => navigation.navigate('OrderHistory')}
            activeOpacity={0.85}
          >
            <Text style={styles.historyBtnText}>Open Order History</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.white} />
          </TouchableOpacity>
        </Card>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.9}>
          <View style={styles.logoutIconWrap}>
            <Ionicons name="log-out-outline" size={18} color={colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.logoutTitle}>Log out</Text>
            <Text style={styles.logoutSub}>Sign out from this device</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.white} />
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  hero: {
    backgroundColor: colors.brown, padding: 24, paddingTop: 52,
    flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  avatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: colors.saffron, alignItems: 'center', justifyContent: 'center',
    ...SHADOW.medium,
  },
  avatarText: { color: colors.white, fontSize: 22, ...FONTS.bold },
  userName:   { color: colors.white, fontSize: 18, ...FONTS.bold },
  userPhone:  { color: colors.textMuted, fontSize: 13 },
  editBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: RADIUS.md, paddingHorizontal: 12, paddingVertical: 8,
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  editBtnTxt: { color: colors.white, fontSize: 13, ...FONTS.medium },
  body: { padding: 16 },
  themeToggleCard: {
    backgroundColor: colors.cardBg, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: colors.borderLight,
    marginBottom: 16, ...SHADOW.small, padding: 14,
  },
  themeToggleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  themeIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  themeToggleLabel: { fontSize: 15, ...FONTS.medium, color: colors.text },
  themeToggleSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  quickLinks: {
    backgroundColor: colors.cardBg, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: colors.borderLight,
    marginBottom: 16, ...SHADOW.small, overflow: 'hidden',
  },
  quickLink: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  quickLinkIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  quickLinkLabel: { flex: 1, fontSize: 15, ...FONTS.medium, color: colors.text },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1, backgroundColor: colors.cardBg,
    borderRadius: RADIUS.lg, borderWidth: 1, borderColor: colors.borderLight,
    padding: 14, alignItems: 'center', gap: 4, ...SHADOW.small,
  },
  statNum: { fontSize: 20, ...FONTS.bold, color: colors.text },
  statLbl: { fontSize: 11, color: colors.textMuted, textAlign: 'center' },
  sectionTitle: { fontSize: 18, ...FONTS.bold, color: colors.text, marginBottom: 12 },
  historyCard: {
    marginTop: 4,
    padding: 14,
    marginBottom: 18,
  },
  historyIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.saffronPale,
    marginRight: 10,
  },
  historyTitle: { fontSize: 15, ...FONTS.bold, color: colors.text },
  historySub: { fontSize: 12, color: colors.textMuted, marginTop: 3 },
  historyBtn: {
    marginTop: 12,
    backgroundColor: colors.saffronDeep,
    borderRadius: RADIUS.md,
    paddingVertical: 11,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyBtnText: { color: colors.white, ...FONTS.semibold, fontSize: 14 },
  logoutBtn: {
    marginTop: 4,
    backgroundColor: colors.saffronDeep,
    borderRadius: RADIUS.lg,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOW.small,
  },
  logoutIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  logoutTitle: { color: colors.white, ...FONTS.bold, fontSize: 15 },
  logoutSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
});
