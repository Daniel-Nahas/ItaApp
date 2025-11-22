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

type RouteItem = {
  id?: number;
  nome?: string;
  pontos?: { lat: number; lng: number }[] | string;
  tipo?: string;
};

export default function Rota({ navigation, route }: any) {
  const { styles } = useTheme();
  const { visitante, userId } = useAuth();
  const params: any = route?.params || {};

  const selectedRouteIdParam = params?.routeId ?? null;
  const selectedRouteNameParam = params?.routeName ?? '';

  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [busPositions, setBusPositions] = useState<{ id: number; latitude: number; longitude: number }[]>([]);
  const [routes, setRoutes] = useState<RouteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const busAnim = useRef(new Animated.Value(0)).current;

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

  useEffect(() => {
    const getLocation = async () => {
      if (visitante) {
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

  const fetchData = async () => {
    try {
      const [resRoutes, resBuses] = await Promise.all([
        api.get('/bus').catch(() => ({ data: [] })),
        api.get('/bus/positions').catch(() => ({ data: [] })),
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
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const filteredRoutes = useMemo(() => {
    if (!query.trim()) return routes;
    const q = query.toLowerCase();
    return routes.filter(r => (r.nome || '').toLowerCase().includes(q));
  }, [routes, query]);

  // registrar busca: enviar apenas routeId (backend deve extrair userId do token)
  const registrarBusca = async (routeId: number) => {
    try {
      await api.post('/users/route-search', { routeId });
    } catch (err: any) {
      console.error('Erro ao registrar busca de rota:', err?.response?.status, err?.response?.data || err?.message || err);
    }
  };

  // -------------------------
  // Hooks / estado para fake tracking (TOPO, ordem estável)
  // -------------------------
  const mapRef = useRef<MapView | null>(null);
  const fakeIntervalRef = useRef<number | null>(null);
  const [fakeIndex, setFakeIndex] = useState(0);
  const [fakePos, setFakePos] = useState<{ latitude: number; longitude: number } | null>(null);
  const followMarkerRef = useRef(true);

  // selectedRoute e coords calculados com useMemo (não condicionais)
  const selectedRoute = useMemo(() => {
    if (!selectedRouteIdParam) return null;
    return routes.find(r => Number(r.id) === Number(selectedRouteIdParam)) || null;
  }, [routes, selectedRouteIdParam]);

  const coords = useMemo(() => {
    const pontos = (selectedRoute?.pontos as any) || [];
    return Array.isArray(pontos) ? pontos.map((p: any) => ({ latitude: Number(p.lat), longitude: Number(p.lng) })) : [];
  }, [selectedRoute]);

  // efeito top-level para fake tracking (inicia/limpa interval)
  useEffect(() => {
    // limpa anterior
    if (fakeIntervalRef.current) {
      clearInterval(fakeIntervalRef.current);
      fakeIntervalRef.current = null;
    }

    if (!coords || coords.length === 0) {
      setFakePos(null);
      setFakeIndex(0);
      return;
    }

    if (visitante) {
      setFakePos(null);
      setFakeIndex(0);
      return;
    }

    // iniciar no primeiro ponto
    setFakePos(coords[0]);
    setFakeIndex(0);

    const STEP_MS = 1000; // ajuste de velocidade
    let idx = 0;

    fakeIntervalRef.current = (setInterval(() => {
      idx = (idx + 1) % coords.length;
      const next = coords[idx];
      setFakePos(next);
      setFakeIndex(idx);

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
          } catch (e) {
            // silencioso
          }
        });
      }
    }, STEP_MS) as unknown) as number;

    return () => {
      if (fakeIntervalRef.current) {
        clearInterval(fakeIntervalRef.current);
        fakeIntervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(coords), visitante]);

  // proteção: enquanto carrega ou sem localização válida
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

  // Branch: rota selecionada por param
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

          {coords.length >= 2 && <Polyline key={String(selectedRoute.id ?? 'route')} coordinates={coords} strokeColor={'green'} strokeWidth={4} />}

          {/* marcador fake que simula um ônibus em movimento */}
          {fakePos && (
            <Marker key={`fake-${fakeIndex}`} coordinate={fakePos} title={`Ônibus simulado`} pinColor="orange">
              <Image source={require('../assets/onibus.png')} style={{ width: 36, height: 36, tintColor: 'orange' }} />
            </Marker>
          )}
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
            {/*COLOCAR UM ICONE DE CHAT AQUI
            <Image source={require('../assets/chat-icon.png')} style={{ width: 26, height: 26, tintColor: '#fff' }} /> */}
          </TouchableOpacity>
        )}

        {/* Barra inferior: para visitante volta ao Map; para autenticado mostra itens normais */}
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

  // Caso padrão: mapa geral + busca + listagem
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
          const pontos = (r.pontos as any) || [];
          const coords = Array.isArray(pontos) ? pontos.map((p: any) => ({ latitude: Number(p.lat), longitude: Number(p.lng) })) : [];
          if (coords.length < 2) return null;
          return <Polyline key={String(r.id ?? index)} coordinates={coords} strokeColor={index % 2 === 0 ? 'green' : 'red'} strokeWidth={4} />;
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