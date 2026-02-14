/**
 * Algoritmo de Distribuição Automática de Metas
 * Distribui assuntos pelos dias disponíveis do aluno
 */

/**
 * Calcula o tempo estimado de estudo por assunto
 * @param {string} tipoEstudo - 'expresso', 'regular' ou 'calma'
 * @returns {number} Tempo em minutos
 */
const calcularTempoEstimado = (tipoEstudo) => {
  const tempos = {
    'expresso': 15,   // Revisão rápida - 15min conforme edital
    'regular': 30,    // Estudo normal - 30min conforme edital
    'calma': 45       // Estudo aprofundado - 45min conforme edital
  };
  
  return tempos[tipoEstudo] || 30;
};

/**
 * Identifica quais dias da semana o aluno tem disponível
 * @param {object} configuracoes - Configurações de estudo do aluno
 * @returns {array} Lista de dias disponíveis com horas
 */
const identificarDiasDisponiveis = (configuracoes) => {
  if (!configuracoes || !configuracoes.horasPorDia) {
    // Fallback para formato antigo
    return [
      { id: 'segunda', nome: 'Segunda-feira', horas: 4 },
      { id: 'terca', nome: 'Terça-feira', horas: 4 },
      { id: 'quarta', nome: 'Quarta-feira', horas: 4 },
      { id: 'quinta', nome: 'Quinta-feira', horas: 4 },
      { id: 'sexta', nome: 'Sexta-feira', horas: 4 },
    ];
  }

  const diasSemana = [
    { id: 'domingo', nome: 'Domingo', ordem: 0 },
    { id: 'segunda', nome: 'Segunda-feira', ordem: 1 },
    { id: 'terca', nome: 'Terça-feira', ordem: 2 },
    { id: 'quarta', nome: 'Quarta-feira', ordem: 3 },
    { id: 'quinta', nome: 'Quinta-feira', ordem: 4 },
    { id: 'sexta', nome: 'Sexta-feira', ordem: 5 },
    { id: 'sabado', nome: 'Sábado', ordem: 6 },
  ];

  const diasDisponiveis = [];
  
  for (const dia of diasSemana) {
    const horas = configuracoes.horasPorDia[dia.id];
    if (horas && horas > 0) {
      diasDisponiveis.push({
        id: dia.id,
        nome: dia.nome,
        ordem: dia.ordem,
        horas: horas,
        minutos: horas * 60
      });
    }
  }

  console.log('📅 Dias disponíveis:', diasDisponiveis);
  return diasDisponiveis;
};

/**
 * Encontra o próximo dia disponível a partir de uma data
 * @param {Date} data - Data atual
 * @param {array} diasDisponiveis - Lista de dias disponíveis
 * @returns {Date} Próxima data disponível
 */
const encontrarProximoDiaDisponivel = (data, diasDisponiveis) => {
  const maxTentativas = 14; // Busca até 2 semanas à frente
  let tentativa = 0;
  
  while (tentativa < maxTentativas) {
    const diaSemana = data.getDay();
    const diaDisponivel = diasDisponiveis.find(d => d.ordem === diaSemana);
    
    if (diaDisponivel) {
      return { data: new Date(data), diaDisponivel };
    }
    
    // Avança para o próximo dia
    data.setDate(data.getDate() + 1);
    tentativa++;
  }
  
  // Se não encontrar, retorna a data original
  return { data: new Date(data), diaDisponivel: diasDisponiveis[0] };
};

/**
 * Formata data para exibição
 * @param {Date} data 
 * @returns {string} Data formatada
 */
