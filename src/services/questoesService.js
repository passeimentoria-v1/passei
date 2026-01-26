import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy,
  getDocs,
  Timestamp,
  doc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase.config';

/**
 * Registrar questões resolvidas
 */
export const registrarQuestoes = async (dadosRegistro) => {
  try {
    const registrosRef = collection(db, 'registros_questoes');
    
    const registroData = {
      alunoId: dadosRegistro.alunoId,
      cursoId: dadosRegistro.cursoId,
      disciplinaId: dadosRegistro.disciplinaId,
      assuntoId: dadosRegistro.assuntoId,
      assuntoTitulo: dadosRegistro.assuntoTitulo,
      disciplinaNome: dadosRegistro.disciplinaNome,
      totalQuestoes: dadosRegistro.totalQuestoes,
      acertos: dadosRegistro.acertos,
      erros: dadosRegistro.erros,
      percentualAcerto: dadosRegistro.totalQuestoes > 0 
        ? Math.round((dadosRegistro.acertos / dadosRegistro.totalQuestoes) * 100) 
        : 0,
      dataRegistro: Timestamp.now(),
      observacoes: dadosRegistro.observacoes || ''
    };

    const docRef = await addDoc(registrosRef, registroData);
    
    return {
      sucesso: true,
      registroId: docRef.id
    };
  } catch (error) {
    console.error('Erro ao registrar questões:', error);
    return {
      sucesso: false,
      erro: 'Erro ao registrar questões'
    };
  }
};

/**
 * Buscar registros de um aluno
 */
export const buscarRegistrosAluno = async (alunoId, limite = 50) => {
  try {
    const registrosRef = collection(db, 'registros_questoes');
    const q = query(
      registrosRef,
      where('alunoId', '==', alunoId),
      orderBy('dataRegistro', 'desc')
    );

    const snapshot = await getDocs(q);
    const registros = snapshot.docs.slice(0, limite).map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return {
      sucesso: true,
      registros
    };
  } catch (error) {
    console.error('Erro ao buscar registros:', error);
    return {
      sucesso: false,
      erro: 'Erro ao buscar registros',
      registros: []
    };
  }
};

/**
 * Buscar registros por período
 */
export const buscarRegistrosPorPeriodo = async (alunoId, dataInicio, dataFim) => {
  try {
    const registrosRef = collection(db, 'registros_questoes');
    const q = query(
      registrosRef,
      where('alunoId', '==', alunoId),
      where('dataRegistro', '>=', Timestamp.fromDate(dataInicio)),
      where('dataRegistro', '<=', Timestamp.fromDate(dataFim)),
      orderBy('dataRegistro', 'desc')
    );

    const snapshot = await getDocs(q);
    const registros = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return {
      sucesso: true,
      registros
    };
  } catch (error) {
    console.error('Erro ao buscar registros:', error);
    return {
      sucesso: false,
      erro: 'Erro ao buscar registros',
      registros: []
    };
  }
};

/**
 * Atualizar registro
 */
export const atualizarRegistro = async (registroId, dadosAtualizacao) => {
  try {
    const registroRef = doc(db, 'registros_questoes', registroId);
    
    const updateData = {
      totalQuestoes: dadosAtualizacao.totalQuestoes,
      acertos: dadosAtualizacao.acertos,
      erros: dadosAtualizacao.erros,
      percentualAcerto: dadosAtualizacao.totalQuestoes > 0 
        ? Math.round((dadosAtualizacao.acertos / dadosAtualizacao.totalQuestoes) * 100) 
        : 0,
      observacoes: dadosAtualizacao.observacoes || ''
    };

    await updateDoc(registroRef, updateData);

    return {
      sucesso: true
    };
  } catch (error) {
    console.error('Erro ao atualizar registro:', error);
    return {
      sucesso: false,
      erro: 'Erro ao atualizar registro'
    };
  }
};

/**
 * Deletar registro
 */
export const deletarRegistro = async (registroId) => {
  try {
    const registroRef = doc(db, 'registros_questoes', registroId);
    await deleteDoc(registroRef);

    return {
      sucesso: true
    };
  } catch (error) {
    console.error('Erro ao deletar registro:', error);
    return {
      sucesso: false,
      erro: 'Erro ao deletar registro'
    };
  }
};

/**
 * Calcular estatísticas de questões
 */
export const calcularEstatisticasQuestoes = (registros) => {
  if (registros.length === 0) {
    return {
      totalQuestoes: 0,
      totalAcertos: 0,
      totalErros: 0,
      mediaAcerto: 0,
      totalRegistros: 0
    };
  }

  const totalQuestoes = registros.reduce((acc, r) => acc + r.totalQuestoes, 0);
  const totalAcertos = registros.reduce((acc, r) => acc + r.acertos, 0);
  const totalErros = registros.reduce((acc, r) => acc + r.erros, 0);
  const mediaAcerto = totalQuestoes > 0 
    ? Math.round((totalAcertos / totalQuestoes) * 100) 
    : 0;

  // Questões por disciplina
  const porDisciplina = {};
  registros.forEach(registro => {
    const disciplina = registro.disciplinaNome;
    if (!porDisciplina[disciplina]) {
      porDisciplina[disciplina] = {
        total: 0,
        acertos: 0,
        erros: 0
      };
    }
    porDisciplina[disciplina].total += registro.totalQuestoes;
    porDisciplina[disciplina].acertos += registro.acertos;
    porDisciplina[disciplina].erros += registro.erros;
  });

  return {
    totalQuestoes,
    totalAcertos,
    totalErros,
    mediaAcerto,
    totalRegistros: registros.length,
    porDisciplina
  };
};

/**
 * Buscar disciplinas de um curso
 */
export const buscarDisciplinasCurso = async (cursoId) => {
  try {
    const disciplinasRef = collection(db, 'cursos/' + cursoId + '/disciplinas');
    const q = query(disciplinasRef, orderBy('ordem', 'asc'));
    const snapshot = await getDocs(q);

    const disciplinas = [];
    snapshot.forEach((doc) => {
      disciplinas.push({ id: doc.id, ...doc.data() });
    });

    return {
      sucesso: true,
      disciplinas
    };
  } catch (error) {
    console.error('Erro ao buscar disciplinas:', error);
    return {
      sucesso: false,
      disciplinas: [],
      erro: 'Erro ao buscar disciplinas'
    };
  }
};

/**
 * Buscar assuntos de uma disciplina
 */
export const buscarAssuntosDisciplina = async (cursoId, disciplinaId) => {
  try {
    const path = 'cursos/' + cursoId + '/disciplinas/' + disciplinaId + '/assuntos';
    const assuntosRef = collection(db, path);
    const q = query(assuntosRef, orderBy('ordem', 'asc'));
    const snapshot = await getDocs(q);

    const assuntos = [];
    snapshot.forEach((doc) => {
      assuntos.push({ id: doc.id, ...doc.data() });
    });

    return {
      sucesso: true,
      assuntos
    };
  } catch (error) {
    console.error('Erro ao buscar assuntos:', error);
    return {
      sucesso: false,
      assuntos: [],
      erro: 'Erro ao buscar assuntos'
    };
  }
};