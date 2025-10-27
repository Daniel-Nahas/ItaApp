// telas/AuthContext.tsx (serve para o sistema saber saber durante a navegação se o usuário está logado ou não)
import React, { createContext, useState, useContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AuthContextType = {
  token: string | null;
  visitante: boolean;
  userId: number | null;
  loginComoVisitante: () => void;
  login: (token: string, userId: number) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>(null!);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [visitante, setVisitante] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  const loginComoVisitante = () => {
  setVisitante(true);
  setToken(null);
  setUserId(null);
  AsyncStorage.removeItem('token');
};



  const login = async (newToken: string, id: number) => {
    setToken(newToken);
    setVisitante(false);
    setUserId(id);
    await AsyncStorage.setItem('token', newToken);
  };

  const logout = async () => {
    setToken(null);
    setVisitante(false);
    setUserId(null);
    await AsyncStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ token, visitante, userId, loginComoVisitante, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
