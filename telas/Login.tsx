// telas/Login.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Alert } from 'react-native';
import { useTheme } from './ThemeContext';
import { useAuth } from './AuthContext';
import api from '../components/Api';

export default function Login({ navigation }: any) {
  const { styles, toggleTheme, isAccessible } = useTheme();
  const { login, loginComoVisitante } = useAuth();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !senha.trim()) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    try {
      const response = await api.post('/auth/login', { email, senha });
      login(response.data.token, response.data.user.id);
      navigation.replace('Map');
    } catch (err: any) {
      Alert.alert('Erro', err.response?.data?.message || 'Falha ao autenticar');
    }
  };

  return (
    <View style={styles.container}>
      <Image source={require('../assets/logo2.svg')} style={styles.logo} />
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={isAccessible ? '#ccc' : '#666'}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Senha"
        placeholderTextColor={isAccessible ? '#ccc' : '#666'}
        secureTextEntry
        value={senha}
        onChangeText={setSenha}
      />
      
      <TouchableOpacity style={styles.btnEsqueciSenha} onPress={() => navigation.navigate('EsqueciSenha')}>
        <Text style={styles.esqueciSenhaTxt}>Esqueci a Senha</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btnEntrar} onPress={handleLogin}>
        <Text style={styles.btnTxtEntrar}>Entrar</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btnCad} onPress={() => navigation.navigate('Register')}>
        <Text style={styles.btnTxtCad}>Cadastrar</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.btnVisitante}
        onPress={() => {
          loginComoVisitante();
          navigation.replace('Map');
        }}
      >
        <Text style={styles.btnTxtVisitante}>Entrar como visitante</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btn} onPress={toggleTheme}>
        <Text style={styles.btnTxt}>{isAccessible ? 'Modo Padrão' : 'Modo Acessível'}</Text>
      </TouchableOpacity>
      
    </View>
  );
}
