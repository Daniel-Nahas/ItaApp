// telas/RastreadorMotorista.tsx
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, Platform, ActivityIndicator } from 'react-native';
import { useTheme } from './ThemeContext';
import { useAuth } from './AuthContext';
import * as Location from 'expo-location';
import io, { Socket } from 'socket.io-client';
import { Picker } from '@react-native-picker/picker';
import api from '../components/Api';

export default function RastreadorMotorista({ navigation, route }: any) {
  const { styles } = useTheme();
  const { token, userId, logout } = useAuth();
  const params = route?.params || {};
  const initialBusId = params?.busId ?? null;

  const [busId] = useState<number | null>(initialBusId ?? null);
  const [routeId, setRouteId] = useState<number | null>(params?.routeId ?? null);
  const [routes, setRoutes] = useState<Array<{ id: number; nome: string }>>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(false);

  const [tracking, setTracking] = useState(false);
  const [lastPos, setLastPos] = useState<any>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [connectingError, setConnectingError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const watchRef = useRef<any>(null);
  const queuedPositionsRef = useRef<any[]>([]);

  // Ajuste esta URL para seu servidor de API e Socket
  const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.100.115:3000/';
  const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://192.168.100.115:3000/';

  // Buscar rotas ao montar
  useEffect(() => {
  let mounted = true;

  const loadRoutes = async () => {
    try {
      setLoadingRoutes(true);

      // usa o mesmo endpoint do Map (ajuste se seu server usa outro)
      const res = await api.get('/bus');
      console.log('Rotas fetch res status:', res.status ?? 'no status', 'data len:', Array.isArray(res.data) ? res.data.length : typeof res.data);
      if (!mounted) return;

      // se o backend retorna { data: [...] } ou diretamente array, adapte aqui
      const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
      const mapped = Array.isArray(data) ? data.map((r: any) => ({ id: r.id, nome: r.nome })) : [];
      setRoutes(mapped);
    } catch (err: any) {
      console.warn('Falha ao buscar rotas via api:', err?.message ?? err);
      // fallback: se quiser, tentar fetch direto por URL
      try {
        const fallbackRes = await fetch(`${API_URL.replace(/\/$/, '')}/bus`);
        console.log('Fallback fetch status', fallbackRes.status);
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          const arr = Array.isArray(fallbackData) ? fallbackData : (fallbackData?.data ?? []);
          setRoutes(arr.map((r: any) => ({ id: r.id, nome: r.nome })));
          return;
        }
      } catch (e) {
        console.warn('Fallback também falhou:', e);
      }
    } finally {
      if (mounted) setLoadingRoutes(false);
    }
  };

    loadRoutes();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

  // Conectar Socket.IO
  useEffect(() => {
    let adjustedSocketUrl = SOCKET_URL;
    if (!adjustedSocketUrl.includes('://')) adjustedSocketUrl = 'http://' + adjustedSocketUrl;
    if (Platform.OS !== 'ios' && adjustedSocketUrl.includes('localhost')) {
      adjustedSocketUrl = adjustedSocketUrl.replace('localhost', 'SEU_IP_LOCAL_AQUI');
    }

    const s: Socket = io(adjustedSocketUrl, {
      transports: ['websocket'],
      auth: token ? { token } : undefined,
      reconnection: true,
      reconnectionAttempts: 9999,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    socketRef.current = s;
    console.log('Tentando conectar socket em', adjustedSocketUrl);

    s.on('connect', () => {
      console.log('Socket conectado', s.id);
      setSocketConnected(true);
      setConnectingError(null);
      // se já escolheu rota, entra na sala
      if (routeId) s.emit('join_room', Number(routeId));
      // enviar fila se houver
      flushQueuedPositions();
    });

    s.on('connect_error', (err: any) => {
      console.error('socket connect_error', err);
      setConnectingError(String(err?.message || err));
      setSocketConnected(false);
    });

    s.on('disconnect', (reason: string) => {
      console.log('socket desconectado', reason);
      setSocketConnected(false);
    });

    return () => {
      try { if (routeId) s.emit('leave_room', Number(routeId)); } catch {}
      try { s.disconnect(); } catch {}
      socketRef.current = null;
      pararRastreamento();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Quando a rota muda, sair/entrar na sala socket
  useEffect(() => {
    const s = socketRef.current;
    if (!s) return;
    try {
      // remove de rota antiga e entra na nova
      s.emit('leave_all_rooms'); // se seu server suportar; caso contrário, apenas emitir leave da antiga antes de join
    } catch {}
    if (routeId && s.connected) {
      s.emit('join_room', Number(routeId));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeId]);

  const flushQueuedPositions = () => {
    const s = socketRef.current;
    if (!s || !s.connected) return;
    while (queuedPositionsRef.current.length) {
      const p = queuedPositionsRef.current.shift();
      s.emit('driver_position_update', p);
    }
  };

  const safeEmitPosition = (payload: any) => {
    const s = socketRef.current;
    if (s && s.connected) {
      s.emit('driver_position_update', payload);
    } else {
      queuedPositionsRef.current.push(payload);
      console.log('Posição enfileirada, total:', queuedPositionsRef.current.length);
    }
  };

  const iniciarRastreamento = async () => {
    if (!routeId) return Alert.alert('Selecione a rota', 'Escolha a rota que você está fazendo antes de iniciar o rastreamento.');
    // esperar socket conectado (até 10s)
    const waitForSocket = (timeout = 10000) => new Promise<boolean>((resolve) => {
      if (socketRef.current && socketRef.current.connected) return resolve(true);
      const start = Date.now();
      const iv = setInterval(() => {
        if (socketRef.current && socketRef.current.connected) {
          clearInterval(iv);
          return resolve(true);
        }
        if (Date.now() - start > timeout) {
          clearInterval(iv);
          return resolve(false);
        }
      }, 250);
    });

    const ok = await waitForSocket(10000);
    if (!ok) {
      return Alert.alert('Aguardando conexão', 'Socket não conectado. Verifique URL/rede/token e tente novamente.');
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return Alert.alert('Permissão negada', 'Ative a localização para rastrear.');
    }

    if (watchRef.current) return setTracking(true);

    try {
      const sub = await Location.watchPositionAsync(
        { accuracy: Location.LocationAccuracy.Highest, timeInterval: 2000, distanceInterval: 5 },
        (loc) => {
          const { latitude, longitude, speed, heading, accuracy } = loc.coords;
          if (accuracy && accuracy > 100) return;
          const payload = {
            routeId: Number(routeId),
            busId: busId ?? null,
            latitude,
            longitude,
            speed: speed ?? 0,
            heading: heading ?? 0,
            accuracy,
            timestamp: Date.now(),
          };
          safeEmitPosition(payload);
          setLastPos({ latitude, longitude, speed, heading, accuracy, timestamp: Date.now() });
        }
      );
      watchRef.current = sub;
      setTracking(true);
    } catch (err) {
      console.warn('Erro ao iniciar watchPosition:', err);
      Alert.alert('Erro', 'Não foi possível iniciar o rastreamento');
    }
  };

  const pararRastreamento = async () => {
    try {
      if (watchRef.current) {
        watchRef.current.remove?.();
        watchRef.current = null;
      }
    } catch (err) {
      console.warn('Erro ao parar watchPosition', err);
    }
    setTracking(false);
  };

  const abrirChat = () => {
    if (!routeId) return Alert.alert('Sem rota', 'Configure a rota antes de abrir o chat');
    navigation.navigate('Chat', { routeId: Number(routeId), routeName: '' });
  };

  const sair = async () => {
    await pararRastreamento();
    try {
      if (socketRef.current && socketRef.current.connected) {
        if (routeId) socketRef.current.emit('leave_room', Number(routeId));
      }
    } catch {}
    await logout();
    navigation.replace('Login');
  };

  return (
    <View style={[styles.container, { padding: 20 }]}>
      <Text style={styles.title}>Painel Motorista</Text>

      <Text style={{ marginTop: 8, fontWeight: '700' }}>Motorista: {userId ?? '-'}</Text>
      <Text>Bus ID: {busId ?? 'não definido'}</Text>

      <View style={{ marginTop: 12 }}>
        <Text style={{ marginBottom: 6, fontWeight: '700' }}>Selecione a rota</Text>
        {loadingRoutes ? (
          <ActivityIndicator />
        ) : (
          <View style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 6, overflow: 'hidden' }}>
            <Picker
              selectedValue={routeId ?? ''}
              onValueChange={(val) => setRouteId(val === '' ? null : Number(val))}
              mode="dropdown"
            >
              <Picker.Item label="-- Escolha a rota --" value="" />
              {routes.map((r) => (
                <Picker.Item key={r.id} label={`${r.id} — ${r.nome}`} value={r.id} />
              ))}
            </Picker>
          </View>
        )}
      </View>

      <Text style={{ marginTop: 12 }}>Status Socket: {socketConnected ? 'Conectado' : connectingError ? `Erro: ${connectingError}` : 'Desconectado'}</Text>
      <Text>Rastreamento: {tracking ? 'Ativo' : 'Parado'}</Text>

      <View style={{ height: 12 }} />

      {!tracking ? (
        <TouchableOpacity style={[styles.btn, { backgroundColor: '#28a745' }]} onPress={iniciarRastreamento}>
          <Text style={styles.btnTxt}>Iniciar Rastreamento</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={[styles.btn, { backgroundColor: '#6c757d' }]} onPress={pararRastreamento}>
          <Text style={styles.btnTxt}>Parar Rastreamento</Text>
        </TouchableOpacity>
      )}

      <View style={{ height: 12 }} />

      <TouchableOpacity style={[styles.btn, { backgroundColor: '#2b8aef' }]} onPress={abrirChat}>
        <Text style={styles.btnTxt}>Abrir Chat da Rota</Text>
      </TouchableOpacity>

      <View style={{ height: 16 }} />

      <Text style={{ fontWeight: '700' }}>Última posição enviada</Text>
      {lastPos ? (
        <View style={{ marginTop: 8 }}>
          <Text>Lat: {lastPos.latitude.toFixed(6)}</Text>
          <Text>Lng: {lastPos.longitude.toFixed(6)}</Text>
          <Text>Vel: {lastPos.speed ?? 0} m/s</Text>
          <Text>Acc: {lastPos.accuracy ?? '–'}</Text>
          <Text>Horário: {new Date(lastPos.timestamp).toLocaleString()}</Text>
        </View>
      ) : (
        <Text style={{ color: '#666', marginTop: 8 }}>Nenhuma posição enviada ainda</Text>
      )}

      <View style={{ height: 40 }} />

      <TouchableOpacity style={[styles.btn, { backgroundColor: '#6c757d' }]} onPress={sair}>
        <Text style={styles.btnTxt}>Sair</Text>
      </TouchableOpacity>
    </View>
  );
}