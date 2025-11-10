// telas/Opcoes.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Alert, Image } from 'react-native';
import { useTheme } from './ThemeContext';
import { useAuth } from './AuthContext';

export default function Opcoes({ navigation }: any) {
  const { styles } = useTheme();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigation.replace('Login');
    } catch {
      Alert.alert('Erro', 'Não foi possível sair agora.');
    }
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
            <TouchableOpacity style={styles.navItem} >
                <Text style={styles.btnTxtMap}>O</Text>
                <View style={styles.activeIndicator} />
            </TouchableOpacity>
        </View>  

    </View>
  );
}