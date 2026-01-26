import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy,
  getDocs,
  Timestamp,
  doc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../firebase.config';

/**
 * Adicionar comentário em uma meta
 */
export const adicionarComentario = async (dadosComentario) => {
  try {
    const comentariosRef = collection(db, 'comentarios');
    
    const comentarioData = {
      metaId: dadosComentario.metaId,
      alunoId: dadosComentario.alunoId,
      autorId: dadosComentario.autorId,
      autorNome: dadosComentario.autorNome,
      autorTipo: dadosComentario.autorTipo, // 'mentor' ou 'aluno'
      texto: dadosComentario.texto,
      dataCriacao: Timestamp.now()
    };

    const docRef = await addDoc(comentariosRef, comentarioData);
    
    return {
      sucesso: true,
      comentarioId: docRef.id
    };
  } catch (error) {
    console.error('Erro ao adicionar comentário:', error);
    return {
      sucesso: false,
      erro: 'Erro ao adicionar comentário: ' + error.message
    };
  }
};

/**
 * Buscar comentários de uma meta
 */
export const buscarComentariosMeta = async (metaId) => {
  try {
    const comentariosRef = collection(db, 'comentarios');
    
    // Query simples primeiro - só metaId
    const q = query(
      comentariosRef,
      where('metaId', '==', metaId)
    );

    const snapshot = await getDocs(q);
    
    // Ordenar no cliente (JavaScript) ao invés do Firestore
    const comentarios = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .sort((a, b) => {
        const dataA = a.dataCriacao?.toMillis() || 0;
        const dataB = b.dataCriacao?.toMillis() || 0;
        return dataA - dataB; // Ordem crescente (mais antigo primeiro)
      });

    return {
      sucesso: true,
      comentarios
    };
  } catch (error) {
    console.error('Erro ao buscar comentários:', error);
    return {
      sucesso: false,
      erro: 'Erro ao buscar comentários: ' + error.message,
      comentarios: []
    };
  }
};

/**
 * Atualizar status da meta
 */
export const atualizarStatusMeta = async (metaId, novoStatus) => {
  try {
    const metaRef = doc(db, 'metas', metaId);
    
    await updateDoc(metaRef, {
      status: novoStatus,
      dataAtualizacaoStatus: Timestamp.now()
    });

    return {
      sucesso: true
    };
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    return {
      sucesso: false,
      erro: 'Erro ao atualizar status: ' + error.message
    };
  }
};

/**
 * Buscar metas com dúvidas (para o mentor)
 */
export const buscarMetasComDuvidas = async (mentorId) => {
  try {
    // Buscar alunos do mentor
    const usersRef = collection(db, 'users');
    const qAlunos = query(
      usersRef,
      where('tipo', '==', 'aluno'),
      where('mentorId', '==', mentorId),
      where('ativo', '==', true)
    );
    const snapshotAlunos = await getDocs(qAlunos);
    const alunosIds = snapshotAlunos.docs.map(doc => doc.id);

    if (alunosIds.length === 0) {
      return {
        sucesso: true,
        metas: []
      };
    }

    // Buscar metas com status "Com dúvida"
    const metasRef = collection(db, 'metas');
    const metasComDuvidas = [];

    for (const alunoId of alunosIds) {
      const qMetas = query(
        metasRef,
        where('alunoId', '==', alunoId),
        where('status', '==', 'Com dúvida')
      );
      const snapshotMetas = await getDocs(qMetas);
      
      snapshotMetas.docs.forEach(doc => {
        metasComDuvidas.push({
          id: doc.id,
          ...doc.data()
        });
      });
    }

    return {
      sucesso: true,
      metas: metasComDuvidas
    };
  } catch (error) {
    console.error('Erro ao buscar metas com dúvidas:', error);
    return {
      sucesso: false,
      erro: 'Erro ao buscar metas com dúvidas: ' + error.message,
      metas: []
    };
  }
};

/**
 * Contar comentários não lidos de uma meta
 */
export const contarComentariosNaoLidos = async (metaId, usuarioId) => {
  try {
    const comentariosRef = collection(db, 'comentarios');
    const q = query(
      comentariosRef,
      where('metaId', '==', metaId)
    );

    const snapshot = await getDocs(q);
    
    // Filtrar no cliente
    const naoLidos = snapshot.docs.filter(doc => 
      doc.data().autorId !== usuarioId
    );
    
    return {
      sucesso: true,
      total: naoLidos.length
    };
  } catch (error) {
    console.error('Erro ao contar comentários:', error);
    return {
      sucesso: false,
      total: 0
    };
  }
};