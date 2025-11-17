// telas/StyleAccessible.tsx
import { StyleSheet } from 'react-native';
const normal = 'regular';
const grossa = 'bold';

export const accessibleStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa', // fundo mais neutro
    padding: 20,
  },
  logo: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
    marginBottom: 50,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 25,
  },
  inputContainerChat: {
    width: '100%',
    marginBottom: 60,
  },
  label: {
    fontSize: 20,
    color: '#000000ff', // contraste mais forte
    marginBottom: 8,
    textAlign: 'left',
  },
   labelinput: {
    fontSize: 20,
    color: '#02251fff',
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
  inputFocus: {
    borderColor: '#ff7f50', // destaque no foco
    borderWidth: 2,
  },
  btnEsqueciSenha: {
    alignSelf: 'center',
    marginBottom: 20,
    marginTop : 20,
  },
  esqueciSenhaTxt: {
    color: '#f24100ff',
    fontSize: 14,
    fontWeight: '600',

  },
  btnEntrar: {
    width: '90%',
    height: 50,
    backgroundColor: '#f24100ff',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop : 10,
  },
  btnTxtEntrar: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
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
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
  },
  btn: {
    width: '90%',
    height: 55,
    backgroundColor: '#004d40',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  btnChat: {
    width: '100%',
    height: 55,
    backgroundColor: '#006151',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  backButton:{
    width: '100%',
    height: 50,
    backgroundColor: '#c44d4d',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  btnTxt: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  searchBar: {
    width: '100%',
    height: 55,
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000000ff',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 18,
    color: '#000000ff',
  },
  searchIcon: {
    marginLeft: 12,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  mainText: {
    fontSize: 20,
    color: '#000000ff',
    textAlign: 'center',
    marginBottom: 20,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    height: 65,
    backgroundColor: 'white',
    borderRadius: 32,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  navItem: {
    alignItems: 'center',
  },
  navIcon: {
    width: 28,
    height: 28,
  },
  activeIndicator: {
    marginTop: 6,
    width: 34,
    height: 4,
    backgroundColor: '#ff7f50', // cor de destaque visível
    borderRadius: 2,
  },
});