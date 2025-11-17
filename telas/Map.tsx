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
  StyleSheet,
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

export default function Map({ navigation }: any) {
  const { styles } = useTheme();
  const { visitante, userId } = useAuth();

  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [busPositions, setBusPositions] = useState<{ id: number; latitude: number; longitude: number }[]>([]);
  const [routes, setRoutes] = useState<RouteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const busAnim = useRef(new Animated.Value(0)).current;

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
    if (!query.trim()) return [];
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

  // Loading
  if (loading || !userLocation) {
    return (
      <View style={localStyles.loadingContainer}>
        <Animated.Image
          source={require('../assets/solo.png')}
          style={{
            width: 120,
            height: 120,
            transform: [{ translateX: busAnim }],
          }}
          resizeMode="contain"
        />
        <Text style={localStyles.loadingText}>Carregando mapa...</Text>
      </View>
    );
  }

  return (
    <View style={localStyles.container}>
      {/* Mapa cobrindo toda a tela */}
      <MapView
        provider={PROVIDER_GOOGLE}
        style={localStyles.map}
        region={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
        showsUserLocation={!visitante}
      >
  
     {/*busPositions.map(bus =>     ///toda essa parte tava responsavel por aqueles pontos azuis escritos onibus
          bus.latitude && bus.longitude ? (
            <Marker
              key={bus.id}
              coordinate={{ latitude: Number(bus.latitude), longitude: Number(bus.longitude) }}
              title={`Ônibus ${bus.id}`}
              pinColor="blue"
            />
          ) : null
        )*/}

        {filteredRoutes.length > 0 &&
          filteredRoutes.map((r, index) => {
            const pontos = Array.isArray(r.pontos) ? r.pontos : [];
            const coords = pontos
              .map((p: any) => ({
                latitude: Number(p.lat),
                longitude: Number(p.lng),
              }))
              .filter(coord => !isNaN(coord.latitude) && !isNaN(coord.longitude));

            if (coords.length < 2) return null;

            return (
              <Polyline
                key={r.id ?? index}
                coordinates={coords}
                strokeColor={index % 2 === 0 ? '#00A86B' : '#D32F2F'}
                strokeWidth={4}
              />
            );
          })}
      </MapView>

      {/* Logo no topo */}
      <Image source={require('../assets/logo2.png')} style={localStyles.logo} />

      {/* Barra de pesquisa */}
      <View style={localStyles.searchContainer}>
        <TextInput
          placeholder="Qual ônibus você espera?"
          value={query}
          onChangeText={setQuery}
          style={localStyles.searchInput}
        />
      </View>

      {/* Resultados da busca */}
      {query.trim() !== '' && (
        <ScrollView style={localStyles.resultsContainer}>
          {filteredRoutes.length === 0 ? (
            <Text style={localStyles.noResult}>Nenhuma rota encontrada</Text>
          ) : (
            filteredRoutes.map(r => (
              <TouchableOpacity
                key={String(r.id)}
                style={localStyles.resultItem}
                onPress={() => {
                  registrarBusca(r.id!);
                  navigation.dispatch(
                    StackActions.replace('Rota', { routeId: r.id, routeName: r.nome })
                  );
                }}
              >
                <Text style={localStyles.resultText}>{r.nome}</Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}

      {/* Barra de navegação inferior */}
      <View style={localStyles.bottomNav}>
        {visitante ? (
          <TouchableOpacity
            style={localStyles.navItem}
            onPress={() => navigation.replace('Login')}
          >
            <Text style={localStyles.btnTxtMap}>Login</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity style={localStyles.navItemActive}>
              <Image source={require('../assets/home2.png')} style={localStyles.navIcon} />
              <View style={localStyles.activeIndicator} />
            </TouchableOpacity>
            <TouchableOpacity
              style={localStyles.navItem}
              onPress={() => navigation.replace('Perfil')}
            >
              <Image source={require('../assets/perfil.png')} style={localStyles.navIcon} />
            </TouchableOpacity>
            <TouchableOpacity
              style={localStyles.navItem}
              onPress={() => navigation.replace('Opcoes')}
            >
              <Image source={require('../assets/opcao.png')} style={localStyles.navIcon} />
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

// Estilos locais para o mapa full-screen

const normal = 'regular';
const grossa = 'bold';

const localStyles = StyleSheet.create({

  

  container: {
    flex: 1,
    backgroundColor: '#F5F5DC',
  },
  map: {
    ...StyleSheet.absoluteFillObject, // Cobrir toda a tela
  },
  logo: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
    width: 80,
    height: 80,
    resizeMode: 'contain',
    zIndex: 10,
  },
  searchContainer: {
    position: 'absolute',
    top: 140,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#F15A24',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 4,
    shadowColor: '#ff6868ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    zIndex: 10,

    ////
  },
  searchInput: {
    height: 40,
    fontSize: 16,
    color:'#003366'
    
  },
  resultsContainer: {
    position: 'absolute',
    width:'85%',
    top: 195,
    left: 30,
    right: 20,
    maxHeight: 200,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    zIndex: 11,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  resultItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    fontFamily: 'normal',
  },
  resultText: {
    fontSize: 16,
    color:'#003366',
  },
  noResult: {
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 10,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 30,
    left: 70,
    right: 70,
    height: 60,
    backgroundColor: 'white',
    borderRadius: 30,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 10,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  navItemActive: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  navIcon: {
    width: 26,
    height: 26,
  },
  activeIndicator: {
    marginTop: 6,
    width: 32,
    height: 3,
    backgroundColor: '#F15A24',
    borderRadius: 2,
  },
  btnTxtMap: {
    color: '#333',
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5DC',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#F15A24',
    fontFamily: grossa,

  },
});