// telas/Register.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from './AuthContext';
import { useTheme } from './ThemeContext';
import api from '../components/Api';

export default function Register({ navigation }: any) {
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const { styles } = useTheme();

  const handleRegister = async () => {
    if (!nome || !cpf || !email || !password) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    try {
      const response = await api.post('/auth/register', { nome, cpf, email, password });
      login(response.data.token, response.data.user.id);
      navigation.replace('Map');
    } catch (err: any) {
      console.log('Erro completo:', err);
      Alert.alert('Erro', err.response?.data?.message || 'Falha ao registrar');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cadastro</Text>
      <TextInput style={styles.input} placeholder="Nome" value={nome} onChangeText={setNome} />
      <TextInput style={styles.input} placeholder="CPF" value={cpf} onChangeText={setCpf} />
      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} />
      <TextInput style={styles.input} placeholder="Senha" value={password} onChangeText={setPassword} secureTextEntry />

      <TouchableOpacity style={styles.btn} onPress={handleRegister}>
        <Text style={styles.btnTxt}>Cadastrar</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.replace('Login')}>
        <Text style={styles.btnTxt}>Sair do Cadastro</Text>
      </TouchableOpacity>
    </View>
  );
}
