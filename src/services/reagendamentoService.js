import { 
  collection, 
  query, 
  where, 
  getDocs,
  doc,
  updateDoc,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase.config';

/**
 * ✅ Encontrar próximo dia livre do aluno
 */
export const encontrarProximoDiaLivre = async (alunoId, dataInicial) => {
  try {
    // Buscar todas as metas do aluno
    const metasRef = collection(db, 'metas');
    const q = query(
      metasRef,
      where('alunoId', '==', alunoId),
      where('concluida', '==', false),
      where('arquivado', '==', false),
      where('oculto', '==', false)
    );

    const snapshot = await getDocs(q);
    const metas = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Agrupar metas por data
    const metasPorData = {};
    metas.forEach(meta => {
      const data = meta.dataProgramada.toDate();
      data.setHours(0, 0, 0, 0);
      const dataKey = data.toISOString().split('T')[0];
      
      if (!metasPorData[dataKey]) {
        metasPorData[dataKey] = [];
      }
      metasPorData[dataKey].push(meta);
    });

    // Calcular tempo total por dia
    const tempoPorDia = {};
    Object.keys(metasPorData).forEach(dataKey => {
      tempoPorDia[dataKey] = metasPorData[dataKey].reduce((total, meta) => {
        return total + (meta.tempoEstimado || 0);
      }, 0);
    });

    // Buscar configurações do aluno
    const userDoc = await getDocs(query(
      collection(db, 'users'),
      where('__name__', '==', alunoId)
    ));

    let horasPorDia = {
      segunda: 4, terca: 4, quarta: 4, quinta: 4, sexta: 4,
      sabado: 0, domingo: 0
    };

    if (!userDoc.empty) {
      const userData = userDoc.docs[0].data();
      if (userData.configuracoesEstudo?.horasPorDia) {
        horasPorDia = userData.configuracoesEstudo.horasPorDia;
      }
    }

    // Converter horas em minutos
    const minutosPorDia = {};
    Object.keys(horasPorDia).forEach(dia => {
      minutosPorDia[dia] = horasPorDia[dia] * 60;
    });

    const diasSemana = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];

    // Procurar próximo dia com espaço disponível
    let dataAtual = new Date(dataInicial);
    dataAtual.setDate(dataAtual.getDate() + 1); // Começar do dia seguinte
    dataAtual.setHours(0, 0, 0, 0);

    const limite = 60; // Buscar até 60 dias à frente
    for (let i = 0; i < limite; i++) {
      const dataKey = dataAtual.toISOString().split('T')[0];
      const diaSemana = diasSemana[dataAtual.getDay()];
      const limiteMinutos = minutosPorDia[diaSemana] || 0;

      // Pular dias sem horas configuradas
      if (limiteMinutos === 0) {
        dataAtual.setDate(dataAtual.getDate() + 1);
        continue;
      }

      const tempoUsado = tempoPorDia[dataKey] || 0;
      const espacoDisponivel = limiteMinutos - tempoUsado;

      // Se tem espaço disponível (pelo menos 30 minutos)
      if (espacoDisponivel >= 30) {
        return {
          sucesso: true,
          data: new Date(dataAtual),
          espacoDisponivel: espacoDisponivel
        };
      }

      dataAtual.setDate(dataAtual.getDate() + 1);
    }

    // Se não encontrou, retornar próxima segunda-feira
    dataAtual = new Date(dataInicial);
    dataAtual.setDate(dataAtual.getDate() + 1);
    while (dataAtual.getDay() !== 1) { // 1 = segunda
      dataAtual.setDate(dataAtual.getDate() + 1);
    }

    return {
      sucesso: true,
      data: dataAtual,
      espacoDisponivel: minutosPorDia['segunda']
    };

  } catch (error) {
    console.error('Erro ao encontrar próximo dia livre:', error);
    return {
      sucesso: false,
      erro: error.message
    };
  }
};

/**
 * ✅ Reagendar meta para próximo dia livre
 */
export const reagendarMetaProximoDiaLivre = async (metaId, alunoId) => {
  try {
    // Buscar data atual da meta
    const metaDoc = await getDocs(query(
      collection(db, 'metas'),
      where('__name__', '==', metaId)
    ));

    if (metaDoc.empty) {
      return {
        sucesso: false,
        erro: 'Meta não encontrada'
      };
    }

    const metaData = metaDoc.docs[0].data();
    const dataAtual = metaData.dataProgramada.toDate();

    // Encontrar próximo dia livre
    const resultado = await encontrarProximoDiaLivre(alunoId, dataAtual);

    if (!resultado.sucesso) {
      return resultado;
    }

    // Atualizar meta
    const metaRef = doc(db, 'metas', metaId);
    await updateDoc(metaRef, {
      dataProgramada: Timestamp.fromDate(resultado.data),
      dataReagendamento: Timestamp.now(),
      motivoReagendamento: 'precisa_mais_tempo'
    });

    return {
      sucesso: true,
      novaData: resultado.data,
      espacoDisponivel: resultado.espacoDisponivel
    };

  } catch (error) {
    console.error('Erro ao reagendar meta:', error);
    return {
      sucesso: false,
      erro: error.message
    };
  }
};