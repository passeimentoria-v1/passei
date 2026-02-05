/**
 * 🤖 ALGORITMO DE DISTRIBUIÇÃO AUTOMÁTICA DE METAS
 * 
 * Distribui assuntos no calendário do aluno respeitando:
 * - Dias por semana que o aluno estuda
 * - Horas disponíveis por dia
 */

/**
 * FUNÇÃO PRINCIPAL - Distribui metas automaticamente
 */
export const distribuirMetasAutomaticamente = ({ 
  assuntos, 
  configuracoes, 
  dataInicio, 
  tipoEstudo 
}) => {
  try {
    // 1. VALIDAÇÕES
    if (!assuntos || assuntos.length === 0) {
      return { sucesso: false, erro: 'Nenhum assunto selecionado' };
    }

    if (!configuracoes || !configuracoes.diasPorSemana || !configuracoes.horasPorDia) {
      return { sucesso: false, erro: 'Configurações do aluno não encontradas' };
    }

    // 2. EXTRAIR CONFIGURAÇÕES
    const diasPorSemana = parseInt(configuracoes.diasPorSemana);
    const horasPorDia = parseFloat(configuracoes.horasPorDia);
    const minutosPorDia = horasPorDia * 60;

    // 3. PREPARAR ASSUNTOS COM TEMPO
    const assuntosComTempo = assuntos.map(a => ({
      ...a,
      tempoEstimado: a.tempos?.[tipoEstudo] || 60
    }));

    // 4. CALCULAR DIAS DISPONÍVEIS DA SEMANA
    // Se estuda 5 dias: Seg, Ter, Qua, Qui, Sex (1,2,3,4,5)
    // Se estuda 6 dias: Seg a Sáb (1,2,3,4,5,6)
    // Se estuda 7 dias: Todos (0,1,2,3,4,5,6)
    const diasDisponiveis = calcularDiasDisponiveis(diasPorSemana);

    // 5. DISTRIBUIR ASSUNTOS
    const distribuicao = [];
    let assuntosRestantes = [...assuntosComTempo];
    
    // Converter data início para Date
    const [ano, mes, dia] = dataInicio.split('-').map(Number);
    let dataAtual = new Date(ano, mes - 1, dia);
    
    let tentativas = 0;
    const MAX_DIAS = 100; // Máximo de 100 dias para distribuir

    while (assuntosRestantes.length > 0 && tentativas < MAX_DIAS) {
      tentativas++;
      
      const diaSemana = dataAtual.getDay(); // 0=Dom, 1=Seg, ..., 6=Sáb
      
      // Verificar se é um dia disponível
      if (diasDisponiveis.includes(diaSemana)) {
        // Coletar assuntos para este dia
        const assuntosNoDia = [];
        let tempoUsado = 0;
        
        // Adicionar assuntos até encher o dia
        while (assuntosRestantes.length > 0) {
          const proximoAssunto = assuntosRestantes[0];
          const novoTempo = tempoUsado + proximoAssunto.tempoEstimado;
          
          // Se cabe no dia
          if (novoTempo <= minutosPorDia) {
            assuntosNoDia.push(assuntosRestantes.shift());
            tempoUsado = novoTempo;
          } else {
            break; // Dia cheio, próximo dia
          }
        }
        
        // Se conseguiu adicionar pelo menos 1 assunto
        if (assuntosNoDia.length > 0) {
          const dataString = formatarData(dataAtual);
          
          distribuicao.push({
            data: dataString,
            dataFormatada: formatarDataExibicao(dataString),
            diaSemana: obterNomeDia(diaSemana),
            assuntos: assuntosNoDia,
            tempoTotal: tempoUsado,
            tempoDisponivel: minutosPorDia,
            tempoLivre: minutosPorDia - tempoUsado
          });
        }
      }
      
      // Avançar 1 dia
      dataAtual.setDate(dataAtual.getDate() + 1);
    }

    // 6. ESTATÍSTICAS
    const tempoTotal = assuntos.reduce((acc, a) => 
      acc + (a.tempos?.[tipoEstudo] || 60), 0
    );

    const estatisticas = {
      totalAssuntos: assuntos.length,
      totalDias: distribuicao.length,
      tempoTotal,
      dataInicio: distribuicao[0]?.data,
      dataFim: distribuicao[distribuicao.length - 1]?.data
    };

    return {
      sucesso: true,
      distribuicao,
      estatisticas
    };

  } catch (error) {
    console.error('Erro:', error);
    return {
      sucesso: false,
      erro: 'Erro ao calcular: ' + error.message
    };
  }
};

/**
 * Calcula quais dias da semana o aluno estuda
 */
const calcularDiasDisponiveis = (diasPorSemana) => {
  // Prioridade: Seg, Ter, Qua, Qui, Sex, Sáb, Dom
  const ordem = [1, 2, 3, 4, 5, 6, 0];
  return ordem.slice(0, diasPorSemana);
};

/**
 * Formata Date para "YYYY-MM-DD"
 */
const formatarData = (data) => {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
};

/**
 * Formata "YYYY-MM-DD" para "DD/MM/YYYY"
 */
const formatarDataExibicao = (dataString) => {
  const [ano, mes, dia] = dataString.split('-');
  return `${dia}/${mes}/${ano}`;
};

/**
 * Retorna nome do dia da semana
 */
const obterNomeDia = (diaSemana) => {
  const nomes = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  return nomes[diaSemana];
};

/**
 * Converte distribuição em array de metas para salvar
 */
export const converterParaMetas = (
  distribuicao,
  alunoId,
  cursoId,
  mentorId,
  observacoes,
  tipoEstudo
) => {
  const metas = [];
  
  distribuicao.forEach(dia => {
    dia.assuntos.forEach(assunto => {
      metas.push({
        alunoId,
        cursoId,
        disciplinaId: assunto.disciplinaId,
        assuntoId: assunto.id,
        assuntoTitulo: assunto.titulo,
        dataProgramada: dia.data,
        tipoEstudo,
        tempoEstimado: assunto.tempoEstimado,
        observacoes,
        mentorId
      });
    });
  });
  
  return metas;
};