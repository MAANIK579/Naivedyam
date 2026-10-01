// src/screens/LoginScreen.js — Enhanced UI with theme support
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

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const { colors, isDark } = useTheme();
  const [phone,    setPhone]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleLogin() {
    if (!phone || !password) {
      Alert.alert('Missing fields', 'Please enter your phone and password.');
      return;
    }
    try {
      setLoading(true);
      await login(phone, password);
    } catch (err) {
      Alert.alert('Login Failed', err.message);
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
        {/* Logo */}
        <View style={styles.logoWrap}>
          <View style={styles.logoIcon}>
            <Ionicons name="flame" size={36} color={colors.white} />
          </View>
          <Text style={styles.logoText}>Navedyam</Text>
          <Text style={styles.logoSub}>CLOUD KITCHEN · BHIWANI</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Login to order fresh Haryanvi food</Text>

          <Input
            label="Phone Number"
            leftIcon="call-outline"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="Enter your phone number"
            autoComplete="tel"
          />
          <Input
            label="Password"
            leftIcon="lock-closed-outline"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Enter your password"
          />

          <Button title="Login" icon="log-in-outline" onPress={handleLogin} loading={loading} style={{ marginTop: 8 }} />

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.switchLink}>Register</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors, isDark) => StyleSheet.create({
  base: { flex: 1 },
  container: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoIcon: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: colors.saffron,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
    ...SHADOW.medium,
  },
  logoText: {
    fontSize: 34, color: colors.white,
    ...FONTS.heavy, letterSpacing: 1,
  },
  logoSub: {
    fontSize: 10, color: colors.turmeric,
    letterSpacing: 3, textTransform: 'uppercase',
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: RADIUS.xl,
    padding: 24,
    ...SHADOW.large,
  },
  title: {
    fontSize: 24, ...FONTS.bold, color: colors.text, marginBottom: 4,
  },
  subtitle: {
    fontSize: 14, color: colors.textMuted, marginBottom: 24,
  },
  switchRow: {
    flexDirection: 'row', justifyContent: 'center', marginTop: 20,
  },
  switchText: { color: colors.textMuted, fontSize: 14 },
  switchLink: { color: colors.saffron, fontSize: 14, ...FONTS.bold },
});
