// src/theme.js — Craving Design Tokens for Navedyam App
// Exact tokens from design specification:
// bg: #121A16 | card: #1B2620 | border: #33463C | text: #FFFFFF | muted: #A3B5AA
// mood-comfort: #F5B042, blob #FFD998, text #2B1A05
// mood-fresh: #8FE0A0, blob #BFF0CA, text #0F2A10
// mood-fire: #EE5F45, blob #FF9783, text #FFFFFF
// mood-sweet: #F6BDD3, blob #FDE0EC, text #3A0F25

export const MOODS = {
  comfort: {
    id: 'comfort',
    name: 'Comfort',
    subtitle: 'Warm, slow, heavy.',
    color: '#F5B042',
    blobColor: '#FFD998',
    textColor: '#2B1A05',
    gradientFrom: '#E69E2E',
    gradientTo: '#FCD78E',
  },
  fresh: {
    id: 'fresh',
    name: 'Fresh',
    subtitle: 'Light, crisp, bright.',
    color: '#8FE0A0',
    blobColor: '#BFF0CA',
    textColor: '#0F2A10',
    gradientFrom: '#74CD86',
    gradientTo: '#C2FAD2',
  },
  fire: {
    id: 'fire',
    name: 'Fire',
    subtitle: 'Spicy, smoky, bold.',
    color: '#EE5F45',
    blobColor: '#FF9783',
    textColor: '#FFFFFF',
    gradientFrom: '#DE4529',
    gradientTo: '#FFA08E',
  },
  sweet: {
    id: 'sweet',
    name: 'Sweet',
    subtitle: 'Dessert, treat, joy.',
    color: '#F6BDD3',
    blobColor: '#FDE0EC',
    textColor: '#3A0F25',
    gradientFrom: '#EAA2BF',
    gradientTo: '#FFE3EF',
  },
};

export const DARK_COLORS = {
  // Brand accents & moods
  saffron:      '#F5B042',    // Primary mood accent (Comfort amber)
  saffronLight: '#FFD998',
  saffronDeep:  '#E69E2E',
  saffronPale:  '#2B1A05',

  // Mood Tokens
  moodComfort:     '#F5B042',
  moodComfortBlob: '#FFD998',
  moodComfortText: '#2B1A05',

  moodFresh:       '#8FE0A0',
  moodFreshBlob:   '#BFF0CA',
  moodFreshText:   '#0F2A10',

  moodFire:        '#EE5F45',
  moodFireBlob:    '#FF9783',
  moodFireText:    '#FFFFFF',

  moodSweet:       '#F6BDD3',
  moodSweetBlob:   '#FDE0EC',
  moodSweetText:   '#3A0F25',

  // App Canvas Backgrounds
  cream:        '#121A16',    // bg: #121A16
  creamDark:    '#1B2620',    // card: #1B2620
  cardBg:       '#1B2620',    // card: #1B2620
  cardElevated: '#24332B',

  // Accent colors
  turmeric:     '#F5B042',
  brown:        '#121A16',
  brownMid:     '#1B2620',
  brownLight:   '#33463C',

  // Fresh green
  green:        '#8FE0A0',
  greenLight:   '#BFF0CA',
  greenPale:    '#0F2A10',

  // Text tokens
  text:         '#FFFFFF',    // text: #FFFFFF
  textMuted:    '#A3B5AA',    // muted: #A3B5AA
  textLight:    '#7D9184',    // deeper muted

  // Surfaces & borders
  white:        '#FFFFFF',
  border:       '#33463C',    // border: #33463C
  borderLight:  '#283830',

  // Status colors
  error:        '#EE5F45',
  errorPale:    '#3A120B',
  success:      '#8FE0A0',
  successPale:  '#0F2A10',

  // Overlays
  overlay:      'rgba(0, 0, 0, 0.75)',

  // Tab bar
  tabBarBg:     '#121A16',
  tabBarBorder: '#33463C',
  tabInactive:  '#A3B5AA',

  // Status bar
  statusBarStyle: 'light-content',
};

export const LIGHT_COLORS = {
  ...DARK_COLORS,
  // Craving is a deep culinary aesthetic by design, but we support clean contrast for light preference
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
  md: 16,
  lg: 26,     // Large cards/tiles: radius 26-32px
  xl: 28,     // Fully rounded buttons: height 56px, radius 28px
  xxl: 32,    // Tile Large radius
  chip: 20,   // Chips radius 20px
  full: 999,
};

export const SHADOW = {
  small: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  medium: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  large: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
};
