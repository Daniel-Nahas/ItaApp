// telas/StyleAccessible.tsx
import { StyleSheet, Platform } from 'react-native';

/*
  Accessible styles completo (substitui/expande o appStyles).
  Recomendações de uso:
  - Se quiser uma fonte específica para dislexia (ex.: "OpenDyslexic"), instale e registre a fonte, então
    descomente as linhas fontFamily: 'OpenDyslexic' nos blocos de texto.
  - Controle dinâmico (tema/lowMotion) no ThemeProvider ou no componente, aplicando estilos condicionais.
*/

export const accessibleStyles = StyleSheet.create({
  // Container principal
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#FAFAF9', // suave, não‑ofuscante
    justifyContent: 'center',
    alignItems: 'center',
  },

  /******** Logo e imagens ********/
  logo: {
    width: 180,
    height: 180,
    resizeMode: 'contain',
    marginBottom: 32,
    alignSelf: 'center',
  },

  /******** Inputs e rótulos ********/
  inputContainer: {
    width: '100%',
    marginBottom: 18,
  },
  inputContainerChat: {
    width: '100%',
    marginBottom: 28,
  },
  label: {
    fontSize: 20, // aumentado
    color: '#0B1826', // alto contraste
    marginBottom: 8,
    textAlign: 'left',
    fontWeight: '700',
    // fontFamily: 'OpenDyslexic', // opcional se instalar fonte
  },
  input: {
    width: '100%',
    height: 60,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 18,
    fontSize: 18,
    color: '#0B1826',
    borderWidth: 2,
    borderColor: '#D1D5DB',
    // aumentar espaçamento entre letras/palavras pode ajudar dislexia
    letterSpacing: 0.2,
    // remoção de sombra para tornar mais legível em baixo contraste; preserve se quiser depth
    ...Platform.select({
      ios: { shadowColor: '#00000020', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  inputChat: {
    width: '100%',
    height: 60,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 18,
    fontSize: 18,
    color: '#0B1826',
    borderWidth: 2,
    borderColor: '#D1D5DB',
    letterSpacing: 0.2,
  },
  inputFocus: {
    borderColor: '#FF7F50', // foco bem visível
    borderWidth: 3,
  },

  /******** Botões (vários) ********/
  btnEsqueciSenha: {
    alignSelf: 'flex-end',
    marginBottom: 18,
  },
  esqueciSenhaTxt: {
    color: '#FF7F50',
    fontSize: 16,
    fontWeight: '600',
  },

  btnEntrar: {
    width: '100%',
    height: 64,
    backgroundColor: '#003366',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 0,
  },
  btnTxtEntrar: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    // fontFamily: 'OpenDyslexic',
  },

  btnCad: {
    width: '100%',
    height: 64,
    backgroundColor: '#004A7A',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  btnTxtCad: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },

  btn: {
    width: '100%',
    height: 64,
    backgroundColor: '#005a87',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },

  btnChat: {
    width: '100%',
    height: 64,
    backgroundColor: '#006151',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 22,
  },

  btnVisitante: {
    width: '100%',
    height: 64,
    backgroundColor: '#0bb386', // tom mais profundo e contraste com texto preto
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 0,
  },

  backButton: {
    width: '100%',
    height: 58,
    backgroundColor: '#B93F3F',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },

  /******** Textos de botões e labels ********/
  btnTxt: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  btnTxtMap: {
    color: '#0B1826',
    fontSize: 18,
    fontWeight: '700',
  },
  btnTxtVisitante: {
    color: '#07161B', // preto azulado para contraste no botão claro
    fontSize: 18,
    fontWeight: '700',
  },

  /******** Background e search ********/
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  searchBar: {
    width: '100%',
    height: 64,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 18,
    color: '#0B1826',
  },
  searchIcon: {
    marginLeft: 12,
  },

  /******** Conteúdo principal e textos ********/
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  mainText: {
    fontSize: 20,
    color: '#0B1826',
    textAlign: 'center',
  },

  /******** Barra inferior (navegação) ********/
  bottomNav: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    height: 76,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E6E7E8',
    paddingHorizontal: 8,
  },
  navItem: {
    alignItems: 'center',
    padding: 12, // hit area maior
  },
  navItemSair: {
    backgroundColor: '#FF4D4F',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  navIcon: {
    width: 34,
    height: 34,
    tintColor: '#0B1826',
  },
  activeIndicator: {
    marginTop: 6,
    width: 38,
    height: 6,
    backgroundColor: '#FF7F50',
    borderRadius: 3,
  },

  /******** Perfil ********/
  profileContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E6E7E8',
  },
  profileText: {
    fontSize: 20,
    color: '#0B1826',
    marginBottom: 12,
    textAlign: 'left',
    width: '100%',
    fontWeight: '600',
  },
  profileLabel: {
    fontSize: 16,
    color: '#333333',
    marginBottom: 6,
  },
  profileValue: {
    fontSize: 20,
    color: '#111111',
    marginBottom: 14,
    fontWeight: '600',
  },

  /******** Chat ********/
  // inputContainerChat já definido acima
  inputChat: {
    width: '100%',
    height: 64,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 18,
    fontSize: 18,
    color: '#0B1826',
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginBottom: 18,
  },
  btnChatFloating: {
    position: 'absolute',
    right: 18,
    bottom: 100,
    backgroundColor: '#2B8AEF',
    padding: 14,
    borderRadius: 28,
    elevation: 6,
  },

  /******** Helpers ********/
  lowMotion: {
    // aplicar para usuários que preferem reduzir movimento
    shadowColor: 'transparent',
    elevation: 0,
    // componentes podem usar conditionalProps to disable animations
  },

  // Tema de baixa luminosidade (se o usuário preferir)
  lowLightTheme: {
    backgroundColor: '#1F1F21',
    color: '#EAEAEA',
  },

  // Pequenos ajustes para compatibilidade
  smallText: {
    fontSize: 16,
    color: '#0B1826',
  },

  // fallback key names do appStyles originais (para compatibilidade)
  btnTxtEntrarSmall: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});

