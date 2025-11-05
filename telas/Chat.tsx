// telas/Chat.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { useTheme } from './ThemeContext';
import { useAuth } from './AuthContext';
import io, { Socket } from 'socket.io-client';
import api from '../components/Api';

const LEET_MAP: Record<string, string> = {
  '4': 'a', '@': 'a',
  '3': 'e',
  '1': 'i', '!' : 'i', '|' : 'i',
  '0': 'o',
  '5': 's', '$': 's',
  '7': 't',
  '2': 'r',
  '9': 'g',
  '8': 'b',
  '6': 'g'
};

const normalizeClient = (msg: string) => {
  if (!msg) return '';
  let s = msg.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  s = s.split('').map(ch => LEET_MAP[ch] || ch).join('');
  s = s.replace(/[^a-z0-9\s]/g, ' ');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
};

const containsPalavroes = (text: string) => {
  const clean = normalizeClient(text);
  if (!clean) return false;
  // importe/duplique sua lista Palavroes aqui (mesma do backend)
  const PalavroesLocal = [
    'merda','bosta','porra','caralho','puta','filhodaputa','otario','otaria','fdp',
    'vagabundo','vagabunda','arrombado','vaca','piranha','fuck','shit',
    'bitch','asshole','motherfucker','mierda','gilipollas'
  ];
  for (const bad of PalavroesLocal) {
    if (clean.includes(bad)) return true;
  }
  // siglas
  const SIGLAS = ['fdp','pqp'];
  for (const token of clean.split(' ')) {
    if (SIGLAS.includes(token)) return true;
  }
  return false;
};

interface Message {
  userId?: number | null;
  user?: string;
  text: string;
  foto_url?: string | null;
  createdAt?: string | Date;
}

export default function Chat({ navigation }: any) {
  const { styles } = useTheme();
  const { token, userId } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [me, setMe] = useState<{ id?: number | null; nome?: string; foto_url?: string | null }>({});
  const flatRef = useRef<FlatList>(null);
  const windowWidth = Dimensions.get('window').width;

  useEffect(() => {
    // Carrega perfil do usuário logado (nome e foto)
    const fetchProfile = async () => {
      try {
        const res = await api.get('/auth/profile'); // ajuste se seu endpoint for outro
        if (res.data) {
          setMe({ id: res.data.id, nome: res.data.nome, foto_url: res.data.foto_url });
        }
      } catch {
        // fallback: se não autenticado, mantém valores padrões
        setMe({ id: null, nome: 'Anônimo', foto_url: null });
      }
    };
    fetchProfile();

    // Conectar socket
    // OBS: certifique-se que o IP dentro do seu projeto está consistente com o Api.ts
    const SOCKET_URL = api.defaults.baseURL?.replace('/api', '') || 'http://10.0.2.2:3000';
    const s = io(SOCKET_URL, { query: { token } });
    setSocket(s);

    s.on('receive_message', (msg: Message) => {
      // Normaliza data/formatos se necessário
      setMessages(prev => {
        const updated = [...prev, { ...msg, createdAt: msg.createdAt || new Date() }];
        // manter limite razoável para memória
        if (updated.length > 500) return updated.slice(-500);
        return updated;
      });
      // rolar para o final
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 50);
    });

    // Opcional: carregar histórico via REST se tiver endpoint
    const loadHistory = async () => {
      try {
        // se tiver rota para obter mensagens gerais ou por rota, ajuste aqui
        const res = await api.get('/chat/0'); // exemplo: ajustar para a rota real
        if (Array.isArray(res.data)) {
          setMessages(res.data.map((m: any) => ({
            userId: m.user_id ?? m.userId ?? null,
            user: m.userNome ?? m.user ?? 'Anônimo',
            text: m.mensagem ?? m.text ?? '',
            foto_url: m.foto_url ?? null,
            createdAt: m.created_at ?? m.createdAt ?? new Date(),
          })));
        }
      } catch (e) {
        // sem histórico não é crítico
      }
    };
    loadHistory();

    return () => {
      s.disconnect();
    };
  }, [token]);

  const sendMessage = () => {
    if (!input.trim()) return;

    if (containsPalavroes(input)) {
      Alert.alert(
        'Mensagem bloqueada',
        'Sua mensagem contém palavras inadequadas.\nSe continuar, você só poderá usar o mapa.'
      );
      setInput('');
      return;
    }

    if (socket) {
      const message: Message = {
        userId: me.id ?? userId ?? null,
        user: me.nome ?? 'Você',
        text: input,
        foto_url: me.foto_url ?? null,
        createdAt: new Date(),
      };
      socket.emit('send_message', message);
      setMessages(prev => [...prev, message]);
      setInput('');
      // rolar para fim
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 50);
    }
  };

  const renderItem = ({ item, index }: { item: Message; index: number }) => {
    const isMe = (me.id && item.userId && me.id === item.userId) || (!item.userId && item.user === me.nome);
    return (
      <View
        style={{
          flexDirection: 'row',
          marginVertical: 6,
          alignItems: 'flex-end',
          justifyContent: isMe ? 'flex-end' : 'flex-start',
          paddingHorizontal: 12,
        }}
      >
        {!isMe && (
          <Image
            source={item.foto_url ? { uri: item.foto_url } : require('../assets/splash.png')}
            style={{ width: 40, height: 40, borderRadius: 20, marginRight: 8 }}
          />
        )}

        <View
          style={[
            {
              maxWidth: windowWidth * 0.72,
              padding: 10,
              borderRadius: 12,
            },
            isMe ? { backgroundColor: '#2b8aef', borderBottomRightRadius: 2 } : { backgroundColor: '#eee', borderBottomLeftRadius: 2 },
          ]}
        >
          {!isMe && <Text style={{ fontWeight: '700', marginBottom: 4 }}>{item.user ?? 'Anônimo'}</Text>}
          <Text style={{ color: isMe ? '#fff' : '#222', lineHeight: 20 }}>{item.text}</Text>
          {item.createdAt && (
            <Text style={{ color: isMe ? '#dde9ff' : '#666', fontSize: 10, marginTop: 6, alignSelf: 'flex-end' }}>
              {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          )}
        </View>

        {isMe && (
          <Image
            source={me.foto_url ? { uri: me.foto_url } : require('../assets/splash.png')}
            style={{ width: 36, height: 36, borderRadius: 18, marginLeft: 8 }}
          />
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <Text style={styles.title}>Chat</Text>

        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={(_, index) => index.toString()}
          renderItem={renderItem}
          style={{ flex: 1, width: '100%', marginVertical: 10 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 12 }}
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
          initialNumToRender={20}
          maxToRenderPerBatch={30}
          windowSize={21}
        />

        <View style={[styles.inputContainerChat, { paddingHorizontal: 12, paddingBottom: Platform.OS === 'ios' ? 20 : 12 }]}>
          <TextInput
            style={styles.inputChat}
            placeholder="Digite sua mensagem..."
            value={input}
            onChangeText={setInput}
            multiline
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
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.replace('Opcoes')}>
            <Image source={require('../assets/nav1.png')} style={styles.navIcon} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.replace('Opcoes')}>
            <Text style={styles.btnTxtMap}>O</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
