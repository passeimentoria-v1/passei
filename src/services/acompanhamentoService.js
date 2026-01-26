import { 
  collection, 
  query, 
  where, 
  getDocs,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase.config';

/**
 * Buscar estatísticas completas de um aluno
 */
export const buscarEstatisticasAluno = async (alunoId) => {
  try {
    // Buscar metas
    const metasRef = collection(db, 'metas');
    const qMetas = query(
      metasRef,
      where('alunoId', '==', alunoId),
      orderBy('dataProgramada', 'desc')
    );
    const snapshotMetas = await getDocs(qMetas);
    const metas = snapshotMetas.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Buscar questões
    const questoesRef = collection(db, 'registros_questoes');
    const qQuestoes = query(
      questoesRef,
      where('alunoId', '==', alunoId),
      orderBy('dataRegistro', 'desc')
    );
    const snapshotQuestoes = await getDocs(qQuestoes);
    const questoes = snapshotQuestoes.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Calcular estatísticas de metas
    const totalMetas = metas.length;
    const metasConcluidas = metas.filter(m => m.concluida).length;
    const metasPendentes = totalMetas - metasConcluidas;
    const progressoMetas = totalMetas > 0 
      ? Math.round((metasConcluidas / totalMetas) * 100) 
      : 0;

    // Metas atrasadas
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const metasAtrasadas = metas.filter(m => {
      if (m.concluida) return false;
      const dataMeta = m.dataProgramada.toDate();
      dataMeta.setHours(0, 0, 0, 0);
      return dataMeta < hoje;
    }).length;

    // Calcular estatísticas de questões
    const totalQuestoes = questoes.reduce((acc, q) => acc + q.totalQuestoes, 0);
    const totalAcertos = questoes.reduce((acc, q) => acc + q.acertos, 0);
    const mediaAcerto = totalQuestoes > 0 
      ? Math.round((totalAcertos / totalQuestoes) * 100) 
      : 0;

    // Desempenho por disciplina
    const porDisciplina = {};
    questoes.forEach(q => {
      const disciplina = q.disciplinaNome;
      if (!porDisciplina[disciplina]) {
        porDisciplina[disciplina] = {
          total: 0,
          acertos: 0,
          erros: 0,
          percentual: 0
        };
      }
      porDisciplina[disciplina].total += q.totalQuestoes;
      porDisciplina[disciplina].acertos += q.acertos;
      porDisciplina[disciplina].erros += q.erros;
    });

    // Calcular percentual por disciplina
    Object.keys(porDisciplina).forEach(disciplina => {
      const dados = porDisciplina[disciplina];
      dados.percentual = dados.total > 0 
        ? Math.round((dados.acertos / dados.total) * 100) 
        : 0;
    });

    // Últimas atividades
    const ultimasAtividades = [];

    // Adicionar metas concluídas recentemente
    metas
      .filter(m => m.concluida && m.dataConclusao)
      .slice(0, 5)
      .forEach(m => {
        ultimasAtividades.push({
          tipo: 'meta',
          descricao: `Concluiu: ${m.assuntoTitulo}`,
          data: m.dataConclusao,
          icone: '✓'
        });
      });

    // Adicionar questões recentes
    questoes.slice(0, 5).forEach(q => {
      ultimasAtividades.push({
        tipo: 'questao',
        descricao: `${q.assuntoTitulo} - ${q.percentualAcerto}% de acerto`,
        data: q.dataRegistro,
        icone: '📝'
      });
    });

    // Ordenar por data
    ultimasAtividades.sort((a, b) => {
      const dataA = a.data.toDate ? a.data.toDate() : new Date(a.data);
      const dataB = b.data.toDate ? b.data.toDate() : new Date(b.data);
      return dataB - dataA;
    });

    return {
      sucesso: true,
      estatisticas: {
        metas: {
          total: totalMetas,
          concluidas: metasConcluidas,
          pendentes: metasPendentes,
          atrasadas: metasAtrasadas,
          progresso: progressoMetas
        },
        questoes: {
          total: totalQuestoes,
          acertos: totalAcertos,
          mediaAcerto: mediaAcerto,
          totalRegistros: questoes.length,
          porDisciplina: porDisciplina
        },
        ultimasAtividades: ultimasAtividades.slice(0, 10)
      },
      metas: metas.slice(0, 10),
      questoes: questoes.slice(0, 10)
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas do aluno:', error);
    return {
      sucesso: false,
      erro: 'Erro ao buscar estatísticas'
    };
  }
};

/**
 * Buscar estatísticas de todos os alunos de um mentor
 */
export const buscarEstatisticasTodosAlunos = async (mentorId) => {
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
    const alunos = snapshotAlunos.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Buscar estatísticas de cada aluno
    const estatisticasPorAluno = [];
    
    for (const aluno of alunos) {
      const resultado = await buscarEstatisticasAluno(aluno.id);
      
      if (resultado.sucesso) {
        estatisticasPorAluno.push({
          aluno: {
            id: aluno.id,
            nome: aluno.nome,
            email: aluno.email,
            fotoPerfil: aluno.fotoPerfil
          },
          ...resultado.estatisticas
        });
      }
    }

    // Ordenar por progresso (maior para menor)
    estatisticasPorAluno.sort((a, b) => 
      b.metas.progresso - a.metas.progresso
    );

    return {
      sucesso: true,
      alunos: estatisticasPorAluno
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas de todos os alunos:', error);
    return {
      sucesso: false,
      erro: 'Erro ao buscar estatísticas',
      alunos: []
    };
  }
};

/**
 * Buscar metas de um aluno específico (para o mentor)
 */
export const buscarMetasAlunoPorMentor = async (alunoId) => {
  try {
    const metasRef = collection(db, 'metas');
    const q = query(
      metasRef,
      where('alunoId', '==', alunoId),
      orderBy('dataProgramada', 'desc')
    );

    const snapshot = await getDocs(q);
    const metas = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return {
      sucesso: true,
      metas
    };
  } catch (error) {
    console.error('Erro ao buscar metas:', error);
    return {
      sucesso: false,
      erro: 'Erro ao buscar metas',
      metas: []
    };
  }
};

/**
 * Buscar questões de um aluno específico (para o mentor)
 */
export const buscarQuestoesAlunoPorMentor = async (alunoId) => {
  try {
    const questoesRef = collection(db, 'registros_questoes');
    const q = query(
      questoesRef,
      where('alunoId', '==', alunoId),
      orderBy('dataRegistro', 'desc')
    );

    const snapshot = await getDocs(q);
    const questoes = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return {
      sucesso: true,
      questoes
    };
  } catch (error) {
    console.error('Erro ao buscar questões:', error);
    return {
      sucesso: false,
      erro: 'Erro ao buscar questões',
      questoes: []
    };
  }
};