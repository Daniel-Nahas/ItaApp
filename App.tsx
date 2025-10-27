// App.tsx
import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Login from './telas/Login';
import Register from './telas/Register';
import EsqueciSenha from './telas/EsqueciSenha';
import Map from './telas/Map';
import Chat from './telas/Chat';
import Feedback from './telas/Feedback';
import TelaPerfil from './telas/TelaPerfil';

import { AuthProvider } from './telas/AuthContext';
import { ThemeProvider } from './telas/ThemeContext';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="Register" component={Register} />
            <Stack.Screen name="EsqueciSenha" component={EsqueciSenha} />
            <Stack.Screen name="Map" component={Map} />
            <Stack.Screen name="Chat" component={Chat} />
            <Stack.Screen name="Feedback" component={Feedback} />
            <Stack.Screen name="Perfil" component={TelaPerfil} />
          </Stack.Navigator>
        </NavigationContainer>
      </ThemeProvider>
    </AuthProvider>
  );
}