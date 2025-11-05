// telas/ResetPassword.tsx
import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from './ThemeContext';
import api from '../components/Api';

const passwordChecks = (pwd: string) => ({
  length: pwd.length >= 8,
  upper: /[A-Z]/.test(pwd),
  lower: /[a-z]/.test(pwd),
  number: /[0-9]/.test(pwd),
  special: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
});

export default function ResetPassword({ navigation }: any) {
  const { styles } = useTheme();
  const [token, setToken] = useState('');
  const [senha, setSenha] = useState('');
  const [senha2, setSenha2] = useState('');

  const checks = useMemo(() => passwordChecks(senha), [senha]);
  const passwordOk = Object.values(checks).every(Boolean);

  const handleReset = async () => {
    if (!token || !senha || !senha2) {
      Alert.alert('Erro', 'Preencha token e senha');
      return;
    }
    if (senha !== senha2) {
      Alert.alert('Erro', 'Senhas não coincidem');
      return;
    }
    if (!passwordOk) {
      Alert.alert('Erro', 'Senha não atende aos requisitos de segurança');
      return;
    }
    try {
      await api.post('/auth/reset', { token, senha });
      Alert.alert('Sucesso', 'Senha redefinida. Faça login com a nova senha.');
      navigation.replace('Login');
    } catch (err: any) {
      console.error('Erro reset:', err.response || err);
      Alert.alert('Erro', err.response?.data?.message || 'Falha ao redefinir senha');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Redefinir Senha</Text>

      <TextInput style={styles.input} placeholder="Token (copie do email)" value={token} onChangeText={setToken} autoCapitalize="none" />

      <TextInput style={styles.input} placeholder="Nova senha" value={senha} onChangeText={setSenha} secureTextEntry />
      <TextInput style={styles.input} placeholder="Confirmar nova senha" value={senha2} onChangeText={setSenha2} secureTextEntry />

      <View style={{ marginVertical: 8 }}>
        <Text style={{ fontWeight: 'bold' }}>Requisitos da senha:</Text>
        <Text style={{ color: checks.length ? 'green' : 'red' }}>• Mínimo 8 caracteres</Text>
        <Text style={{ color: checks.upper ? 'green' : 'red' }}>• Letra maiúscula</Text>
        <Text style={{ color: checks.lower ? 'green' : 'red' }}>• Letra minúscula</Text>
        <Text style={{ color: checks.number ? 'green' : 'red' }}>• Número</Text>
        <Text style={{ color: checks.special ? 'green' : 'red' }}>• Caractere especial</Text>
      </View>

      <TouchableOpacity style={styles.btn} onPress={handleReset}>
        <Text style={styles.btnTxt}>Redefinir senha</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.replace('Login')}>
        <Text style={styles.btnTxt}>Voltar</Text>
      </TouchableOpacity>
    </View>
  );
}