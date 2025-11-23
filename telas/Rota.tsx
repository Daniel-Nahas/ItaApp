// telas/Rota.tsx
import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  Animated,
  Easing,
  TextInput,
  ScrollView,
  InteractionManager,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useTheme } from './ThemeContext';
import api from '../components/Api';
import { useAuth } from './AuthContext';
import * as Location from 'expo-location';
import { StackActions } from '@react-navigation/native';
import io, { Socket } from 'socket.io-client'; // Socket.IO-client

type RouteItem = {
  id?: number;
  nome?: string;
  pontos?: { lat: number; lng: number }[] | string;
  tipo?: string;
};

export default function Rota({ navigation, route }: any) {
  const { styles } = useTheme();
  const { visitante, userId, token } = useAuth();
  const params: any = route?.params || {};

  const selectedRouteIdParam = params?.routeId ?? null;
  const selectedRouteNameParam = params?.routeName ?? '';

  // -----------------------
  // Estado local
  // -----------------------
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [busPositions, setBusPositions] = useState<{ id: number; latitude: number; longitude: number; route_id?: number }[]>([]);
  const [routes, setRoutes] = useState<RouteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  // animação do logo enquanto carrega
  const busAnim = useRef(new Animated.Value(0)).current;

  // -----------------------
  // Animação de logo (carregando)
  // -----------------------
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(busAnim, { toValue: 30, duration: 700, useNativeDriver: true, easing: Easing.linear }),
        Animated.timing(busAnim, { toValue: -30, duration: 700, useNativeDriver: true, easing: Easing.linear }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [busAnim]);

  // -----------------------
  // Obter localização do dispositivo (permissão)
  // -----------------------
  useEffect(() => {
    const getLocation = async () => {
      if (visitante) {
        // visitante: posição padrão
        setUserLocation({ latitude: -24.190, longitude: -46.780 });
        return;
      }
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permissão Negada', 'Não foi possível acessar a localização.');
          setUserLocation({ latitude: -24.190, longitude: -46.780 });
          return;
        }
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } catch (e) {
        console.warn('Erro ao obter localização:', e);
        setUserLocation({ latitude: -24.190, longitude: -46.780 });
      }
    };
    getLocation();
  }, [visitante]);

  // -----------------------
  // Buscar rotas e posições (usa /api/bus e /api/bus/positions)
  // Atualiza a cada 10s - evita loops infinitos porque é um intervalo controlado
  // -----------------------
  const fetchData = async () => {
    try {
      const [resRoutes, resBuses] = await Promise.all([
        api.get('/bus').catch(err => {
          console.log('Erro rotas (fetchData):', err?.message || err);
          return { data: [] };
        }),
        api.get('/bus/positions').catch(err => {
          console.log('Erro posições (fetchData):', err?.message || err);
          return { data: [] };
        }),
      ]);

      setRoutes(resRoutes.data || []);
      setBusPositions(resBuses.data || []);
    } catch (err) {
      console.log('Falha geral no fetchData:', err);
      Alert.alert('Erro', 'Falha ao carregar dados do mapa');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // 10s
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -----------------------
  // Filtragem local das rotas (barra de busca)
  // -----------------------
  const filteredRoutes = useMemo(() => {
    if (!query.trim()) return routes;
    const q = query.toLowerCase();
    return routes.filter(r => (r.nome || '').toLowerCase().includes(q));
  }, [routes, query]);

  // -----------------------
  // registrar busca: envia somente routeId (token no backend deve resolver user)
  // -----------------------
  const registrarBusca = async (routeId: number) => {
    try {
      await api.post('/users/route-search', { routeId }).catch(() => {});
    } catch (err) {
      console.log('Erro ao registrar busca de rota:', err);
    }
  };

  // -----------------------
  // Socket.IO — rastreamento em tempo real
  // Explicação:
  // 1) Criamos uma conexão client com o servidor Socket.IO.
  // 2) Quando há uma rota selecionada, entramos na sala "route_<id>".
  // 3) Ouvimos eventos do servidor com posições atualizadas e aplicamos em busPositions.
  // 4) Limpamos a conexão ao sair da rota/desmontar.
  // -----------------------
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Só conecta em rota específica e se não for visitante
    if (!selectedRouteIdParam || visitante) return;

    // Exemplo de URL do Socket.IO: ajuste para seu backend (mesma origem da API ou variável de ambiente)
    const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:3000';

    // Conecta com token (se houver) via query; o backend já sabe extrair do handshake
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 10,
      query: token ? { token } : undefined,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      // entrar na sala da rota
      socket.emit('join_room', Number(selectedRouteIdParam));
      // opcional: solicitar última posição inicial
      socket.emit('bus_request_latest', { routeId: Number(selectedRouteIdParam) });
    });

    // Evento esperado do servidor para atualização de posições
    // - 'bus_position_update' para posição de um ônibus
    // - ou 'bus_positions_snapshot' para lista completa
    socket.on('bus_position_update', (payload: { id: number; latitude: number; longitude: number; route_id?: number }) => {
      if (!payload || !payload.latitude || !payload.longitude) return;
      setBusPositions(prev => {
        // atualiza ou insere o ônibus por id
        const idx = prev.findIndex(b => String(b.id) === String(payload.id));
        const nextItem = { id: payload.id, latitude: Number(payload.latitude), longitude: Number(payload.longitude), route_id: payload.route_id };
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = nextItem;
          return copy;
        }
        return [...prev, nextItem];
      });
    });

    socket.on('bus_positions_snapshot', (list: { id: number; latitude: number; longitude: number; route_id?: number }[]) => {
      if (!Array.isArray(list)) return;
      setBusPositions(list.map(b => ({ id: b.id, latitude: Number(b.latitude), longitude: Number(b.longitude), route_id: b.route_id })));
    });

    socket.on('disconnect', () => {
      // limpeza automática (o useEffect também faz cleanup abaixo)
    });

    // Cleanup: sair da sala e desconectar
    return () => {
      try {
        socket.emit('leave_room', Number(selectedRouteIdParam));
        socket.disconnect();
      } catch {}
      socketRef.current = null;
    };
  }, [selectedRouteIdParam, visitante, token]);

  // -----------------------
  // Fake tracking
  // Objetivo: simular um ônibus andando pelos pontos da rota sem precisar do backend em tempo real.
  // Como funciona:
  // - Criamos um índice (fakeIndex) que percorre o array de coordenadas da rota (coords).
  // - A cada STEP_MS, atualizamos fakePos para o próximo ponto.
  // - Opcionalmente, animamos a câmera para seguir o marcador simulado.
  // Observação:
  // - ESTA LÓGICA ESTÁ DESATIVADA por padrão (comentada) porque agora usamos Socket.IO de verdade.
  // - Para testar offline, descomente o bloco do useEffect e a renderização do Marker fake.
  // -----------------------
  const mapRef = useRef<MapView | null>(null);
  const fakeIntervalRef = useRef<number | null>(null);
  const [fakeIndex, setFakeIndex] = useState(0);
  const [fakePos, setFakePos] = useState<{ latitude: number; longitude: number } | null>(null);
  const followMarkerRef = useRef(true);

  const selectedRoute = useMemo(() => {
    if (!selectedRouteIdParam) return null;
    return routes.find(r => Number(r.id) === Number(selectedRouteIdParam)) || null;
  }, [routes, selectedRouteIdParam]);

  const coords = useMemo(() => {
    const pontos = (selectedRoute?.pontos as any) || [];
    let parsed = pontos;
    if (typeof pontos === 'string') {
      try {
        parsed = JSON.parse(pontos);
      } catch {
        parsed = [];
      }
    }
    return Array.isArray(parsed) ? parsed.map((p: any) => ({ latitude: Number(p.lat), longitude: Number(p.lng) })) : [];
  }, [selectedRoute]);

  // Fake tracking effect (DESATIVADO — deixe comentado para referência)
  /*
  useEffect(() => {
    // 1) Limpa qualquer intervalo anterior
    if (fakeIntervalRef.current) {
      clearInterval(fakeIntervalRef.current);
      fakeIntervalRef.current = null;
    }

    // 2) Se não houver pontos na rota, ou se for visitante, não iniciar
    if (!coords || coords.length === 0 || visitante) {
      setFakePos(null);
      setFakeIndex(0);
      return;
    }

    // 3) Inicializa posição no primeiro ponto
    setFakePos(coords[0]);
    setFakeIndex(0);

    // 4) Define o intervalo de atualização da posição (ms)
    const STEP_MS = 1000;
    let idx = 0;

    // 5) Intervalo que avança o índice e atualiza posição do marcador
    fakeIntervalRef.current = (setInterval(() => {
      idx = (idx + 1) % coords.length;
      const next = coords[idx];
      setFakePos(next);
      setFakeIndex(idx);

      // 6) Opcional: anima a câmera para seguir o marcador
      if (followMarkerRef.current && mapRef.current && next) {
        InteractionManager.runAfterInteractions(() => {
          try {
            mapRef.current?.animateCamera(
              {
                center: { latitude: next.latitude, longitude: next.longitude },
                pitch: 0,
                heading: 0,
                zoom: 16,
              },
              { duration: 600 }
            );
          } catch {}
        });
      }
    }, STEP_MS) as unknown) as number;

    // 7) Cleanup do intervalo ao desmontar/alterar dependências
    return () => {
      if (fakeIntervalRef.current) {
        clearInterval(fakeIntervalRef.current);
        fakeIntervalRef.current = null;
      }
    };
  }, [JSON.stringify(coords), visitante]);
  */

  // Se ainda carregando / sem localização: mostrar animação
  if (loading || !userLocation) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }]}>
        <Animated.Image
          source={require('../assets/logo.png')}
          style={{
            width: 120,
            height: 120,
            transform: [{ translateX: busAnim }],
          }}
          resizeMode="contain"
        />
        <Text style={{ marginTop: 20, fontSize: 16, color: '#555' }}>Carregando mapa...</Text>
      </View>
    );
  }

  // Branch: rota selecionada por param (mostra detalhe + socket em tempo real)
  if (selectedRouteIdParam) {
    if (!selectedRoute) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Rota não encontrada</Text>
          <TouchableOpacity style={styles.btn} onPress={() => navigation.goBack()}>
            <Text style={styles.btnTxt}>Voltar</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const centerLat = coords.length ? coords[0].latitude : (userLocation.latitude ?? -24.19);
    const centerLng = coords.length ? coords[0].longitude : (userLocation.longitude ?? -46.78);

    return (
      <View style={styles.container}>
        <Text style={[styles.title, { marginTop: 12 }]}>{selectedRoute.nome ?? selectedRouteNameParam}</Text>

        <MapView
          ref={(r) => {
            mapRef.current = r;
          }}
          provider={PROVIDER_GOOGLE}
          style={{ flex: 1, width: '100%' }}
          initialRegion={{
            latitude: centerLat,
            longitude: centerLng,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
          showsUserLocation={!visitante}
        >
          {/* === Marcadores dos ônibus (em tempo real via Socket.IO + fallback do backend REST) === */}
          {busPositions.map((bus, i) =>
            bus.latitude && bus.longitude ? (
              <Marker
                key={String(bus.id ?? i)}
                coordinate={{ latitude: Number(bus.latitude), longitude: Number(bus.longitude) }}
                title={`Ônibus ${bus.id}`}
                pinColor="blue"
              />
            ) : null
          )}

          {/* === Polyline da rota selecionada (do banco /api/bus) === */}
          {coords.length >= 2 && <Polyline key={String(selectedRoute.id ?? 'route')} coordinates={coords} strokeColor={'yellow'} strokeWidth={4} />}

          {/* === Marcador fake (DESATIVADO) — descomente para testar offline */}
          {/*
          {fakePos && (
            <Marker key={`fake-${fakeIndex}`} coordinate={fakePos} title={`Ônibus simulado`} pinColor="orange">
              <Image source={require('../assets/onibus.png')} style={{ width: 36, height: 36, tintColor: 'orange' }} />
            </Marker>
          )}
          */}
        </MapView>

        {/* Botão de Chat: mostra apenas para usuários autenticados */}
        {!visitante && (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('Chat', {
                routeId: Number(selectedRouteIdParam),
                routeName: selectedRoute.nome ?? selectedRouteNameParam,
              })
            }
            style={{
              position: 'absolute',
              right: 18,
              bottom: 100,
              backgroundColor: '#2b8aef',
              padding: 12,
              borderRadius: 28,
              elevation: 5,
              shadowColor: '#000',
              shadowOpacity: 0.2,
              shadowOffset: { width: 0, height: 2 },
            }}
            accessibilityRole="button"
            accessibilityLabel="Abrir chat da rota"
          >
            {/* Ícone de chat pode ser colocado aqui */}
          </TouchableOpacity>
        )}

        {/* Barra inferior */}
        {visitante ? (
          <View style={styles.bottomNav}>
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.replace('Map')}>
              <Text style={styles.btnTxtMap}>Voltar ao Mapa</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.bottomNav}>
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.replace('Map')}>
              <Image source={require('../assets/onibus.png')} style={styles.navIcon} />
              <View style={styles.activeIndicator} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.replace('Perfil')}>
              <Image source={require('../assets/nav.png')} style={styles.navIcon} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.replace('Opcoes')}>
              <Text style={styles.btnTxtMap}>O</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  // -----------------------
  // Caso padrão: mapa geral + busca + listagem
  // -----------------------
  return (
    <View style={styles.container}>
      <View
        style={{
          position: 'absolute',
          top: '6%',
          left: 20,
          right: 20,
          zIndex: 10,
          backgroundColor: 'white',
          borderRadius: 25,
          paddingHorizontal: 15,
          paddingVertical: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 5,
          elevation: 3,
        }}
      >
        <TextInput placeholder="Pesquisar rotas (ex.: Guapura, Centro)" value={query} onChangeText={setQuery} style={{ height: 40, fontSize: 16 }} />
      </View>

      {query.trim() !== '' && (
        <ScrollView
          style={{
            position: 'absolute',
            top: '14%',
            left: 20,
            right: 20,
            maxHeight: 150,
            backgroundColor: 'white',
            borderRadius: 10,
            zIndex: 11,
            padding: 10,
          }}
        >
          {filteredRoutes.length === 0 ? (
            <Text style={{ color: '#666' }}>Nenhuma rota encontrada</Text>
          ) : (
            filteredRoutes.map((r, index) => (
              <TouchableOpacity
                key={String(r.id ?? index)}
                style={{ paddingVertical: 8 }}
                onPress={() => {
                  registrarBusca(r.id!);
                  navigation.navigate('Rota', { routeId: r.id, routeName: r.nome });
                }}
              >
                <Text style={{ fontSize: 16 }}>{r.nome}</Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}

      <MapView
        provider={PROVIDER_GOOGLE}
        style={{ flex: 1, width: '100%' }}
        initialRegion={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
        showsUserLocation={!visitante}
      >
        {busPositions.map((bus, i) =>
          bus.latitude && bus.longitude ? (
            <Marker key={String(bus.id ?? i)} coordinate={{ latitude: Number(bus.latitude), longitude: Number(bus.longitude) }} title={`Ônibus ${bus.id}`} pinColor="blue" />
          ) : null
        )}

        {filteredRoutes.map((r, index) => {
          // r.pontos pode vir como string (JSON) ou array
          const pontosRaw = (r.pontos as any) || [];
          let pontosParsed: any[] = [];
          if (typeof pontosRaw === 'string') {
            try {
              pontosParsed = JSON.parse(pontosRaw);
            } catch {
              pontosParsed = [];
            }
          } else if (Array.isArray(pontosRaw)) {
            pontosParsed = pontosRaw;
          }
          const coordsLocal = pontosParsed.map((p: any) => ({ latitude: Number(p.lat), longitude: Number(p.lng) }));
          if (coordsLocal.length < 2) return null;
          return <Polyline key={String(r.id ?? index)} coordinates={coordsLocal} strokeColor={index % 2 === 0 ? 'green' : 'red'} strokeWidth={4} />;
        })}
      </MapView>

      {visitante ? (
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.replace('Map')}>
            <Text style={styles.btnTxtMap}>Voltar ao Mapa</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem}>
            <Image source={require('../assets/onibus.png')} style={styles.navIcon} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.replace('Perfil')}>
            <Image source={require('../assets/nav.png')} style={styles.navIcon} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.replace('Opcoes')}>
            <Text style={styles.btnTxtMap}>O</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}