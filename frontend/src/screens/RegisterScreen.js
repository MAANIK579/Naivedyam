// src/screens/RegisterScreen.js — Enhanced UI with theme support
import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Alert, KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Button, Input } from '../components';
import { FONTS, RADIUS, SHADOW } from '../theme';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const { colors, isDark } = useTheme();
  const [form,    setForm]    = useState({ name:'', phone:'', password:'', address:'' });
  const [loading, setLoading] = useState(false);

  function set(field, value) { setForm(f => ({ ...f, [field]: value })); }

  async function handleRegister() {
    if (!form.name || !form.phone || !form.password)
      return Alert.alert('Missing fields', 'Name, phone and password are required.');
    if (form.password.length < 6)
      return Alert.alert('Weak password', 'Password must be at least 6 characters.');
    try {
      setLoading(true);
      await register(form.name, form.phone, form.password, form.address);
    } catch (err) {
      Alert.alert('Registration Failed', err.message);
    } finally {
      setLoading(false);
    }
  }

  const styles = createStyles(colors, isDark);

  return (
    <KeyboardAvoidingView
      style={[styles.base, { backgroundColor: colors.brown }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.brown} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.logoWrap}>
          <View style={styles.logoIcon}>
            <Ionicons name="flame" size={32} color={colors.white} />
          </View>
          <Text style={styles.logoText}>Navedyam</Text>
          <Text style={styles.logoSub}>CREATE YOUR ACCOUNT</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Get Started</Text>
          <Text style={styles.subtitle}>Order ghar ka khana in minutes</Text>

          <Input label="Full Name"    leftIcon="person-outline" value={form.name}     onChangeText={v=>set('name',v)}     placeholder="Your name" />
          <Input label="Phone"        leftIcon="call-outline"   value={form.phone}    onChangeText={v=>set('phone',v)}    placeholder="+91 XXXXX XXXXX" keyboardType="phone-pad" />
          <Input label="Password"     leftIcon="lock-closed-outline" value={form.password} onChangeText={v=>set('password',v)} placeholder="Min 6 characters" secureTextEntry />
          <Input label="Address (optional)" leftIcon="location-outline" value={form.address} onChangeText={v=>set('address',v)} placeholder="Delivery address in Bhiwani" multiline numberOfLines={2} />

          <Button title="Create Account" icon="person-add-outline" onPress={handleRegister} loading={loading} style={{ marginTop: 8 }} />

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.switchLink}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  base: { flex: 1 },
  container: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  logoWrap: { alignItems: 'center', marginBottom: 28 },
  logoIcon: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: colors.saffron,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    ...SHADOW.medium,
  },
  logoText: { fontSize: 30, color: colors.white, ...FONTS.heavy, letterSpacing: 1 },
  logoSub: { fontSize: 10, color: colors.turmeric, letterSpacing: 3, textTransform: 'uppercase', marginTop: 4 },
  card: { backgroundColor: colors.cardBg, borderRadius: RADIUS.xl, padding: 24, ...SHADOW.large },
  title: { fontSize: 24, ...FONTS.bold, color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.textMuted, marginBottom: 24 },
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  switchText: { color: colors.textMuted, fontSize: 14 },
  switchLink: { color: colors.saffron, fontSize: 14, ...FONTS.bold },
});
