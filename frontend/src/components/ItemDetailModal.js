// src/components/ItemDetailModal.js — Craving Dish Screen (PDF Page 3)
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  ScrollView, Animated, Dimensions, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { FONTS, RADIUS, SHADOW, MOODS } from '../theme';
import { useCart } from '../context/CartContext';
import Plate from './Plate';
import api from '../api/client';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ItemDetailModal({ visible, onClose, item, mood: moodProp = 'comfort', navigation }) {
  const { colors } = useTheme();
  const { addItem, removeItem, getQty } = useCart();
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const slideAnim = React.useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  const itemId = item?._id || item?.id;
  const currentQty = getQty(itemId);
  const [modalQty, setModalQty] = useState(1);

  const moodKey = item?.mood || moodProp || 'comfort';
  const moodCfg = MOODS[moodKey] || MOODS.comfort;

  useEffect(() => {
    if (visible && item) {
      setModalQty(currentQty > 0 ? currentQty : 1);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
      loadReviews();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, item]);

  async function loadReviews() {
    if (!itemId) return;
    setLoadingReviews(true);
    try {
      const data = await api.getItemReviews(itemId, 1);
      setReviews(data?.reviews?.slice(0, 4) || []);
    } catch (_) {}
    setLoadingReviews(false);
  }

  function handleClose() {
    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 220,
      useNativeDriver: true,
    }).start(() => onClose());
  }

  function handleAddOrUpdateCart() {
    const diff = modalQty - currentQty;
    if (diff > 0) {
      for (let i = 0; i < diff; i++) {
        addItem({ ...item, id: itemId });
      }
    } else if (diff < 0) {
      for (let i = 0; i < Math.abs(diff); i++) {
        removeItem(itemId);
      }
    }
    handleClose();
  }

  if (!item) return null;

  const styles = createStyles(moodCfg);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={handleClose} activeOpacity={1} />

        <Animated.View
          style={[
            styles.sheet,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Top Bar with 44px Round Back Button matching PDF Page 3 */}
          <View style={styles.topBackBar}>
            <TouchableOpacity
              style={styles.backCircleBtn}
              onPress={handleClose}
              activeOpacity={0.85}
              accessibilityLabel="Back to mood menu"
            >
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* Huge Hero Mood Block with Plate and Blob matching PDF Page 3 */}
            <View style={[styles.heroCard, { backgroundColor: moodCfg.color }]}>
              {/* Corner Offset Blob Circle */}
              <View
                style={[
                  styles.heroBlob,
                  { backgroundColor: moodCfg.blobColor },
                ]}
              />

              {/* Giant Plate Component */}
              <Plate
                imageUrl={item.image_url}
                mood={moodKey}
                size={180}
              />
            </View>

            {/* Dish Name */}
            <Text style={styles.dishName}>{item.name}</Text>

            {/* Description */}
            <Text style={styles.dishDescription}>
              {item.description || 'Cooked fresh on order using traditional culinary recipe and finest spices.'}
            </Text>

            {/* 3 Chips matching PDF Page 3: Cook time, Spice, Serves */}
            <View style={styles.chipsRow}>
              <View style={styles.chipPill}>
                <Ionicons name="time-outline" size={13} color="#A3B5AA" style={{ marginRight: 5 }} />
                <Text style={styles.chipText}>{item.cook_time || 18} min</Text>
              </View>

              <View style={styles.chipPill}>
                <Ionicons name="flame-outline" size={13} color="#EE5F45" style={{ marginRight: 5 }} />
                <Text style={styles.chipText}>{item.spice_level || 'Medium'} spice</Text>
              </View>

              <View style={styles.chipPill}>
                <Ionicons name="people-outline" size={13} color="#A3B5AA" style={{ marginRight: 5 }} />
                <Text style={styles.chipText}>Serves {item.serves || '1-2'}</Text>
              </View>
            </View>

            {/* Customer reviews if any */}
            {reviews.length > 0 && (
              <View style={styles.reviewSection}>
                <Text style={styles.reviewHeading}>What Foodies Say</Text>
                {reviews.map((r, idx) => (
                  <View key={idx} style={styles.reviewCard}>
                    <Text style={styles.reviewerName}>{r.user?.name || 'Satisfied Diner'}</Text>
                    {r.comment ? (
                      <Text style={styles.reviewBody}>"{r.comment}"</Text>
                    ) : null}
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Bottom Action Controls matching PDF Page 3: [- 1 +] and [Add · PRICE] */}
          <View style={styles.bottomDock}>
            {/* Quantity Stepper */}
            <View style={styles.stepperWrap}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => setModalQty((prev) => Math.max(1, prev - 1))}
                activeOpacity={0.8}
                accessibilityLabel="Decrease quantity"
              >
                <Ionicons name="remove" size={18} color="#FFFFFF" />
              </TouchableOpacity>

              <Text style={styles.stepperNumber}>{modalQty}</Text>

              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => setModalQty((prev) => Math.min(10, prev + 1))}
                activeOpacity={0.8}
                accessibilityLabel="Increase quantity"
              >
                <Ionicons name="add" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Primary Add Button in Mood Accent Color */}
            <TouchableOpacity
              style={[
                styles.primaryAddBtn,
                { backgroundColor: moodCfg.color },
              ]}
              onPress={handleAddOrUpdateCart}
              activeOpacity={0.88}
              accessibilityLabel={`Add for ₹${item.price * modalQty}`}
            >
              <Text
                style={[
                  styles.primaryAddBtnText,
                  { color: moodCfg.textColor },
                ]}
              >
                Add · ₹{item.price * modalQty}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const createStyles = (moodCfg) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
    },
    sheet: {
      backgroundColor: '#121A16',
      borderTopLeftRadius: 36,
      borderTopRightRadius: 36,
      borderTopWidth: 1,
      borderColor: '#33463C',
      maxHeight: SCREEN_HEIGHT * 0.92,
      paddingBottom: 24,
    },
    topBackBar: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 10,
    },
    backCircleBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: '#1B2620',
      borderWidth: 1,
      borderColor: '#33463C',
      alignItems: 'center',
      justifyContent: 'center',
    },
    scrollBody: {
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    heroCard: {
      height: 250,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      position: 'relative',
      marginBottom: 20,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 12,
      elevation: 6,
    },
    heroBlob: {
      position: 'absolute',
      top: -30,
      right: -30,
      width: 140,
      height: 140,
      borderRadius: 70,
      opacity: 0.85,
    },
    dishName: {
      fontSize: 28,
      ...FONTS.heavy,
      color: '#FFFFFF',
      letterSpacing: -0.6,
      lineHeight: 33,
      marginBottom: 10,
    },
    dishDescription: {
      fontSize: 14.5,
      color: '#A3B5AA',
      lineHeight: 22,
      ...FONTS.regular,
      marginBottom: 18,
    },
    chipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 20,
    },
    chipPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#1B2620',
      borderWidth: 1,
      borderColor: '#33463C',
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: RADIUS.chip,
    },
    chipText: {
      fontSize: 13,
      ...FONTS.medium,
      color: '#FFFFFF',
    },
    reviewSection: {
      marginTop: 8,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: '#1B2620',
    },
    reviewHeading: {
      fontSize: 15,
      ...FONTS.bold,
      color: '#A3B5AA',
      marginBottom: 10,
    },
    reviewCard: {
      backgroundColor: '#1B2620',
      padding: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: '#33463C',
      marginBottom: 8,
    },
    reviewerName: {
      fontSize: 13,
      ...FONTS.bold,
      color: '#FFFFFF',
    },
    reviewBody: {
      fontSize: 12.5,
      color: '#A3B5AA',
      marginTop: 2,
    },
    bottomDock: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 10,
      gap: 14,
    },
    stepperWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#1B2620',
      borderWidth: 1,
      borderColor: '#33463C',
      borderRadius: 28,
      height: 56,
      paddingHorizontal: 8,
    },
    stepperBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepperNumber: {
      fontSize: 18,
      ...FONTS.heavy,
      color: '#FFFFFF',
      minWidth: 26,
      textAlign: 'center',
    },
    primaryAddBtn: {
      flex: 1,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
    },
    primaryAddBtnText: {
      fontSize: 16.5,
      ...FONTS.heavy,
      letterSpacing: -0.3,
    },
  });
