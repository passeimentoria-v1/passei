import { 
  doc, 
  updateDoc, 
  getDoc 
} from 'firebase/firestore';
import { 
  updateProfile, 
  updateEmail, 
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider 
} from 'firebase/auth';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL,
  deleteObject 
} from 'firebase/storage';
import { db, auth, storage } from '../firebase.config';

/**
 * Upload de foto de perfil
 */
export const uploadFotoPerfil = async (userId, arquivo) => {
  try {
    // Validar tipo de arquivo
    const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!tiposPermitidos.includes(arquivo.type)) {
      return {
        sucesso: false,
        erro: 'Tipo de arquivo inválido. Use JPG, PNG ou WEBP.'
      };
    }

    // Validar tamanho (máximo 5MB)
    const tamanhoMaximo = 5 * 1024 * 1024; // 5MB
    if (arquivo.size > tamanhoMaximo) {
      return {
        sucesso: false,
        erro: 'Arquivo muito grande. Tamanho máximo: 5MB.'
      };
    }

    // Criar referência no Storage
    const extensao = arquivo.name.split('.').pop();
    const nomeArquivo = `perfil_${userId}_${Date.now()}.${extensao}`;
    const storageRef = ref(storage, `fotos-perfil/${nomeArquivo}`);

    // Upload
    await uploadBytes(storageRef, arquivo);

    // Obter URL
    const fotoURL = await getDownloadURL(storageRef);

    // Atualizar no Authentication
    await updateProfile(auth.currentUser, {
      photoURL: fotoURL
    });

    // Atualizar no Firestore
    await updateDoc(doc(db, 'users', userId), {
      fotoURL: fotoURL
    });

    return {
      sucesso: true,
      fotoURL
    };
  } catch (error) {
    console.error('Erro ao fazer upload da foto:', error);
    return {
      sucesso: false,
      erro: 'Erro ao fazer upload da foto'
    };
  }
};

/**
 * Remover foto de perfil
 */
export const removerFotoPerfil = async (userId) => {
  try {
    // Buscar URL atual
    const userDoc = await getDoc(doc(db, 'users', userId));
    const fotoURL = userDoc.data()?.fotoURL;

    // Deletar do Storage se existir
    if (fotoURL && fotoURL.includes('firebase')) {
      try {
        const fotoRef = ref(storage, fotoURL);
        await deleteObject(fotoRef);
      } catch (error) {
        console.log('Foto já não existe no storage');
      }
    }

    // Atualizar no Authentication
    await updateProfile(auth.currentUser, {
      photoURL: null
    });

    // Atualizar no Firestore
    await updateDoc(doc(db, 'users', userId), {
      fotoURL: null
    });

    return {
      sucesso: true
    };
  } catch (error) {
    console.error('Erro ao remover foto:', error);
    return {
      sucesso: false,
      erro: 'Erro ao remover foto'
    };
  }
};

/**
 * Atualizar nome
 */
export const atualizarNome = async (userId, novoNome) => {
  try {
    // Atualizar no Authentication
    await updateProfile(auth.currentUser, {
      displayName: novoNome
    });

    // Atualizar no Firestore
    await updateDoc(doc(db, 'users', userId), {
      nome: novoNome
    });

    return {
      sucesso: true
    };
  } catch (error) {
    console.error('Erro ao atualizar nome:', error);
    return {
      sucesso: false,
      erro: 'Erro ao atualizar nome'
    };
  }
};

/**
 * Atualizar email (requer reautenticação)
 */
export const atualizarEmail = async (novoEmail, senhaAtual) => {
  try {
    const user = auth.currentUser;

    // Reautenticar
    const credential = EmailAuthProvider.credential(user.email, senhaAtual);
    await reauthenticateWithCredential(user, credential);

    // Atualizar email no Authentication
    await updateEmail(user, novoEmail);

    // Atualizar no Firestore
    await updateDoc(doc(db, 'users', user.uid), {
      email: novoEmail
    });

    return {
      sucesso: true
    };
  } catch (error) {
    console.error('Erro ao atualizar email:', error);
    
    if (error.code === 'auth/wrong-password') {
      return {
        sucesso: false,
        erro: 'Senha atual incorreta'
      };
    } else if (error.code === 'auth/email-already-in-use') {
      return {
        sucesso: false,
        erro: 'Este email já está em uso'
      };
    } else if (error.code === 'auth/invalid-email') {
      return {
        sucesso: false,
        erro: 'Email inválido'
      };
    }
    
    return {
      sucesso: false,
      erro: 'Erro ao atualizar email'
    };
  }
};

/**
 * Alterar senha (requer reautenticação)
 */
export const alterarSenha = async (senhaAtual, novaSenha) => {
  try {
    const user = auth.currentUser;

    // Reautenticar
    const credential = EmailAuthProvider.credential(user.email, senhaAtual);
    await reauthenticateWithCredential(user, credential);

    // Atualizar senha
    await updatePassword(user, novaSenha);

    return {
      sucesso: true
    };
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    
    if (error.code === 'auth/wrong-password') {
      return {
        sucesso: false,
        erro: 'Senha atual incorreta'
      };
    } else if (error.code === 'auth/weak-password') {
      return {
        sucesso: false,
        erro: 'Nova senha muito fraca (mínimo 6 caracteres)'
      };
    }
    
    return {
      sucesso: false,
      erro: 'Erro ao alterar senha'
    };
  }
};

/**
 * Buscar dados completos do perfil
 */
export const buscarDadosPerfil = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      
      // Buscar nome do curso se tiver
      let cursoNome = null;
      if (userData.cursoId) {
        const cursoDoc = await getDoc(doc(db, 'cursos', userData.cursoId));
        if (cursoDoc.exists()) {
          cursoNome = cursoDoc.data().nome;
        }
      }
      
      // Buscar nome do mentor se tiver
      let mentorNome = null;
      if (userData.mentorId) {
        const mentorDoc = await getDoc(doc(db, 'users', userData.mentorId));
        if (mentorDoc.exists()) {
          mentorNome = mentorDoc.data().nome;
        }
      }
      
      return {
        sucesso: true,
        dados: {
          ...userData,
          cursoNome,
          mentorNome
        }
      };
    }
    
    return {
      sucesso: false,
      erro: 'Usuário não encontrado'
    };
  } catch (error) {
    console.error('Erro ao buscar dados do perfil:', error);
    return {
      sucesso: false,
      erro: 'Erro ao buscar dados'
    };
  }
};