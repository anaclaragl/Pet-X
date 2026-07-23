import { StyleSheet, View, FlatList, Image, Pressable } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/use-theme';
import { useChat } from '@/context/ChatContext';
import { MaterialIcons } from '@expo/vector-icons';

export default function MessagesScreen() {
  const theme = useTheme();
  const { conversations } = useChat();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.responsiveWrapper}>
        <ThemedView style={[styles.header, { borderBottomColor: theme.border }]}>
          <ThemedText type="title" style={{ fontSize: 24, color: theme.text }}>Mensagens</ThemedText>
        </ThemedView>

        {conversations.length === 0 ? (
          <View style={styles.emptyContent}>
            <MaterialIcons name="chat-bubble-outline" size={64} color={theme.border} />
            <ThemedText style={{ marginTop: 16, color: theme.textSecondary }}>
              Suas conversas aparecerão aqui.
            </ThemedText>
          </View>
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable 
                style={[styles.conversationItem, { borderBottomColor: theme.border }]}
                onPress={() => router.push(`/chat/${item.id}` as any)}
              >
                <Image source={{ uri: item.userAvatar }} style={styles.avatar} resizeMode="cover" />
                <View style={styles.contentContainer}>
                  <View style={styles.topRow}>
                    <ThemedText style={styles.userName}>{item.userName}</ThemedText>
                    <ThemedText style={[styles.timeText, { color: theme.textSecondary }]}>
                      {item.lastTime}
                    </ThemedText>
                  </View>
                  <View style={styles.bottomRow}>
                    <ThemedText 
                      numberOfLines={1} 
                      style={[styles.lastMessage, { color: item.unreadCount > 0 ? theme.text : theme.textSecondary, fontWeight: item.unreadCount > 0 ? '600' : '400' }]}
                    >
                      {item.lastMessage}
                    </ThemedText>
                    {item.unreadCount > 0 && (
                      <View style={[styles.badge, { backgroundColor: theme.brand }]}>
                        <ThemedText style={styles.badgeText}>{item.unreadCount}</ThemedText>
                      </View>
                    )}
                  </View>
                </View>
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
    padding: 16,
    borderBottomWidth: 1,
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 14,
  },
  contentContainer: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
  },
  timeText: {
    fontSize: 12,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    flex: 1,
    fontSize: 14,
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
