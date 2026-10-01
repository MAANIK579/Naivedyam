// src/screens/NotificationsScreen.js — Enhanced with theme support
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { FONTS, RADIUS, SHADOW } from '../theme';
import EmptyState from '../components/EmptyState';
import { api } from '../api/client';
import { useNotifications } from '../context/NotificationContext';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const now  = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60)     return `${diff}s ago`;
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

const ICON_MAP = {
  order:    'bag-outline',
  delivery: 'bicycle-outline',
  promo:    'pricetag-outline',
  default:  'notifications-outline',
};

export default function NotificationsScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const { setUnreadCount }                = useNotifications();

  const loadNotifications = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const data = await api.getNotifications();
      const list = data.notifications || data || [];
      setNotifications(list);
      const unread = list.filter(n => !n.read).length;
      setUnreadCount(unread);
    } catch (err) {
      console.warn('Failed to load notifications:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  function onRefresh() {
    setRefreshing(true);
    loadNotifications(true);
  }

  async function handleMarkRead(id) {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev =>
        prev.map(n => (n._id === id || n.id === id) ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.warn('Failed to mark read:', err);
    }
  }

  async function handleMarkAllRead() {
    try {
      await api.markAllNotificationsRead?.();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      const unread = notifications.filter(n => !n.read);
      await Promise.allSettled(unread.map(n => api.markNotificationRead(n._id || n.id)));
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    }
  }

  const styles = createStyles(colors, isDark);

  function renderItem({ item }) {
    const id = item._id || item.id;
    const iconName = ICON_MAP[item.type] || ICON_MAP.default;

    return (
      <TouchableOpacity
        style={[styles.notifCard, !item.read && styles.notifCardUnread]}
        onPress={() => !item.read && handleMarkRead(id)}
        activeOpacity={0.8}
      >
        <View style={[styles.notifIconWrap, !item.read && styles.notifIconWrapUnread]}>
          <Ionicons name={iconName} size={20} color={!item.read ? colors.saffron : colors.textMuted} />
        </View>
        <View style={styles.notifContent}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {!item.read && <View style={styles.unreadDot} />}
            <Text style={[styles.notifTitle, !item.read && styles.notifTitleUnread]} numberOfLines={1}>
              {item.title}
            </Text>
          </View>
          {!!item.body && (
            <Text style={styles.notifBody} numberOfLines={2}>{item.body}</Text>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
            <Ionicons name="time-outline" size={12} color={colors.textMuted} />
            <Text style={styles.notifTime}>{timeAgo(item.created_at || item.createdAt || item.sent_at)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  const hasUnread = notifications.some(n => !n.read);

  return (
    <SafeAreaView style={styles.safeArea}>
      {hasUnread && (
        <View style={styles.markAllBar}>
          <TouchableOpacity onPress={handleMarkAllRead} style={styles.markAllBtn}>
            <Ionicons name="checkmark-done-outline" size={16} color={colors.saffron} style={{ marginRight: 6 }} />
            <Text style={styles.markAllText}>Mark all as read</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.saffron} />
        </View>
      ) : notifications.length === 0 ? (
        <EmptyState
          iconName="notifications-outline"
          title="No notifications yet"
          subtitle="We'll let you know when something important happens"
        />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item._id || item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.saffron]} tintColor={colors.saffron} />
          }
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.cream },
  markAllBar: {
    backgroundColor: colors.cardBg, paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: colors.border, alignItems: 'flex-end',
  },
  markAllBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  markAllText: { ...FONTS.medium, fontSize: 13, color: colors.saffron },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16 },
  notifCard: {
    flexDirection: 'row', backgroundColor: colors.cardBg,
    borderRadius: RADIUS.lg, borderWidth: 1, borderColor: colors.border,
    padding: 14, marginBottom: 10, ...SHADOW.small,
  },
  notifCardUnread: { backgroundColor: colors.saffronPale, borderColor: colors.saffronLight },
  notifIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: colors.creamDark, alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  notifIconWrapUnread: { backgroundColor: colors.saffronPale },
  unreadDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.saffron },
  notifContent: { flex: 1 },
  notifTitle: { ...FONTS.medium, fontSize: 14, color: colors.text, flex: 1 },
  notifTitleUnread: { ...FONTS.semibold },
  notifBody: { ...FONTS.regular, fontSize: 13, color: colors.textMuted, lineHeight: 18, marginTop: 2 },
  notifTime: { ...FONTS.regular, fontSize: 11, color: colors.textMuted },
});
