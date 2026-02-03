import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase.config';

/**
 * ✅ Atualizar configurações de estudo do usuário
 */
export const atualizarConfiguracoesEstudo = async (userId, configuracoes) => {
  try {
    const userRef = doc(db, 'users', userId);
    
    const configUpdate = {
      'configuracoesEstudo.diasPorSemana': parseInt(configuracoes.diasPorSemana) || 5,
      'configuracoesEstudo.horasPorDia': parseFloat(configuracoes.horasPorDia) || 4,
      'configuracoesEstudo.tempoPorDisciplina': parseInt(configuracoes.tempoPorDisciplina) || 60,
      'configuracoesEstudo.disciplinasPorDia': parseInt(configuracoes.disciplinasPorDia) || 3
    };

    await updateDoc(userRef, configUpdate);

    return {
      sucesso: true
    };
  } catch (error) {
    console.error('Erro ao atualizar configurações:', error);
    return {
      sucesso: false,
      erro: 'Erro ao atualizar configurações'
    };
  }
};

/**
 * ✅ Buscar configurações de estudo do usuário
 */
export const buscarConfiguracoesEstudo = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return {
        sucesso: false,
        erro: 'Usuário não encontrado'
      };
    }
    
    const userData = userSnap.data();
    const configuracoes = userData.configuracoesEstudo || {
      diasPorSemana: 5,
      horasPorDia: 4,
      tempoPorDisciplina: 60,
      disciplinasPorDia: 3
    };
    
    return {
      sucesso: true,
      configuracoes
    };
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    return {
      sucesso: false,
      erro: 'Erro ao buscar configurações'
    };
  }
};

/**
 * ✅ Vincular aluno a curso
 */
export const vincularAlunoACurso = async (alunoId, cursoId) => {
  try {
    const userRef = doc(db, 'users', alunoId);
    await updateDoc(userRef, {
      cursoId: cursoId
    });

    return {
      sucesso: true
    };
  } catch (error) {
    console.error('Erro ao vincular aluno ao curso:', error);
    return {
      sucesso: false,
      erro: 'Erro ao vincular aluno'
    };
  }
};