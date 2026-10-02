// src/screens/OrderSuccessScreen.js — Craving Order Placed Confirmation Screen (PDF Page 5)
import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated,
  TouchableOpacity, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FONTS, RADIUS } from '../theme';

export default function OrderSuccessScreen({ navigation, route }) {
  const { orderId, displayId, estimatedMinutes } = route.params || {};
  const eta = estimatedMinutes || 35;
  const resolvedOrderNo = displayId || (orderId ? String(orderId).slice(-5).toUpperCase() : '7842');

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#121A16" />

      <View style={styles.centerContainer}>
        {/* Large Amber Circle with animated check mark matching PDF Page 5 */}
        <Animated.View
          style={[
            styles.checkCircle,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          <Ionicons name="checkmark" size={68} color="#2B1A05" />
        </Animated.View>

        <Animated.View style={[styles.textWrap, { opacity: fadeAnim }]}>
          {/* Heading matching PDF Page 5 */}
          <Text style={styles.title}>Order{'\n'}placed</Text>

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            The kitchen has it. Arriving in about {eta} min.
          </Text>

          {/* Order #[ORDER NO.] Row */}
          <View style={styles.orderNoRow}>
            <Text style={styles.orderLabel}>Order</Text>
            <Text style={styles.orderValue}>#{resolvedOrderNo}</Text>
          </View>
        </Animated.View>
      </View>

      {/* Buttons matching PDF Page 5 */}
      <View style={styles.bottomDock}>
        {/* Track my order Primary Button */}
        <TouchableOpacity
          style={styles.primaryTrackBtn}
          onPress={() =>
            navigation.navigate('MainTabs', {
              screen: 'Home',
              params: { openTracker: true, orderId },
            })
          }
          activeOpacity={0.88}
          accessibilityLabel="Track my order"
        >
          <Text style={styles.primaryTrackText}>Track my order</Text>
        </TouchableOpacity>

        {/* Back to home Secondary Outline Button */}
        <TouchableOpacity
          style={styles.secondaryHomeBtn}
          onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
          activeOpacity={0.85}
          accessibilityLabel="Back to home"
        >
          <Text style={styles.secondaryHomeText}>Back to home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#121A16',
    justifyContent: 'space-between',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    marginTop: -20,
  },
  checkCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#F5B042',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  textWrap: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    ...FONTS.heavy,
    fontSize: 40,
    lineHeight: 44,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -1,
    marginBottom: 16,
  },
  subtitle: {
    ...FONTS.medium,
    fontSize: 16,
    lineHeight: 23,
    color: '#A3B5AA',
    textAlign: 'center',
    marginBottom: 44,
    maxWidth: 260,
  },
  orderNoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#1B2620',
    borderWidth: 1,
    borderColor: '#33463C',
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  orderLabel: {
    fontSize: 15,
    ...FONTS.medium,
    color: '#A3B5AA',
  },
  orderValue: {
    fontSize: 16,
    ...FONTS.heavy,
    color: '#FFFFFF',
  },
  bottomDock: {
    paddingHorizontal: 24,
    paddingBottom: 28,
    gap: 12,
  },
  primaryTrackBtn: {
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F5B042',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryTrackText: {
    color: '#2B1A05',
    fontSize: 16.5,
    ...FONTS.heavy,
    letterSpacing: -0.2,
  },
  secondaryHomeBtn: {
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: '#33463C',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryHomeText: {
    color: '#FFFFFF',
    fontSize: 16,
    ...FONTS.bold,
    letterSpacing: -0.2,
  },
});
