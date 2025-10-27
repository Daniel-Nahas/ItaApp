// telas/Map.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useTheme } from './ThemeContext';
import api from '../components/Api';
import { useAuth } from './AuthContext';

export default function Map({ route, navigation }: any) {
  const { styles } = useTheme();
  const { visitante } = useAuth();
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number}>({latitude: -24.190, longitude: -46.780});
  const [busPositions, setBusPositions] = useState<{id: number, latitude: number, longitude: number}[]>([]);
  const [routes, setRoutes] = useState<{coords: {latitude: number, longitude: number}[]}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resRoutes = await api.get('/bus/routes'); // Rotas de ida/volta
        setRoutes(resRoutes.data);

        const resBuses = await api.get('/bus/positions'); // Localização real dos ônibus
        setBusPositions(resBuses.data);

      } catch (err) {
        Alert.alert('Erro', 'Falha ao carregar dados do mapa');
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    const interval = setInterval(fetchData, 5000); // Atualiza posições a cada 5s
    return () => clearInterval(interval);
  }, []);

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

  return (
    <View style={styles.container}>
      <MapView
        style={{ flex: 1, width: '100%' }}
        initialRegion={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02
        }}
        showsUserLocation={!visitante}
      >
        {/* Marcadores dos ônibus */}
        {busPositions.map(bus => (
          <Marker
            key={bus.id}
            coordinate={{ latitude: bus.latitude, longitude: bus.longitude }}
            title={`Ônibus ${bus.id}`}
            pinColor="blue"
          />
        ))}

        {/* Rotas */}
        {routes.map((routeData, index) => (
          <Polyline
            key={index}
            coordinates={routeData.coords}
            strokeColor={index % 2 === 0 ? 'green' : 'red'}
            strokeWidth={4}
          />
        ))}
      </MapView>

      {!visitante && (
        <View style={styles.bottomNav}>
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
