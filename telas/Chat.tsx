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
    StyleSheet,
} from 'react-native';
import { useTheme } from './ThemeContext';
import { useAuth } from './AuthContext';
import io, { Socket } from 'socket.io-client';
import api from '../components/Api';
import { useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons'; 

// =================================================================
// LÓGICA DE MENSAGENS E ESTILOS DE INPUT (Mantido)
// =================================================================

const LEET_MAP: Record<string, string> = { 
    '4': 'a', '0': 'o', '@': 'a', '3': 'e', '1': 'l', '5': 's', '7': 't', '$': 's'
};
const normalizeClient = (text: string) => {
    let normalized = text.toLowerCase();
    for (const [leet, normal] of Object.entries(LEET_MAP)) {
        normalized = normalized.split(leet).join(normal);
    }
    return normalized;
};
const PalavroesLocal = ['puta', 'caralho', 'filho da puta', 'fdp', 'vsf', 'cu', 'bosta', 'merda', 'viado', 'gay', 'foda-se', 'krl', 'crlh', 'piranha', 'vadia'];
const containsPalavroes = (text: string) => {
    const normalizedText = normalizeClient(text);
    return PalavroesLocal.some(word => normalizedText.includes(word));
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

// =================================================================
// ESTILOS LOCAIS EXCLUSIVOS DO CHAT
// =================================================================

const chatStyles = StyleSheet.create({
    inputGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 25,
        paddingHorizontal: 15,
        // ✅ AJUSTE: paddingVertical maior para dar mais "ar" (como no input do mapa)
        paddingVertical: 8, 
        minHeight: 50,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
        elevation: 2,
    },
    inputChatNew: {
        flex: 1,
        fontSize: 16,
        paddingVertical: 5,
    },
    btnChatIcon: {
        marginLeft: 8,
        padding: 5,
    },
    avatar: {
        width: 35,
        height: 35,
        borderRadius: 17.5,
        marginHorizontal: 8,
        borderWidth: 1,
        borderColor: '#ccc',
    },
});

// =================================================================
// COMPONENTE PRINCIPAL
// =================================================================

export default function Chat({ navigation, routeId: propRouteId, routeName: propRouteName }: any) {
    const { styles } = useTheme(); // Importa estilos globais
    const { userId, me } = useAuth();
    const route = useRoute();
    
    // Fallback para props ou params
    const params: any = route.params || {};
    const routeIdParam: number | null = propRouteId ?? params.routeId ?? null;
    const routeNameParam: string = propRouteName ?? params.routeName ?? '';

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const socketRef = useRef<Socket | null>(null);
    const flatRef = useRef<FlatList>(null);
    const windowWidth = Dimensions.get('window').width;

    // Função de navegação para resolver o erro 'dispatch'
    const navigateAndReplace = (screenName: string) => {
        if (navigation) {
            navigation.replace(screenName);
        } else {
            // Este erro só deve ocorrer se Chat for renderizado fora de um Navigator
            console.error('Objeto navigation não encontrado em Chat.tsx');
        }
    };

    useEffect(() => {
        if (!userId) { return; }

        const newSocket = io('http://localhost:3000', {
            query: { userId, routeId: routeIdParam },
            transports: ['websocket'],
        });

        newSocket.on('connect', () => { console.log('Conectado ao chat'); });
        newSocket.on('newMessage', (message: Message) => {
            setMessages(prevMessages => {
                // Checagem de duplicação por ID e ClientID
                if (message.id && prevMessages.some(m => m.id === message.id)) { return prevMessages; }
                if (message.clientId && prevMessages.some(m => m.clientId === message.clientId)) { return prevMessages; }
                return [...prevMessages, message];
            });
        });
        newSocket.on('messageConfirmed', ({ clientId, id }: { clientId: string, id: string }) => {
            setMessages(prevMessages => prevMessages.map(m => m.clientId === clientId ? { ...m, id } : m));
        });

        socketRef.current = newSocket;
        return () => { newSocket.disconnect(); console.log('Desconectado do chat'); };
    }, [userId, routeIdParam]);

    useEffect(() => {
        const fetchMessages = async () => {
            if (!routeIdParam) return;
            // ✅ String da URL reescrita para evitar caracteres invisíveis
            try {
                const response = await api.get(`/bus/chat/${routeIdParam}`);
                setMessages(response.data.messages || []);
            } catch (error) {
                console.error('Erro ao buscar mensagens:', error);
            }
        };

        fetchMessages();
    }, [routeIdParam]);


    const sendMessage = () => {
        if (!input.trim() || !routeIdParam) { return; }
        if (containsPalavroes(input)) {
            Alert.alert('Alerta', 'Sua mensagem contém palavras inadequadas e não será enviada.');
            setInput('');
            return;
        }

        const newMessage: Message = {
            clientId: makeClientId(),
            userId: userId,
            user: me?.nome,
            text: input,
            routeId: routeIdParam,
            foto_url: me?.foto_url,
            createdAt: new Date(),
        };

        if (socketRef.current) {
            socketRef.current.emit('sendMessage', newMessage);
        }

        setMessages(prevMessages => [...prevMessages, newMessage]);
        setInput('');
        setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    };

    const renderItem = ({ item }: { item: Message }) => {
        const isMyMessage = item.userId === userId;

        const messageContainerStyle = {
            maxWidth: windowWidth * 0.7,
            padding: 10,
            borderRadius: 15,
            marginVertical: 4,
            alignSelf: isMyMessage ? 'flex-end' : 'flex-start',
            backgroundColor: isMyMessage ? '#2b8aef' : '#e0e0e0', 
        };

        const textStyle = {
            color: isMyMessage ? '#fff' : '#000',
            fontSize: 15,
        };

        const userStyle = {
            fontSize: 12,
            color: isMyMessage ? '#fff' : '#555',
            marginBottom: 2,
        };

        const timeStyle = {
            fontSize: 10,
            color: isMyMessage ? '#ccc' : '#888',
            textAlign: 'right' as const,
            marginTop: 4,
        };

        return (
            <View style={{ 
                flexDirection: 'row', 
                alignItems: 'flex-end', 
                marginHorizontal: 10, 
                alignSelf: isMyMessage ? 'flex-end' : 'flex-start',
                // Inverte a ordem para que o avatar fique na posição correta
                flexDirection: isMyMessage ? 'row-reverse' : 'row',
            }}>
                
                {/* Ícone/Avatar: Aparece apenas se não for a minha mensagem, ou se for, inverte a ordem */}
                {/* O avatar só deve aparecer na esquerda, se não for a minha mensagem */}
                {!isMyMessage && item.foto_url && (
                    <Image
                        source={{ uri: item.foto_url }}
                        style={chatStyles.avatar}
                    />
                )}
                
                <View style={messageContainerStyle}>
                    {!isMyMessage && item.user && <Text style={userStyle}>{item.user}</Text>}
                    <Text style={textStyle}>{item.text}</Text>
                    <Text style={timeStyle}>{new Date(item.createdAt!).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
                
                {/* Se for a minha mensagem, o avatar fica na direita, mas só se houver url */}
                {isMyMessage && item.foto_url && (
                    <Image
                        source={{ uri: item.foto_url }}
                        style={chatStyles.avatar}
                    />
                )}
                
            </View>
        );
    };

    // A barra de navegação global tem 60px de altura e bottom: 30
    const NAV_HEIGHT = 60; 
    const NAV_BOTTOM_MARGIN = 30; 
    const INPUT_BOTTOM_POSITION = NAV_HEIGHT + NAV_BOTTOM_MARGIN + 10; // 60 + 30 + 10 = 100

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{routeNameParam ? `Chat - ${routeNameParam}` : 'Chat por Rota'}</Text>

            <FlatList
                ref={flatRef}
                data={messages}
                keyExtractor={(item) => item.id ?? item.clientId ?? String(Math.random())}
                renderItem={renderItem}
                style={{ flex: 1, width: '100%', marginVertical: 10 }}
                showsVerticalScrollIndicator={false}
                // Garante que o último item não fique atrás do input e da nav
                contentContainerStyle={{ paddingBottom: INPUT_BOTTOM_POSITION + 80 }} 
                onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
                initialNumToRender={20}
                maxToRenderPerBatch={30}
                windowSize={21}
            />

            {/* 1. INPUT DE MENSAGEM */}
            <View style={{ 
                position: 'absolute',
                // ✅ POSICIONAMENTO CORRIGIDO: 10px acima da barra de navegação
                bottom: INPUT_BOTTOM_POSITION, 
                width: '100%',
                paddingHorizontal: 12, 
                backgroundColor: 'transparent',
                zIndex: 20,
            }}>
                <View style={chatStyles.inputGroup}>
                    <TextInput
                        style={chatStyles.inputChatNew}
                        placeholder={routeIdParam ? 'Digite sua mensagem...' : 'Selecione uma rota para falar'}
                        value={input}
                        onChangeText={setInput}
                        editable={!!routeIdParam}
                        multiline
                    />
                    <TouchableOpacity
                        style={chatStyles.btnChatIcon}
                        onPress={sendMessage}
                        disabled={!routeIdParam || !input.trim()}
                    >
                        <Ionicons
                            name="send"
                            size={24}
                            color={routeIdParam && input.trim() ? '#2b8aef' : '#999'}
                        />
                    </TouchableOpacity>
                </View>
            </View>

            {/* 2. BARRA DE NAVEGAÇÃO INFERIOR */}
            <View style={styles.bottomNav}>
                
                {/* 1º BOTÃO: MAPA/HOME/CHAT (ATIVO) */}
                <TouchableOpacity 
                    style={styles.navItem} 
                    onPress={() => navigateAndReplace('Rota')}
                >
                    <Image source={require('../assets/home2.png')} style={styles.navIcon} />
                    <View style={styles.activeIndicator} />
                </TouchableOpacity>
                
                {/* 2º BOTÃO: PERFIL (INATIVO) */}
                <TouchableOpacity 
                    style={styles.navItem} 
                    onPress={() => navigateAndReplace('Perfil')} 
                >
                    <Image source={require('../assets/perfil.png')} style={styles.navIcon} />
                </TouchableOpacity>
                
                {/* 3º BOTÃO: OPÇÕES (INATIVO) */}
                <TouchableOpacity 
                    style={styles.navItem} 
                    onPress={() => navigateAndReplace('Opcoes')} 
                >
                    <Image 
                        source={require('../assets/opcao.png')} 
                        style={styles.navIcon} 
                    />
                </TouchableOpacity>
                
            </View>
        </View>
    );
}
