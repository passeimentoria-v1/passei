import { 
  collection, 
  query, 
  where, 
  getDocs,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase.config';
import { calcularEstatisticasMetas } from './metaService';
import { calcularEstatisticasQuestoes } from './questoesService';

/**
 * Gerar relatório semanal do aluno
 */
export const gerarRelatorioSemanalAluno = async (alunoId) => {
  try {
    // Calcular início e fim da semana
    const hoje = new Date();
    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - hoje.getDay()); // Domingo
    inicioSemana.setHours(0, 0, 0, 0);
    
    const fimSemana = new Date(inicioSemana);
    fimSemana.setDate(inicioSemana.getDate() + 6); // Sábado
    fimSemana.setHours(23, 59, 59, 999);

    // Buscar metas da semana
    const metasRef = collection(db, 'metas');
    const qMetas = query(
      metasRef,
      where('alunoId', '==', alunoId),
      where('dataProgramada', '>=', Timestamp.fromDate(inicioSemana)),
      where('dataProgramada', '<=', Timestamp.fromDate(fimSemana))
    );
    const snapshotMetas = await getDocs(qMetas);
    const metas = snapshotMetas.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Buscar questões da semana
    const questoesRef = collection(db, 'registros_questoes');
    const qQuestoes = query(
      questoesRef,
      where('alunoId', '==', alunoId),
      where('dataRegistro', '>=', Timestamp.fromDate(inicioSemana)),
      where('dataRegistro', '<=', Timestamp.fromDate(fimSemana))
    );
    const snapshotQuestoes = await getDocs(qQuestoes);
    const questoes = snapshotQuestoes.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Calcular estatísticas
    const statsMetas = calcularEstatisticasMetas(metas);
    const statsQuestoes = calcularEstatisticasQuestoes(questoes);

    // Calcular tempo total estudado (soma dos tempos estimados das metas concluídas)
    const tempoEstudado = metas
      .filter(m => m.concluida)
      .reduce((acc, m) => acc + (m.tempoEstimado || 0), 0);

    // Disciplinas com mais dificuldade (menor percentual de acerto)
    const disciplinasComDificuldade = Object.entries(statsQuestoes.porDisciplina || {})
      .map(([nome, dados]) => ({
        nome,
        percentualAcerto: dados.percentual,
        totalQuestoes: dados.total,
        erros: dados.erros
      }))
      .sort((a, b) => a.percentualAcerto - b.percentualAcerto)
      .slice(0, 3);

    return {
      sucesso: true,
      relatorio: {
        periodo: {
          inicio: inicioSemana,
          fim: fimSemana,
          tipo: 'semanal'
        },
        metas: {
          total: statsMetas.total,
          concluidas: statsMetas.concluidas,
          pendentes: statsMetas.pendentes,
          percentualConclusao: statsMetas.percentual
        },
        questoes: {
          total: statsQuestoes.totalQuestoes,
          acertos: statsQuestoes.totalAcertos,
          erros: statsQuestoes.totalErros,
          mediaAcerto: statsQuestoes.mediaAcerto
        },
        tempo: {
          totalMinutos: tempoEstudado,
          totalHoras: Math.round(tempoEstudado / 60 * 10) / 10,
          mediaDiaria: Math.round(tempoEstudado / 7)
        },
        disciplinasComDificuldade
      }
    };
  } catch (error) {
    console.error('Erro ao gerar relatório semanal:', error);
    return {
      sucesso: false,
      erro: 'Erro ao gerar relatório: ' + error.message
    };
  }
};

/**
 * Gerar relatório mensal do aluno
 */
