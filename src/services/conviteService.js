import { 
  collection, 
  addDoc, 
  doc, 
  getDoc,
  updateDoc,
  query,
  where,
  getDocs,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase.config';

/**
 * Gerar código único de convite
 */
const gerarCodigoConvite = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let codigo = '';
  for (let i = 0; i < 8; i++) {
    codigo += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return codigo;
};

/**
 * Criar convite de mentor
 */
export const criarConvite = async (mentorId, mentorNome) => {
  try {
    const codigo = gerarCodigoConvite();
    
    const convitesRef = collection(db, 'convites');
    const conviteData = {
      codigo,
      mentorId,
      mentorNome,
      dataCriacao: Timestamp.now(),
      ativo: true,
      usosRestantes: 50 // Limite de usos
    };

    const docRef = await addDoc(convitesRef, conviteData);

    return {
      sucesso: true,
      codigo,
      conviteId: docRef.id
    };
  } catch (error) {
    console.error('Erro ao criar convite:', error);
    return {
      sucesso: false,
      erro: 'Erro ao criar convite'
    };
  }
};

/**
 * Validar código de convite
 */
export const validarConvite = async (codigo) => {
  try {
    const convitesRef = collection(db, 'convites');
    const q = query(
      convitesRef,
      where('codigo', '==', codigo.toUpperCase()),
      where('ativo', '==', true)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return {
        valido: false,
        erro: 'Código de convite inválido ou expirado'
      };
    }

    const convite = snapshot.docs[0];
    const conviteData = convite.data();

    if (conviteData.usosRestantes <= 0) {
      return {
        valido: false,
        erro: 'Este convite atingiu o limite de usos'
      };
    }

    return {
      valido: true,
      conviteId: convite.id,
      mentorId: conviteData.mentorId,
      mentorNome: conviteData.mentorNome
    };
  } catch (error) {
    console.error('Erro ao validar convite:', error);
    return {
      valido: false,
      erro: 'Erro ao validar convite'
    };
  }
};

/**
 * Usar convite (decrementar usos)
 */
export const usarConvite = async (conviteId) => {
  try {
    const conviteRef = doc(db, 'convites', conviteId);
    const conviteSnap = await getDoc(conviteRef);

    if (!conviteSnap.exists()) {
      return { sucesso: false };
    }

    const usosRestantes = conviteSnap.data().usosRestantes;

    await updateDoc(conviteRef, {
      usosRestantes: usosRestantes - 1,
      ultimoUso: Timestamp.now()
    });

    return { sucesso: true };
  } catch (error) {
    console.error('Erro ao usar convite:', error);
    return { sucesso: false };
  }
};

/**
 * Buscar convites de um mentor
 */
export const buscarConvitesMentor = async (mentorId) => {
  try {
    const convitesRef = collection(db, 'convites');
    const q = query(
      convitesRef,
      where('mentorId', '==', mentorId),
      where('ativo', '==', true)
    );

    const snapshot = await getDocs(q);
    const convites = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return {
      sucesso: true,
      convites
    };
  } catch (error) {
    console.error('Erro ao buscar convites:', error);
    return {
      sucesso: false,
      convites: [],
      erro: 'Erro ao buscar convites'
    };
  }
};

/**
 * Desativar convite
 */
export const desativarConvite = async (conviteId) => {
  try {
    const conviteRef = doc(db, 'convites', conviteId);
    await updateDoc(conviteRef, {
      ativo: false
    });

    return { sucesso: true };
  } catch (error) {
    console.error('Erro ao desativar convite:', error);
    return { sucesso: false };
  }
};