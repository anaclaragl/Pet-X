import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { View, Platform, StyleSheet } from 'react-native';
import { AppThemeProvider, useAppTheme } from '@/hooks/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { PostsProvider } from '@/context/PostsContext';
import { ChatProvider } from '@/context/ChatContext';
import { NotificationsProvider } from '@/context/NotificationsContext';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { colorScheme } = useAppTheme();
  return (
    <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <View style={styles.appContainer}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="chat/[id]" />
          <Stack.Screen name="post/[id]" />
          <Stack.Screen name="notifications" />
        </Stack>
      </View>
    </NavigationThemeProvider>
  );
}

export default function TabLayout() {
  return (
    <AppThemeProvider>
      <AuthProvider>
        <PostsProvider>
          <ChatProvider>
            <NotificationsProvider>
              <RootLayoutNav />
            </NotificationsProvider>
          </ChatProvider>
        </PostsProvider>
      </AuthProvider>
    </AppThemeProvider>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
  }
});