export const gerarRelatorioMensalAluno = async (alunoId) => {
  try {
    // Calcular início e fim do mês
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    inicioMes.setHours(0, 0, 0, 0);
    
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    fimMes.setHours(23, 59, 59, 999);

    // Buscar metas do mês
    const metasRef = collection(db, 'metas');
    const qMetas = query(
      metasRef,
      where('alunoId', '==', alunoId),
      where('dataProgramada', '>=', Timestamp.fromDate(inicioMes)),
      where('dataProgramada', '<=', Timestamp.fromDate(fimMes))
    );
    const snapshotMetas = await getDocs(qMetas);
    const metas = snapshotMetas.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Buscar questões do mês
    const questoesRef = collection(db, 'registros_questoes');
    const qQuestoes = query(
      questoesRef,
      where('alunoId', '==', alunoId),
      where('dataRegistro', '>=', Timestamp.fromDate(inicioMes)),
      where('dataRegistro', '<=', Timestamp.fromDate(fimMes))
    );
    const snapshotQuestoes = await getDocs(qQuestoes);
    const questoes = snapshotQuestoes.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Calcular estatísticas
    const statsMetas = calcularEstatisticasMetas(metas);
    const statsQuestoes = calcularEstatisticasQuestoes(questoes);

    // Calcular tempo total estudado
    const tempoEstudado = metas
      .filter(m => m.concluida)
      .reduce((acc, m) => acc + (m.tempoEstimado || 0), 0);

    // Evolução semanal do percentual de acerto
    const evolucaoSemanal = calcularEvolucaoSemanal(questoes, inicioMes, fimMes);

    // Disciplinas com mais dificuldade
    const disciplinasComDificuldade = Object.entries(statsQuestoes.porDisciplina || {})
      .map(([nome, dados]) => ({
        nome,
        percentualAcerto: dados.percentual,
        totalQuestoes: dados.total,
        erros: dados.erros
      }))
      .sort((a, b) => a.percentualAcerto - b.percentualAcerto)
      .slice(0, 5);

    const diasNoMes = fimMes.getDate();

    return {
      sucesso: true,
      relatorio: {
        periodo: {
          inicio: inicioMes,
          fim: fimMes,
          tipo: 'mensal'
        },
        metas: {
          total: statsMetas.total,
          concluidas: statsMetas.concluidas,
          pendentes: statsMetas.pendentes,
          atrasadas: statsMetas.atrasadas,
          percentualConclusao: statsMetas.percentual
        },
        questoes: {
          total: statsQuestoes.totalQuestoes,
          acertos: statsQuestoes.totalAcertos,
          erros: statsQuestoes.totalErros,
          mediaAcerto: statsQuestoes.mediaAcerto,
          porDisciplina: statsQuestoes.porDisciplina
        },
        tempo: {
          totalMinutos: tempoEstudado,
          totalHoras: Math.round(tempoEstudado / 60 * 10) / 10,
          mediaDiaria: Math.round(tempoEstudado / diasNoMes)
        },
        evolucaoSemanal,
        disciplinasComDificuldade
      }
    };
  } catch (error) {
    console.error('Erro ao gerar relatório mensal:', error);
    return {
      sucesso: false,
      erro: 'Erro ao gerar relatório: ' + error.message
    };
  }
};

/**
 * Calcular evolução semanal do percentual de acerto
 */
const calcularEvolucaoSemanal = (questoes, inicioMes, fimMes) => {
  const semanas = [];
  let dataAtual = new Date(inicioMes);

  while (dataAtual <= fimMes) {
    const inicioSemana = new Date(dataAtual);
    const fimSemana = new Date(dataAtual);
    fimSemana.setDate(fimSemana.getDate() + 6);

    if (fimSemana > fimMes) {
      fimSemana.setTime(fimMes.getTime());
    }

    const questoesSemana = questoes.filter(q => {
      const dataRegistro = q.dataRegistro.toDate();
      return dataRegistro >= inicioSemana && dataRegistro <= fimSemana;
    });

    const totalQuestoes = questoesSemana.reduce((acc, q) => acc + q.totalQuestoes, 0);
    const totalAcertos = questoesSemana.reduce((acc, q) => acc + q.acertos, 0);
    const percentual = totalQuestoes > 0 ? Math.round((totalAcertos / totalQuestoes) * 100) : 0;

    semanas.push({
      semana: semanas.length + 1,
      inicio: new Date(inicioSemana),
      fim: new Date(fimSemana),
      totalQuestoes,
      percentualAcerto: percentual
    });

    dataAtual.setDate(dataAtual.getDate() + 7);
  }

  return semanas;
};

/**
 * Gerar relatório consolidado do mentor (todos os alunos)
 */
export const gerarRelatorioMentor = async (mentorId) => {
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
    const alunos = snapshotAlunos.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Gerar relatório para cada aluno
    const relatoriosAlunos = [];

    for (const aluno of alunos) {
      const relatorioSemanal = await gerarRelatorioSemanalAluno(aluno.id);
      
      if (relatorioSemanal.sucesso) {
        relatoriosAlunos.push({
          aluno: {
            id: aluno.id,
            nome: aluno.nome,
            email: aluno.email
          },
          ...relatorioSemanal.relatorio
        });
      }
    }

    // Identificar alunos atrasados
    const alunosAtrasados = relatoriosAlunos
      .filter(r => r.metas.pendentes > 0)
      .sort((a, b) => b.metas.pendentes - a.metas.pendentes);

    // Calcular performance geral
    const performanceGeral = {
      totalAlunos: relatoriosAlunos.length,
      metasConcluidas: relatoriosAlunos.reduce((acc, r) => acc + r.metas.concluidas, 0),
      metasTotais: relatoriosAlunos.reduce((acc, r) => acc + r.metas.total, 0),
      questoesTotais: relatoriosAlunos.reduce((acc, r) => acc + r.questoes.total, 0),
      mediaAcertoGeral: relatoriosAlunos.length > 0
        ? Math.round(relatoriosAlunos.reduce((acc, r) => acc + r.questoes.mediaAcerto, 0) / relatoriosAlunos.length)
        : 0
    };

    return {
      sucesso: true,
      relatorio: {
        periodo: relatoriosAlunos[0]?.periodo || {},
        performanceGeral,
        alunos: relatoriosAlunos,
        alunosAtrasados,
        ranking: relatoriosAlunos
          .sort((a, b) => b.metas.percentualConclusao - a.metas.percentualConclusao)
          .slice(0, 10)
      }
    };
  } catch (error) {
    console.error('Erro ao gerar relatório do mentor:', error);
    return {
      sucesso: false,
      erro: 'Erro ao gerar relatório: ' + error.message
    };
  }
};