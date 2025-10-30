import React, { useEffect, useMemo, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, Alert, Animated, Easing, TextInput, ScrollView } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useTheme } from './ThemeContext';
import api from '../components/Api';
import { useAuth } from './AuthContext';
import * as Location from 'expo-location';

type RouteItem = {
  id?: number;
  nome?: string;
  pontos?: { lat: number; lng: number }[] | string;
  tipo?: string;
};

export default function Map({ navigation }: any) {
  const { styles } = useTheme();
  const { visitante, userId } = useAuth();

  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [busPositions, setBusPositions] = useState<{ id: number; latitude: number; longitude: number }[]>([]);
  const [routes, setRoutes] = useState<RouteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const busAnim = useRef(new Animated.Value(0)).current;

  // animação do "ônibus andando"
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(busAnim, { toValue: 30, duration: 700, useNativeDriver: true, easing: Easing.linear }),
        Animated.timing(busAnim, { toValue: -30, duration: 700, useNativeDriver: true, easing: Easing.linear }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    const getLocation = async () => {
      if (visitante) {
        setUserLocation({ latitude: -24.190, longitude: -46.780 });
        return;
      }
      try {
        console.log("📡 Solicitando permissão de localização...");
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permissão Negada', 'Não foi possível acessar a localização.');
          setUserLocation({ latitude: -24.190, longitude: -46.780 });
          return;
        }
        const location = await Location.getCurrentPositionAsync({});
        console.log('Localização obtida:', location.coords);
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
      console.log('Buscando rotas e posições...');
      const [resRoutes, resBuses] = await Promise.all([
        api.get('/bus').catch(err => { console.log('Erro rotas:', err.message); return { data: [] }; }),
        api.get('/bus/positions').catch(err => { console.log('Erro posições:', err.message); return { data: [] }; }),
      ]);
      console.log('Rotas recebidas:', resRoutes.data.length);
      console.log('Posições recebidas:', resBuses.data.length);
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
    const interval = setInterval(fetchData, 10000); // reduz um pouco para 10s
    return () => clearInterval(interval);
  }, []);

  const filteredRoutes = useMemo(() => {
    if (!query.trim()) return routes;
    const q = query.toLowerCase();
    return routes.filter(r => (r.nome || '').toLowerCase().includes(q));
  }, [routes, query]);

  const registrarBusca = async (routeId: number) => {
    try {
      await api.post('/users/route-search', { userId, routeId });
    } catch (err) {
      console.log('Erro ao registrar busca de rota:', err);
    }
  };

  // Tela de carregamento animada
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

  // Tela principal do mapa
  return (
    <View style={styles.container}>
      {/* Barra de pesquisa */}
      <View style={{
        position: 'absolute', top: '6%', left: 20, right: 20, zIndex: 10,
        backgroundColor: 'white', borderRadius: 25, paddingHorizontal: 15, paddingVertical: 8,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5,
        elevation: 3
      }}>
        <TextInput
          placeholder="Pesquisar rotas (ex.: Guapura, Centro)"
          value={query}
          onChangeText={setQuery}
          style={{ height: 40, fontSize: 16 }}
        />
      </View>

      {query.trim() !== '' && (
        <ScrollView style={{
          position: 'absolute', top: '14%', left: 20, right: 20,
          maxHeight: 150, backgroundColor: 'white', borderRadius: 10, zIndex: 11, padding: 10
        }}>
          {filteredRoutes.length === 0 ? (
            <Text style={{ color: '#666' }}>Nenhuma rota encontrada</Text>
          ) : (
            filteredRoutes.map(r => (
              <TouchableOpacity key={r.id} style={{ paddingVertical: 8 }} onPress={() => { registrarBusca(r.id!); setQuery(r.nome || ''); }}>
                <Text style={{ fontSize: 16 }}>{r.nome}</Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}

      {/* Mapa */}
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
        {busPositions.map(bus => (bus.latitude && bus.longitude) && (
          <Marker
            key={bus.id}
            coordinate={{ latitude: Number(bus.latitude), longitude: Number(bus.longitude) }}
            title={`Ônibus ${bus.id}`}
            pinColor="blue"
          />
        ))}

        {filteredRoutes.map((r, index) => {
          const pontos = (r.pontos as any) || [];
          const coords = Array.isArray(pontos) ? pontos.map((p: any) => ({
            latitude: Number(p.lat),
            longitude: Number(p.lng)
          })) : [];
          if (coords.length < 2) return null;
          return (
            <Polyline key={r.id ?? index} coordinates={coords} strokeColor={index % 2 === 0 ? 'green' : 'red'} strokeWidth={4} />
          );
        })}
      </MapView>

      {/* Barra de navegação inferior */}
      {visitante ? (
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.replace('Login')}>
            <Text style={styles.btnTxtMap}>Login</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem}>
            <Image source={require('../assets/onibus.png')} style={styles.navIcon} />
            <View style={styles.activeIndicator} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.replace('Perfil')}>
            <Image source={require('../assets/nav.png')} style={styles.navIcon} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.replace('Chat')}>
            <Image source={require('../assets/nav1.png')} style={styles.navIcon} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.replace('Feedback')}>
            <Text style={styles.btnTxtMap}>F</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItemSair} onPress={() => navigation.replace('Login')}>
            <Text style={styles.btnTxtMap}>Sair</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
