import React from 'react';
import {
  StyleSheet,
  View,
  Image,
  Pressable,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { router, usePathname } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from './themed-text';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/context/AuthContext';
import { usePosts } from '@/context/PostsContext';
import { useNotifications } from '@/context/NotificationsContext';
import { useChat } from '@/context/ChatContext';

interface DesktopSidebarProps {
  currentTab?: string;
}

export function DesktopSidebar({ currentTab }: DesktopSidebarProps) {
  const theme = useTheme();
  const { user } = useAuth();
  const { userProfile } = usePosts();
  const { unreadCount } = useNotifications();
  const { conversations } = useChat();
  const { width } = useWindowDimensions();
  const pathname = usePathname();

  const isDesktop = width >= 768;
  if (!isDesktop) return null;

  const unreadMessagesCount = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  const cleanUsername = userProfile?.username?.replace('@', '').toLowerCase();
  const isProfileActive =
    currentTab === 'profile' ||
    pathname === '/(tabs)/profile' ||
    (pathname.startsWith('/profile/') && (
      (user?.id && pathname === `/profile/${user.id}`) ||
      (cleanUsername && pathname.toLowerCase() === `/profile/${cleanUsername}`)
    ));

  const navItems: Array<{
    name: string;
    label: string;
    icon: keyof typeof MaterialIcons.glyphMap;
    activeIcon: keyof typeof MaterialIcons.glyphMap;
    path: string;
    badge?: number;
  }> = [
    {
      name: 'index',
      label: 'Início',
      icon: 'home',
      activeIcon: 'home',
      path: '/(tabs)',
    },
    {
      name: 'explore',
      label: 'Pesquisar',
      icon: 'search',
      activeIcon: 'search',
      path: '/(tabs)/explore',
    },
    {
      name: 'notifications',
      label: 'Notificações',
      icon: 'notifications-none',
      activeIcon: 'notifications',
      path: '/(tabs)/notifications',
      badge: unreadCount,
    },
    {
      name: 'messages',
      label: 'Mensagens',
      icon: 'mail-outline',
      activeIcon: 'mail',
      path: '/(tabs)/messages',
      badge: unreadMessagesCount,
    },
  ];

  const checkIsFocused = (itemName: string) => {
    if (currentTab) {
      return currentTab === itemName;
    }
    if (itemName === 'index') {
      return pathname === '/' || pathname === '/(tabs)' || pathname.startsWith('/post');
    }
    if (itemName === 'messages') {
      return pathname.includes('messages') || pathname.startsWith('/chat');
    }
    if (itemName === 'notifications') {
      return pathname.includes('notifications');
    }
    if (itemName === 'explore') {
      return pathname.includes('explore');
    }
    return false;
  };

  return (
    <View style={[styles.sidebarContainer, { backgroundColor: theme.background, borderRightColor: theme.border }]}>
      {/* Brand Header */}
      <Pressable
        onPress={() => router.push('/(tabs)')}
        style={({ pressed }: any) => [
          styles.brandContainer,
          pressed && { opacity: 0.8 },
        ]}
      >
        {({ hovered }: any) => (
          <>
            <View style={[styles.brandLogoBg, { backgroundColor: theme.brand }, hovered && styles.brandPop]}>
              <MaterialIcons name="pets" size={24} color="#FFF" />
            </View>
            <ThemedText style={styles.brandTitle}>Pet-X</ThemedText>
          </>
        )}
      </Pressable>

      {/* Navigation Items */}
      <View style={styles.navGroup}>
        {navItems.map((item) => {
          const isFocused = checkIsFocused(item.name);

          return (
            <Pressable
              key={item.name}
              onPress={() => router.push(item.path as any)}
              style={({ pressed, hovered }: any) => [
                styles.sidebarNavItem,
                isFocused && { backgroundColor: theme.backgroundElement },
                hovered && !isFocused && { backgroundColor: 'rgba(255, 107, 74, 0.08)' },
                pressed && styles.buttonPressed,
              ]}
            >
              {({ hovered }: any) => {
                const activeColor = isFocused || hovered ? theme.brand : theme.textSecondary;
                const iconName = isFocused ? item.activeIcon : item.icon;
                const showBadge = Boolean(item.badge && item.badge > 0);

                return (
                  <>
                    <View style={[styles.navIconWrapper, (hovered || isFocused) && styles.iconPop]}>
                      <MaterialIcons name={iconName} size={26} color={activeColor} />
                      {showBadge && (
                        <View style={[styles.sidebarBadge, { backgroundColor: theme.brand }]}>
                          <ThemedText style={styles.sidebarBadgeText}>
                            {(item.badge || 0) > 99 ? '99+' : item.badge}
                          </ThemedText>
                        </View>
                      )}
                    </View>
                    <ThemedText
                      style={[
                        styles.sidebarNavLabel,
                        { color: isFocused || hovered ? theme.text : theme.textSecondary },
                        (isFocused || hovered) && { fontWeight: '700' },
                      ]}
                    >
                      {item.label}
                    </ThemedText>
                  </>
                );
              }}
            </Pressable>
          );
        })}
      </View>

      {/* Action Button: Novo Post */}
      <Pressable
        style={({ pressed, hovered }: any) => [
          styles.sidebarPostBtn,
          { backgroundColor: theme.brand },
          hovered && styles.sidebarPostBtnHovered,
          pressed && styles.buttonPressed,
        ]}
        onPress={() => router.push('/(tabs)/post')}
      >
        {({ hovered }: any) => (
          <>
            <View style={[styles.addIconWrapper, hovered && styles.iconRotatePop]}>
              <MaterialIcons name="add" size={22} color="#FFF" />
            </View>
            <ThemedText style={styles.sidebarPostBtnText}>Novo Post</ThemedText>
          </>
        )}
      </Pressable>

      {/* User Profile Summary */}
      <View style={[styles.sidebarFooter, { borderTopColor: theme.border }]}>
        <Pressable
          style={({ pressed, hovered }: any) => [
            styles.sidebarUserProfile,
            isProfileActive && { backgroundColor: theme.backgroundElement },
            hovered && !isProfileActive && { backgroundColor: 'rgba(255, 107, 74, 0.08)' },
            pressed && styles.buttonPressed,
          ]}
          onPress={() => router.push('/(tabs)/profile')}
        >
          {({ hovered }: any) => (
            <>
              {userProfile?.avatar ? (
                <Image
                  source={{ uri: userProfile.avatar }}
                  style={[
                    styles.sidebarAvatar,
                    (hovered || isProfileActive) && styles.avatarPop,
                  ]}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={[
                    styles.sidebarAvatar,
                    styles.avatarPlaceholder,
                    { backgroundColor: theme.brand },
                    (hovered || isProfileActive) && styles.avatarPop,
                  ]}
                >
                  <ThemedText style={styles.avatarPlaceholderText}>
                    {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : 'U'}
                  </ThemedText>
                </View>
              )}
              <View style={styles.sidebarUserInfo}>
                <ThemedText style={styles.sidebarUserName} numberOfLines={1}>
                  {userProfile?.name || 'Meu Perfil'}
                </ThemedText>
                <ThemedText style={[styles.sidebarUserHandle, { color: theme.textSecondary }]} numberOfLines={1}>
                  {userProfile?.username || '@perfil'}
                </ThemedText>
              </View>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebarContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 260,
    borderRightWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
    justifyContent: 'space-between',
    zIndex: 100,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 24,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  brandLogoBg: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  brandPop: {
    transform: [{ scale: 1.08 }],
  },
  navGroup: {
    flex: 1,
    gap: 6,
  },
  sidebarNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 24,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.15s ease-in-out',
      },
    }),
  },
  navIconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginRight: 16,
  },
  sidebarBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  sidebarBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  sidebarNavLabel: {
    fontSize: 17,
    fontWeight: '600',
  },
  iconPop: {
    transform: [{ scale: 1.1 }],
  },
  sidebarPostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 28,
    marginTop: 16,
    marginBottom: 16,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        boxShadow: '0px 4px 14px rgba(255, 107, 74, 0.35)',
        transition: 'all 0.15s ease-in-out',
      },
    }),
  },
  sidebarPostBtnHovered: {
    transform: [{ scale: 1.02 }],
  },
  addIconWrapper: {
    marginRight: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconRotatePop: {
    transform: [{ scale: 1.15 }, { rotate: '90deg' }],
  },
  sidebarPostBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  sidebarFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
  },
  sidebarUserProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 24,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.15s ease-in-out',
      },
    }),
  },
  sidebarAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  avatarPop: {
    transform: [{ scale: 1.06 }],
  },
  sidebarUserInfo: {
    flex: 1,
  },
  sidebarUserName: {
    fontSize: 14,
    fontWeight: '700',
  },
  sidebarUserHandle: {
    fontSize: 12,
    marginTop: 1,
  },
  buttonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
});
