import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { FONTS, RADIUS, SHADOW } from '../theme';
import { Button } from '../components';
import { api } from '../api/client';

const LABELS = ['Home', 'Work', 'Other'];

export default function AddAddressScreen({ navigation, route }) {
  const existingAddress = route.params?.address;
  const isEdit = !!existingAddress;
  const { colors } = useTheme();

  const [label, setLabel]                       = useState(existingAddress?.label || 'Home');
  const [fullAddress, setFullAddress]           = useState(existingAddress?.full_address || '');
  const [landmark, setLandmark]                 = useState(existingAddress?.landmark || '');
  const [deliveryInstructions, setDeliveryInstructions] = useState(existingAddress?.delivery_instructions || '');
  const [lat, setLat]                           = useState(existingAddress?.lat || 0);
  const [lng, setLng]                           = useState(existingAddress?.lng || 0);
  const [locating, setLocating]                 = useState(false);
  const [saving, setSaving]                     = useState(false);
  const [error, setError]                       = useState('');

  async function handleSave() {
    if (!fullAddress.trim()) {
      setError('Full address is required');
      return;
    }
    setError('');
    setSaving(true);

    try {
      const payload = {
        label,
        full_address: fullAddress.trim(),
        landmark: landmark.trim(),
        delivery_instructions: deliveryInstructions.trim(),
        lat: Number(lat) || 0,
        lng: Number(lng) || 0,
      };

      if (isEdit) {
        const id = existingAddress._id || existingAddress.id;
        await api.updateAddress(id, payload);
      } else {
        await api.addAddress(payload);
      }

      Alert.alert(
        'Success',
        isEdit ? 'Address updated!' : 'Address saved!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not save address');
    } finally {
      setSaving(false);
    }
  }

  function handlePinLocation() {
    setLocating(true);
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(parseFloat(pos.coords.latitude.toFixed(6)));
          setLng(parseFloat(pos.coords.longitude.toFixed(6)));
          setLocating(false);
          Alert.alert('GPS Fixed', `Captured GPS coordinates: ${pos.coords.latitude.toFixed(4)}° N, ${pos.coords.longitude.toFixed(4)}° E`);
        },
        (_err) => {
          // Fallback Bhiwani local delivery zone coordinates
          setLat(28.7931);
          setLng(76.1397);
          setLocating(false);
          Alert.alert('Location Pinned', 'Using Bhiwani delivery zone coordinates (28.7931° N, 76.1397° E).');
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setLat(28.7931);
      setLng(76.1397);
      setLocating(false);
      Alert.alert('Location Pinned', 'GPS coordinates pinned to Bhiwani delivery hub (28.7931° N, 76.1397° E).');
    }
  }

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? 'Edit Address' : 'Add New Address'}</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Label picker */}
        <Text style={styles.fieldLabel}>Label</Text>
        <View style={styles.labelRow}>
          {LABELS.map(l => (
            <TouchableOpacity
              key={l}
              style={[styles.labelChip, label === l && styles.labelChipActive]}
              onPress={() => setLabel(l)}
              activeOpacity={0.8}
            >
              <Text style={[styles.labelChipText, label === l && styles.labelChipTextActive]}>
                {l === 'Home' ? '🏠 ' : l === 'Work' ? '💼 ' : '📍 '}{l}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Full address */}
        <Text style={styles.fieldLabel}>Full Address <Text style={styles.required}>*</Text></Text>
        <TextInput
          value={fullAddress}
          onChangeText={text => { setFullAddress(text); if (error) setError(''); }}
          placeholder="House/Flat no., Street, Area, City, State, PIN"
          placeholderTextColor={colors.textMuted}
          style={[styles.textArea, !!error && styles.inputError]}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
        {!!error && <Text style={styles.errorText}>{error}</Text>}

        {/* Landmark */}
        <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Landmark (optional)</Text>
        <TextInput
          value={landmark}
          onChangeText={setLandmark}
          placeholder="Near school, temple, mall..."
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />

        {/* Delivery Instructions */}
        <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Delivery Instructions (optional)</Text>
        <TextInput
          value={deliveryInstructions}
          onChangeText={setDeliveryInstructions}
          placeholder="e.g. Leave with guard / Ring bell twice / 2nd floor"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />

        {/* GPS Coordinates Section */}
        <View style={{ marginTop: 16, marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={styles.fieldLabel}>GPS Geolocation Pin</Text>
            <TouchableOpacity
              onPress={handlePinLocation}
              disabled={locating}
              style={styles.gpsBtn}
              activeOpacity={0.8}
            >
              <Ionicons name="navigate-circle-outline" size={16} color={colors.saffron} />
              <Text style={styles.gpsBtnText}>
                {locating ? 'Locating...' : 'Use Current Location'}
              </Text>
            </TouchableOpacity>
          </View>
          {lat && lng ? (
            <View style={styles.gpsBadge}>
              <Ionicons name="location" size={14} color={colors.green} />
              <Text style={styles.gpsBadgeText}>
                Pinned: {Number(lat).toFixed(4)}° N, {Number(lng).toFixed(4)}° E
              </Text>
            </View>
          ) : (
            <Text style={styles.gpsHint}>No GPS pin set. Tap above to attach exact delivery coordinates for rider navigation.</Text>
          )}
        </View>

        <Button
          title={saving ? '' : (isEdit ? 'Update Address' : 'Save Address')}
          onPress={handleSave}
          loading={saving}
          style={styles.saveBtn}
        />
      </ScrollView>
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
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },
  fieldLabel: {
    ...FONTS.medium,
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 8,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  required: {
    color: colors.error,
  },
  labelRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  labelChip: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.creamDark,
  },
  labelChipActive: {
    backgroundColor: colors.saffron,
    borderColor: colors.saffron,
  },
  labelChipText: {
    ...FONTS.medium,
    fontSize: 14,
    color: colors.text,
  },
  labelChipTextActive: {
    color: colors.white,
    ...FONTS.semibold,
  },
  textArea: {
    backgroundColor: colors.creamDark,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: RADIUS.md,
    padding: 13,
    fontSize: 15,
    color: colors.text,
    ...FONTS.regular,
    minHeight: 100,
    marginBottom: 4,
  },
  input: {
    backgroundColor: colors.creamDark,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: RADIUS.md,
    padding: 13,
    fontSize: 15,
    color: colors.text,
    ...FONTS.regular,
    marginBottom: 4,
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    ...FONTS.regular,
    fontSize: 12,
    color: colors.error,
    marginBottom: 8,
  },
  saveBtn: {
    marginTop: 28,
  },
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: colors.saffron,
    backgroundColor: colors.saffronPale,
  },
  gpsBtnText: {
    ...FONTS.semibold,
    fontSize: 12,
    color: colors.saffron,
  },
  gpsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    backgroundColor: colors.greenPale || '#E8F5E9',
    borderWidth: 1,
    borderColor: colors.green || '#4CAF50',
  },
  gpsBadgeText: {
    ...FONTS.medium,
    fontSize: 12,
    color: colors.text,
  },
  gpsHint: {
    ...FONTS.regular,
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
  },
});
