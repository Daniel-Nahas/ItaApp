// telas/Register.tsx
import React, { useState, useMemo } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, Alert } from 'react-native';
import { isValidCPF } from '../backend/src/utils/validators';
import { useTheme } from './ThemeContext';
import api from '../components/Api';

const passwordChecks = (pwd: string) => {
  return {
    length: pwd.length >= 8,
    upper: /[A-Z]/.test(pwd),
    lower: /[a-z]/.test(pwd),
    number: /[0-9]/.test(pwd),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
  };
};

export default function Register({ navigation }: any) {
  const { styles } = useTheme();
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [senha2, setSenha2] = useState('');

  const checks = useMemo(() => passwordChecks(senha), [senha]);
  const passwordOk = Object.values(checks).every(Boolean);

  const handleRegister = async () => {
    if (!nome || !cpf || !email || !senha || !senha2) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }
    if (!isValidCPF(cpf)) {
      Alert.alert('Erro', 'CPF inválido');
      return;
    }
    if (senha !== senha2) {
      Alert.alert('Erro', 'As senhas não coincidem');
      return;
    }
    if (!passwordOk) {
      Alert.alert('Erro', 'Senha não atende aos requisitos de segurança');
      return;
    }
    try {
      const res = await api.post('/auth/register', { nome, cpf, email, senha });
      Alert.alert('Sucesso', 'Cadastro realizado com sucesso');
      navigation.replace('Login');
    } catch (err: any) {
      Alert.alert('Erro', err.response?.data?.message || 'Falha ao registrar');
    }
  };

  return (
    <View style={styles.container}>
      <Image source={require('../assets/logo1.png')} style={styles.imagemcad} />
      <Text style={styles.labelcad}>Crie sua conta e vamos embarcar!</Text>
      <TextInput style={styles.inputcad} placeholder="Nome" value={nome} onChangeText={setNome} />
      <TextInput style={styles.inputcad} placeholder="CPF (somente números)" value={cpf} onChangeText={setCpf} keyboardType="number-pad" />
      <TextInput style={styles.inputcad} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <TextInput style={styles.inputcad} placeholder="Senha" value={senha} onChangeText={setSenha} secureTextEntry />
      <TextInput style={styles.inputcad} placeholder="Confirmar senha" value={senha2} onChangeText={setSenha2} secureTextEntry />

      <View style={{ marginVertical: 8 }}>
        <Text style={{ fontWeight: 'bold' }}>Requisitos da senha:</Text>
        <Text style={{ color: checks.length ? 'green' : 'red' }}>• Mínimo 8 caracteres</Text>
        <Text style={{ color: checks.upper ? 'green' : 'red' }}>• Letra maiúscula</Text>
        <Text style={{ color: checks.lower ? 'green' : 'red' }}>• Letra minúscula</Text>
        <Text style={{ color: checks.number ? 'green' : 'red' }}>• Número</Text>
        <Text style={{ color: checks.special ? 'green' : 'red' }}>• Caractere especial</Text>
      </View>

      <TouchableOpacity style={styles.btn} onPress={handleRegister}>
        <Text style={styles.btnTxt}>Cadastrar</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.replace('Login')}>
        <Text style={styles.btnTxt}>Voltar</Text>
      </TouchableOpacity>
    </View>
  );
}
