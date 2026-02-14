import { 
  doc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  writeBatch,
  Timestamp,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase.config';

/**
 * Trocar curso do aluno com arquivamento inteligente
 * @param {string} alunoId - ID do aluno
 * @param {string} cursoAntigoId - ID do curso antigo
 * @param {string} cursoNovoId - ID do curso novo
 * @returns {object} Resultado da operação
 */
export const trocarCursoAluno = async (alunoId, cursoAntigoId, cursoNovoId) => {
  try {
    console.log('🔄 Iniciando troca de curso...');
    console.log('👤 Aluno:', alunoId);
    console.log('📚 Curso antigo:', cursoAntigoId);
    console.log('📚 Curso novo:', cursoNovoId);

    const batch = writeBatch(db);
    const dataArquivamento = Timestamp.now();

    // 1. Buscar disciplinas do curso novo para verificar quais questões manter
    const cursoNovoRef = doc(db, 'cursos', cursoNovoId);
    const cursoNovoSnap = await getDoc(cursoNovoRef);
    
    let disciplinasNovoCurso = [];
    if (cursoNovoSnap.exists()) {
      // Buscar disciplinas do curso novo
      const disciplinasRef = collection(db, `cursos/${cursoNovoId}/disciplinas`);
      const disciplinasSnap = await getDocs(disciplinasRef);
      disciplinasNovoCurso = disciplinasSnap.docs.map(doc => doc.id);
    }

    console.log('📋 Disciplinas no curso novo:', disciplinasNovoCurso);

    // 2. ARQUIVAR METAS do curso antigo
    const metasRef = collection(db, 'metas');
    const metasQuery = query(
      metasRef,
      where('alunoId', '==', alunoId),
      where('cursoId', '==', cursoAntigoId)
    );

    const metasSnap = await getDocs(metasQuery);
    let metasArquivadas = 0;

    metasSnap.forEach((doc) => {
      batch.update(doc.ref, {
        arquivado: true,
        dataArquivamento,
        motivoArquivamento: 'troca_curso',
        cursoAntigoId: cursoAntigoId
      });
      metasArquivadas++;
    });

    console.log(`📦 Arquivando ${metasArquivadas} metas`);

    // 3. PROCESSAR QUESTÕES - Manter se disciplina existe, arquivar se não
    const questoesRef = collection(db, 'registrosQuestoes');
    const questoesQuery = query(
      questoesRef,
      where('alunoId', '==', alunoId),
      where('cursoId', '==', cursoAntigoId)
    );

    const questoesSnap = await getDocs(questoesQuery);
    let questoesMantidas = 0;
    let questoesArquivadas = 0;

    questoesSnap.forEach((docSnap) => {
      const questao = docSnap.data();
      const disciplinaExisteNoCursoNovo = disciplinasNovoCurso.includes(questao.disciplinaId);

      if (disciplinaExisteNoCursoNovo) {
        // Manter questão, apenas atualizar cursoId
        batch.update(docSnap.ref, {
          cursoId: cursoNovoId,
          cursoAnteriorId: cursoAntigoId,
          dataTransferencia: dataArquivamento
        });
        questoesMantidas++;
      } else {
        // Arquivar questão
        batch.update(docSnap.ref, {
          arquivado: true,
          dataArquivamento,
          motivoArquivamento: 'troca_curso_disciplina_nao_existe',
          cursoAntigoId: cursoAntigoId
        });
        questoesArquivadas++;
      }
    });

    console.log(`✅ Mantendo ${questoesMantidas} questões (disciplina existe no novo curso)`);
    console.log(`📦 Arquivando ${questoesArquivadas} questões (disciplina não existe)`);

    // 4. ARQUIVAR FLASHCARDS
    const flashcardsRef = collection(db, 'flashcards');
    const flashcardsQuery = query(
      flashcardsRef,
      where('alunoId', '==', alunoId),
      where('cursoId', '==', cursoAntigoId)
    );

    const flashcardsSnap = await getDocs(flashcardsQuery);
    let flashcardsArquivados = 0;

    flashcardsSnap.forEach((doc) => {
      batch.update(doc.ref, {
        arquivado: true,
        dataArquivamento,
        motivoArquivamento: 'troca_curso',
        cursoAntigoId: cursoAntigoId
      });
      flashcardsArquivados++;
    });

    console.log(`📦 Arquivando ${flashcardsArquivados} flashcards`);

    // 5. ARQUIVAR ESTATÍSTICAS (criar registro histórico)
    // Salvar snapshot das estatísticas antes de trocar
    const estatisticasHistoricoRef = collection(db, 'estatisticasHistorico');
    const estatisticasDoc = {
      alunoId,
      cursoAntigoId,
      cursoNovoId,
      dataArquivamento,
      totalMetas: metasArquivadas,
      totalQuestoesMantidas: questoesMantidas,
      totalQuestoesArquivadas: questoesArquivadas,
      totalFlashcards: flashcardsArquivados
    };
    
    batch.set(doc(estatisticasHistoricoRef), estatisticasDoc);

    console.log('📊 Criando snapshot de estatísticas no histórico');

    // 6. ATUALIZAR CURSO DO ALUNO
    const alunoRef = doc(db, 'users', alunoId);
    batch.update(alunoRef, {
      cursoId: cursoNovoId,
      cursoAnteriorId: cursoAntigoId,
      dataTrocaCurso: dataArquivamento
    });

    console.log('👤 Atualizando curso do aluno');

    // 7. EXECUTAR TODAS AS OPERAÇÕES
    await batch.commit();

    console.log('✅ Troca de curso concluída com sucesso!');

    return {
      sucesso: true,
      resumo: {
        metasArquivadas,
        questoesMantidas,
        questoesArquivadas,
        flashcardsArquivados,
        disciplinasComuns: questoesMantidas
      }
    };

  } catch (error) {
    console.error('❌ Erro ao trocar curso:', error);
    return {
      sucesso: false,
      erro: 'Erro ao trocar curso: ' + error.message
    };
  }
};

/**
 * Restaurar curso anterior do aluno
 * @param {string} alunoId - ID do aluno
 * @returns {object} Resultado da operação
 */
export const restaurarCursoAnterior = async (alunoId) => {
  try {
    console.log('🔙 Restaurando curso anterior...');

    const alunoRef = doc(db, 'users', alunoId);
    const alunoSnap = await getDoc(alunoRef);

    if (!alunoSnap.exists()) {
      return {
        sucesso: false,
        erro: 'Aluno não encontrado'
      };
    }

    const alunoData = alunoSnap.data();
    
    if (!alunoData.cursoAnteriorId) {
      return {
        sucesso: false,
        erro: 'Não há curso anterior registrado'
      };
    }

    const cursoAtual = alunoData.cursoId;
    const cursoAnterior = alunoData.cursoAnteriorId;

    // Trocar de volta
    const resultado = await trocarCursoAluno(alunoId, cursoAtual, cursoAnterior);

    if (resultado.sucesso) {
      console.log('✅ Curso anterior restaurado!');
    }

    return resultado;

  } catch (error) {
    console.error('❌ Erro ao restaurar curso:', error);
    return {
      sucesso: false,
      erro: 'Erro ao restaurar curso'
    };
  }
};

/**
 * Buscar histórico de trocas de curso
 * @param {string} alunoId - ID do aluno
 * @returns {object} Histórico
 */
export const buscarHistoricoTrocas = async (alunoId) => {
  try {
    const historicoRef = collection(db, 'estatisticasHistorico');
    const q = query(
      historicoRef,
      where('alunoId', '==', alunoId)
    );

    const snapshot = await getDocs(q);
    const historico = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Ordenar por data
    historico.sort((a, b) => {
      if (!a.dataArquivamento || !b.dataArquivamento) return 0;
      return b.dataArquivamento.toDate() - a.dataArquivamento.toDate();
    });

    return {
      sucesso: true,
      historico
    };

  } catch (error) {
    console.error('❌ Erro ao buscar histórico:', error);
    return {
      sucesso: false,
      erro: 'Erro ao buscar histórico',
      historico: []
    };
  }
};