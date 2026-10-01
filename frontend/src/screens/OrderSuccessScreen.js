// src/screens/OrderSuccessScreen.js — Swiggy-like order confirmation with animation
import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, Easing,
  SafeAreaView, TouchableOpacity, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { FONTS, RADIUS, SHADOW } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function Confetti({ delay, x, colors }) {
  const fallAnim = useRef(new Animated.Value(-50)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const CONFETTI_COLORS = [colors.saffron, colors.saffronLight, colors.turmeric, colors.saffronDeep, '#86EFAC', '#166534'];

  useEffect(() => {
    const timeout = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fallAnim, {
          toValue: 600,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);

    return () => clearTimeout(timeout);
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '720deg'],
  });

  const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
  const size = 8 + Math.random() * 8;

  return (
    <Animated.View
      style={[
        styles_static.confetti,
        {
          left: x,
          width: size,
          height: size,
          backgroundColor: color,
          transform: [{ translateY: fallAnim }, { rotate }],
          opacity: opacityAnim,
        },
      ]}
    />
  );
}

const styles_static = StyleSheet.create({
  confetti: {
    position: 'absolute',
    borderRadius: 2,
  },
});

export default function OrderSuccessScreen({ navigation, route }) {
  const { orderId, displayId, grandTotal, estimatedMinutes } = route.params || {};
  const eta = estimatedMinutes || 35;
  const { colors } = useTheme();

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const tickAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animations
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(tickAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Generate confetti positions
  const confettiPieces = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * SCREEN_WIDTH,
    delay: Math.random() * 1000,
  }));

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Confetti */}
      {confettiPieces.map((piece) => (
        <Confetti key={piece.id} x={piece.x} delay={piece.delay} colors={colors} />
      ))}

      <View style={styles.content}>
        {/* Success Circle */}
        <Animated.View
          style={[
            styles.successCircle,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          <Animated.View style={{ opacity: tickAnim }}>
            <Ionicons name="checkmark" size={64} color={colors.white} />
          </Animated.View>
        </Animated.View>

        <Animated.View style={[styles.textContainer, { opacity: fadeAnim }]}>
          <Text style={styles.title}>Order Placed!</Text>
          <Text style={styles.subtitle}>
            Your order has been confirmed and is being prepared
          </Text>

          {/* Order Details Card */}
          <View style={styles.orderCard}>
            <View style={styles.orderRow}>
              <Text style={styles.orderLabel}>Order ID</Text>
              <Text style={styles.orderValue}>{displayId || orderId}</Text>
            </View>
            {grandTotal && (
              <View style={styles.orderRow}>
                <Text style={styles.orderLabel}>Total Amount</Text>
                <Text style={styles.orderValueBold}>₹{grandTotal}</Text>
              </View>
            )}
            <View style={styles.orderRow}>
              <Text style={styles.orderLabel}>Estimated Delivery</Text>
              <Text style={styles.orderValueBold}>{eta}-{eta + 10} min</Text>
            </View>
          </View>

          {/* Delivery Info */}
          <View style={styles.infoBox}>
            <Ionicons name="bicycle-outline" size={24} color={colors.saffron} />
            <Text style={styles.infoText}>
              We'll notify you when your order is on the way!
            </Text>
          </View>
        </Animated.View>
      </View>

      {/* Bottom Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.trackBtn}
          onPress={() => navigation.replace('MainTabs', { screen: 'Track', params: { orderId } })}
          activeOpacity={0.85}
        >
          <Ionicons name="location-outline" size={20} color={colors.white} />
          <Text style={styles.trackBtnText}>Track Order</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.homeBtn}
          onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
          activeOpacity={0.8}
        >
          <Text style={styles.homeBtnText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  successCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    ...SHADOW.large,
  },
  textContainer: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    ...FONTS.heavy,
    fontSize: 28,
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    ...FONTS.medium,
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 32,
  },
  orderCard: {
    backgroundColor: colors.cardBg,
    borderRadius: RADIUS.xl,
    padding: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...SHADOW.small,
    marginBottom: 20,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  orderLabel: {
    ...FONTS.medium,
    fontSize: 14,
    color: colors.textMuted,
  },
  orderValue: {
    ...FONTS.medium,
    fontSize: 14,
    color: colors.text,
  },
  orderValueBold: {
    ...FONTS.bold,
    fontSize: 16,
    color: colors.saffronDeep,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.creamDark,
    borderRadius: RADIUS.lg,
    padding: 16,
    width: '100%',
  },
  infoText: {
    flex: 1,
    ...FONTS.medium,
    fontSize: 14,
    color: colors.text,
  },
  footer: {
    padding: 20,
    paddingBottom: 32,
    gap: 12,
  },
  trackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.saffron,
    borderRadius: RADIUS.lg,
    paddingVertical: 16,
    ...SHADOW.medium,
  },
  trackBtnText: {
    ...FONTS.bold,
    fontSize: 16,
    color: colors.white,
  },
  homeBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  homeBtnText: {
    ...FONTS.semibold,
    fontSize: 15,
    color: colors.textMuted,
  },
});
