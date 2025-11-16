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
  Platform,
  Dimensions,
} from 'react-native';
import { useTheme } from './ThemeContext';
import { useAuth } from './AuthContext';
import io, { Socket } from 'socket.io-client';
import api from '../components/Api';
import { useRoute } from '@react-navigation/native';

// (mantém o restante das funções auxiliar: normalizeClient, containsPalavroes, makeClientId, etc.)
// ... (copie as funções LEET_MAP, normalizeClient, PalavroesLocal, containsPalavroes, makeClientId, Message interface)

const LEET_MAP: Record<string, string> = {
  '4': 'a', '@': 'a',
  '3': 'e',
  '1': 'i', '!': 'i', '|': 'i',
  '0': 'o',
  '5': 's', '$': 's',
  '7': 't',
  '2': 'r',
  '9': 'g',
  '8': 'b',
  '6': 'g',
};

const normalizeClient = (msg: string) => {
  if (!msg) return '';
  let s = msg.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  s = s.split('').map(ch => LEET_MAP[ch] || ch).join('');
  s = s.replace(/[^a-z0-9\s]/g, ' ');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
};

const PalavroesLocal = [
  'merda','bosta','porra','caralho','puta','filhodaputa','otario','otaria','fdp',
  'vagabundo','vagabunda','arrombado','vaca','piranha','fuck','shit',
  'bitch','asshole','motherfucker','mierda','gilipollas'
];

const containsPalavroes = (text: string) => {
  const clean = normalizeClient(text);
  if (!clean) return false;
  for (const bad of PalavroesLocal) if (clean.includes(bad)) return true;
  const SIGLAS = ['fdp','pqp'];
  for (const token of clean.split(' ')) if (SIGLAS.includes(token)) return true;
  return false;
};

