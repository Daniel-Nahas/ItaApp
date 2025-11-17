// components/Api.tsx
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.5.94:3000/api';

const api = axios.create({
  baseURL: API_URL,
});

// Interceptor para enviar token automaticamente
api.interceptors.request.use(async config => {
  const token = await AsyncStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
