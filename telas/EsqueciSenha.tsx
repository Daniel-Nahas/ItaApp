// telas/EsqueciSenha.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from './ThemeContext';

export default function EsqueciSenha({ navigation }: any) {
  const { styles, isAccessible } = useTheme();
  const [email, setEmail] = useState('');

  const enviarRecuperacao = () => {
    if (!email) {
      Alert.alert('Erro', 'Por favor, insira seu email.');
      return;
    }
    Alert.alert(
      'Recuperação enviada',
      `Um link de redefinição foi enviado para: ${email}`
    );
    navigation.replace('Login');
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
      />

      <TouchableOpacity style={styles.btn} onPress={enviarRecuperacao}>
        <Text style={styles.btnTxt}>Enviar para email</Text>
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