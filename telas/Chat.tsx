// telas/Chat.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Alert, Image } from 'react-native';
import { useTheme } from './ThemeContext';
import { useAuth } from './AuthContext';
import io from 'socket.io-client';
import api from '../components/Api';

const Palavroes = [
  "merda", "bosta", "porra", "caralho", "puta", "otario",
  "otaria", "fdp", "vagabundo", "vagabunda", "arrombado",
  "vaca", "piranha", "fuck", "shit", "bitch", "asshole",
  "motherfucker", "mierda", "gilipollas"
];

const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const containsPalavroes = (text: string) => Palavroes.some(word => normalize(text).includes(word));

export default function Chat({ navigation }: any) {
  const { styles } = useTheme();
  const { token } = useAuth();
  const [messages, setMessages] = useState<{user: string, text: string}[]>([]);
  const [input, setInput] = useState('');
  const [socket, setSocket] = useState<any>(null);

  useEffect(() => {
    const s = io('http://192.168.0.100:3000', { query: { token } });
    setSocket(s);

    s.on('chatMessage', (msg: {user: string, text: string}) => {
      setMessages(prev => [...prev, msg]);
    });

    return () => { s.disconnect(); };
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
    socket.on('chatMessage', (msg: { user: string; text: string }) => {
  setMessages(prev => [...prev, msg]);
});

socket.emit('chatMessage', { text: input });

    setInput('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chat</Text>
      <FlatList
        data={messages}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item }) => <Text style={{ marginVertical: 4 }}>{item.user}: {item.text}</Text>}
        style={{ flex: 1, width: '100%', marginVertical: 10 }}
      />
      <View style={styles.inputContainerChat}>
        <TextInput
          style={styles.inputChat}
          placeholder="Digite sua mensagem"
          value={input}
          onChangeText={setInput}
        />
        <TouchableOpacity style={styles.btnChat} onPress={sendMessage}>
          <Text style={styles.btnTxt}>Enviar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
