import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase.config';
import {
  registrarUsuario,
  fazerLogin,
  fazerLoginGoogle,
  fazerLogout,
  recuperarSenha
} from '../services/authService';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // ✅ NOVO: Verificar se o usuário está ativo
            if (userData.ativo === false) {
              console.warn('⚠️ Usuário inativo tentando acessar:', user.email);
              // Fazer logout automático
              await auth.signOut();
              setUsuario(null);
              setErro('Sua conta está desativada. Entre em contato com seu mentor.');
              setCarregando(false);
              return;
            }
            
            setUsuario({
              uid: user.uid,
              email: user.email,
              nome: userData.nome,
              tipo: userData.tipo,
              fotoPerfil: userData.fotoPerfil || user.photoURL,
              mentorId: userData.mentorId || null,
              ativo: userData.ativo !== false // Default true se não existir
            });
          } else {
            setUsuario(null);
          }
        } catch (error) {
          console.error('Erro ao buscar dados do usuário:', error);
          setUsuario(null);
        }
      } else {
        setUsuario(null);
      }
      setCarregando(false);
    });

    return unsubscribe;
  }, []);

  const registrar = async (dados) => {
    setCarregando(true);
    setErro(null);
    
    const resultado = await registrarUsuario(dados);
    
    if (resultado.sucesso) {
      setUsuario(resultado.usuario);
    } else {
      setErro(resultado.erro);
    }
    
    setCarregando(false);
    return resultado;
  };

  const login = async (email, senha) => {
    setCarregando(true);
    setErro(null);
    
    const resultado = await fazerLogin(email, senha);
    
    if (resultado.sucesso) {
      setUsuario(resultado.usuario);
    } else {
      setErro(resultado.erro);
    }
    
    setCarregando(false);
    return resultado;
  };

  const loginGoogle = async (tipo) => {
    setCarregando(true);
    setErro(null);
    
    const resultado = await fazerLoginGoogle(tipo);
    
    if (resultado.sucesso) {
      setUsuario(resultado.usuario);
    } else {
      setErro(resultado.erro);
    }
    
    setCarregando(false);
    return resultado;
  };

  const logout = async () => {
    setCarregando(true);
    setErro(null);
    
    const resultado = await fazerLogout();
    
    if (resultado.sucesso) {
      setUsuario(null);
    } else {
      setErro(resultado.erro);
    }
    
    setCarregando(false);
    return resultado;
  };

  const resetarSenha = async (email) => {
    setErro(null);
    return await recuperarSenha(email);
  };

  const isMentor = () => usuario?.tipo === 'mentor';
  const isAluno = () => usuario?.tipo === 'aluno';

  const value = {
    usuario,
    carregando,
    erro,
    registrar,
    login,
    loginGoogle,
    logout,
    resetarSenha,
    isMentor,
    isAluno,
    estaAutenticado: !!usuario
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;