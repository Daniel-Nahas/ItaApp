// telas/Chat.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Alert, Image } from 'react-native';
import { useTheme } from './ThemeContext';
import { useAuth } from './AuthContext';
import io, { Socket } from 'socket.io-client';
import api from '../components/Api';

// Lista simples de palavras proibidas
const Palavroes = [
  "merda", "bosta", "porra", "caralho", "puta", "otario",
  "otaria", "fdp", "vagabundo", "vagabunda", "arrombado",
  "vaca", "piranha", "fuck", "shit", "bitch", "asshole",
  "motherfucker", "mierda", "gilipollas"
];

const normalize = (text: string) =>
  text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const containsPalavroes = (text: string) =>
  Palavroes.some(word => normalize(text).includes(word));

interface Message {
  user: string;
  text: string;
}

export default function Chat({ navigation }: any) {
  const { styles } = useTheme();
  const { token } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [user, setUser] = useState<string>('Usuário'); // Adiciona nome padrão

  useEffect(() => {
    // Carregar nome do usuário logado
    const fetchUser = async () => {
      try {
        const res = await api.get('/auth/profile');
        if (res.data?.nome) setUser(res.data.nome);
      } catch {
        setUser('Anônimo');
      }
    };
    fetchUser();

    const s = io('http://192.168.100.115:3000', { query: { token } });// IPv4 da maquina como do backend !!
    setSocket(s);

    // Mensagens recebidas
    s.on('receive_message', (msg: Message) => {
      setMessages(prev => [...prev, msg]);
    });

    return () => {
      s.disconnect();
    };
  }, [token]);

  const sendMessage = () => {
    if (!input.trim()) return;

    if (containsPalavroes(input)) {
      Alert.alert(
        "Mensagem bloqueada",
        "Sua mensagem contém palavras inadequadas.\nSe continuar, você só poderá usar o mapa."
      );
      setInput('');
      return;
    }

    if (socket) {
      const message: Message = { user, text: input };
      socket.emit('send_message', message);
      setInput('');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chat</Text>

      <FlatList
        data={messages}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item }) => (
          <Text style={{ marginVertical: 4 }}>
            <Text style={{ fontWeight: 'bold' }}>{item.user}:</Text> {item.text}
          </Text>
        )}
        style={{ flex: 1, width: '100%', marginVertical: 10 }}
      />

      <View style={styles.inputContainerChat}>
        <TextInput
          style={styles.inputChat}
          placeholder="Digite sua mensagem..."
          value={input}
          onChangeText={setInput}
        />
        <TouchableOpacity style={styles.btnChat} onPress={sendMessage}>
          <Text style={styles.btnTxt}>Enviar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.replace('Map')}>
          <Image source={require('../assets/onibus.png')} style={styles.navIcon} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.replace('Perfil')}>
          <Image source={require('../assets/nav.png')} style={styles.navIcon} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Image source={require('../assets/nav1.png')} style={styles.navIcon} />
          <View style={styles.activeIndicator} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.replace('Feedback')}>
          <Text style={styles.btnTxtMap}>F</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItemSair} onPress={() => navigation.replace('Login')}>
          <Text style={styles.btnTxtMap}>Sair</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}
