// telas/TelaPerfil.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, TextInput, Alert } from 'react-native';
import { useTheme } from './ThemeContext';
import { useAuth } from './AuthContext';
import api from '../components/Api';

export default function TelaPerfil({ navigation }: any) {
  const { styles } = useTheme();
  const { userId, logout } = useAuth();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get(`/users/${userId}`);
        setNome(res.data.nome);
        setEmail(res.data.email);
        setCpf(res.data.cpf);
        setFotoUrl(res.data.foto_url);
      } catch {
        Alert.alert('Erro', 'Não foi possível carregar os dados do perfil');
      }
    };
    fetchUser();
  }, [userId]);


  const salvarAlteracoes = async () => {
    try {
      await api.put(`/users/${userId}`, { nome, email, cpf });
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso');
    } catch {
      Alert.alert('Erro', 'Falha ao atualizar perfil');
    }
  };

  const alterarFoto = async () => {
    try {
      await api.put(`/users/${userId}/photo`, { foto_url: 'https://exemplo.com/nova-foto.jpg' });
      Alert.alert('Foto atualizada', 'A foto foi alterada com sucesso');
    } catch {
      Alert.alert('Erro', 'Não foi possível alterar a foto');
    }
  };

  const sair = async () => {
    await logout();
    navigation.replace('Login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Meu Perfil</Text>

      <Image
        source={fotoUrl ? { uri: fotoUrl } : undefined}
        style={{ width: '50%', height: 250, marginBottom: 20, borderRadius: 19 }}
      />


      <TouchableOpacity style={styles.btn} onPress={alterarFoto}>
        <Text style={styles.btnTxt}>Alterar Foto</Text>
      </TouchableOpacity>

      <TextInput style={styles.input} value={nome} onChangeText={setNome} placeholder="Nome" />
      <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Email" />
      <TextInput style={styles.input} value={cpf} onChangeText={setCpf} placeholder="CPF" />

      <TouchableOpacity style={styles.btn} onPress={salvarAlteracoes}>
        <Text style={styles.btnTxt}>Salvar Alterações</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backButton} onPress={sair}>
        <Text style={styles.btnTxt}>Sair da Conta</Text>
      </TouchableOpacity>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.replace('Map')}>
          <Image source={require('../assets/onibus.png')} style={styles.navIcon} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Image source={require('../assets/nav.png')} style={styles.navIcon} />
          <View style={styles.activeIndicator} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.replace('Chat')}>
          <Image source={require('../assets/nav1.png')} style={styles.navIcon} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.replace('Feedback')}>
          <Text style={styles.btnTxtMap}>F</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={sair}>
          <Text style={styles.btnTxtMap}>Sair</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
