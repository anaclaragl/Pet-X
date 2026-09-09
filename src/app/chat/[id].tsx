import React, { useState, useRef } from 'react';
import { StyleSheet, View, Image, TextInput, Pressable, FlatList, KeyboardAvoidingView, Platform, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { useChat } from '@/context/ChatContext';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DesktopSidebar } from '@/components/desktop-sidebar';

export default function ChatScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { conversations, sendMessage } = useChat();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const [text, setText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const conversation = conversations.find((c) => c.id === id);

  const handleSend = () => {
    if (!text.trim() || !id) return;
    sendMessage(id, text.trim());
    setText('');
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  if (!conversation) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <DesktopSidebar currentTab="messages" />
        <View style={[styles.mainArea, isDesktop && { marginLeft: 260 }]}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <MaterialIcons name="arrow-back" size={24} color={theme.text} />
            </Pressable>
            <ThemedText type="subtitle">Conversa não encontrada</ThemedText>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <DesktopSidebar currentTab="messages" />
      <View style={[styles.mainArea, isDesktop && { marginLeft: 260 }]}>
        <View style={styles.responsiveWrapper}>
          <KeyboardAvoidingView 
            style={{ flex: 1 }} 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <MaterialIcons name="arrow-back" size={24} color={theme.text} />
            </Pressable>
            <Image source={{ uri: conversation.userAvatar }} style={styles.avatar} />
            <View style={styles.headerInfo}>
              <ThemedText style={styles.userName}>{conversation.userName}</ThemedText>
              <ThemedText style={{ fontSize: 12, color: theme.textSecondary }}>Ativo recentemente</ThemedText>
            </View>
          </View>

        {/* Message History */}
        <FlatList
          ref={flatListRef}
          data={conversation.messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesContainer}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => (
            <View
              style={[
                styles.messageBubble,
                item.isUser
                  ? [styles.userBubble, { backgroundColor: theme.brand }]
                  : [styles.otherBubble, { backgroundColor: theme.backgroundElement, borderColor: theme.border }],
              ]}
            >
              <ThemedText
                style={[
                  styles.messageText,
                  { color: item.isUser ? '#FFF' : theme.text },
                ]}
              >
                {item.text}
              </ThemedText>
              <ThemedText
                style={[
                  styles.timestampText,
                  { color: item.isUser ? 'rgba(255,255,255,0.75)' : theme.textSecondary },
                ]}
              >
                {item.timestamp}
              </ThemedText>
            </View>
          )}
        />

        {/* Input Bar */}
        <View style={[styles.inputBar, { borderTopColor: theme.border, backgroundColor: theme.background }]}>
          <TextInput
            style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text, borderColor: theme.border }]}
            placeholder="Digite uma mensagem..."
            placeholderTextColor={theme.textSecondary}
            value={text}
            onChangeText={setText}
            multiline
          />
          <Pressable
            style={[
              styles.sendButton,
              { backgroundColor: theme.brand, opacity: text.trim() ? 1 : 0.5 },
            ]}
            onPress={handleSend}
            disabled={!text.trim()}
          >
            <MaterialIcons name="send" size={20} color="#FFF" />
          </Pressable>
        </View>
        </KeyboardAvoidingView>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainArea: {
    flex: 1,
    width: '100%',
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  userName: {
    fontWeight: '700',
    fontSize: 16,
  },
  messagesContainer: {
    padding: 16,
    gap: 12,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  userBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  timestampText: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    borderWidth: 1,
    fontSize: 15,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
