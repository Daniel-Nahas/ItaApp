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

  // Navega para a tela de confirmação/ação de exclusão
  const goToExcluirConta = () => {
    navigation.navigate('ExcluirConta');
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

      <TouchableOpacity style={[styles.btn, { backgroundColor: '#ffdddd' }]} onPress={goToExcluirConta}>
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
