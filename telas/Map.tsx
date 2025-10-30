// telas/Map.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, Image, Alert, ActivityIndicator, TextInput, ScrollView } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useTheme } from './ThemeContext';
import api from '../components/Api';
import { useAuth } from './AuthContext';
import * as Location from 'expo-location';

type RouteItem = {
  id?: number;
  nome?: string;
  pontos?: { lat: number; lng: number }[];
};

export default function Map({ navigation }: any) {
  const { styles } = useTheme();
  const { visitante, userId } = useAuth();

  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [busPositions, setBusPositions] = useState<{ id: number; latitude: number; longitude: number }[]>([]);
  const [routes, setRoutes] = useState<RouteItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Busca / filtro
  const [query, setQuery] = useState('');

  useEffect(() => {
    const getLocation = async () => {
      if (visitante) {
        setUserLocation({ latitude: -24.190, longitude: -46.780 });
        return;
      }
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
    };
    getLocation();
  }, [visitante]);

  const fetchData = async () => {
    try {
      const resRoutes = await api.get('/bus');
      const routesRaw: RouteItem[] = resRoutes.data || [];
      setRoutes(routesRaw);

      const resBuses = await api.get('/bus/positions');
      setBusPositions(resBuses.data || []);
    } catch (err) {
      console.log('Erro ao carregar dados do mapa:', err);
      Alert.alert('Erro', 'Falha ao carregar dados do mapa');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredRoutes = useMemo(() => {
    if (!query.trim()) return routes;
    const q = query.toLowerCase();
    return routes.filter(r => (r.nome || '').toLowerCase().includes(q));
  }, [routes, query]);

  // Função para registrar busca de rota
  const registrarBusca = async (routeId: number) => {
    try {
      await api.post('/users/route-search', { userId, routeId });
    } catch (err) {
      console.log('Erro ao registrar busca de rota:', err);
    }
  };

  if (loading || !userLocation) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

  return (
    <View style={styles.container}>
      {/* Barra de busca posicionada acima do meio */}
      <View
        style={{
          position: 'absolute',
          top: '30%',
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
          elevation: 3
        }}
      >
        <TextInput
          placeholder="Pesquisar rotas (ex.: Guapura, Centro)"
          value={query}
          onChangeText={setQuery}
          style={{ height: 40, fontSize: 16 }}
        />
      </View>

      {/* Lista de rotas filtradas */}
      {query.trim() !== '' && (
        <ScrollView
          style={{
            position: 'absolute',
            top: '38%',
            left: 20,
            right: 20,
            maxHeight: 150,
            backgroundColor: 'white',
            borderRadius: 10,
            zIndex: 11,
            padding: 10
          }}
        >
          {filteredRoutes.length === 0 ? (
            <Text style={{ color: '#666' }}>Nenhuma rota encontrada</Text>
          ) : (
            filteredRoutes.map(r => (
              <TouchableOpacity
                key={r.id}
                style={{ paddingVertical: 8 }}
                onPress={() => {
                  registrarBusca(r.id!);
                  setQuery(r.nome || '');
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
        {/* Marcadores dos ônibus */}
        {busPositions.map(bus => bus.latitude && bus.longitude && (
          <Marker
            key={bus.id}
            coordinate={{ latitude: bus.latitude, longitude: bus.longitude }}
            title={`Ônibus ${bus.id}`}
            pinColor="blue"
          />
        ))}

        {/* Polylines das rotas */}
        {filteredRoutes.map((r, index) => {
          const coords = (r.pontos || []).map(p => ({
            latitude: p.lat,
            longitude: p.lng,
          }));
          return (
            <Polyline
              key={r.id ?? index}
              coordinates={coords}
              strokeColor={index % 2 === 0 ? 'green' : 'red'}
              strokeWidth={4}
            />
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
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.replace('Login')}>
            <Text style={styles.btnTxtMap}>Sair da Conta</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
