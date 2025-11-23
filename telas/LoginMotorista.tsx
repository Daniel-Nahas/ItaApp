// telas/LoginMotorista.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useTheme } from './ThemeContext';
import api from '../components/Api';
import { useAuth } from './AuthContext';

// Tela de login exclusiva para motoristas
export default function LoginMotorista({ navigation }: any) {
  const { styles } = useTheme();
  const { signIn } = useAuth(); // adaptar ao seu AuthContext para persistir token e user
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !senha) return Alert.alert('Preencha todos os campos');
    setLoading(true);
    try {
      // Ajuste o endpoint caso seu backend use /api/auth/login
      const res = await api.post('/auth/login', { email, senha });

      // Espera-se resposta com { token, user }
      const token = res.data.token ?? res.data.accessToken ?? null;
      const user = res.data.user ?? res.data;
      if (!token || !user) {
        setLoading(false);
        return Alert.alert('Erro', 'Resposta inválida do servidor');
      }

      // Garantir que somente contas com role 'driver' (motorista) possam entrar aqui
      if (user.role !== 'driver') {
        setLoading(false);
        return Alert.alert('Acesso negado', 'Esta área é exclusiva para motoristas');
      }

      // Salvar token e dados do usuário no AuthContext (implemente signIn conforme seu contexto)
      await signIn({ token, user });

      // Navegar para o rastreador do motorista, passando busId/routeId se disponíveis
      navigation.replace('RastreadorMotorista', {
        busId: user.busId ?? null,
        routeId: user.currentRouteId ?? null,
      });
    } catch (err: any) {
      console.error('Erro login motorista:', err?.response?.data || err?.message || err);
      Alert.alert('Falha', err?.response?.data?.message || 'Credenciais inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { padding: 20, justifyContent: 'center' }]}>
      <Text style={styles.title}>Login Motorista</Text>

      <TextInput
        placeholder="E-mail"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
        style={[styles.input, { marginTop: 12 }]}
        keyboardType="email-address"
      />

      <TextInput
        placeholder="Senha"
        secureTextEntry
        value={senha}
        onChangeText={setSenha}
        style={[styles.input, { marginTop: 12 }]}
      />

      <TouchableOpacity style={[styles.btn, { marginTop: 18 }]} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTxt}>Entrar</Text>}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.btn, { marginTop: 12, backgroundColor: '#4b7bec' }]}
        onPress={() => navigation.navigate('RegistroMotorista')}
        >
        <Text style={styles.btnTxt}>Registrar Motorista</Text>
      </TouchableOpacity>

      <View style={{ height: 12 }} />

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={{ color: '#666' }}>Voltar</Text>
      </TouchableOpacity>
    </View>
  );
}