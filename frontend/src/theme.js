// src/theme.js — Modern High-Contrast Culinary Design System (Light & Dark)

export const LIGHT_COLORS = {
  // Brand accents (Appetizing Saffron / Tangerine)
  saffron:      '#EA580C',    // Vibrant warm saffron-orange
  saffronLight: '#FB923C',
  saffronDeep:  '#C2410C',
  saffronPale:  '#FFF7ED',    // Orange-50 warm tint

  // Background tones
  cream:        '#F8FAFC',    // Slate-50 clean canvas
  creamDark:    '#F1F5F9',    // Slate-100 secondary surface

  // Accent colors
  turmeric:     '#D97706',    // Amber-600

  // Neutral darks for text and headers
  brown:        '#0F172A',    // Slate-900 header
  brownMid:     '#1E293B',    // Slate-800
  brownLight:   '#334155',    // Slate-700

  // Fresh green for pure veg & success
  green:        '#16A34A',    // Emerald-600 pure veg
  greenLight:   '#22C55E',
  greenPale:    '#DCFCE7',

  // High-contrast text
  text:         '#0F172A',    // Slate-900 crisp primary text
  textMuted:    '#64748B',    // Slate-500 secondary
  textLight:    '#94A3B8',    // Slate-400 placeholder/meta

  // Surfaces
  white:        '#FFFFFF',
  cardBg:       '#FFFFFF',
  cardElevated: '#FFFFFF',

  // Crisp borders
  border:       '#E2E8F0',    // Slate-200 clean border
  borderLight:  '#F1F5F9',    // Slate-100 hairline divider

  // Status colors
  error:        '#DC2626',
  errorPale:    '#FEF2F2',
  success:      '#16A34A',
  successPale:  '#F0FDF4',

  // Overlays
  overlay:      'rgba(15, 23, 42, 0.65)',

  // Tab bar
  tabBarBg:     '#FFFFFF',
  tabBarBorder: '#E2E8F0',
  tabInactive:  '#94A3B8',

  // Status bar
  statusBarStyle: 'dark-content',
};

export const DARK_COLORS = {
  // Brand accents (Luminous Saffron / Amber)
  saffron:      '#F97316',    // Vibrant Orange-500
  saffronLight: '#FB923C',
  saffronDeep:  '#EA580C',
  saffronPale:  '#431407',    // Deep warm amber tint

  // Background tones (Deep Obsidian & Charcoal)
  cream:        '#09090B',    // Zinc-950 deep pure canvas
  creamDark:    '#18181B',    // Zinc-900 elevated surface

  // Accent colors
  turmeric:     '#FBBF24',    // Warm Amber

  // Header & section tones
  brown:        '#09090B',
  brownMid:     '#18181B',
  brownLight:   '#27272A',

  // Fresh green for pure veg & success
  green:        '#22C55E',    // Bright Emerald
  greenLight:   '#4ADE80',
  greenPale:    '#052E16',

  // High-contrast text
  text:         '#FAFAFA',    // Zinc-50 bright, ultra-crisp
  textMuted:    '#A1A1AA',    // Zinc-400
  textLight:    '#71717A',    // Zinc-500

  // Surfaces (Solid, high-contrast cards)
  white:        '#FFFFFF',
  cardBg:       '#18181B',    // Zinc-900 solid card
  cardElevated: '#27272A',    // Zinc-800 elevated card

  // Clean borders
  border:       '#27272A',    // Zinc-800
  borderLight:  '#3F3F46',    // Zinc-700

  // Status colors
  error:        '#EF4444',
  errorPale:    '#450A0A',
  success:      '#22C55E',
  successPale:  '#052E16',

  // Overlays
  overlay:      'rgba(0, 0, 0, 0.75)',

  // Tab bar
  tabBarBg:     '#121114',
  tabBarBorder: '#27272A',
  tabInactive:  '#71717A',

  // Status bar
  statusBarStyle: 'light-content',
};

// Default colors
export const COLORS = DARK_COLORS;

export const FONTS = {
  regular:  { fontFamily: 'System', fontWeight: '400' },
  medium:   { fontFamily: 'System', fontWeight: '500' },
  semibold: { fontFamily: 'System', fontWeight: '600' },
  bold:     { fontFamily: 'System', fontWeight: '700' },
  heavy:    { fontFamily: 'System', fontWeight: '800' },
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
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 999,
};

export const SHADOW = {
  small: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
};
