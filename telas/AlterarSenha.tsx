// telas/AlterarSenha.tsx
import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useTheme } from './ThemeContext';
import api from '../components/Api';
import { useAuth } from './AuthContext';

const passwordChecks = (pwd: string) => ({
  length: pwd.length >= 8,
  upper: /[A-Z]/.test(pwd),
  lower: /[a-z]/.test(pwd),
  number: /[0-9]/.test(pwd),
  special: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
});

export default function AlterarSenha({ navigation }: any) {
  const { styles } = useTheme();
  const { token } = useAuth();

  const [step, setStep] = useState<'request' | 'confirm'>('request');
  const [currentPassword, setCurrentPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [tokenInput, setTokenInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPassword2, setNewPassword2] = useState('');

  const checks = useMemo(() => passwordChecks(newPassword), [newPassword]);
  const passwordOk = Object.values(checks).every(Boolean);

  // Passo 1: solicita token por email (verifica senha atual antes)
  const handleRequest = async () => {
    if (!currentPassword) {
      Alert.alert('Erro', 'Digite sua senha atual');
      return;
    }
    setLoading(true);
    try {
      // endpoint protegido que verifica a senha atual e envia token por e-mail
      await api.post('/auth/request-change-password', { currentPassword });
      Alert.alert('Verifique seu email', 'Enviamos um token para confirmar a alteração de senha.');
      setStep('confirm');
    } catch (err: any) {
      console.error('Erro request-change:', err.response || err);
      Alert.alert('Erro', err.response?.data?.message || 'Falha ao solicitar confirmação por email');
    } finally {
      setLoading(false);
    }
  };

  // Passo 2: confirmar alteração com token + nova senha
  const handleConfirm = async () => {
    if (!tokenInput || !newPassword || !newPassword2) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }
    if (newPassword !== newPassword2) {
      Alert.alert('Erro', 'As novas senhas não coincidem');
      return;
    }
    if (!passwordOk) {
      Alert.alert('Erro', 'A nova senha não atende aos requisitos');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/confirm-change-password', { token: tokenInput, newPassword });
      Alert.alert('Sucesso', 'Senha alterada com sucesso');
      navigation.replace('Perfil');
    } catch (err: any) {
      console.error('Erro confirm-change:', err.response || err);
      Alert.alert('Erro', err.response?.data?.message || 'Falha ao confirmar alteração');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Alterar Senha</Text>

      {step === 'request' ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="Senha atual"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
          />

          <TouchableOpacity style={styles.btn} onPress={handleRequest} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTxt}>Solicitar confirmação por email</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.backButton} onPress={() => navigation.replace('Perfil')}>
            <Text style={styles.btnTxt}>Cancelar</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TextInput
            style={styles.input}
            placeholder="Token recebido por email"
            value={tokenInput}
            onChangeText={setTokenInput}
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Nova senha"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />
          <TextInput
            style={styles.input}
            placeholder="Confirmar nova senha"
            value={newPassword2}
            onChangeText={setNewPassword2}
            secureTextEntry
          />

          <View style={{ marginVertical: 8 }}>
            <Text style={{ fontWeight: 'bold' }}>Requisitos da senha:</Text>
            <Text style={{ color: checks.length ? 'green' : 'red' }}>• Mínimo 8 caracteres</Text>
            <Text style={{ color: checks.upper ? 'green' : 'red' }}>• Letra maiúscula</Text>
            <Text style={{ color: checks.lower ? 'green' : 'red' }}>• Letra minúscula</Text>
            <Text style={{ color: checks.number ? 'green' : 'red' }}>• Número</Text>
            <Text style={{ color: checks.special ? 'green' : 'red' }}>• Caractere especial</Text>
          </View>

          <TouchableOpacity style={styles.btn} onPress={handleConfirm} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTxt}>Confirmar alteração</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.backButton} onPress={() => setStep('request')}>
            <Text style={styles.btnTxt}>Voltar</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}
