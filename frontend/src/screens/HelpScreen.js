// src/screens/HelpScreen.js — Swiggy-like help & support screen
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Linking, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { FONTS, RADIUS, SHADOW } from '../theme';

const FAQ_DATA = [
  {
    question: 'How do I track my order?',
    answer: 'After placing an order, you can track it in real-time from the Track Order screen. Go to Profile > Your Orders and tap on any active order to see its current status.',
  },
  {
    question: 'What are the delivery timings?',
    answer: 'We deliver from 11:00 AM to 10:00 PM, 7 days a week. Orders placed during peak hours may take slightly longer.',
  },
  {
    question: 'How can I cancel my order?',
    answer: 'You can cancel your order within 2 minutes of placing it. Go to Track Order and tap the Cancel button. After the order is confirmed, cancellation may not be possible.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept Cash on Delivery (COD), UPI payments (Google Pay, PhonePe, Paytm), and online payments via Razorpay (cards, net banking).',
  },
  {
    question: 'How do I apply a coupon?',
    answer: 'In the cart screen, look for the "Apply Coupon" section. Enter your coupon code or browse available coupons. The discount will be applied automatically.',
  },
  {
    question: 'What is your refund policy?',
    answer: 'If you receive a wrong or damaged order, contact us immediately. We will either replace the item or process a full refund within 3-5 business days.',
  },
];

export default function HelpScreen({ navigation }) {
  const [expandedFaq, setExpandedFaq] = useState(null);
  const { colors } = useTheme();

  const CONTACT_OPTIONS = [
    {
      icon: 'call-outline',
      title: 'Call Us',
      subtitle: 'Available 11 AM - 10 PM',
      action: () => Linking.openURL('tel:+919999999999'),
      color: colors.saffron,
      bg: colors.saffronPale,
    },
    {
      icon: 'logo-whatsapp',
      title: 'WhatsApp',
      subtitle: 'Quick response',
      action: () => Linking.openURL('https://wa.me/919999999999?text=Hi%20Navedyam'),
      color: colors.saffronLight,
      bg: colors.saffronPale,
    },
    {
      icon: 'mail-outline',
      title: 'Email',
      subtitle: 'support@navedyam.com',
      action: () => Linking.openURL('mailto:support@navedyam.com'),
      color: colors.saffronDeep,
      bg: colors.saffronPale,
    },
  ];

  function toggleFaq(index) {
    setExpandedFaq(expandedFaq === index ? null : index);
  }

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Quick Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <View style={styles.contactGrid}>
            {CONTACT_OPTIONS.map((opt, i) => (
              <TouchableOpacity
                key={i}
                style={styles.contactCard}
                onPress={opt.action}
                activeOpacity={0.8}
              >
                <View style={[styles.contactIconWrap, { backgroundColor: opt.bg }]}>
                  <Ionicons name={opt.icon} size={24} color={opt.color} />
                </View>
                <Text style={styles.contactTitle}>{opt.title}</Text>
                <Text style={styles.contactSub}>{opt.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* FAQs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          {FAQ_DATA.map((faq, index) => (
            <TouchableOpacity
              key={index}
              style={styles.faqCard}
              onPress={() => toggleFaq(index)}
              activeOpacity={0.8}
            >
              <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>{faq.question}</Text>
                <Ionicons
                  name={expandedFaq === index ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={colors.saffron}
                />
              </View>
              {expandedFaq === index && (
                <Text style={styles.faqAnswer}>{faq.answer}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Links</Text>
          <TouchableOpacity
            style={styles.linkCard}
            onPress={() => navigation.navigate('Profile')}
          >
            <View style={styles.linkLeft}>
              <Ionicons name="receipt-outline" size={20} color={colors.saffron} />
              <Text style={styles.linkText}>View Order History</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.linkCard}
            onPress={() => navigation.navigate('Addresses')}
          >
            <View style={styles.linkLeft}>
              <Ionicons name="location-outline" size={20} color={colors.saffron} />
              <Text style={styles.linkText}>Manage Addresses</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.linkCard}
            onPress={() => Alert.alert('Terms & Conditions', 'Our terms and conditions document will be available soon.')}
          >
            <View style={styles.linkLeft}>
              <Ionicons name="document-text-outline" size={20} color={colors.saffron} />
              <Text style={styles.linkText}>Terms & Conditions</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.linkCard}
            onPress={() => Alert.alert('Privacy Policy', 'Our privacy policy document will be available soon.')}
          >
            <View style={styles.linkLeft}>
              <Ionicons name="shield-outline" size={20} color={colors.saffron} />
              <Text style={styles.linkText}>Privacy Policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appName}>Navedyam</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
          <Text style={styles.appTagline}>Ghar Ka Swaad, Seedha Aapke Darwaze</Text>
        </View>
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    ...FONTS.bold,
    fontSize: 18,
    color: colors.text,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    ...FONTS.bold,
    fontSize: 17,
    color: colors.text,
    marginBottom: 14,
  },
  contactGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  contactCard: {
    flex: 1,
    backgroundColor: colors.cardBg,
    borderRadius: RADIUS.lg,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...SHADOW.small,
  },
  contactIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  contactTitle: {
    ...FONTS.semibold,
    fontSize: 13,
    color: colors.text,
    marginBottom: 2,
  },
  contactSub: {
    ...FONTS.regular,
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
  },
  faqCard: {
    backgroundColor: colors.cardBg,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...SHADOW.small,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    flex: 1,
    ...FONTS.semibold,
    fontSize: 14,
    color: colors.text,
    marginRight: 12,
  },
  faqAnswer: {
    ...FONTS.regular,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 20,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cardBg,
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  linkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  linkText: {
    ...FONTS.medium,
    fontSize: 14,
    color: colors.text,
  },
  appInfo: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 10,
  },
  appName: {
    ...FONTS.heavy,
    fontSize: 22,
    color: colors.saffron,
  },
  appVersion: {
    ...FONTS.regular,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  appTagline: {
    ...FONTS.medium,
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 8,
  },
});
