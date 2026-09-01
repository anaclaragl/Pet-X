import React from 'react';
import { StyleSheet, View, FlatList, Image, Pressable } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { useNotifications, NotificationItem } from '@/context/NotificationsContext';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NotificationsScreen() {
  const theme = useTheme();
  const { notifications, markAsRead, markAllAsRead } = useNotifications();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/(tabs)');
    }
  };

  const handleNotificationPress = (item: NotificationItem) => {
    markAsRead(item.id);
    if (item.type === 'message' && item.targetId) {
      router.push(`/chat/${item.targetId}` as any);
    } else if (item.targetId) {
      router.push(`/post/${item.targetId}` as any);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <MaterialIcons name="favorite" size={20} color="#E0245E" />;
      case 'comment':
        return <MaterialIcons name="chat-bubble" size={20} color="#3B82F6" />;
      case 'message':
        return <MaterialIcons name="mail" size={20} color="#8B5CF6" />;
      case 'alert':
        return <MaterialIcons name="warning" size={20} color="#F59E0B" />;
      default:
        return <MaterialIcons name="notifications" size={20} color={theme.brand} />;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.responsiveWrapper}>
        <ThemedView style={[styles.header, { borderBottomColor: theme.border }]}>
          <View style={styles.headerTitleRow}>
            <Pressable onPress={handleBack} style={styles.backButton}>
              <MaterialIcons name="arrow-back" size={24} color={theme.text} />
            </Pressable>
            <ThemedText type="title" style={{ fontSize: 20 }}>Notificações</ThemedText>
          </View>
          <Pressable onPress={markAllAsRead}>
            <ThemedText style={{ color: theme.brand, fontSize: 13, fontWeight: '600' }}>
              Marcar lidas
            </ThemedText>
          </Pressable>
        </ThemedView>

        {notifications.length === 0 ? (
          <View style={styles.emptyContent}>
            <MaterialIcons name="notifications-none" size={64} color={theme.border} />
            <ThemedText style={{ marginTop: 16, color: theme.textSecondary }}>
              Nenhuma notificação por enquanto.
            </ThemedText>
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable
                style={[
                  styles.itemContainer,
                  {
                    borderBottomColor: theme.border,
                    backgroundColor: item.isRead ? theme.background : theme.backgroundElement,
                  },
                ]}
                onPress={() => handleNotificationPress(item)}
              >
                <View style={styles.iconContainer}>
                  {getNotificationIcon(item.type)}
                </View>
                <Image source={{ uri: item.userAvatar }} style={styles.avatar} resizeMode="cover" />
                <View style={styles.contentContainer}>
                  <ThemedText style={styles.itemText}>
                    <ThemedText style={{ fontWeight: '700' }}>{item.user} </ThemedText>
                    {item.text}
                  </ThemedText>
                  <ThemedText style={{ color: theme.textSecondary, fontSize: 12, marginTop: 4 }}>
                    {item.timestamp}
                  </ThemedText>
                </View>
                {!item.isRead && <View style={[styles.unreadDot, { backgroundColor: theme.brand }]} />}
              </Pressable>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  responsiveWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  itemContainer: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  iconContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  itemText: {
    fontSize: 14,
    lineHeight: 20,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
});
