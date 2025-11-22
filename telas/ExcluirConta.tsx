// telas/ExcluirConta.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useTheme } from './ThemeContext';
import api from '../components/Api';
import { useAuth } from './AuthContext';

export default function ExcluirConta({ navigation }: any) {
  const { styles } = useTheme();
  const { logout } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    Alert.alert(
      'Confirmação',
      'Tem certeza que deseja excluir sua conta? Essa ação é irreversível.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              // endpoint: /users/me (backend deve usar req.userId do token)
              await api.delete('/users/me');
              setLoading(false);
              Alert.alert('Conta excluída', 'Sua conta foi removida com sucesso.');
              await logout();
              navigation.replace('Login');
            } catch (err: any) {
              setLoading(false);
              console.error('Erro excluir conta:', err?.response ?? err?.message ?? err);
              const msg = err?.response?.data?.message || 'Não foi possível excluir a conta. Tente novamente.';
              Alert.alert('Erro', msg);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={[styles.container, { padding: 20, justifyContent: 'center' }]}>
      <Text style={[styles.title, { marginBottom: 12 }]}>Excluir Conta</Text>
      <Text style={{ color: '#666', marginBottom: 24 }}>
        Ao excluir sua conta, todos os seus dados (perfil, mensagens, favoritos e feedbacks) poderão ser removidos.
        Essa ação não pode ser desfeita.
      </Text>

      <TouchableOpacity
        style={[styles.btn, { backgroundColor: '#d9534f', marginBottom: 12 }]}
        onPress={handleDelete}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTxt}>Excluir Conta</Text>}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.btn, { backgroundColor: '#6c757d' }]}
        onPress={() => navigation.goBack()}
        disabled={loading}
      >
        <Text style={styles.btnTxt}>Cancelar</Text>
      </TouchableOpacity>
    </View>
  );
}
