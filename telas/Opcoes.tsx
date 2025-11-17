// telas/Opcoes.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Alert, Image, StyleSheet } from 'react-native';
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
    <View style={styles.containerOpcoes}>
      <Image source={require('../assets/option.png')} style={styles.imagemOpt} />
      <Text style={styles.OpcoesTitle}>Opções</Text>

      <TouchableOpacity style={styles.OpcoesBtn} onPress={() => navigation.navigate('Feedback')}>
        <Text style={styles.OpcoesBtnTxt}>Enviar Feedback</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.OpcoesBtn} onPress={() => navigation.navigate('AlterarSenha')}>
        <Text style={styles.OpcoesBtnTxt}>Alterar Senha</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.OpcoesBtn} onPress={handleLogout}>
        <Text style={styles.OpcoesBtnSairTxt}>Sair</Text>
      </TouchableOpacity>

      <View style={styles.bottomNav}>
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.replace('Map')}>
                <Image source={require('../assets/home.png')} style={styles.navIcon} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.replace('Perfil')}>
                <Image source={require('../assets/perfil.png')} style={styles.navIcon} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} >
                <Image source={require('../assets/opcao2.png')} style={styles.navIcon} />
                <View style={styles.activeIndicator} />
            </TouchableOpacity>
        </View>  

    </View>
  );
}
  
  const normal = 'regular';
  const grossa = 'bold';
  const localStyles = StyleSheet.create({

  
  OpcoesBtn: {
    width: '90%',
    height: 50,
    backgroundColor: '#F5F5DC',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },

  OpcoesBtnTxt: {
    color: '#003366',
    fontSize: 18,
    fontFamily: grossa,
    fontWeight: 'bold',
  },

   OpcoesBtnSairTxt: {
    color: '#ff0000ff',
    fontSize: 18,
    fontFamily: grossa,
    fontWeight: 'bold',
  },

    imagemOpt:{
    width:120,
    height:120,
    resizeMode: 'contain',
    marginBottom: 10,
  },

    OpcoesTitle:{

    fontFamily: grossa,
    fontWeight: 'bold',
    fontSize: 30,
    color: '#F5F5DC',
    marginBottom: 10,
    alignSelf: 'center',
    textAlign: 'center',

  },

})