const formatarData = (data) => {
  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Formata data para banco (YYYY-MM-DD)
 * @param {Date} data 
 * @returns {string} Data no formato YYYY-MM-DD
 */
const formatarDataBanco = (data) => {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
};

/**
 * Obtém nome do dia da semana
 * @param {Date} data 
 * @returns {string} Nome do dia
 */
const obterNomeDiaSemana = (data) => {
  const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  return dias[data.getDay()];
};

/**
 * Agrupa assuntos por disciplina
 * @param {array} assuntos - Lista de assuntos
 * @returns {object} Assuntos agrupados por disciplinaId
 */
const agruparPorDisciplina = (assuntos) => {
  const grupos = {};
  
  assuntos.forEach(assunto => {
    const disciplinaId = assunto.disciplinaId;
    if (!grupos[disciplinaId]) {
      grupos[disciplinaId] = [];
    }
    grupos[disciplinaId].push(assunto);
  });
  
  return grupos;
};

/**
 * Distribui assuntos em um dia respeitando restrições
 * @param {object} diaSlot - Slot do dia
 * @param {array} filaAssuntos - Fila de assuntos a distribuir
 * @param {number} maxDisciplinasPorDia - Máximo de disciplinas diferentes
 * @param {number} tempoMaxPorDisciplina - Tempo máximo por disciplina em minutos
 * @returns {object} Resultado da alocação
 */
const distribuirAssuntosNoDia = (diaSlot, filaAssuntos, maxDisciplinasPorDia, tempoMaxPorDisciplina) => {
  let alocouAlgum = false;
  let i = 0;
  
  while (i < filaAssuntos.length) {
    const assunto = filaAssuntos[i];
    const disciplinaId = assunto.disciplinaId;
    
    // Verificar se ainda há espaço no dia
    if (diaSlot.tempoTotal + assunto.tempoEstimado > diaSlot.tempoDisponivel) {
      i++;
      continue;
    }
    
    // Verificar limite de disciplinas diferentes por dia
    if (maxDisciplinasPorDia) {
      const disciplinasAtuais = Object.keys(diaSlot.disciplinas).length;
      const disciplinaJaExiste = diaSlot.disciplinas[disciplinaId] !== undefined;
      
      if (!disciplinaJaExiste && disciplinasAtuais >= maxDisciplinasPorDia) {
        i++;
        continue;
      }
    }
    
    // Verificar limite de tempo por disciplina
    if (tempoMaxPorDisciplina) {
      const tempoAtualDisciplina = diaSlot.disciplinas[disciplinaId] || 0;
      
      if (tempoAtualDisciplina + assunto.tempoEstimado > tempoMaxPorDisciplina) {
        i++;
        continue;
      }
    }
    
    // Pode alocar este assunto
    diaSlot.assuntos.push(assunto);
    diaSlot.tempoTotal += assunto.tempoEstimado;
    
    // Atualizar controle de tempo por disciplina
    if (!diaSlot.disciplinas[disciplinaId]) {
      diaSlot.disciplinas[disciplinaId] = 0;
    }
    diaSlot.disciplinas[disciplinaId] += assunto.tempoEstimado;
    
    // Remover da fila
    filaAssuntos.splice(i, 1);
    alocouAlgum = true;
    
    // Não incrementa i porque removemos o elemento
  }
  
  return { alocouAlgum };
};

/**
 * Distribui assuntos pelos dias disponíveis
 * @param {object} params - Parâmetros
 * @param {array} params.assuntos - Lista de assuntos selecionados
 * @param {object} params.configuracoes - Configurações do aluno
 * @param {string} params.dataInicio - Data de início (YYYY-MM-DD)
 * @param {string} params.tipoEstudo - Tipo de estudo
 * @param {number} params.maxDisciplinasPorDia - Máximo de disciplinas diferentes por dia (opcional)
 * @param {number} params.tempoMaxPorDisciplina - Tempo máximo por disciplina em minutos (opcional)
 * @returns {object} Distribuição ou erro
 */
export const distribuirMetasAutomaticamente = ({ 
  assuntos, 
  configuracoes, 
  dataInicio, 
  tipoEstudo,
  maxDisciplinasPorDia = null,
  tempoMaxPorDisciplina = null
}) => {
  try {
    console.log('🤖 Iniciando distribuição automática...');
    console.log('📚 Assuntos:', assuntos.length);
    console.log('⚙️ Configurações:', configuracoes);
    console.log('📅 Data início:', dataInicio);
    console.log('📖 Tipo estudo:', tipoEstudo);
    console.log('🎯 Max disciplinas/dia:', maxDisciplinasPorDia || 'ilimitado');
    console.log('⏱️ Tempo max/disciplina:', tempoMaxPorDisciplina || 'ilimitado');

    // Validações
    if (!assuntos || assuntos.length === 0) {
      return {
        sucesso: false,
        erro: 'Nenhum assunto selecionado'
      };
    }

    if (!dataInicio) {
      return {
        sucesso: false,
        erro: 'Data de início não informada'
      };
    }

    // Identificar dias disponíveis
    const diasDisponiveis = identificarDiasDisponiveis(configuracoes);
    
    if (diasDisponiveis.length === 0) {
      return {
        sucesso: false,
        erro: 'Aluno não tem dias disponíveis configurados'
      };
    }

    console.log('✅ Dias disponíveis:', diasDisponiveis.map(d => `${d.nome} (${d.horas}h)`).join(', '));

    // Calcular tempo estimado por assunto
    const tempoEstimado = calcularTempoEstimado(tipoEstudo);
    console.log(`⏱️ Tempo estimado por assunto: ${tempoEstimado}min`);

    // Preparar assuntos com tempo
    const assuntosComTempo = assuntos.map(a => ({
      ...a,
      tempoEstimado
    }));

    // Agrupar assuntos por disciplina
    const assuntosPorDisciplina = agruparPorDisciplina(assuntosComTempo);
    console.log(`📚 ${Object.keys(assuntosPorDisciplina).length} disciplinas diferentes`);

    // Iniciar distribuição
    const distribuicao = [];
    let dataAtual = new Date(dataInicio + 'T12:00:00');
    
    // Criar fila de assuntos para distribuir
    const filaAssuntos = [...assuntosComTempo];
    
    while (filaAssuntos.length > 0) {
      // Encontrar próximo dia disponível
      const { data, diaDisponivel } = encontrarProximoDiaDisponivel(dataAtual, diasDisponiveis);
      
      if (!diaDisponivel) {
        console.warn('⚠️ Não foi possível encontrar dia disponível');
        break;
      }

      // Criar slot do dia
      const diaSlot = {
        data: new Date(data),
        dataBanco: formatarDataBanco(data),
        dataFormatada: formatarData(data),
        diaSemana: obterNomeDiaSemana(data),
        diaId: diaDisponivel.id,
        tempoDisponivel: diaDisponivel.minutos,
        tempoTotal: 0,
        assuntos: [],
        disciplinas: {} // Controle de tempo por disciplina
      };

      // Distribuir assuntos neste dia respeitando restrições
      const resultado = distribuirAssuntosNoDia(
        diaSlot,
        filaAssuntos,
        maxDisciplinasPorDia,
        tempoMaxPorDisciplina
      );

      // Adicionar dia à distribuição se tiver assuntos
      if (diaSlot.assuntos.length > 0) {
        distribuicao.push(diaSlot);
      }

      // Se não conseguiu alocar nenhum assunto, forçar avanço
      if (!resultado.alocouAlgum && filaAssuntos.length > 0) {
        console.warn('⚠️ Não foi possível alocar assuntos neste dia, pulando...');
        // Remove o primeiro assunto para evitar loop infinito
        filaAssuntos.shift();
      }

      // Avançar para o próximo dia
      dataAtual = new Date(data);
      dataAtual.setDate(dataAtual.getDate() + 1);
      
      // Proteção contra loop infinito
      if (distribuicao.length > 365) {
        console.error('❌ Distribuição muito extensa (>365 dias)');
        return {
          sucesso: false,
          erro: 'Não foi possível distribuir - cronograma muito longo. Revise as configurações.'
        };
      }
    }

    console.log('✅ Distribuição concluída!');
    console.log(`📊 ${assuntos.length} assuntos em ${distribuicao.length} dias`);

    return {
      sucesso: true,
      distribuicao
    };

  } catch (error) {
    console.error('❌ Erro na distribuição:', error);
    return {
      sucesso: false,
      erro: 'Erro ao calcular distribuição: ' + error.message
    };
  }
};

/**
 * Converte distribuição em metas para salvar no Firebase
 * @param {array} distribuicao - Resultado da distribuição
 * @param {string} alunoId - ID do aluno
 * @param {string} cursoId - ID do curso
 * @param {string} mentorId - ID do mentor
 * @param {string} observacoes - Observações gerais
 * @param {string} tipoEstudo - Tipo de estudo
 * @returns {array} Lista de metas
 */
export const converterParaMetas = (distribuicao, alunoId, cursoId, mentorId, observacoes, tipoEstudo) => {
  const metas = [];

  for (const dia of distribuicao) {
    for (const assunto of dia.assuntos) {
      // Criar título com nome da disciplina
      const tituloCompleto = assunto.disciplinaNome 
        ? `${assunto.disciplinaNome}: ${assunto.titulo}`
        : assunto.titulo;

      metas.push({
        alunoId,
        cursoId,
        disciplinaId: assunto.disciplinaId,
        disciplinaNome: assunto.disciplinaNome || '', // ✅ ADICIONADO
        assuntoId: assunto.id,
        assuntoTitulo: tituloCompleto, // ✅ MODIFICADO para incluir nome da disciplina
        dataProgramada: dia.dataBanco,
        tipoEstudo,
        tempoEstimado: assunto.tempoEstimado,
        observacoes,
        mentorId
      });
    }
  }

  console.log(`✅ ${metas.length} metas geradas para salvamento`);
  return metas;
};

/**
 * Valida se a distribuição é viável
 * @param {array} assuntos - Lista de assuntos
 * @param {object} configuracoes - Configurações do aluno
 * @param {string} tipoEstudo - Tipo de estudo
 * @returns {object} Resultado da validação
 */
export const validarDistribuicao = (assuntos, configuracoes, tipoEstudo) => {
  const diasDisponiveis = identificarDiasDisponiveis(configuracoes);
  const tempoEstimado = calcularTempoEstimado(tipoEstudo);
  
  const tempoTotalNecessario = assuntos.length * tempoEstimado;
  const tempoTotalDisponivel = diasDisponiveis.reduce((total, dia) => total + dia.minutos, 0);
  
  // Calcular quantas semanas serão necessárias
  const tempoPorSemana = tempoTotalDisponivel;
  const semanasNecessarias = Math.ceil(tempoTotalNecessario / tempoPorSemana);
  
  return {
    viavel: tempoTotalNecessario <= (tempoTotalDisponivel * 12), // Máximo 12 semanas
    tempoTotalNecessario,
    tempoTotalDisponivel,
    semanasNecessarias,
    diasDisponiveis: diasDisponiveis.length,
    mensagem: tempoTotalNecessario > (tempoTotalDisponivel * 12)
      ? `São necessários ${semanasNecessarias} semanas, o que pode ser muito extenso. Considere aumentar a disponibilidade ou reduzir assuntos.`
      : `Distribuição será feita em aproximadamente ${semanasNecessarias} semana(s)`
  };
};