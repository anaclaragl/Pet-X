import { ThemedText } from '@/components/themed-text';
import { usePosts } from '@/context/PostsContext';
import { useTheme } from '@/hooks/use-theme';
import { MaterialIcons } from '@expo/vector-icons';
import { Tabs, router } from 'expo-router';
import { Image, Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

interface TabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

function ResponsiveTabBar({ state, descriptors, navigation }: TabBarProps) {
  const theme = useTheme();
  const { userProfile } = usePosts();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const routes = state.routes || [];
  const currentRouteName = routes[state.index]?.name;

  if (isDesktop) {
    const desktopRoutes = routes.filter((r: any) => r.name !== 'post');

    return (
      <View style={[styles.sidebarContainer, { backgroundColor: theme.background, borderRightColor: theme.border }]}>
        {/* Brand Header */}
        <Pressable
          onPress={() => router.push('/(tabs)')}
          style={({ pressed, hovered }: any) => [
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

        {/* Navigation Items (Sem 'post', que já tem o botão de destaque abaixo) */}
        <View style={styles.navGroup}>
          {desktopRoutes.map((route: any) => {
            const isFocused = currentRouteName === route.name;
            const { options } = descriptors[route.key];

            let iconName: keyof typeof MaterialIcons.glyphMap = 'home';
            let label = options.title || route.name;

            if (route.name === 'index') {
              iconName = 'home';
              label = 'Início';
            } else if (route.name === 'explore') {
              iconName = 'search';
              label = 'Pesquisar';
            } else if (route.name === 'messages') {
              iconName = 'mail-outline';
              label = 'Mensagens';
            } else if (route.name === 'profile') {
              iconName = 'person-outline';
              label = 'Perfil';
            }

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

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                style={({ pressed, hovered }: any) => [
                  styles.sidebarNavItem,
                  isFocused && { backgroundColor: theme.backgroundElement },
                  hovered && !isFocused && { backgroundColor: 'rgba(255, 107, 107, 0.08)' },
                  pressed && styles.buttonPressed,
                ]}
              >
                {({ hovered }: any) => {
                  const activeColor = isFocused || hovered ? theme.brand : theme.textSecondary;
                  return (
                    <>
                      <View style={[styles.navIconWrapper, (hovered || isFocused) && styles.iconPop]}>
                        <MaterialIcons
                          name={iconName}
                          size={26}
                          color={activeColor}
                        />
                      </View>
                      <ThemedText
                        style={[
                          styles.sidebarNavLabel,
                          { color: isFocused || hovered ? theme.text : theme.textSecondary },
                          (isFocused || hovered) && { fontWeight: '700' },
                        ]}
                      >
                        {label}
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
        <Pressable
          style={({ pressed, hovered }: any) => [
            styles.sidebarUserProfile,
            { borderTopColor: theme.border },
            hovered && { backgroundColor: theme.backgroundElement, borderRadius: 16 },
            pressed && styles.buttonPressed,
          ]}
          onPress={() => router.push('/(tabs)/profile')}
        >
          {({ hovered }: any) => (
            <>
              <Image 
                source={{ uri: userProfile.avatar }} 
                style={[styles.sidebarAvatar, hovered && styles.avatarPop]} 
                resizeMode="cover" 
              />
              <View style={styles.sidebarUserInfo}>
                <ThemedText style={styles.sidebarUserName} numberOfLines={1}>
                  {userProfile.name}
                </ThemedText>
                <ThemedText style={[styles.sidebarUserHandle, { color: theme.textSecondary }]} numberOfLines={1}>
                  {userProfile.username}
                </ThemedText>
              </View>
            </>
          )}
        </Pressable>
      </View>
    );
  }

  // Mobile Bottom Bar Layout
  return (
    <View style={[styles.bottomBarContainer, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
      {routes.map((route: any, index: number) => {
        const isFocused = state.index === index;

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
        if (route.name === 'index') iconName = 'home';
        else if (route.name === 'explore') iconName = 'search';
        else if (route.name === 'messages') iconName = 'mail-outline';
        else if (route.name === 'profile') iconName = 'person-outline';

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={({ pressed }) => [styles.mobileNavItem, pressed && { opacity: 0.6 }]}
          >
            <MaterialIcons
              name={iconName}
              size={26}
              color={isFocused ? theme.brand : theme.textSecondary}
            />
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
      <Tabs.Screen name="explore" options={{ title: 'Pesquisa' }} />
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
  sidebarUserProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 14,
    borderTopWidth: 1,
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
});
