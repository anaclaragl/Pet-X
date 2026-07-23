import { useState } from 'react';
import { StyleSheet, TextInput, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';

export default function LoginScreen() {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // Simulate login and navigate to tabs
    router.replace('/(tabs)');
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={{ color: theme.brand, marginBottom: 8 }}>Pet-X</ThemedText>
        <ThemedText type="subtitle">Entrar na sua conta</ThemedText>
      </View>

      <View style={styles.form}>
        <TextInput
          style={[styles.input, { color: theme.text, borderColor: theme.border }]}
          placeholder="E-mail"
          placeholderTextColor={theme.textSecondary}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={[styles.input, { color: theme.text, borderColor: theme.border }]}
          placeholder="Senha"
          placeholderTextColor={theme.textSecondary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        
        <Pressable 
          style={({ pressed }) => [
            styles.button, 
            { backgroundColor: theme.brand, opacity: pressed ? 0.8 : 1 }
          ]} 
          onPress={handleLogin}
        >
          <ThemedText style={styles.buttonText}>Entrar</ThemedText>
        </Pressable>

        <Pressable onPress={() => router.push('/register')} style={styles.linkContainer}>
          <ThemedText type="small">Ainda não tem conta? <ThemedText type="smallBold" style={{ color: theme.brand }}>Cadastre-se</ThemedText></ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 48,
    alignItems: 'center',
  },
  form: {
    gap: 16,
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: 'transparent',
  },
  button: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#F8FAFC',
    fontWeight: '600',
    fontSize: 16,
  },
  linkContainer: {
    marginTop: 24,
    alignItems: 'center',
  }
});
