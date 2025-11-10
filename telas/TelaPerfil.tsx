// telas/TelaPerfil.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, TextInput, Alert, ScrollView } from 'react-native';
import { useTheme } from './ThemeContext';
import { useAuth } from './AuthContext';
import api from '../components/Api';
import * as ImagePicker from 'expo-image-picker';

export default function TelaPerfil({ navigation }: any) {
  const { styles } = useTheme();
  const { userId, logout } = useAuth();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');
  const [editando, setEditando] = useState(false);

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
      // Somente nome e email são atualizáveis aqui
      await api.put(`/users/${userId}`, { nome, email });
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso');
      setEditando(false);
    } catch {
      Alert.alert('Erro', 'Falha ao atualizar perfil');
    }
  };

  const alterarFoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const novaFoto = result.assets[0].uri;
      setFotoUrl(novaFoto);

      try {
        await api.put(`/users/${userId}/photo`, { foto_url: novaFoto });
        Alert.alert('Foto atualizada', 'A foto foi alterada com sucesso');
      } catch {
        Alert.alert('Erro', 'Não foi possível alterar a foto');
      }
    }
  };

  const sair = async () => {
    await logout();
    navigation.replace('Login');
  };

  const [favoritas, setFavoritas] = useState<any[]>([]);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const res = await api.get(`/users/${userId}/favorites`);
        setFavoritas(res.data);
      } catch {
        console.log('Erro ao carregar favoritas');
      }
    };
    fetchFavorites();
  }, [userId]);

  return (
    <ScrollView contentContainerStyle={[styles.container, { alignItems: 'center', padding: 20 }]}>
      <Text style={styles.title}>Meu Perfil</Text>

      <Image
        source={fotoUrl ? { uri: fotoUrl } : require('../assets/splash.png')}
        style={{ width: 150, height: 150, borderRadius: 75, marginBottom: 20 }}
      />

      {editando ? (
        <>
          <TouchableOpacity style={styles.btn} onPress={alterarFoto}>
            <Text style={styles.btnTxt}>Alterar Foto</Text>
          </TouchableOpacity>

          <TextInput style={styles.input} value={nome} onChangeText={setNome} placeholder="Nome" />
          <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Email" />

          <TouchableOpacity style={styles.btn} onPress={salvarAlteracoes}>
            <Text style={styles.btnTxt}>Salvar Alterações</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.backButton} onPress={() => setEditando(false)}>
            <Text style={styles.btnTxt}>Cancelar</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TouchableOpacity style={styles.btn} onPress={() => setEditando(true)}>
            <Text style={styles.btnTxt}>Editar Perfil</Text>
          </TouchableOpacity>

          <View style={styles.profileContainer}>
            <Text style={styles.profileLabel}>Nome</Text>
            <Text style={styles.profileValue}>{nome}</Text>

            <Text style={styles.profileLabel}>Email</Text>
            <Text style={styles.profileValue}>{email}</Text>

            <Text style={styles.profileLabel}>CPF</Text>
            <Text style={styles.profileValue}>{cpf}</Text>

            <Text style={styles.profileLabel}>Rotas favoritas</Text>
            {favoritas.length === 0 ? (
              <Text style={styles.profileText}>Nenhuma rota favorita ainda.</Text>
            ) : (
              favoritas.map(r => (
                <Text key={r.id} style={styles.profileValue}>
                  {r.nome} ({r.total} buscas)
                </Text>
              ))
            )}
          </View>
        </>
      )}

      {/* Barra de navegação inferior */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.replace('Map')}>
          <Image source={require('../assets/onibus.png')} style={styles.navIcon} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Image source={require('../assets/nav.png')} style={styles.navIcon} />
          <View style={styles.activeIndicator} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.replace('Opcoes')}>
          <Text style={styles.btnTxtMap}>O</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
