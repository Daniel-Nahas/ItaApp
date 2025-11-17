// telas/Style.tsx
import { StyleSheet } from 'react-native';
const normal = 'regular';
const grossa = 'bold';
 

export const appStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5DC',
    padding: 20,
  },

  containerOpcoes: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F15A24',
    padding: 20,
  },

  logo: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
    marginBottom: 40,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  inputContainerChat: {
    width: '100%',
    marginBottom: 60,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
    labelinput: {
    fontSize: 16,
    color: '#003366',
    marginBottom: 10,
    fontFamily: normal,
    fontWeight: 'bold'
  },
  input: {
  width: '90%',
  height: 50,
  backgroundColor: 'white',
  borderColor: '#003366',
  borderWidth: 2,
  borderRadius: 25,
  paddingHorizontal: 15,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 5,
  elevation: 3,
  marginBottom: 10,
  fontFamily: 'regular'
  },
  inputChat: {
    width: '100%',
    height: 50,
    backgroundColor: 'white',
    borderRadius: 25,
    paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    marginBottom: 20,
  },
  btnEsqueciSenha: {
    alignSelf: 'center',
    marginBottom: 20,
    marginTop : 20,
  },
  esqueciSenhaTxt: {
    color: '#F15A24',
    fontSize: 14,
  },
  btnEntrar: {
    width: '90%',
    height: 50,
    backgroundColor: '#F15A24',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop : 10,
  },
  btnTxtEntrar: {
    color: 'white',
    fontSize: 18,
   fontFamily: grossa,
    fontWeight: 'bold'
  },
  btnCad: {
    width: '90%',
    height: 50,
    backgroundColor: '#003366',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    
  },
  btnTxtCad: {
    color: '#F5F5DC',
    fontSize: 18,
    fontFamily: normal,
    fontWeight: 'regular'
  },
  btn: {
    width: '90%',
    height: 50,
    backgroundColor: '#003366',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  btnChat: {
    width: '100%',
    height: 50,
    backgroundColor: '#003366',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },

  btnTxt: {
    color: '#F5F5DC',
    fontSize: 18,
    fontFamily: normal,
    fontWeight: 'regular',
  },
  btnTxtMap: {
    color: 'black',
    fontSize: 18,
  },
  //Opções//

  OpcoesBtn: {
    width: '90%',
    height: 50,
    backgroundColor: '#F5F5DC',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },

  OpcoesBtnTxt: {
    color: '#003366',
    fontSize: 18,
    fontFamily: grossa,
    fontWeight: 'bold',
  },

   OpcoesBtnSairTxt: {
    color: '#ff0000ff',
    fontSize: 18,
    fontFamily: grossa,
    fontWeight: 'bold',
  },

    imagemOpt:{
    width:120,
    height:120,
    resizeMode: 'contain',
    marginBottom: 10,
  },

    OpcoesTitle:{

    fontFamily: 'grossa',
    fontWeight: 'bold',
    fontSize: 30,
    color: '#F5F5DC',
    marginBottom: 10,
    alignSelf: 'center',
    textAlign: 'center',

  },



  //fim das opções//
  //Estilização do Cadastro//

  inputcad: {
  width: '90%',
  height: 50,
  backgroundColor: 'white',
  borderColor: '#003366',
  borderWidth: 2,
  borderRadius: 25,
  paddingHorizontal: 15,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 5,
  elevation: 3,
  marginBottom: 10,
  fontFamily: 'regular'
  },

   labelcad: {
    fontFamily: normal,
    fontWeight: 'bold',
    fontSize: 30,
    color: '#003366',
    marginBottom: 10,
    alignSelf: 'center',
    textAlign: 'center',
  },

  imagemcad:{
    width:100,
    height:100,
    resizeMode: 'contain',
    marginBottom: 10,
  },

    backButton:{
    width: '90%',
    height: 50,
    backgroundColor: '#bb0b0b',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },

  //fim do cadastro//
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    resizeMode: 'cover', // Garante que a imagem cubra toda a tela
  },
  searchBar: {
    width: '100%',
    height: 50,
    backgroundColor: 'white',
    borderRadius: 25,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    marginBottom: 400,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
  },
  searchIcon: {
    marginLeft: 10,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  mainText: {
    fontSize: 18,
    color: '#333',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 30,
    left: 70,
    right: 70,
    height: 60,
    backgroundColor: 'white',
    borderRadius: 30,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 10,
  },
  navItem: {
    alignItems: 'center',
  },
  navItemSair: {
    backgroundColor:'#ff0000ff',
    borderRadius: 9,
    padding: 9,
    alignItems: 'center',
  },
  navIcon: {
    width: 24,
    height: 24,
  },
  activeIndicator: {
    marginTop: 5,
    width: 30,
    height: 3,
    backgroundColor: '#F15A24',
    borderRadius: 1.5,
  },
  profileContainer: {
  width: '100%',
  backgroundColor: '#ffffffff',
  borderRadius: 20,
  padding: 20,
  marginBottom: 10,
  marginTop: 10,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.05,
  shadowRadius: 4,
  elevation: 2,
  },
  profileText: {
    fontSize: 18,
    color: '#333',
    marginBottom: 12,
    textAlign: 'left',
    width: '100%',
    fontWeight: '500',
  },
  profileLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  profileValue: {
    fontSize: 18,
    color: '#222',
    marginBottom: 16,
  },
});