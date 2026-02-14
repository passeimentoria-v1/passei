import { 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc,
  getDocs, 
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase.config';

/**
 * Criar meta para um aluno
 */
export const criarMeta = async (dadosMeta) => {
  try {
    const metasRef = collection(db, 'metas');
    
    // Criar data corretamente sem problemas de timezone
    // Se vier no formato "2026-01-31", parseia e cria a data ao meio-dia
    const [ano, mes, dia] = dadosMeta.dataProgramada.split("-");
    const dataProgramada = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia), 12, 0, 0);

    const metaData = {
      alunoId: dadosMeta.alunoId,
      cursoId: dadosMeta.cursoId,
      disciplinaId: dadosMeta.disciplinaId,
      assuntoId: dadosMeta.assuntoId,
      assuntoTitulo: dadosMeta.assuntoTitulo,
      dataProgramada: Timestamp.fromDate(dataProgramada),
      tipoEstudo: dadosMeta.tipoEstudo || 'regular',
      tempoEstimado: dadosMeta.tempoEstimado || 0,
      observacoes: dadosMeta.observacoes || '',
      concluida: false,
      dataConclusao: null,
      status: 'Pendente',
      criadoPor: dadosMeta.mentorId,
      dataCriacao: Timestamp.now(),
      // ✅ NOVOS: Campos para controlar visibilidade
      oculto: false,
      arquivado: false
    };

    const docRef = await addDoc(metasRef, metaData);
    
    return {
      sucesso: true,
      metaId: docRef.id
    };
  } catch (error) {
    console.error('Erro ao criar meta:', error);
    return {
      sucesso: false,
      erro: 'Erro ao criar meta'
    };
  }
};

/**
 * Criar múltiplas metas de uma vez
 */
export const criarMetasEmLote = async (metas) => {
  try {
    const promises = metas.map(meta => criarMeta(meta));
    const resultados = await Promise.all(promises);
    
    const sucesso = resultados.every(r => r.sucesso);
    
    return {
      sucesso,
      total: metas.length,
      criadas: resultados.filter(r => r.sucesso).length
    };
  } catch (error) {
    console.error('Erro ao criar metas em lote:', error);
    return {
      sucesso: false,
      erro: 'Erro ao criar metas'
    };
  }
};

/**
 * Buscar metas de um aluno por período
 * ✅ ATUALIZADO: Filtra metas ocultas e arquivadas
 */
