// telas/AuthContext.tsx
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../components/Api';

type User = {
  id?: number;
  nome?: string;
  email?: string;
  role?: string; // ex.: 'driver' para motoristas
  busId?: number | null;
  currentRouteId?: number | null;
  foto_url?: string | null;
};

type AuthContextType = {
  token: string | null;
  user: User | null;
  visitante: boolean;
  userId: number | null;
  loginComoVisitante: () => void;
  login: (token: string, userId: number) => Promise<void>;
  signIn: (payload: { token: string; user: User }) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>(null!);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [visitante, setVisitante] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  // Salva token e configura header default do axios
  const applyToken = async (t: string | null) => {
    if (t) {
      api.defaults.headers.common['Authorization'] = `Bearer ${t}`;
      await AsyncStorage.setItem('token', t);
      setToken(t);
      setVisitante(false);
    } else {
      delete api.defaults.headers.common['Authorization'];
      await AsyncStorage.removeItem('token');
      setToken(null);
    }
  };

  const loginComoVisitante = () => {
    setVisitante(true);
    setToken(null);
    setUser(null);
    setUserId(null);
    delete api.defaults.headers.common['Authorization'];
    AsyncStorage.removeItem('token');
  };

  // login tradicional existente — mantém compatibilidade (recebe token e userId)
  const login = async (newToken: string, id: number) => {
    await applyToken(newToken);
    setUserId(id);
    setVisitante(false);
  };

  // signIn mais completo usado por telas de login (ex.: LoginMotorista)
  // payload: { token, user }
  const signIn = async (payload: { token: string; user: User }) => {
    const { token: t, user: u } = payload;
    if (!t) throw new Error('Token ausente');
    await applyToken(t);
    setUser(u ?? null);
    setUserId(u?.id ?? null);
    setVisitante(false);
    // salva também o objeto user para restauração rápida (opcional)
    try {
      await AsyncStorage.setItem('user', JSON.stringify(u ?? {}));
    } catch (err) {
      // não bloqueante
      console.warn('Falha ao salvar user no AsyncStorage', err);
    }
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    setVisitante(false);
    setUserId(null);
    delete api.defaults.headers.common['Authorization'];
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
  };

  // Ao iniciar o app, tenta restaurar token + user e, se token existir, busca /auth/profile para garantir dados atualizados
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        const storedUser = await AsyncStorage.getItem('user');
        if (storedToken) {
          api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          setToken(storedToken);
          setVisitante(false);

          // Prefere perfil via API para garantir dados atualizados
          try {
            const res = await api.get('/auth/profile');
            if (res?.data) {
              setUser(res.data);
              setUserId(res.data.id ?? null);
              await AsyncStorage.setItem('user', JSON.stringify(res.data));
            } else if (storedUser) {
              const u = JSON.parse(storedUser);
              setUser(u);
              setUserId(u?.id ?? null);
            }
          } catch (err) {
            // fallback para storedUser se /auth/profile falhar
            if (storedUser) {
              const u = JSON.parse(storedUser);
              setUser(u);
              setUserId(u?.id ?? null);
            } else {
              // sem dados do usuário, removemos token para forçar login
              setToken(null);
              delete api.defaults.headers.common['Authorization'];
              await AsyncStorage.removeItem('token');
            }
          }
        } else {
          // sem token
          if (storedUser) {
            const u = JSON.parse(storedUser);
            setUser(u);
            setUserId(u?.id ?? null);
          }
        }
      } catch (err) {
        console.warn('Erro ao restaurar token/user', err);
      }
    };

    bootstrap();
  }, []);

  return (
    <AuthContext.Provider value={{
      token,
      user,
      visitante,
      userId,
      loginComoVisitante,
      login,
      signIn,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);