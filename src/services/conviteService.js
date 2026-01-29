import { 
  collection, 
  doc, 
  getDoc, 
  getDocs,
  updateDoc, 
  query, 
  where,
  Timestamp,
  addDoc 
} from 'firebase/firestore';
import { db } from '../firebase.config';

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
        mensagem: 'Código de convite inválido ou já utilizado'
      };
    }

    const conviteDoc = snapshot.docs[0];
    const convite = { id: conviteDoc.id, ...conviteDoc.data() };

    return {
      valido: true,
      convite
    };
  } catch (error) {
    console.error('Erro ao validar convite:', error);
    return {
      valido: false,
      mensagem: 'Erro ao validar convite'
    };
  }
};

/**
 * Aceitar convite e associar aluno ao mentor
 */
export const aceitarConvite = async (alunoId, conviteId, mentorId, cursoId) => {
  try {
    // Atualizar dados do aluno
    const alunoRef = doc(db, 'users', alunoId);
    await updateDoc(alunoRef, {
      mentorId: mentorId,
      cursoId: cursoId, // NOVO: Associar curso ao aluno
      dataVinculo: Timestamp.now()
    });

    // Desativar convite
    const conviteRef = doc(db, 'convites', conviteId);
    await updateDoc(conviteRef, {
      ativo: false,
      dataUtilizado: Timestamp.now(),
      utilizadoPor: alunoId
    });

    return {
      sucesso: true
    };
  } catch (error) {
    console.error('Erro ao aceitar convite:', error);
    return {
      sucesso: false,
      erro: 'Erro ao aceitar convite'
    };
  }
};

/**
 * Criar código de convite
 */
export const criarConvite = async (mentorId, cursoId) => {
  try {
    const codigo = gerarCodigoAleatorio();

    const conviteData = {
      codigo,
      mentorId,
      cursoId, // NOVO: Associar curso ao convite
      ativo: true,
      dataCriacao: Timestamp.now(),
      utilizadoPor: null,
      dataUtilizado: null
    };

    const conviteRef = await addDoc(collection(db, 'convites'), conviteData);

    return {
      sucesso: true,
      codigo,
      conviteId: conviteRef.id
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
 * Buscar convites do mentor
 */
export const buscarConvitesMentor = async (mentorId) => {
  try {
    const convitesRef = collection(db, 'convites');
    const q = query(convitesRef, where('mentorId', '==', mentorId));
    const snapshot = await getDocs(q);

    const convites = [];
    for (const conviteDoc of snapshot.docs) {
      const conviteData = { id: conviteDoc.id, ...conviteDoc.data() };
      
      // Buscar nome do curso se houver
      if (conviteData.cursoId) {
        const cursoRef = doc(db, 'cursos', conviteData.cursoId);
        const cursoDoc = await getDoc(cursoRef);
        if (cursoDoc.exists()) {
          conviteData.cursoNome = cursoDoc.data().nome;
        }
      }
      
      convites.push(conviteData);
    }

    return {
      sucesso: true,
      convites
    };
  } catch (error) {
    console.error('Erro ao buscar convites:', error);
    return {
      sucesso: false,
      erro: 'Erro ao buscar convites',
      convites: []
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

    return {
      sucesso: true
    };
  } catch (error) {
    console.error('Erro ao desativar convite:', error);
    return {
      sucesso: false,
      erro: 'Erro ao desativar convite'
    };
  }
};

/**
 * Gerar código aleatório
 */
const gerarCodigoAleatorio = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let codigo = '';
  for (let i = 0; i < 8; i++) {
    codigo += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return codigo;
};