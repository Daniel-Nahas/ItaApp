// telas/Opcoes.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Alert, Image } from 'react-native';
import { useTheme } from './ThemeContext';
import { useAuth } from './AuthContext';
import api from '../components/Api';

export default function Opcoes({ navigation }: any) {
  const { styles } = useTheme();
  const { logout, userId, token } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigation.replace('Login');
    } catch {
      Alert.alert('Erro', 'Não foi possível sair agora.');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Excluir conta',
      'Tem certeza que deseja excluir sua conta permanentemente? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete('/users/me', token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
              // após exclusão, efetuar logout local e navegar para Login
              await logout();
              Alert.alert('Conta excluída', 'Sua conta foi excluída com sucesso.');
              navigation.replace('Login');
            } catch (err: any) {
              console.warn('Erro excluir conta:', err);
              const msg = err?.response?.data?.message || 'Erro ao excluir conta';
              Alert.alert('Erro', msg);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Opções</Text>

      <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Feedback')}>
        <Text style={styles.btnTxt}>Enviar Feedback</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('AlterarSenha')}>
        <Text style={styles.btnTxt}>Alterar Senha</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('AlterarEmail')}>
        <Text style={styles.btnTxt}>Alterar Email</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.btn, { backgroundColor: '#ffdddd' }]} onPress={handleDeleteAccount}>
        <Text style={[styles.btnTxt, { color: '#a00' }]}>Excluir Conta</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btn} onPress={handleLogout}>
        <Text style={styles.btnTxt}>Sair</Text>
      </TouchableOpacity>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.replace('Map')}>
          <Image source={require('../assets/onibus.png')} style={styles.navIcon} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.replace('Perfil')}>
          <Image source={require('../assets/nav.png')} style={styles.navIcon} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.btnTxtMap}>O</Text>
          <View style={styles.activeIndicator} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
