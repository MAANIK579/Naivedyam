import React, { useEffect } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, ActivityIndicator, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemeProvider, useTheme }      from './src/context/ThemeContext';
import { AuthProvider, useAuth }        from './src/context/AuthContext';
import { SocketProvider }               from './src/context/SocketContext';
import { CartProvider, useCart }        from './src/context/CartContext';
import { FavoritesProvider }            from './src/context/FavoritesContext';
import { NotificationProvider, useNotifications } from './src/context/NotificationContext';

// Auth screens
import LoginScreen    from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';

// Main tab screens
import HomeScreen    from './src/screens/HomeScreen';
import MenuScreen    from './src/screens/MenuScreen';
import CartScreen    from './src/screens/CartScreen';
import TrackScreen   from './src/screens/TrackScreen';
import ProfileScreen from './src/screens/ProfileScreen';

// Stack screens
import SearchScreen         from './src/screens/SearchScreen';
import FavoritesScreen      from './src/screens/FavoritesScreen';
import AddressesScreen      from './src/screens/AddressesScreen';
import AddAddressScreen     from './src/screens/AddAddressScreen';
import PaymentScreen        from './src/screens/PaymentScreen';
import OrderDetailScreen    from './src/screens/OrderDetailScreen';
import ReviewScreen         from './src/screens/ReviewScreen';
import NotificationsScreen  from './src/screens/NotificationsScreen';
import CouponScreen         from './src/screens/CouponScreen';
import HelpScreen           from './src/screens/HelpScreen';
import OrderRatingScreen    from './src/screens/OrderRatingScreen';
import OrderSuccessScreen   from './src/screens/OrderSuccessScreen';
import OrderHistoryScreen   from './src/screens/OrderHistoryScreen';
import MyReviewsScreen      from './src/screens/MyReviewsScreen';

import { FONTS } from './src/theme';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

const TAB_ICONS = {
  Home:    { focused: 'home',       unfocused: 'home-outline' },
  Menu:    { focused: 'restaurant', unfocused: 'restaurant-outline' },
  Cart:    { focused: 'cart',       unfocused: 'cart-outline' },
  Track:   { focused: 'location',   unfocused: 'location-outline' },
  Profile: { focused: 'person',     unfocused: 'person-outline' },
};

function TabIcon({ routeName, focused, badgeCount, colors }) {
  const icons = TAB_ICONS[routeName] || TAB_ICONS.Home;
  const iconName = focused ? icons.focused : icons.unfocused;
  const color = focused ? colors.saffron : colors.tabInactive;

  return (
    <View style={{ alignItems: 'center', position: 'relative' }}>
      <Ionicons name={iconName} size={22} color={color} />
      {badgeCount > 0 && (
        <View style={[styles.badge, { backgroundColor: colors.saffron, borderColor: colors.tabBarBg }]}>
          <Text style={[styles.badgeTxt, { color: '#FFFFFF' }]}>{badgeCount > 9 ? '9+' : badgeCount}</Text>
        </View>
      )}
    </View>
  );
}

