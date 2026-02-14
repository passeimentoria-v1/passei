import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase.config';

/**
 * ✅ Atualizar configurações de estudo do usuário
 */
export const atualizarConfiguracoesEstudo = async (userId, configuracoes) => {
  try {
    console.log('💾 Salvando configurações para userId:', userId);
    console.log('📝 Dados a salvar:', configuracoes);
    
    const userRef = doc(db, 'users', userId);
    
    // Salvar o objeto completo de configurações
    await updateDoc(userRef, {
      configuracoesEstudo: configuracoes
    });

    console.log('✅ Configurações salvas com sucesso');

    return {
      sucesso: true
    };
  } catch (error) {
    console.error('❌ Erro ao atualizar configurações:', error);
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
    console.log('🔍 Buscando configurações para userId:', userId);
    
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      console.log('⚠️ Usuário não encontrado');
      return {
        sucesso: false,
        erro: 'Usuário não encontrado'
      };
    }
    
    const userData = userSnap.data();
    console.log('📦 Dados do usuário:', userData);
    
    // Se não tiver configurações, retorna null para usar valores padrão no componente
    if (!userData.configuracoesEstudo) {
      console.log('ℹ️ Nenhuma configuração encontrada');
      return {
        sucesso: true,
        configuracoes: null
      };
    }
    
    const configuracoes = userData.configuracoesEstudo;
    
    // Verificar se está no formato novo (objeto com dias da semana)
    if (configuracoes.horasPorDia && typeof configuracoes.horasPorDia === 'object' && 
        configuracoes.horasPorDia.segunda !== undefined) {
      console.log('✅ Formato novo detectado');
      
      // Remover diasPorSemana se existir (campo obsoleto)
      const { diasPorSemana, tempoPorDisciplina, disciplinasPorDia, ...configLimpa } = configuracoes;
      
      return {
        sucesso: true,
        configuracoes: configLimpa
      };
    }
    
    // Formato antigo - migrar automaticamente
    console.log('⚠️ Formato antigo detectado, migrando...');
    const horasDefault = typeof configuracoes.horasPorDia === 'number' 
      ? configuracoes.horasPorDia 
      : 4;
    
    const configMigradas = {
      horasPorDia: {
        segunda: horasDefault,
        terca: horasDefault,
        quarta: horasDefault,
        quinta: horasDefault,
        sexta: horasDefault,
        sabado: 0,
        domingo: 0
      }
    };
    
    return {
      sucesso: true,
      configuracoes: configMigradas
    };
  } catch (error) {
    console.error('❌ Erro ao buscar configurações:', error);
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

/**
 * ✅ NOVO: Alternar status do usuário (ativo/inativo)
 */
export const alternarStatusUsuario = async (userId, ativoAtual) => {
  try {
    const novoStatus = !ativoAtual;
    console.log(`🔄 Alterando status para: ${novoStatus ? 'ATIVO' : 'INATIVO'}`);
    
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ativo: novoStatus
    });

    return {
      sucesso: true,
      novoStatus
    };
  } catch (error) {
    console.error('❌ Erro ao alternar status:', error);
    return {
      sucesso: false,
      erro: 'Erro ao alternar status do usuário'
    };
  }
};