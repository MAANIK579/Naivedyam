// src/components/BannerCarousel.js — Swiggy-like auto-scrolling banner carousel with theme support
import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Dimensions, FlatList,
  TouchableOpacity, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { FONTS, RADIUS, SHADOW } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_WIDTH = SCREEN_WIDTH - 32;
const BANNER_HEIGHT = 140;
const AUTO_SCROLL_INTERVAL = 4000;

const DEFAULT_BANNERS = [
  {
    id: '1',
    title: 'WELCOME50',
    subtitle: 'Flat ₹50 OFF',
    description: 'On your first order',
    icon: 'gift-outline',
    gradient: ['#166534', '#16A34A'],
    accent: '#DCFCE7',
  },
  {
    id: '2',
    title: 'COMBO199',
    subtitle: 'Thali + Lassi',
    description: 'At just ₹199',
    icon: 'fast-food-outline',
    gradient: ['#14532D', '#15803D'],
    accent: '#BBF7D0',
  },
  {
    id: '3',
    title: 'FREEDELIVERY',
    subtitle: 'Free Delivery',
    description: 'On orders above ₹299',
    icon: 'bicycle-outline',
    gradient: ['#166534', '#15803D'],
    accent: '#86EFAC',
  },
  {
    id: '4',
    title: 'WEEKEND20',
    subtitle: '20% OFF',
    description: 'This weekend only!',
    icon: 'sparkles-outline',
    gradient: ['#14532D', '#166534'],
    accent: '#4ADE80',
  },
];

export default function BannerCarousel({ banners = DEFAULT_BANNERS, onBannerPress }) {
  const { colors } = useTheme();
  const flatListRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (activeIndex + 1) % banners.length;
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
    }, AUTO_SCROLL_INTERVAL);

    return () => clearInterval(interval);
  }, [activeIndex, banners.length]);

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  function renderBanner({ item, index }) {
    return (
      <TouchableOpacity
        style={[styles.banner, { backgroundColor: item.gradient[0] }]}
        onPress={() => onBannerPress?.(item)}
        activeOpacity={0.9}
      >
        <View style={styles.bannerContent}>
          <View style={styles.bannerLeft}>
            <Text style={styles.bannerCode}>{item.title}</Text>
            <Text style={styles.bannerSubtitle}>{item.subtitle}</Text>
            <Text style={styles.bannerDesc}>{item.description}</Text>
            <View style={styles.applyCta}>
              <Text style={styles.applyText}>TAP TO APPLY</Text>
              <Ionicons name="arrow-forward" size={12} color={item.gradient[0]} />
            </View>
          </View>
          <View style={[styles.bannerIconWrap, { backgroundColor: item.accent + '30' }]}>
            <Ionicons name={item.icon} size={40} color={item.accent} />
          </View>
        </View>
        <View style={[styles.circle, styles.circle1, { backgroundColor: item.gradient[1] }]} />
        <View style={[styles.circle, styles.circle2, { backgroundColor: item.accent + '20' }]} />
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={banners}
        renderItem={renderBanner}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={BANNER_WIDTH + 12}
        decelerationRate="fast"
        contentContainerStyle={styles.listContent}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onScrollToIndexFailed={() => {}}
      />
      <View style={styles.pagination}>
        {banners.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              { backgroundColor: index === activeIndex ? colors.saffron : colors.border },
              index === activeIndex && styles.dotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  banner: {
    width: BANNER_WIDTH,
    height: BANNER_HEIGHT,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    marginRight: 12,
    ...SHADOW.medium,
  },
  bannerContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  bannerLeft: {
    flex: 1,
  },
  bannerCode: {
    ...FONTS.heavy,
    fontSize: 20,
    color: '#FAFAF9',
    letterSpacing: 1,
  },
  bannerSubtitle: {
    ...FONTS.bold,
    fontSize: 24,
    color: '#FAFAF9',
    marginTop: 2,
  },
  bannerDesc: {
    ...FONTS.medium,
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  applyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
    backgroundColor: '#FAFAF9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
    alignSelf: 'flex-start',
  },
  applyText: {
    ...FONTS.bold,
    fontSize: 10,
    color: '#171717',
    letterSpacing: 0.5,
  },
  bannerIconWrap: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    position: 'absolute',
    borderRadius: 100,
  },
  circle1: {
    width: 120,
    height: 120,
    top: -40,
    right: -20,
    opacity: 0.3,
  },
  circle2: {
    width: 80,
    height: 80,
    bottom: -30,
    left: 30,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 20,
  },
});
