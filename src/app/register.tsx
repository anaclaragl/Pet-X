import { useState } from 'react';
import { StyleSheet, TextInput, Pressable, View, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';

export default function RegisterScreen() {
  const theme = useTheme();
  const [accountType, setAccountType] = useState<'fisica' | 'ong'>('fisica');
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = () => {
    // Simulate register and navigate
    router.replace('/(tabs)');
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <ThemedText type="title" style={{ color: theme.brand, marginBottom: 8 }}>Pet-X</ThemedText>
          <ThemedText type="subtitle">Crie sua conta</ThemedText>
        </View>

        <View style={styles.form}>
          <View style={styles.typeSelector}>
            <Pressable
              style={[
                styles.typeButton,
                { borderColor: theme.border },
                accountType === 'fisica' && { backgroundColor: theme.brand, borderColor: theme.brand }
              ]}
              onPress={() => setAccountType('fisica')}
            >
              <ThemedText style={{ color: accountType === 'fisica' ? '#FFF' : theme.text }}>Pessoa Física</ThemedText>
            </Pressable>
            <Pressable
              style={[
                styles.typeButton,
                { borderColor: theme.border },
                accountType === 'ong' && { backgroundColor: theme.brand, borderColor: theme.brand }
              ]}
              onPress={() => setAccountType('ong')}
            >
              <ThemedText style={{ color: accountType === 'ong' ? '#FFF' : theme.text }}>ONG</ThemedText>
            </Pressable>
          </View>

          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.border }]}
            placeholder={accountType === 'fisica' ? "Nome Completo" : "Nome da ONG"}
            placeholderTextColor={theme.textSecondary}
            value={name}
            onChangeText={setName}
          />
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.flex2, { color: theme.text, borderColor: theme.border }]}
              placeholder="Cidade"
              placeholderTextColor={theme.textSecondary}
              value={city}
              onChangeText={setCity}
            />
            <TextInput
              style={[styles.input, styles.flex1, { color: theme.text, borderColor: theme.border }]}
              placeholder="Estado (UF)"
              placeholderTextColor={theme.textSecondary}
              value={state}
              onChangeText={setState}
              maxLength={2}
              autoCapitalize="characters"
            />
          </View>
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
            onPress={handleRegister}
          >
            <ThemedText style={styles.buttonText}>Cadastrar</ThemedText>
          </Pressable>

          <Pressable onPress={() => router.back()} style={styles.linkContainer}>
            <ThemedText type="small">Já tem conta? <ThemedText type="smallBold" style={{ color: theme.brand }}>Faça login</ThemedText></ThemedText>
          </Pressable>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    justifyContent: 'center',
    flexGrow: 1,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  form: {
    gap: 16,
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  typeButton: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  flex2: {
    flex: 2,
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
