import { 
  collection, 
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query, 
  where, 
  getDocs,
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase.config';

/**
 * Algoritmo SM-2 (SuperMemo 2)
 * Calcula o próximo intervalo de revisão baseado na dificuldade
 */
const calcularProximaRevisao = (facilidade, intervaloAtual = 0, repeticoes = 0) => {
  let novoIntervalo;
  let novasRepeticoes = repeticoes;
  let novaFacilidade = facilidade;

  // Facilidade: 0 = difícil, 1 = médio, 2 = fácil
  // Converter para escala SM-2 (0-5)
  let qualidade;
  if (facilidade === 0) qualidade = 1; // Difícil
  else if (facilidade === 1) qualidade = 3; // Médio
  else qualidade = 5; // Fácil

  // Ajustar EF (Fator de Facilidade)
  novaFacilidade = novaFacilidade + (0.1 - (5 - qualidade) * (0.08 + (5 - qualidade) * 0.02));
  
  if (novaFacilidade < 1.3) novaFacilidade = 1.3;

  // Se a resposta foi "difícil", resetar
  if (qualidade < 3) {
    novasRepeticoes = 0;
    novoIntervalo = 1; // Revisar amanhã
  } else {
    novasRepeticoes += 1;

    // Calcular novo intervalo
    if (novasRepeticoes === 1) {
      novoIntervalo = 1; // 1 dia
    } else if (novasRepeticoes === 2) {
      novoIntervalo = 6; // 6 dias
    } else {
      novoIntervalo = Math.round(intervaloAtual * novaFacilidade);
    }
  }

  // Calcular próxima data de revisão
  const hoje = new Date();
  const proximaRevisao = new Date(hoje);
  proximaRevisao.setDate(proximaRevisao.getDate() + novoIntervalo);

  return {
    intervalo: novoIntervalo,
    repeticoes: novasRepeticoes,
    facilidade: novaFacilidade,
    proximaRevisao: Timestamp.fromDate(proximaRevisao)
  };
};

/**
 * Criar flashcard
 */
export const criarFlashcard = async (dadosFlashcard) => {
  try {
    const flashcardsRef = collection(db, 'flashcards');
    
    // Calcular primeira revisão (amanhã)
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    
    const flashcardData = {
      criadoPor: dadosFlashcard.criadoPor,
      tipoUsuario: dadosFlashcard.tipoUsuario, // 'mentor' ou 'aluno'
      alunoId: dadosFlashcard.alunoId || null, // Se mentor criou para aluno específico
      cursoId: dadosFlashcard.cursoId,
      disciplinaId: dadosFlashcard.disciplinaId,
      disciplinaNome: dadosFlashcard.disciplinaNome,
      assuntoId: dadosFlashcard.assuntoId,
      assuntoTitulo: dadosFlashcard.assuntoTitulo,
      frente: dadosFlashcard.frente, // Pergunta
      verso: dadosFlashcard.verso, // Resposta
      dica: dadosFlashcard.dica || '',
      tags: dadosFlashcard.tags || [],
      
      // Dados do algoritmo SM-2
      facilidade: 2.5, // EF inicial
      intervalo: 1,
      repeticoes: 0,
      proximaRevisao: Timestamp.fromDate(amanha),
      
      dataCriacao: Timestamp.now(),
      ultimaRevisao: null,
      totalRevisoes: 0,
      ativo: true
    };

    const docRef = await addDoc(flashcardsRef, flashcardData);
    
    return {
      sucesso: true,
      flashcardId: docRef.id
    };
  } catch (error) {
    console.error('Erro ao criar flashcard:', error);
    return {
      sucesso: false,
      erro: 'Erro ao criar flashcard'
    };
  }
};

/**
 * Buscar flashcards de um aluno
 */
export const buscarFlashcardsAluno = async (alunoId) => {
  try {
    const flashcardsRef = collection(db, 'flashcards');
    
    // Buscar flashcards criados pelo aluno OU criados para o aluno pelo mentor
    const q1 = query(
      flashcardsRef,
      where('criadoPor', '==', alunoId),
      where('ativo', '==', true),
      orderBy('dataCriacao', 'desc')
    );
    
    const q2 = query(
      flashcardsRef,
      where('alunoId', '==', alunoId),
      where('ativo', '==', true),
      orderBy('dataCriacao', 'desc')
    );

    const [snapshot1, snapshot2] = await Promise.all([
      getDocs(q1),
      getDocs(q2)
    ]);

    const flashcards = [
      ...snapshot1.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      ...snapshot2.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    ];

    // Remover duplicados
    const flashcardsUnicos = Array.from(
      new Map(flashcards.map(f => [f.id, f])).values()
    );

    return {
      sucesso: true,
      flashcards: flashcardsUnicos
    };
  } catch (error) {
    console.error('Erro ao buscar flashcards:', error);
    return {
      sucesso: false,
      erro: 'Erro ao buscar flashcards',
      flashcards: []
    };
  }
};

/**
 * Buscar flashcards para revisar hoje
 */
export const buscarFlashcardsParaRevisar = async (alunoId) => {
  try {
    const hoje = new Date();
    hoje.setHours(23, 59, 59, 999);

    const flashcardsRef = collection(db, 'flashcards');
    
    const q1 = query(
      flashcardsRef,
      where('criadoPor', '==', alunoId),
      where('ativo', '==', true),
      where('proximaRevisao', '<=', Timestamp.fromDate(hoje)),
      orderBy('proximaRevisao', 'asc')
    );
    
    const q2 = query(
      flashcardsRef,
      where('alunoId', '==', alunoId),
      where('ativo', '==', true),
      where('proximaRevisao', '<=', Timestamp.fromDate(hoje)),
      orderBy('proximaRevisao', 'asc')
    );

    const [snapshot1, snapshot2] = await Promise.all([
      getDocs(q1),
      getDocs(q2)
    ]);

    const flashcards = [
      ...snapshot1.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      ...snapshot2.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    ];

    const flashcardsUnicos = Array.from(
      new Map(flashcards.map(f => [f.id, f])).values()
    );

    return {
      sucesso: true,
      flashcards: flashcardsUnicos
    };
  } catch (error) {
    console.error('Erro ao buscar flashcards para revisar:', error);
    return {
      sucesso: false,
      erro: 'Erro ao buscar flashcards',
      flashcards: []
    };
  }
};

/**
 * Revisar flashcard (registrar resposta)
 */
export const revisarFlashcard = async (flashcardId, facilidade) => {
  try {
    const flashcardRef = doc(db, 'flashcards', flashcardId);
    
    // Buscar dados atuais
    const flashcardSnap = await getDocs(query(collection(db, 'flashcards'), where('__name__', '==', flashcardId)));
    if (flashcardSnap.empty) {
      return { sucesso: false, erro: 'Flashcard não encontrado' };
    }

    const flashcardAtual = flashcardSnap.docs[0].data();

    // Calcular próxima revisão com SM-2
    const novosDados = calcularProximaRevisao(
      flashcardAtual.facilidade,
      flashcardAtual.intervalo,
      flashcardAtual.repeticoes
    );

    // Atualizar flashcard
    await updateDoc(flashcardRef, {
      facilidade: novosDados.facilidade,
      intervalo: novosDados.intervalo,
      repeticoes: novosDados.repeticoes,
      proximaRevisao: novosDados.proximaRevisao,
      ultimaRevisao: Timestamp.now(),
      totalRevisoes: flashcardAtual.totalRevisoes + 1
    });

    // Registrar histórico de revisão
    const historicoRef = collection(db, 'historico_revisoes');
    await addDoc(historicoRef, {
      flashcardId,
      alunoId: flashcardAtual.alunoId || flashcardAtual.criadoPor,
      facilidade,
      dataRevisao: Timestamp.now(),
      intervaloAnterior: flashcardAtual.intervalo,
      novoIntervalo: novosDados.intervalo
    });

    return {
      sucesso: true,
      proximaRevisao: novosDados.proximaRevisao,
      intervalo: novosDados.intervalo
    };
  } catch (error) {
    console.error('Erro ao revisar flashcard:', error);
    return {
      sucesso: false,
      erro: 'Erro ao revisar flashcard'
    };
  }
};

/**
 * Atualizar flashcard
 */
export const atualizarFlashcard = async (flashcardId, dadosAtualizacao) => {
  try {
    const flashcardRef = doc(db, 'flashcards', flashcardId);
    
    await updateDoc(flashcardRef, {
      frente: dadosAtualizacao.frente,
      verso: dadosAtualizacao.verso,
      dica: dadosAtualizacao.dica || '',
      tags: dadosAtualizacao.tags || []
    });

    return {
      sucesso: true
    };
  } catch (error) {
    console.error('Erro ao atualizar flashcard:', error);
    return {
      sucesso: false,
      erro: 'Erro ao atualizar flashcard'
    };
  }
};

/**
 * Deletar flashcard
 */
export const deletarFlashcard = async (flashcardId) => {
  try {
    const flashcardRef = doc(db, 'flashcards', flashcardId);
    
    await updateDoc(flashcardRef, {
      ativo: false
    });

    return {
      sucesso: true
    };
  } catch (error) {
    console.error('Erro ao deletar flashcard:', error);
    return {
      sucesso: false,
      erro: 'Erro ao deletar flashcard'
    };
  }
};

/**
 * Buscar estatísticas de flashcards
 */
export const buscarEstatisticasFlashcards = async (alunoId) => {
  try {
    const resultado = await buscarFlashcardsAluno(alunoId);
    
    if (!resultado.sucesso) {
      return {
        sucesso: false,
        erro: resultado.erro
      };
    }

    const flashcards = resultado.flashcards;
    const hoje = new Date();
    hoje.setHours(23, 59, 59, 999);

    const total = flashcards.length;
    const paraRevisar = flashcards.filter(f => {
      const proximaRevisao = f.proximaRevisao.toDate();
      return proximaRevisao <= hoje;
    }).length;

    const revisados = flashcards.filter(f => f.totalRevisoes > 0).length;
    const novos = total - revisados;

    // Agrupar por disciplina
    const porDisciplina = {};
    flashcards.forEach(f => {
      const disciplina = f.disciplinaNome;
      if (!porDisciplina[disciplina]) {
        porDisciplina[disciplina] = 0;
      }
      porDisciplina[disciplina]++;
    });

    return {
      sucesso: true,
      estatisticas: {
        total,
        paraRevisar,
        revisados,
        novos,
        porDisciplina
      }
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return {
      sucesso: false,
      erro: 'Erro ao buscar estatísticas'
    };
  }
};