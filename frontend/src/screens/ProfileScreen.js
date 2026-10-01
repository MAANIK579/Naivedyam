// src/screens/ProfileScreen.js — Glassmorphic Profile & Account Management
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Alert, RefreshControl, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../api/client';
import { Button, Input, GlassCard, AmbientGlow } from '../components';
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
    Alert.alert('Logout', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
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
      <AmbientGlow />

      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.saffron]} tintColor={colors.saffron} />
        }
      >
        {/* Profile Card Hero */}
        <GlassCard elevated style={styles.heroCard} padding={20}>
          <View style={styles.heroRow}>
            <View style={styles.avatarWrap}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>{user?.name}</Text>
              <View style={styles.phoneRow}>
                <Ionicons name="call-outline" size={12} color={colors.textLight} />
                <Text style={styles.userPhone}>{user?.phone}</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => setEditing(e => !e)}
              style={styles.editBtn}
              activeOpacity={0.8}
            >
              <Ionicons name={editing ? 'close' : 'create-outline'} size={15} color={colors.text} />
              <Text style={styles.editBtnTxt}>{editing ? 'Cancel' : 'Edit'}</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        <View style={styles.body}>
          {editing && (
            <GlassCard style={{ marginBottom: 16 }} padding={16}>
              <Text style={styles.sectionTitle}>Edit Profile</Text>
              <Input
                label="Full Name"
                leftIcon="person-outline"
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
              />
              <Button
                title="Save Changes"
                icon="checkmark-outline"
                onPress={handleSave}
                loading={saving}
              />
            </GlassCard>
          )}

          {/* Theme Toggle Glass Card */}
          <GlassCard style={styles.themeToggleCard} padding={14}>
            <View style={styles.themeToggleRow}>
              <View style={[styles.themeIconWrap, { backgroundColor: isDark ? 'rgba(245,158,11,0.18)' : 'rgba(22,163,74,0.12)' }]}>
                <Ionicons name={isDark ? 'moon' : 'sunny'} size={18} color={colors.saffron} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.themeToggleLabel}>Appearance</Text>
                <Text style={styles.themeToggleSub}>
                  {isDark ? 'Dark Obsidian Mode' : 'Light Pearl Mode'}
                </Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.border, true: colors.saffronPale }}
                thumbColor={isDark ? colors.saffron : colors.saffronLight}
              />
            </View>
          </GlassCard>

          {/* Order Stats */}
          <View style={styles.statsRow}>
            {[
              { icon: 'bag-check-outline',       val: orders.length,                                      lbl: 'Orders',    color: colors.saffron },
              { icon: 'checkmark-done-circle-outline', val: orders.filter(o => o.status === 'delivered').length, lbl: 'Delivered', color: colors.green },
              { icon: 'close-circle-outline',     val: orders.filter(o => o.status === 'cancelled').length, lbl: 'Cancelled', color: colors.error },
            ].map(({ icon, val, lbl, color }) => (
              <GlassCard key={lbl} style={styles.statCard} padding={14}>
                <Ionicons name={icon} size={22} color={color} />
                <Text style={styles.statNum}>{val}</Text>
                <Text style={styles.statLbl}>{lbl}</Text>
              </GlassCard>
            ))}
          </View>

          {/* Quick Links Menu */}
          <GlassCard style={styles.quickLinksCard} padding={0}>
            {QUICK_LINKS.map(({ icon, label, screen, color }, idx) => {
              const isLast = idx === QUICK_LINKS.length - 1;
              return (
                <TouchableOpacity
                  key={screen}
                  style={[styles.quickLink, !isLast && styles.quickLinkBorder]}
                  onPress={() => navigation.navigate(screen)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.quickLinkIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)' }]}>
                    <Ionicons name={icon} size={18} color={color} />
                  </View>
                  <Text style={styles.quickLinkLabel}>{label}</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
                </TouchableOpacity>
              );
            })}
          </GlassCard>

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.88}>
            <View style={styles.logoutIconWrap}>
              <Ionicons name="log-out-outline" size={18} color={colors.error} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.logoutTitle}>Sign Out</Text>
              <Text style={styles.logoutSub}>Log out of your account on this device</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  screen: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  heroCard: {
    borderRadius: RADIUS.xl,
    marginBottom: 16,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarWrap: {
    ...SHADOW.small,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.saffron,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    ...FONTS.heavy,
  },
  userName: {
    color: colors.text,
    fontSize: 18,
    ...FONTS.heavy,
    letterSpacing: -0.3,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  userPhone: {
    color: colors.textMuted,
    fontSize: 12.5,
  },
  editBtn: {
    backgroundColor: colors.glass?.pill || (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'),
    borderWidth: 1,
    borderColor: colors.glass?.pillBorder || 'rgba(255,255,255,0.12)',
    borderRadius: RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  editBtnTxt: {
    color: colors.text,
    fontSize: 12,
    ...FONTS.semibold,
  },
  body: {
    gap: 14,
  },
  sectionTitle: {
    fontSize: 16,
    ...FONTS.bold,
    color: colors.text,
    marginBottom: 12,
  },
  themeToggleCard: {
    borderRadius: RADIUS.lg,
  },
  themeToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  themeIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeToggleLabel: {
    fontSize: 14.5,
    ...FONTS.semibold,
    color: colors.text,
  },
  themeToggleSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.lg,
  },
  statNum: {
    fontSize: 18,
    ...FONTS.heavy,
    color: colors.text,
    marginTop: 4,
  },
  statLbl: {
    fontSize: 11,
    color: colors.textMuted,
    ...FONTS.medium,
    marginTop: 1,
  },
  quickLinksCard: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
  },
  quickLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  quickLinkBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.glass?.borderSubtle || (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'),
  },
  quickLinkIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  quickLinkLabel: {
    flex: 1,
    fontSize: 14,
    ...FONTS.semibold,
    color: colors.text,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(239,68,68,0.08)' : 'rgba(254,242,242,0.85)',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(239,68,68,0.25)' : 'rgba(220,38,38,0.18)',
    padding: 14,
    gap: 12,
  },
  logoutIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: isDark ? 'rgba(239,68,68,0.15)' : '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutTitle: {
    fontSize: 14,
    ...FONTS.bold,
    color: colors.error,
  },
  logoutSub: {
    fontSize: 11.5,
    color: colors.textMuted,
    marginTop: 1,
  },
});
