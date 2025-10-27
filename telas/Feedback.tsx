// telas/Feedback.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useTheme } from './ThemeContext';

export default function Feedback({ navigation }: any) {
  const [stars, setStars] = useState(0);
  const { styles } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Avalie o app</Text>

      <View style={{ flexDirection: 'row', marginBottom: 20 }}>
        {[1, 2, 3, 4, 5].map(n => (
          <TouchableOpacity key={n} onPress={() => setStars(n)}>
            <Text style={{ fontSize: 30, color: n <= stars ? 'gold' : 'gray' }}>★</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Barra de navegação inferior */}
        <View style={styles.bottomNav}>
          
          <TouchableOpacity style={styles.navItem}>
            <Image source={require('../assets/onibus.png')} style={styles.navIcon} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.replace('Perfil')}>
            <Image source={require('../assets/nav.png')} style={styles.navIcon} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => navigation.replace('Chat')}>
            <Image source={require('../assets/nav1.png')} style={styles.navIcon} />
          </TouchableOpacity>
          
          <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.replace('Feedback')}
          >
          <Text style={styles.btnTxtMap}>F</Text>
          <View style={styles.activeIndicator} />
          </TouchableOpacity>

          <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.replace('Login')}
          >
          <Text style={styles.btnTxtMap}>Sair da Conta</Text>
          </TouchableOpacity>

        </View>
        
    </View>
  );
}