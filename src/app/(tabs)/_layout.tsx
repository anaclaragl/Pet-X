import { DesktopSidebar } from '@/components/desktop-sidebar';
import { ThemedText } from '@/components/themed-text';
import { useNotifications } from '@/context/NotificationsContext';
import { usePosts } from '@/context/PostsContext';
import { useChat } from '@/context/ChatContext';
import { useTheme } from '@/hooks/use-theme';
import { MaterialIcons } from '@expo/vector-icons';
import { Tabs, router } from 'expo-router';
import { Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

interface TabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

function ResponsiveTabBar({ state, descriptors, navigation }: TabBarProps) {
  const theme = useTheme();
  const { conversations } = useChat();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const unreadMessagesCount = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  const routes = state.routes || [];
  const currentRouteName = routes[state.index]?.name;

  if (isDesktop) {
    return <DesktopSidebar currentTab={currentRouteName} />;
  }

  // Mobile Bottom Bar Layout
  const mobileRoutes = routes.filter((r: any) => r.name !== 'notifications');

  return (
    <View style={[styles.bottomBarContainer, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
      {mobileRoutes.map((route: any, index: number) => {
        const isFocused = currentRouteName === route.name;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        if (route.name === 'post') {
          return (
            <Pressable key={route.key} onPress={onPress} style={styles.mobilePostButtonWrapper}>
              <View style={[styles.mobilePostButton, { backgroundColor: theme.brand }]}>
                <MaterialIcons name="add" size={28} color="#FFF" />
              </View>
            </Pressable>
          );
        }

        let iconName: keyof typeof MaterialIcons.glyphMap = 'home';
        let showMobileBadge = false;
        let mobileBadgeValue = 0;

        if (route.name === 'index') iconName = 'home';
        else if (route.name === 'explore') iconName = 'search';
        else if (route.name === 'messages') {
          iconName = 'mail-outline';
          showMobileBadge = unreadMessagesCount > 0;
          mobileBadgeValue = unreadMessagesCount;
        } else if (route.name === 'profile') iconName = 'person-outline';

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={({ pressed }) => [styles.mobileNavItem, pressed && { opacity: 0.6 }]}
          >
            <View style={styles.mobileIconWrapper}>
              <MaterialIcons
                name={iconName}
                size={26}
                color={isFocused ? theme.brand : theme.textSecondary}
              />
              {showMobileBadge && (
                <View style={[styles.mobileBadge, { backgroundColor: theme.brand }]}>
                  <ThemedText style={styles.mobileBadgeText}>
                    {mobileBadgeValue > 9 ? '9+' : mobileBadgeValue}
                  </ThemedText>
                </View>
              )}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  return (
    <Tabs
      tabBar={(props) => <ResponsiveTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: {
          marginLeft: isDesktop ? 260 : 0,
          backgroundColor: theme.background,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Início' }} />
      <Tabs.Screen name="explore" options={{ title: 'Pesquisar' }} />
      <Tabs.Screen name="notifications" options={{ title: 'Notificações' }} />
      <Tabs.Screen name="post" options={{ title: 'Postar' }} />
      <Tabs.Screen name="messages" options={{ title: 'Mensagens' }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  buttonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
  brandPop: {
    transform: [{ scale: 1.12 }],
  },
  navIconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
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
  iconPop: {
    transform: [{ scale: 1.18 }],
  },
  addIconWrapper: {
    marginRight: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconRotatePop: {
    transform: [{ scale: 1.25 }, { rotate: '90deg' }],
  },
  avatarPop: {
    transform: [{ scale: 1.08 }],
  },
  sidebarPostBtnHovered: {
    transform: [{ scale: 1.025 }],
    ...Platform.select({
      web: {
        boxShadow: '0px 8px 20px rgba(255, 107, 107, 0.45)',
      },
    }),
  },
  // Desktop Sidebar Styles
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
    marginBottom: 28,
    paddingHorizontal: 8,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  brandLogoBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  navGroup: {
    gap: 6,
    flex: 1,
  },
  sidebarNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    gap: 14,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  sidebarNavLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  sidebarPostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 24,
    marginVertical: 16,
    ...Platform.select({
      web: {
        boxShadow: '0px 4px 12px rgba(255, 107, 107, 0.3)',
        cursor: 'pointer',
      },
      default: {
        shadowColor: '#FF6B6B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
      },
    }),
  },
  sidebarPostBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
  },
  sidebarFooter: {
    borderTopWidth: 1,
    paddingTop: 10,
  },
  sidebarUserProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  sidebarAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 10,
  },
  sidebarUserInfo: {
    flex: 1,
  },
  sidebarUserName: {
    fontWeight: '700',
    fontSize: 14,
  },
  sidebarUserHandle: {
    fontSize: 12,
  },

  // Mobile Bottom Bar Styles
  bottomBarContainer: {
    flexDirection: 'row',
    height: 60,
    borderTopWidth: 1,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: Platform.OS === 'ios' ? 14 : 0,
  },
  mobileNavItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  mobilePostButtonWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    top: -14,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  mobilePostButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.25)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 5,
      },
    }),
  },
  mobileIconWrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mobileBadge: {
    position: 'absolute',
    top: -3,
    right: -7,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  mobileBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '700',
  },
});
