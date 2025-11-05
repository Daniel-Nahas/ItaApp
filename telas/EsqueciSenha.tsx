// telas/EsqueciSenha.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useTheme } from './ThemeContext';
import api from '../components/Api';

export default function EsqueciSenha({ navigation }: any) {
  const { styles, isAccessible } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const enviarRecuperacao = async () => {
    if (!email) {
      Alert.alert('Erro', 'Por favor, insira seu email.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/forgot', { email });
      Alert.alert('Verifique seu email', 'Se o email estiver cadastrado, você receberá instruções para redefinir a senha.');
      navigation.replace('Login');
    } catch (err) {
      console.error('Erro forgot:', err);
      Alert.alert('Erro', 'Não foi possível processar a solicitação no momento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recuperar Senha</Text>

      <TextInput
        style={styles.input}
        placeholder="Digite seu email"
        placeholderTextColor={isAccessible ? '#ccc' : '#666'}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TouchableOpacity style={styles.btn} onPress={enviarRecuperacao} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTxt}>Enviar para email</Text>}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.replace('Login')}
      >
        <Text style={styles.btnTxt}>Sair</Text>
      </TouchableOpacity>

    </View>
  );
}
