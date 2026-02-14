import { 
  collection, 
  query, 
  where, 
  getDocs,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase.config';

/**
 * Arquivar todas as metas de um assunto específico
 * (usado quando assunto é excluído ou ocultado)
 */
export const arquivarMetasDoAssunto = async (assuntoId, motivo = 'assunto_excluido') => {
  try {
    console.log('📦 Arquivando metas do assunto:', assuntoId);

    // Buscar todas as metas deste assunto
    const metasRef = collection(db, 'metas');
    const q = query(metasRef, where('assuntoId', '==', assuntoId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log('ℹ️ Nenhuma meta encontrada para este assunto');
      return {
        sucesso: true,
        metasArquivadas: 0
      };
    }

    const batch = writeBatch(db);
    const dataArquivamento = Timestamp.now();

    snapshot.forEach(doc => {
      batch.update(doc.ref, {
        arquivado: true,
        dataArquivamento,
        motivoArquivamento: motivo
      });
    });

    await batch.commit();

    console.log(`✅ ${snapshot.size} metas arquivadas`);

    return {
      sucesso: true,
      metasArquivadas: snapshot.size
    };

  } catch (error) {
    console.error('❌ Erro ao arquivar metas:', error);
    return {
      sucesso: false,
      erro: error.message,
      metasArquivadas: 0
    };
  }
};

/**
 * Ocultar todas as metas de um assunto
 * (quando assunto é apenas ocultado, não excluído)
 */
export const ocultarMetasDoAssunto = async (assuntoId, ocultar = true) => {
  try {
    console.log(`${ocultar ? '🙈' : '👁️'} ${ocultar ? 'Ocultando' : 'Reativando'} metas do assunto:`, assuntoId);

    // Buscar todas as metas deste assunto
    const metasRef = collection(db, 'metas');
    const q = query(metasRef, where('assuntoId', '==', assuntoId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log('ℹ️ Nenhuma meta encontrada para este assunto');
      return {
        sucesso: true,
        metasAfetadas: 0
      };
    }

    const batch = writeBatch(db);

    if (ocultar) {
      // Ocultar metas (não concluídas)
      snapshot.forEach(doc => {
        const meta = doc.data();
        if (!meta.concluida) {
          batch.update(doc.ref, {
            oculto: true,
            dataOcultacao: Timestamp.now()
          });
        }
      });
    } else {
      // Reativar metas
      snapshot.forEach(doc => {
        batch.update(doc.ref, {
          oculto: false,
          dataReativacao: Timestamp.now()
        });
      });
    }

    await batch.commit();

    console.log(`✅ ${snapshot.size} metas ${ocultar ? 'ocultadas' : 'reativadas'}`);

    return {
      sucesso: true,
      metasAfetadas: snapshot.size
    };

  } catch (error) {
    console.error('❌ Erro ao ocultar/reativar metas:', error);
    return {
      sucesso: false,
      erro: error.message,
      metasAfetadas: 0
    };
  }
};

/**
 * Verificar se um assunto tem metas associadas
 */
export const verificarMetasDoAssunto = async (assuntoId) => {
  try {
    const metasRef = collection(db, 'metas');
    const q = query(metasRef, where('assuntoId', '==', assuntoId));
    const snapshot = await getDocs(q);

    const metas = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const metasNaoConcluidas = metas.filter(m => !m.concluida && !m.arquivado);
    const metasConcluidas = metas.filter(m => m.concluida);

    return {
      sucesso: true,
      totalMetas: metas.length,
      metasNaoConcluidas: metasNaoConcluidas.length,
      metasConcluidas: metasConcluidas.length,
      temMetas: metas.length > 0
    };

  } catch (error) {
    console.error('❌ Erro ao verificar metas:', error);
    return {
      sucesso: false,
      temMetas: false,
      totalMetas: 0
    };
  }
};