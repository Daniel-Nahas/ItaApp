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
import Opcoes from './telas/Opcoes';
import AlterarSenha from './telas/AlterarSenha';
import Rota from './telas/Rota';
import AlterarEmail from './telas/AlterarEmail';
import ExcluirConta from './telas/ExcluirConta';

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
            <Stack.Screen name="Opcoes" component={Opcoes} />
            <Stack.Screen name="AlterarSenha" component={AlterarSenha} />
            <Stack.Screen name="Rota" component={Rota} />
            <Stack.Screen name="AlterarEmail" component={AlterarEmail} />
            <Stack.Screen name="ExcluirConta" component={ExcluirConta} />
          </Stack.Navigator>
        </NavigationContainer>
      </ThemeProvider>
    </AuthProvider>
  );
}