// src/screens/AddAddressScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { FONTS, RADIUS, SHADOW } from '../theme';
import { Button } from '../components';
import { api } from '../api/client';

const LABELS = ['Home', 'Work', 'Other'];

export default function AddAddressScreen({ navigation, route }) {
  const existingAddress = route.params?.address;
  const isEdit = !!existingAddress;
  const { colors } = useTheme();

  const [label, setLabel]           = useState(existingAddress?.label || 'Home');
  const [fullAddress, setFullAddress] = useState(existingAddress?.full_address || '');
  const [landmark, setLandmark]     = useState(existingAddress?.landmark || '');
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');

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
});
