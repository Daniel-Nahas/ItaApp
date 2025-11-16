// telas/AlterarEmail.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from './ThemeContext';
import { useAuth } from './AuthContext';
import api from '../components/Api';

const validateEmail = (email: string) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

export default function AlterarEmail({ navigation }: any) {
  const { styles } = useTheme();
  const { token } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const solicitarAlteracao = async () => {
    if (!validateEmail(email)) {
      Alert.alert('E-mail inválido', 'Digite um endereço de e-mail válido.');
      return;
    }
    setLoading(true);
    try {
      await api.post(
        '/users/email/change-request',
        { newEmail: email },
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      );
      Alert.alert(
        'Verificação enviada',
        'Enviamos um e-mail para o novo endereço com um link para confirmar a alteração. Verifique sua caixa de entrada.'
      );
      setEmail('');
      navigation.goBack();
    } catch (err: any) {
      console.warn('Erro solicitarAlteracao:', err);
      const msg = err?.response?.data?.message || 'Erro ao solicitar alteração de e-mail';
      Alert.alert('Erro', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Alterar E‑mail</Text>
      <Text style={{ marginBottom: 8 }}>Informe o novo endereço de e‑mail. Você receberá um link para confirmar.</Text>

      <TextInput
        style={styles.input}
        placeholder="novo@exemplo.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!loading}
      />

      <TouchableOpacity style={styles.btn} onPress={solicitarAlteracao} disabled={loading}>
        <Text style={styles.btnTxt}>{loading ? 'Enviando...' : 'Enviar link de verificação'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.btn, { backgroundColor: '#f2f2f2' }]} onPress={() => navigation.goBack()}>
        <Text style={[styles.btnTxt, { color: '#333' }]}>Voltar</Text>
      </TouchableOpacity>
    </View>
  );
}
