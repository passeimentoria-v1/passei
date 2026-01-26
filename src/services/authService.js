import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';  // ← CORRIGIDO!
import { auth, db } from '../firebase.config';

export const registrarUsuario = async (dados) => {
  const { email, senha, nome, tipo, mentorId = null } = dados;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
    const user = userCredential.user;

    await updateProfile(user, { displayName: nome });

    await setDoc(doc(db, 'users', user.uid), {
      nome,
      email,
      tipo,
      fotoPerfil: null,
      dataCriacao: new Date(),
      ultimoAcesso: new Date(),
      ativo: true,
      ...(tipo === 'aluno' && mentorId && { mentorId }),
      ...(tipo === 'mentor' && { totalAlunos: 0 })
    });

    return {
      sucesso: true,
      usuario: {
        uid: user.uid,
        email: user.email,
        nome,
        tipo
      }
    };
  } catch (error) {
    console.error('Erro ao registrar:', error);
    return {
      sucesso: false,
      erro: tratarErroAuth(error)
    };
  }
};

export const fazerLogin = async (email, senha) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, senha);
    const user = userCredential.user;

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists()) {
      throw new Error('Usuário não encontrado no sistema');
    }

    const userData = userDoc.data();

    if (!userData.ativo) {
      await signOut(auth);
      throw new Error('Usuário desativado. Entre em contato com o suporte.');
    }

    await setDoc(
      doc(db, 'users', user.uid),
      { ultimoAcesso: new Date() },
      { merge: true }
    );

    return {
      sucesso: true,
      usuario: {
        uid: user.uid,
        email: user.email,
        nome: userData.nome,
        tipo: userData.tipo,
        fotoPerfil: userData.fotoPerfil,
        mentorId: userData.mentorId || null
      }
    };
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    return {
      sucesso: false,
      erro: tratarErroAuth(error)
    };
  }
};

export const fazerLoginGoogle = async (tipo) => {
  const provider = new GoogleAuthProvider();

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const userDoc = await getDoc(doc(db, 'users', user.uid));

    if (userDoc.exists()) {
      const userData = userDoc.data();

      if (!userData.ativo) {
        await signOut(auth);
        throw new Error('Usuário desativado. Entre em contato com o suporte.');
      }

      await setDoc(
        doc(db, 'users', user.uid),
        { ultimoAcesso: new Date() },
        { merge: true }
      );

      return {
        sucesso: true,
        usuario: {
          uid: user.uid,
          email: user.email,
          nome: userData.nome,
          tipo: userData.tipo,
          fotoPerfil: userData.fotoPerfil || user.photoURL,
          mentorId: userData.mentorId || null
        }
      };
    } else {
      await setDoc(doc(db, 'users', user.uid), {
        nome: user.displayName,
        email: user.email,
        tipo,
        fotoPerfil: user.photoURL,
        dataCriacao: new Date(),
        ultimoAcesso: new Date(),
        ativo: true,
        ...(tipo === 'mentor' && { totalAlunos: 0 })
      });

      return {
        sucesso: true,
        usuario: {
          uid: user.uid,
          email: user.email,
          nome: user.displayName,
          tipo,
          fotoPerfil: user.photoURL
        }
      };
    }
  } catch (error) {
    console.error('Erro ao fazer login com Google:', error);
    return {
      sucesso: false,
      erro: tratarErroAuth(error)
    };
  }
};

export const fazerLogout = async () => {
  try {
    await signOut(auth);
    return { sucesso: true };
  } catch (error) {
    return {
      sucesso: false,
      erro: tratarErroAuth(error)
    };
  }
};

export const recuperarSenha = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return {
      sucesso: true,
      mensagem: 'Email de recuperação enviado com sucesso!'
    };
  } catch (error) {
    return {
      sucesso: false,
      erro: tratarErroAuth(error)
    };
  }
};

const tratarErroAuth = (error) => {
  const erros = {
    'auth/email-already-in-use': 'Este email já está cadastrado',
    'auth/invalid-email': 'Email inválido',
    'auth/operation-not-allowed': 'Operação não permitida',
    'auth/weak-password': 'Senha muito fraca. Use no mínimo 6 caracteres',
    'auth/user-disabled': 'Usuário desabilitado',
    'auth/user-not-found': 'Usuário não encontrado',
    'auth/wrong-password': 'Senha incorreta',
    'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde',
    'auth/network-request-failed': 'Erro de conexão. Verifique sua internet',
    'auth/invalid-credential': 'Credenciais inválidas',
  };

  return erros[error.code] || error.message || 'Erro desconhecido';
};