// telas/Feedback.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, TextInput, Alert } from 'react-native';
import { useTheme } from './ThemeContext';
import api from '../components/Api';
import { useAuth } from './AuthContext';

export default function Feedback({ navigation }: any) {
  const [stars, setStars] = useState(0);
  const [comentario, setComentario] = useState('');
  const { styles } = useTheme();
  const { token } = useAuth();

  const enviarFeedback = async () => {
    if (stars === 0) {
      Alert.alert('Erro', 'Selecione uma quantidade de estrelas');
      return;
    }
    try {
      await api.post('/feedback', { estrelas: stars, comentario });
      Alert.alert('Obrigado!', 'Seu feedback foi enviado com sucesso');
      setStars(0);
      setComentario('');
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível enviar o feedback');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Avalie o app</Text>

      <View style={{ flexDirection: 'row', marginBottom: 20 }}>
        {[1, 2, 3, 4, 5].map(n => (
          <TouchableOpacity key={n} onPress={() => setStars(n)}>
            <Text style={{ fontSize: 30, color: n <= stars ? 'gold' : 'gray' }}>★</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={styles.input}
        placeholder="Escreva seu comentário..."
        value={comentario}
        onChangeText={setComentario}
        multiline
      />

      <TouchableOpacity style={styles.btn} onPress={enviarFeedback}>
        <Text style={styles.btnTxt}>Enviar Feedback</Text>
      </TouchableOpacity>

      {/* Barra de navegação inferior */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.replace('Map')}>
          <Image source={require('../assets/onibus.png')} style={styles.navIcon} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.replace('Perfil')}>
          <Image source={require('../assets/nav.png')} style={styles.navIcon} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.replace('Opcoes')}>
          <Text style={styles.btnTxtMap}>Voltar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