function MainTabs() {
  const { itemCount } = useCart();
  const { unreadCount } = useNotifications();
  const { colors, isDark } = useTheme();

  const screenOpts = {
    tabBarStyle: {
      backgroundColor: colors.tabBarBg,
      borderTopColor: colors.tabBarBorder,
      borderTopWidth: 1,
      height: 62,
      paddingBottom: 8,
      paddingTop: 6,
      elevation: 4,
    },
    tabBarActiveTintColor:   colors.saffron,
    tabBarInactiveTintColor: colors.tabInactive,
    tabBarLabelStyle:        { ...FONTS.bold, fontSize: 11 },
    headerStyle:             { backgroundColor: colors.cardBg },
    headerTitleStyle:        { color: colors.text, ...FONTS.heavy, fontSize: 18 },
    headerTintColor:         colors.text,
    headerShadowVisible:     false,
  };

  return (
    <Tab.Navigator screenOptions={screenOpts}>
      <Tab.Screen name="Home" component={HomeScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon routeName="Home" focused={focused} colors={colors} />,
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen name="Menu" component={MenuScreen}
        options={{
          title: 'Menu',
          tabBarIcon: ({ focused }) => <TabIcon routeName="Menu" focused={focused} colors={colors} />,
          tabBarLabel: 'Menu',
        }}
      />
      <Tab.Screen name="Cart" component={CartScreen}
        options={{
          title: 'Your Cart',
          tabBarIcon: ({ focused }) => <TabIcon routeName="Cart" focused={focused} badgeCount={itemCount} colors={colors} />,
          tabBarLabel: 'Cart',
        }}
      />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login"    component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

function AppStack() {
  const { colors } = useTheme();

  const commonHeader = {
    headerStyle:          { backgroundColor: colors.cardBg },
    headerTitleStyle:     { color: colors.text, ...FONTS.heavy },
    headerTintColor:      colors.text,
    headerShadowVisible:  false,
  };

  return (
    <Stack.Navigator screenOptions={commonHeader}>
      <Stack.Screen name="MainTabs"      component={MainTabs}           options={{ headerShown: false }} />
      <Stack.Screen name="Profile"       component={ProfileScreen}      options={{ headerShown: false }} />
      <Stack.Screen name="Track"         component={TrackScreen}        options={{ headerShown: false }} />
      <Stack.Screen name="Search"        component={SearchScreen}       options={{ title: 'Search Dishes' }} />
      <Stack.Screen name="Favorites"     component={FavoritesScreen}    options={{ title: 'My Favorites' }} />
      <Stack.Screen name="Addresses"     component={AddressesScreen}    options={{ title: 'Saved Addresses' }} />
      <Stack.Screen name="AddAddress"    component={AddAddressScreen}   options={{ title: 'Add Delivery Address' }} />
      <Stack.Screen name="Payment"       component={PaymentScreen}      options={{ title: 'Payment Options' }} />
      <Stack.Screen name="OrderDetail"   component={OrderDetailScreen}  options={{ title: 'Order Details' }} />
      <Stack.Screen name="Review"        component={ReviewScreen}       options={{ title: 'Rate Your Meal' }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
      <Stack.Screen name="Coupon"        component={CouponScreen}       options={{ title: 'Apply Coupon' }} />
      <Stack.Screen name="Help"          component={HelpScreen}         options={{ headerShown: false }} />
      <Stack.Screen name="OrderRating"   component={OrderRatingScreen}  options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="OrderSuccess"  component={OrderSuccessScreen} options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="MyReviews"     component={MyReviewsScreen}    options={{ title: 'My Reviews' }} />
      <Stack.Screen name="OrderHistory"  component={OrderHistoryScreen} options={{ title: 'Order History' }} />
    </Stack.Navigator>
  );
}

function RootNavigator() {
  const { user, loading: authLoading } = useAuth();
  const { colors, isDark, loading: themeLoading } = useTheme();
  const { setNavigation } = useNotifications();
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    if (navigationRef && setNavigation) {
      setNavigation(navigationRef);
    }
  }, [navigationRef, setNavigation]);

  const loading = authLoading || themeLoading;

  if (loading) {
    return (
      <View style={[styles.splash, { backgroundColor: colors.cardBg }]}>
        <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.cardBg} />
        <Ionicons name="flame" size={56} color={colors.saffron} />
        <Text style={[styles.splashTitle, { color: colors.text }]}>Navedyam</Text>
        <Text style={[styles.splashSub, { color: colors.saffron }]}>CLOUD KITCHEN · BHIWANI</Text>
        <ActivityIndicator color={colors.saffron} style={{ marginTop: 24 }} size="large" />
      </View>
    );
  }

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: colors.saffron,
      background: colors.cream,
      card: colors.cardBg,
      text: colors.text,
      border: colors.border,
    },
  };

  return (
    <>
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.cardBg} />
      <NavigationContainer ref={navigationRef} theme={navTheme}>
        {user ? <AppStack /> : <AuthStack />}
      </NavigationContainer>
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <NotificationProvider>
              <FavoritesProvider>
                <CartProvider>
                  <RootNavigator />
                </CartProvider>
              </FavoritesProvider>
            </NotificationProvider>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashTitle: { fontSize: 32, ...FONTS.heavy, letterSpacing: 0.5, marginTop: 14 },
  splashSub:   { fontSize: 11, letterSpacing: 2.5, textTransform: 'uppercase', marginTop: 4 },
  badge: {
    position: 'absolute', top: -5, right: -10,
    borderRadius: 9,
    minWidth: 17, height: 17, alignItems: 'center',
    justifyContent: 'center', paddingHorizontal: 3,
    borderWidth: 1.5,
  },
  badgeTxt: { fontSize: 9, ...FONTS.bold },
});
