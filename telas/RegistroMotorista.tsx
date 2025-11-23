// telas/RegistroMotorista.tsx
import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from './ThemeContext';
import api from '../components/Api';
import { isValidCPF } from '../backend/src/utils/validators';

const passwordChecks = (pwd: string) => {
  return {
    length: pwd.length >= 8,
    upper: /[A-Z]/.test(pwd),
    lower: /[a-z]/.test(pwd),
    number: /[0-9]/.test(pwd),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
  };
};

// Tela de registro específica para motoristas
export default function RegistroMotorista({ navigation }: any) {
  const { styles } = useTheme();
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [senha2, setSenha2] = useState('');
  const [placa, setPlaca] = useState(''); // opcional: placa do ônibus
  const [loading, setLoading] = useState(false);

  const checks = useMemo(() => passwordChecks(senha), [senha]);
  const passwordOk = Object.values(checks).every(Boolean);

  const handleRegisterDriver = async () => {
    if (!nome || !cpf || !email || !senha || !senha2) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }
    if (!isValidCPF(cpf)) {
      Alert.alert('Erro', 'CPF inválido');
      return;
    }
    if (senha !== senha2) {
      Alert.alert('Erro', 'As senhas não coincidem');
      return;
    }
    if (!passwordOk) {
      Alert.alert('Erro', 'Senha não atende aos requisitos de segurança');
      return;
    }

    setLoading(true);
    try {
      // Envia role: 'driver' para que o backend registre como motorista
      // Opcionalmente envie dados do veículo (placa) para associar posteriormente
      const payload: any = {
        nome,
        cpf,
        email,
        senha,
        role: 'driver',
      };
      if (placa) payload.placa = placa;

      // Endpoint esperado: POST /auth/register -> cria user e, se role === 'driver', cria registro em buses (opcional no backend)
      const res = await api.post('/auth/register', payload);

      Alert.alert('Sucesso', 'Cadastro de motorista realizado com sucesso. Faça login.');
      navigation.replace('LoginMotorista');
    } catch (err: any) {
      console.error('Erro registro motorista:', err?.response?.data || err?.message || err);
      Alert.alert('Erro', err?.response?.data?.message || 'Falha ao registrar motorista');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cadastro Motorista</Text>

      <TextInput style={styles.input} placeholder="Nome completo" value={nome} onChangeText={setNome} />
      <TextInput style={styles.input} placeholder="CPF (somente números)" value={cpf} onChangeText={setCpf} keyboardType="number-pad" />
      <TextInput style={styles.input} placeholder="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Senha" value={senha} onChangeText={setSenha} secureTextEntry />
      <TextInput style={styles.input} placeholder="Confirmar senha" value={senha2} onChangeText={setSenha2} secureTextEntry />

      <TextInput style={styles.input} placeholder="Placa do veículo (opcional)" value={placa} onChangeText={setPlaca} autoCapitalize="characters" />

      <View style={{ marginVertical: 8 }}>
        <Text style={{ fontWeight: 'bold' }}>Requisitos da senha:</Text>
        <Text style={{ color: checks.length ? 'green' : 'red' }}>• Mínimo 8 caracteres</Text>
        <Text style={{ color: checks.upper ? 'green' : 'red' }}>• Letra maiúscula</Text>
        <Text style={{ color: checks.lower ? 'green' : 'red' }}>• Letra minúscula</Text>
        <Text style={{ color: checks.number ? 'green' : 'red' }}>• Número</Text>
        <Text style={{ color: checks.special ? 'green' : 'red' }}>• Caractere especial</Text>
      </View>

      <TouchableOpacity style={styles.btn} onPress={handleRegisterDriver} disabled={loading}>
        <Text style={styles.btnTxt}>{loading ? 'Registrando...' : 'Registrar Motorista'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.replace('LoginMotorista')}>
        <Text style={styles.btnTxt}>Voltar para Login Motorista</Text>
      </TouchableOpacity>
    </View>
  );
}