const makeClientId = () => `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

interface Message {
  id?: string;
  clientId?: string;
  userId?: number | null;
  user?: string;
  text: string;
  foto_url?: string | null;
  routeId?: number | null;
  createdAt?: string | Date;
}

export default function Chat({ navigation }: any) {
  const { styles } = useTheme();
  const { token, userId } = useAuth();
  const route = useRoute();
  const params: any = route.params || {};
  const routeIdParam: number | null = params.routeId ?? null;
  const routeNameParam: string = params.routeName ?? '';

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const socketRef = useRef<Socket | null>(null);
  const [me, setMe] = useState<any>({});
  const flatRef = useRef<FlatList>(null);
  const windowWidth = Dimensions.get('window').width;

  useEffect(() => {
    const SOCKET_URL = api.defaults.baseURL?.replace('/api', '') || 'http://10.0.2.2:3000';
    const s = io(SOCKET_URL, { query: { token } });
    socketRef.current = s;

    api.get('/auth/profile').then(res => {
      if (res.data) setMe({ id: res.data.id, nome: res.data.nome, foto_url: res.data.foto_url });
    }).catch(() => setMe({ id: null, nome: 'Anônimo', foto_url: null }));

    return () => {
      s.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  useEffect(() => {
    const s = socketRef.current;
    if (!s) return;

    s.off('receive_message');
    s.on('receive_message', (msg: Message) => {
      if (msg.routeId && routeIdParam && Number(msg.routeId) !== Number(routeIdParam)) return;
      setMessages(prev => {
        const exists = prev.some(m =>
          (m.clientId && msg.clientId && m.clientId === msg.clientId) ||
          (m.text === msg.text && String(m.user) === String(msg.user) && Math.abs(new Date(m.createdAt as any).getTime() - new Date(msg.createdAt as any).getTime()) < 2000)
        );
        if (exists) return prev;
        const updated = [...prev, { ...msg, createdAt: msg.createdAt ?? new Date() }];
        if (updated.length > 500) return updated.slice(-500);
        return updated;
      });
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 60);
    });

    return () => {
      s.off('receive_message');
    };
  }, [routeIdParam]);

  useEffect(() => {
    if (!routeIdParam) {
      setMessages([]);
      return;
    }
    (async () => {
      try {
        const res = await api.get(`/chat/${routeIdParam}`);
        if (Array.isArray(res.data)) {
          setMessages(res.data.map((m: any) => ({
            id: String(m.id ?? makeClientId()),
            clientId: String(m.clientId ?? makeClientId()),
            userId: m.user_id ?? null,
            user: m.user_nome ?? m.user ?? 'Anônimo',
            text: m.mensagem ?? m.text ?? '',
            foto_url: m.foto_url ?? null,
            routeId: m.route_id ?? routeIdParam,
            createdAt: m.created_at ?? new Date(),
          })));
        }
      } catch (err) {
        console.warn('Erro ao carregar histórico:', err);
      } finally {
        setTimeout(() => flatRef.current?.scrollToEnd({ animated: false }), 120);
      }
    })();

    const s = socketRef.current;
    if (s && routeIdParam) s.emit('join_room', routeIdParam);

    return () => {
      if (s && routeIdParam) s.emit('leave_room', routeIdParam);
    };
  }, [routeIdParam]);

  const sendMessage = () => {
    if (!input.trim()) return;
    if (!routeIdParam) {
      Alert.alert('Selecione uma rota', 'Escolha uma rota para enviar mensagens.');
      return;
    }

    if (containsPalavroes(input)) {
      Alert.alert('Mensagem bloqueada', 'Sua mensagem contém palavras inadequadas.');
      setInput('');
      return;
    }

    const clientId = makeClientId();
    const payload: Message = {
      id: clientId,
      clientId,
      userId: me.id ?? userId ?? null,
      user: me.nome ?? 'Você',
      text: input,
      foto_url: me.foto_url ?? null,
      routeId: routeIdParam,
      createdAt: new Date(),
    };

    setMessages(prev => [...prev, payload]);
    socketRef.current?.emit('send_message', payload);
    setInput('');
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 60);
  };

  const renderItem = ({ item }: { item: Message }) => {
    const isMe = (me.id && item.userId && me.id === item.userId) || (!item.userId && item.user === me.nome);
    return (
      <View style={{
        flexDirection: 'row',
        marginVertical: 6,
        alignItems: 'flex-end',
        justifyContent: isMe ? 'flex-end' : 'flex-start',
        paddingHorizontal: 12,
      }}>
        {!isMe && <Image source={item.foto_url ? { uri: item.foto_url } : require('../assets/splash.png')} style={{ width: 40, height: 40, borderRadius: 20, marginRight: 8 }} />}

        <View style={[{ maxWidth: windowWidth * 0.72, padding: 10, borderRadius: 12 }, isMe ? { backgroundColor: '#2b8aef', borderBottomRightRadius: 2 } : { backgroundColor: '#eee', borderBottomLeftRadius: 2 }]}>
          {!isMe && <Text style={{ fontWeight: '700', marginBottom: 4 }}>{item.user ?? 'Anônimo'}</Text>}
          <Text style={{ color: isMe ? '#fff' : '#222', lineHeight: 20 }}>{item.text}</Text>
          {item.createdAt && <Text style={{ color: isMe ? '#dde9ff' : '#666', fontSize: 10, marginTop: 6, alignSelf: 'flex-end' }}>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>}
        </View>

        {isMe && <Image source={me.foto_url ? { uri: me.foto_url } : require('../assets/splash.png')} style={{ width: 36, height: 36, borderRadius: 18, marginLeft: 8 }} />}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header com seta para voltar à Rota */}
      <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 10 }}>
        <TouchableOpacity onPress={() => {
          if (routeIdParam) {
            navigation.navigate('Rota', { routeId: routeIdParam, routeName: routeNameParam });
          } else {
            navigation.goBack();
          }
        }} style={{ padding: 8 }}>
          {/*<Image source={require('../assets/arrow-left.png')} style={{ width: 22, height: 22, tintColor: '#333' }} />*/}
        </TouchableOpacity>
        <Text style={[styles.title, { marginLeft: 8 }]}>{routeNameParam ? `Chat - ${routeNameParam}` : 'Chat por Rota'}</Text>
      </View>

      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={(item) => item.id ?? String(Math.random())}
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
          placeholder={routeIdParam ? 'Digite sua mensagem...' : 'Selecione uma rota para falar'}
          value={input}
          onChangeText={setInput}
          editable={!!routeIdParam}
          multiline
        />
        <TouchableOpacity style={styles.btnChat} onPress={sendMessage}>
          <Text style={styles.btnTxt}>Enviar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