export const buscarMetasPorPeriodo = async (alunoId, dataInicio, dataFim) => {
  try {
    const metasRef = collection(db, 'metas');
    const q = query(
      metasRef,
      where('alunoId', '==', alunoId),
      where('dataProgramada', '>=', Timestamp.fromDate(dataInicio)),
      where('dataProgramada', '<=', Timestamp.fromDate(dataFim)),
      orderBy('dataProgramada', 'asc')
    );

    const snapshot = await getDocs(q);
    
    // ✅ NOVO: Filtrar metas ocultas e arquivadas no lado do cliente
    const metas = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(meta => !meta.oculto && !meta.arquivado);

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
 * Buscar metas por mês (para calendário)
 * ✅ ATUALIZADO: Filtra metas ocultas e arquivadas
 */
export const buscarMetasPorMes = async (alunoId, mes, ano) => {
  try {
    const inicioPeriodo = new Date(ano, mes, 1);
    const fimPeriodo = new Date(ano, mes + 1, 0, 23, 59, 59);

    const metasRef = collection(db, 'metas');
    const q = query(
      metasRef,
      where('alunoId', '==', alunoId),
      where('dataProgramada', '>=', Timestamp.fromDate(inicioPeriodo)),
      where('dataProgramada', '<=', Timestamp.fromDate(fimPeriodo)),
      orderBy('dataProgramada', 'asc')
    );

    const snapshot = await getDocs(q);
    
    // ✅ NOVO: Filtrar metas ocultas e arquivadas no lado do cliente
    const metas = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(meta => !meta.oculto && !meta.arquivado);

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
 * Buscar todas as metas de um aluno
 * ✅ ATUALIZADO: Filtra metas ocultas e arquivadas
 */
export const buscarMetasAluno = async (alunoId) => {
  try {
    const metasRef = collection(db, 'metas');
    const q = query(
      metasRef,
      where('alunoId', '==', alunoId),
      orderBy('dataProgramada', 'desc')
    );

    const snapshot = await getDocs(q);
    
    // ✅ NOVO: Filtrar metas ocultas e arquivadas no lado do cliente
    const metas = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(meta => !meta.oculto && !meta.arquivado);

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
 * Marcar meta como concluída
 */
export const concluirMeta = async (metaId) => {
  try {
    const metaRef = doc(db, 'metas', metaId);
    
    await updateDoc(metaRef, {
      concluida: true,
      dataConclusao: Timestamp.now(),
      status: 'Concluída'
    });

    return {
      sucesso: true
    };
  } catch (error) {
    console.error('Erro ao concluir meta:', error);
    return {
      sucesso: false,
      erro: 'Erro ao concluir meta'
    };
  }
};

/**
 * Desmarcar meta como concluída
 */
export const desconcluirMeta = async (metaId) => {
  try {
    const metaRef = doc(db, 'metas', metaId);
    
    await updateDoc(metaRef, {
      concluida: false,
      dataConclusao: null,
      status: 'Pendente'
    });

    return {
      sucesso: true
    };
  } catch (error) {
    console.error('Erro ao desconcluir meta:', error);
    return {
      sucesso: false,
      erro: 'Erro ao desconcluir meta'
    };
  }
};

/**
 * Reagendar meta (mudar data)
 */
export const reagendarMeta = async (metaId, novaData) => {
  try {
    const metaRef = doc(db, 'metas', metaId);
    
    await updateDoc(metaRef, {
      dataProgramada: Timestamp.fromDate(dataProgramada),
    });

    return {
      sucesso: true
    };
  } catch (error) {
    console.error('Erro ao reagendar meta:', error);
    return {
      sucesso: false,
      erro: 'Erro ao reagendar meta'
    };
  }
};

/**
 * Reprogramar meta atrasada (NOVA FUNCIONALIDADE)
 */
export const reprogramarMeta = async (metaId, novaData) => {
  try {
    const metaRef = doc(db, 'metas', metaId);
    
    await updateDoc(metaRef, {
      dataProgramada: Timestamp.fromDate(dataProgramada),
      dataReprogramacao: Timestamp.now()
    });

    return {
      sucesso: true
    };
  } catch (error) {
    console.error('Erro ao reprogramar meta:', error);
    return {
      sucesso: false,
      erro: 'Erro ao reprogramar meta'
    };
  }
};

/**
 * Atualizar meta completa
 */
export const atualizarMeta = async (metaId, dadosAtualizacao) => {
  try {
    const metaRef = doc(db, 'metas', metaId);
    
    const updateData = {};
    
    if (dadosAtualizacao.dataProgramada) {
      updateData.dataProgramada = Timestamp.fromDate(new Date(dadosAtualizacao.dataProgramada));
    }
    
    if (dadosAtualizacao.tipoEstudo) {
      updateData.tipoEstudo = dadosAtualizacao.tipoEstudo;
    }
    
    if (dadosAtualizacao.tempoEstimado !== undefined) {
      updateData.tempoEstimado = dadosAtualizacao.tempoEstimado;
    }
    
    if (dadosAtualizacao.observacoes !== undefined) {
      updateData.observacoes = dadosAtualizacao.observacoes;
    }
    
    await updateDoc(metaRef, updateData);

    return {
      sucesso: true
    };
  } catch (error) {
    console.error('Erro ao atualizar meta:', error);
    return {
      sucesso: false,
      erro: 'Erro ao atualizar meta'
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
      erro: 'Erro ao atualizar status'
    };
  }
};

/**
 * Deletar meta
 */
export const deletarMeta = async (metaId) => {
  try {
    const metaRef = doc(db, 'metas', metaId);
    await deleteDoc(metaRef);

    return {
      sucesso: true
    };
  } catch (error) {
    console.error('Erro ao deletar meta:', error);
    return {
      sucesso: false,
      erro: 'Erro ao deletar meta'
    };
  }
};

/**
 * Calcular estatísticas das metas
 */
export const calcularEstatisticasMetas = (metas) => {
  const total = metas.length;
  const concluidas = metas.filter(m => m.concluida).length;
  const pendentes = total - concluidas;
  const percentual = total > 0 ? Math.round((concluidas / total) * 100) : 0;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const atrasadas = metas.filter(m => {
    if (m.concluida) return false;
    const dataMeta = m.dataProgramada.toDate();
    dataMeta.setHours(0, 0, 0, 0);
    return dataMeta < hoje;
  }).length;

  const hoje_metas = metas.filter(m => {
    const dataMeta = m.dataProgramada.toDate();
    dataMeta.setHours(0, 0, 0, 0);
    return dataMeta.getTime() === hoje.getTime();
  }).length;

  return {
    total,
    concluidas,
    pendentes,
    atrasadas,
    hoje: hoje_metas,
    percentual
  };
};

/**
 * Buscar alunos de um mentor
 */
export const buscarAlunosPorMentor = async (mentorId) => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('tipo', '==', 'aluno'),
      where('mentorId', '==', mentorId),
      where('ativo', '==', true)
    );

    const snapshot = await getDocs(q);
    const alunos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return {
      sucesso: true,
      alunos
    };
  } catch (error) {
    console.error('Erro ao buscar alunos:', error);
    return {
      sucesso: false,
      erro: 'Erro ao buscar alunos',
      alunos: []
    };
  }
};

/**
 * Buscar estatísticas detalhadas de metas por período
 */
export const buscarEstatisticasPorPeriodo = async (alunoId, dataInicio, dataFim) => {
  try {
    const resultado = await buscarMetasPorPeriodo(alunoId, dataInicio, dataFim);
    
    if (!resultado.sucesso) {
      return resultado;
    }

    const estatisticas = calcularEstatisticasMetas(resultado.metas);

    return {
      sucesso: true,
      estatisticas,
      metas: resultado.metas
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return {
      sucesso: false,
      erro: 'Erro ao buscar estatísticas'
    };
  }
};

/**
 * Buscar metas atrasadas de um aluno (NOVA FUNCIONALIDADE)
 * ✅ ATUALIZADO: Filtra metas ocultas e arquivadas
 */
export const buscarMetasAtrasadas = async (alunoId) => {
  try {
    const metasRef = collection(db, 'metas');
    const q = query(
      metasRef, 
      where('alunoId', '==', alunoId),
      where('concluida', '==', false)
    );
    
    const snapshot = await getDocs(q);

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const metasAtrasadas = [];
    snapshot.forEach((doc) => {
      const meta = { id: doc.id, ...doc.data() };
      
      // ✅ NOVO: Ignorar metas ocultas e arquivadas
      if (meta.oculto || meta.arquivado) {
        return;
      }
      
      if (meta.dataProgramada) {
        const dataProgramada = meta.dataProgramada.toDate();
        dataProgramada.setHours(0, 0, 0, 0);
        
        if (dataProgramada < hoje) {
          metasAtrasadas.push(meta);
        }
      }
    });

    return {
      sucesso: true,
      metas: metasAtrasadas
    };
  } catch (error) {
    console.error('Erro ao buscar metas atrasadas:', error);
    return {
      sucesso: false,
      erro: 'Erro ao carregar metas atrasadas',
      metas: []
    };
  }
};