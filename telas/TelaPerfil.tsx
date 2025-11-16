// telas/TelaPerfil.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, Alert, ScrollView, FlatList } from 'react-native';
import { useTheme } from './ThemeContext';
import { useAuth } from './AuthContext';
import api from '../components/Api';
import * as ImagePicker from 'expo-image-picker';

export default function TelaPerfil({ navigation }: any) {
  const { styles } = useTheme();
  const { userId, logout } = useAuth();

  const [nome, setNome] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');
  const [favoritas, setFavoritas] = useState<any[]>([]);
  const [loadingFav, setLoadingFav] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get(`/users/${userId}`);
        setNome(res.data.nome || '');
        setFotoUrl(res.data.foto_url || '');
      } catch {
        Alert.alert('Erro', 'Não foi possível carregar os dados do perfil');
      }
    };
    if (userId) fetchUser();
  }, [userId]);

  useEffect(() => {
    const fetchFavorites = async () => {
      setLoadingFav(true);
      try {
        const res = await api.get(`/users/${userId}/favorites`);
        // Espera-se que o backend retorne array com { id, nome, total }
        setFavoritas(Array.isArray(res.data) ? res.data : []);
      } catch {
        console.log('Erro ao carregar favoritas');
        setFavoritas([]);
      } finally {
        setLoadingFav(false);
      }
    };
    if (userId) fetchFavorites();
  }, [userId]);

  const alterarFoto = async () => {
    try {
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
    } catch (err) {
      console.warn('Erro ao selecionar imagem:', err);
    }
  };

  const sair = async () => {
    await logout();
    navigation.replace('Login');
  };

  const primeiroNome = (nome || '').split(' ')[0] || '';

  const renderFavorite = ({ item }: { item: any }) => (
    <TouchableOpacity
      key={String(item.id)}
      style={{
        width: '100%',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderColor: '#eee',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
      onPress={() => {
        // Navegar para a tela Rota mostrando a rota selecionada
        navigation.dispatch({
          ...require('@react-navigation/native').StackActions.replace('Rota', { routeId: item.id, routeName: item.nome }),
        });
      }}
    >
      <View>
        <Text style={{ fontWeight: '700' }}>{item.nome}</Text>
        <Text style={{ color: '#666', marginTop: 4 }}>{item.total ?? 0} buscas</Text>
      </View>
      <TouchableOpacity onPress={async () => {
        // opcional: remoção de favorita (se endpoint existir)
        try {
          await api.delete(`/users/${userId}/favorites/${item.id}`);
          // atualizar lista localmente
          setFavoritas(prev => prev.filter(f => f.id !== item.id));
        } catch {
          Alert.alert('Erro', 'Não foi possível remover das favoritas');
        }
      }}>
        <Text style={{ color: '#d9534f' }}>Remover</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <ScrollView contentContainerStyle={[styles.container, { alignItems: 'center', padding: 20 }]}>
      <Text style={styles.title}>Meu Perfil</Text>

      <Image
        source={fotoUrl ? { uri: fotoUrl } : require('../assets/splash.png')}
        style={{ width: 150, height: 150, borderRadius: 75, marginBottom: 12 }}
      />

      <Text style={{ fontSize: 18, marginBottom: 16 }}>{`Olá, ${primeiroNome}`}</Text>

      <TouchableOpacity style={styles.btn} onPress={alterarFoto}>
        <Text style={styles.btnTxt}>Alterar Foto</Text>
      </TouchableOpacity>

      <View style={{ width: '100%', marginTop: 20 }}>
        <Text style={{ fontWeight: '700', fontSize: 16, marginBottom: 8 }}>Rotas favoritas</Text>

        {loadingFav ? (
          <Text style={{ color: '#666' }}>Carregando favoritas...</Text>
        ) : favoritas.length === 0 ? (
          <Text style={{ color: '#666' }}>Nenhuma rota favorita ainda.</Text>
        ) : (
          <FlatList
            data={favoritas}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderFavorite}
            style={{ width: '100%', borderRadius: 8, overflow: 'hidden' }}
          />
        )}
      </View>

      <View style={{ height: 20 }} />

      <View style={{ height: 60 }} />

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
