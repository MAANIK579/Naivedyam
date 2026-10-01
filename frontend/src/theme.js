// src/theme.js — Light/Dark mode design system with Glassmorphic visual tokens

// Light Mode Colors (Crisp pearl & frosted emerald/amber glass)
export const LIGHT_COLORS = {
  // Primary green tones
  saffron:      '#16A34A',
  saffronLight: '#22C55E',
  saffronDeep:  '#166534',
  saffronPale:  'rgba(22, 163, 74, 0.12)',

  // Background tones (light)
  cream:        '#F8FAF8',
  creamDark:    '#F1F5F2',

  // Accent colors
  turmeric:     '#D97706',

  // Brown / Dark Green tones
  brown:        '#166534',
  brownMid:     '#15803D',
  brownLight:   '#22C55E',

  // Green accents
  green:        '#16A34A',
  greenLight:   '#22C55E',
  greenPale:    'rgba(34, 197, 94, 0.12)',

  // Text colors
  text:         '#0F172A',
  textMuted:    '#475569',    // Slate 600 — accessible readable muted text
  textLight:    '#64748B',    // Slate 500 — secondary metadata

  // Surface colors
  white:        '#FFFFFF',
  cardBg:       'rgba(255, 255, 255, 0.82)',

  // Border colors
  border:       'rgba(226, 232, 240, 0.85)',
  borderLight:  'rgba(241, 245, 249, 0.9)',

  // Status colors
  error:        '#DC2626',
  errorPale:    '#FEF2F2',
  success:      '#16A34A',
  successPale:  '#F0FDF4',

  // Glassmorphism design tokens
  glass: {
    card:             'rgba(255, 255, 255, 0.84)',
    cardElevated:     'rgba(255, 255, 255, 0.94)',
    cardSubtle:       'rgba(255, 255, 255, 0.65)',
    border:           'rgba(255, 255, 255, 0.9)',
    borderSubtle:     'rgba(0, 0, 0, 0.07)',
    highlight:        '#FFFFFF',
    glow:             'rgba(22, 163, 74, 0.18)',
    glowAmber:        'rgba(245, 158, 11, 0.18)',
    pill:             'rgba(255, 255, 255, 0.78)',
    pillBorder:       'rgba(0, 0, 0, 0.08)',
    pillActive:       'rgba(22, 163, 74, 0.16)',
    pillActiveBorder: 'rgba(22, 163, 74, 0.45)',
    surface:          'rgba(255, 255, 255, 0.92)',
    overlay:          'rgba(15, 23, 42, 0.45)',
    orb1:             'rgba(34, 197, 94, 0.14)',
    orb2:             'rgba(245, 158, 11, 0.12)',
  },

  // Overlay
  overlay:      'rgba(15, 23, 42, 0.45)',

  // Tab bar
  tabBarBg:     'rgba(255, 255, 255, 0.92)',
  tabBarBorder: 'rgba(226, 232, 240, 0.8)',
  tabInactive:  '#94A3B8',

  // Status bar
  statusBarStyle: 'dark-content',
};

// Dark Mode Colors (Deep Obsidian & Espresso with Glowing Amber & Emerald Glass)
export const DARK_COLORS = {
  // Primary accent (Appetizing Warm Amber/Saffron)
  saffron:      '#F59E0B',
  saffronLight: '#FBBF24',
  saffronDeep:  '#D97706',
  saffronPale:  'rgba(245, 158, 11, 0.16)',

  // Background tones (Deep Obsidian / Charcoal)
  cream:        '#09090B',    // Zinc 950 - Deep rich obsidian
  creamDark:    '#131215',    // Base elevated surface

  // Accent colors
  turmeric:     '#FCD34D',    // Amber 300 - luminous highlight

  // Rich dark tones (Surfaces and headers)
  brown:        '#121113',    // Dark obsidian header
  brownMid:     '#1C1A1D',    // Secondary cards
  brownLight:   '#28262B',    // Hover/Pressed state

  // Green accents (Keep for veg badges, success states)
  green:        '#22C55E',
  greenLight:   '#4ADE80',
  greenPale:    'rgba(34, 197, 94, 0.14)',

  // Text colors (Crisp luminous off-whites)
  text:         '#FFFBF5',
  textMuted:    '#A1A1AA',    // Zinc 400
  textLight:    '#71717A',    // Zinc 500

  // Surface colors
  white:        '#FFFFFF',
  cardBg:       'rgba(255, 255, 255, 0.065)',

  // Border colors
  border:       'rgba(255, 255, 255, 0.12)',
  borderLight:  'rgba(255, 255, 255, 0.08)',

  // Status colors
  error:        '#EF4444',
  errorPale:    'rgba(239, 68, 68, 0.16)',
  success:      '#22C55E',
  successPale:  'rgba(34, 197, 94, 0.16)',

  // Glassmorphism design tokens
  glass: {
    card:             'rgba(255, 255, 255, 0.07)',
    cardElevated:     'rgba(255, 255, 255, 0.11)',
    cardSubtle:       'rgba(255, 255, 255, 0.04)',
    border:           'rgba(255, 255, 255, 0.14)',
    borderSubtle:     'rgba(255, 255, 255, 0.07)',
    highlight:        'rgba(255, 255, 255, 0.28)',
    glow:             'rgba(245, 158, 11, 0.25)',
    glowAmber:        'rgba(245, 158, 11, 0.25)',
    pill:             'rgba(255, 255, 255, 0.08)',
    pillBorder:       'rgba(255, 255, 255, 0.14)',
    pillActive:       'rgba(245, 158, 11, 0.22)',
    pillActiveBorder: 'rgba(245, 158, 11, 0.55)',
    surface:          'rgba(18, 17, 19, 0.94)',
    overlay:          'rgba(0, 0, 0, 0.75)',
    orb1:             'rgba(245, 158, 11, 0.2)',
    orb2:             'rgba(22, 163, 74, 0.14)',
  },

  // Overlay
  overlay:      'rgba(0, 0, 0, 0.75)',

  // Tab bar
  tabBarBg:     'rgba(18, 17, 19, 0.92)',
  tabBarBorder: 'rgba(255, 255, 255, 0.1)',
  tabInactive:  '#71717A',

  // Status bar
  statusBarStyle: 'light-content',
};

// Default to dark colors for backward compatibility
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
  lg: 18,
  xl: 24,
  xxl: 32,
  full: 999,
};

export const SHADOW = {
  small: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 4,
  },
  large: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
  },
  glassGlow: {
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 6,
  },
};

/**
 * Creates standard glassmorphic card styles
 */
export function getGlassCardStyle(colors, isDark, options = {}) {
  const {
    elevated = false,
    radius = RADIUS.lg,
    padding = SPACING.lg,
    withHighlight = true,
  } = options;

  const bg = elevated
    ? (colors.glass?.cardElevated || (isDark ? 'rgba(255,255,255,0.11)' : 'rgba(255,255,255,0.94)'))
    : (colors.glass?.card || (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.84)'));

  const borderColor = colors.glass?.border || (isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.08)');
  const borderTopColor = withHighlight
    ? (colors.glass?.highlight || (isDark ? 'rgba(255,255,255,0.28)' : '#FFFFFF'))
    : borderColor;

  return {
    backgroundColor: bg,
    borderRadius: radius,
    borderWidth: 1,
    borderColor,
    borderTopColor,
    padding,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: elevated ? 6 : 3 },
    shadowOpacity: isDark ? 0.35 : 0.08,
    shadowRadius: elevated ? 16 : 8,
    elevation: elevated ? 5 : 2,
  };
}
