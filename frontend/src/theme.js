// src/theme.js — Light/Dark mode design system (white+green / black+green)

// Light Mode Colors (white + green)
export const LIGHT_COLORS = {
  // Primary green tones
  saffron:      '#16A34A',
  saffronLight: '#22C55E',
  saffronDeep:  '#166534',
  saffronPale:  '#DCFCE7',

  // Background tones (light)
  cream:        '#fbfbfbff',
  creamDark:    '#F8FAF9',

  // Accent colors
  turmeric:     '#BBF7D0',

  // Brown tones (used for headers etc, now dark green in light mode)
  brown:        '#166534',
  brownMid:     '#15803D',
  brownLight:   '#22C55E',

  // Green accents
  green:        '#22C55E',
  greenLight:   '#4ADE80',
  greenPale:    '#F0FDF4',

  // Text colors
  text:         '#0F172A',
  textMuted:    '#64748B',    // Slate 500 — accessible readable muted text
  textLight:    '#94A3B8',    // Slate 400 — secondary metadata

  // Surface colors
  white:        '#FFFFFF',
  cardBg:       '#FFFFFF',

  // Border colors
  border:       '#E2E8F0',
  borderLight:  '#F1F5F9',

  // Status colors
  error:        '#DC2626',
  errorPale:    '#FEF2F2',
  success:      '#22C55E',
  successPale:  '#F0FDF4',

  // Overlay
  overlay:      'rgba(0, 0, 0, 0.5)',

  // Tab bar
  tabBarBg:     '#FFFFFF',
  tabBarBorder: '#E2E8F0',
  tabInactive:  '#94A3B8',

  // Status bar
  statusBarStyle: 'light-content',
};

// Dark Mode Colors (Premium Warm Mocha & Amber)
export const DARK_COLORS = {
  // Primary accent (Appetizing Amber/Orange)
  saffron:      '#F59E0B',    // Amber 500 - Warm, premium primary
  saffronLight: '#FBBF24',    // Amber 400
  saffronDeep:  '#D97706',    // Amber 600
  saffronPale:  '#451A03',    // Amber 950 - Deep warm tint for pill backgrounds

  // Background tones (Rich Espresso/Mocha)
  cream:        '#0C0A09',    // Stone 950 - Very deep warm black
  creamDark:    '#1C1917',    // Stone 900 - Base elevated surface

  // Accent colors
  turmeric:     '#FCD34D',    // Amber 300 - highlight

  // Rich dark tones (Surfaces and headers)
  brown:        '#0C0A09',    // Match cream for headers
  brownMid:     '#292524',    // Stone 800 - Secondary cards
  brownLight:   '#44403C',    // Stone 700 - Hover/Pressed state

  // Green accents (Keep for veg badges, success states)
  green:        '#22C55E',    // Standard emerald green for veg indicators
  greenLight:   '#4ADE80',
  greenPale:    '#052E16',    // Dark green tint for backgrounds

  // Text colors (Warm off-whites)
  text:         '#FFF7ED',    // Orange 50 - Very warm, premium white
  textMuted:    '#A8A29E',    // Stone 400 - Clear hierarchy for secondary text
  textLight:    '#78716C',    // Stone 500

  // Surface colors
  white:        '#FFFFFF',    // Standard white for high contrast needs
  cardBg:       '#1C1917',    // Stone 900 - Main card background

  // Border colors
  border:       '#292524',    // Stone 800 - Subtle warm borders
  borderLight:  '#44403C',    // Stone 700 - Lighter borders

  // Status colors
  error:        '#EF4444',
  errorPale:    '#450A0A',
  success:      '#22C55E',
  successPale:  '#052E16',

  // Overlay
  overlay:      'rgba(12, 10, 9, 0.85)', // Tinted espresso overlay

  // Tab bar
  tabBarBg:     '#0C0A09',    // Match background
  tabBarBorder: '#292524',    // Match border
  tabInactive:  '#78716C',    // Match textLight

  // Status bar
  statusBarStyle: 'light-content',
};

// Default to dark colors for backward compatibility (current app is dark)
export const COLORS = DARK_COLORS;

export const FONTS = {
  regular:  { fontFamily: 'System', fontWeight: '400' },
  medium:   { fontFamily: 'System', fontWeight: '500' },
  semibold: { fontFamily: 'System', fontWeight: '600' },
  bold:     { fontFamily: 'System', fontWeight: '700' },
  heavy:    { fontFamily: 'System', fontWeight: '900' },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const SHADOW = {
  small: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 3,
  },
  medium: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 6,
  },
  large: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.34,
    shadowRadius: 24,
    elevation: 10,
  },
};
