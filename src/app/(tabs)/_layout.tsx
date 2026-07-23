import { useTheme } from '@/hooks/use-theme';
import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { View } from 'react-native';

export default function TabsLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.brand,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopColor: theme.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          elevation: 0,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="home" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Pesquisa',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="search" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="post"
        options={{
          title: 'Postar',
          tabBarIcon: ({ color }) => (
            <View style={{
              backgroundColor: theme.brand,
              width: 52,
              height: 52,
              borderRadius: 26,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 25,
              shadowColor: theme.brand,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 6,
              elevation: 4,
            }}>
              <MaterialIcons name="add" size={30} color="#FFF" />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Mensagens',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="mail-outline" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="person-outline" size={28} color={color} />,
        }}
      />
    </Tabs>
  );
}
