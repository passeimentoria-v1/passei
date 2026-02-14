import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { buscarMetasAluno, buscarMetasPorMes, concluirMeta, desconcluirMeta } from '../../services/metaService';
import { reagendarMetaProximoDiaLivre } from '../../services/reagendamentoService';
import ModalMetaComComentarios from '../../components/ModalMetaComComentarios';

export const MinhasMetas = () => {
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [visualizacao, setVisualizacao] = useState('lista');
  const [metas, setMetas] = useState([]);
  const [metasFiltradas, setMetasFiltradas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState('todas');
  const [metasAtrasadas, setMetasAtrasadas] = useState(0);

  // ✅ NOVOS: Estados para organização de metas
  const [secoesExpandidas, setSecoesExpandidas] = useState({
    atrasadas: true,
    hoje: true,
    amanha: true,
    semana: true,
    futuro: false
  });
  const [limitePorSecao, setLimitePorSecao] = useState({
    atrasadas: 5,
    hoje: 10,
    amanha: 5,
    semana: 5,
    futuro: 5
  });

  // Estados do calendário
  const [mesAtual, setMesAtual] = useState(new Date().getMonth());
  const [anoAtual, setAnoAtual] = useState(new Date().getFullYear());
  const [metasDoMes, setMetasDoMes] = useState([]);

  // Estados do modal
  const [metaSelecionada, setMetaSelecionada] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [reagendando, setReagendando] = useState(false);
  
  // ✅ NOVOS: Estados para modal de dia completo
  const [diaExpandido, setDiaExpandido] = useState(null);
  const [modalDiaAberto, setModalDiaAberto] = useState(false);
  const [metasDoDiaExpandido, setMetasDoDiaExpandido] = useState([]);

  useEffect(() => {
    if (visualizacao === 'lista') {
      carregarMetas();
    } else {
      carregarMetasCalendario();
    }
  }, [visualizacao, mesAtual, anoAtual]);

  useEffect(() => {
    aplicarFiltro();
  }, [filtro, metas]);

  const carregarMetas = async () => {
    setCarregando(true);
    const resultado = await buscarMetasAluno(usuario.uid);

    if (resultado.sucesso) {
      setMetas(resultado.metas);
      contarMetasAtrasadas(resultado.metas);
    }

    setCarregando(false);
  };

  const carregarMetasCalendario = async () => {
    setCarregando(true);
    const resultado = await buscarMetasPorMes(usuario.uid, mesAtual, anoAtual);

    if (resultado.sucesso) {
      setMetasDoMes(resultado.metas);
    }

    setCarregando(false);
  };

  const contarMetasAtrasadas = (todasMetas) => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    let contador = 0;
    todasMetas.forEach((meta) => {
      if (!meta.concluida && meta.dataProgramada) {
        const dataProgramada = meta.dataProgramada.toDate();
        dataProgramada.setHours(0, 0, 0, 0);

        if (dataProgramada < hoje) {
          contador++;
        }
      }
    });

    setMetasAtrasadas(contador);
  };

  const aplicarFiltro = () => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    let filtradas = [...metas];

    if (filtro === 'pendentes') {
      filtradas = filtradas.filter(m => !m.concluida);
    } else if (filtro === 'concluidas') {
      filtradas = filtradas.filter(m => m.concluida);
    } else if (filtro === 'atrasadas') {
      filtradas = filtradas.filter(m => {
        if (m.concluida || !m.dataProgramada) return false;
        const dataProgramada = m.dataProgramada.toDate();
        dataProgramada.setHours(0, 0, 0, 0);
        return dataProgramada < hoje;
      });
    }

    filtradas.sort((a, b) => {
      if (!a.dataProgramada) return 1;
      if (!b.dataProgramada) return -1;
      return a.dataProgramada.toDate() - b.dataProgramada.toDate();
    });

    setMetasFiltradas(filtradas);
  };

  // ✅ NOVAS: Funções para organização
  const toggleSecao = (secao) => {
    setSecoesExpandidas(prev => ({
      ...prev,
      [secao]: !prev[secao]
    }));
  };

  const verMais = (secao) => {
    setLimitePorSecao(prev => ({
      ...prev,
      [secao]: prev[secao] + 10
    }));
  };

  const agruparMetasPorPeriodo = (metas) => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);
    
    const fimSemana = new Date(hoje);
    fimSemana.setDate(fimSemana.getDate() + 7);

    const grupos = {
      atrasadas: [],
      hoje: [],
      amanha: [],
      semana: [],
      futuro: []
    };

    metas.forEach(meta => {
      const dataMeta = meta.dataProgramada.toDate();
      dataMeta.setHours(0, 0, 0, 0);

      if (!meta.concluida && dataMeta < hoje) {
        grupos.atrasadas.push(meta);
      } else if (dataMeta.getTime() === hoje.getTime()) {
        grupos.hoje.push(meta);
      } else if (dataMeta.getTime() === amanha.getTime()) {
        grupos.amanha.push(meta);
      } else if (dataMeta > amanha && dataMeta <= fimSemana) {
        grupos.semana.push(meta);
      } else {
        grupos.futuro.push(meta);
      }
    });

    // Ordenar cada grupo por data
    Object.keys(grupos).forEach(chave => {
      grupos[chave].sort((a, b) => {
        const dataA = a.dataProgramada.toDate();
        const dataB = b.dataProgramada.toDate();
        return dataA - dataB;
      });
    });

    return grupos;
  };

  const handleConcluir = async (metaId) => {
    const resultado = await concluirMeta(metaId);
    
    if (resultado.sucesso) {
      if (visualizacao === 'lista') {
        carregarMetas();
      } else {
        carregarMetasCalendario();
        setModalAberto(false);
      }
    }
  };

  const handleDesconcluir = async (metaId) => {
    const resultado = await desconcluirMeta(metaId);
    
    if (resultado.sucesso) {
      if (visualizacao === 'lista') {
        carregarMetas();
      } else {
        carregarMetasCalendario();
        setModalAberto(false);
      }
    }
  };

  // ✅ NOVA: Reagendar meta (para usar na lista e calendário)
  const handleReagendar = async (metaId, event) => {
    if (event) event.stopPropagation();
    
    const confirmacao = window.confirm(
      '⏰ Precisa de mais tempo?\n\n' +
      'A meta será reagendada para o próximo dia livre.'
    );
    
    if (!confirmacao) return;
    
    setReagendando(true);
    
    const resultado = await reagendarMetaProximoDiaLivre(metaId, usuario.uid);
    
    if (resultado.sucesso) {
      const novaData = resultado.novaData.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        weekday: 'long'
      });
      
      alert(
        `✅ Reagendada!\n\n` +
        `Nova data: ${novaData}\n` +
        `Espaço: ${Math.floor(resultado.espacoDisponivel / 60)}h`
      );
      
      if (visualizacao === 'lista') {
        carregarMetas();
      } else {
        carregarMetasCalendario();
      }
    } else {
      alert('❌ Erro: ' + resultado.erro);
    }
    
    setReagendando(false);
  };

  const abrirModal = (meta) => {
    setMetaSelecionada(meta);
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setMetaSelecionada(null);
    if (visualizacao === 'lista') {
      carregarMetas();
    } else {
      carregarMetasCalendario();
    }
  };

  const formatarData = (timestamp) => {
    if (!timestamp) return '';
    const data = timestamp.toDate();
    return data.toLocaleDateString('pt-BR');
  };

  const formatarDataCompleta = (timestamp) => {
    if (!timestamp) return '';
    const data = timestamp.toDate();
    return data.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const verificarAtrasada = (meta) => {
    if (meta.concluida || !meta.dataProgramada) return false;
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataProgramada = meta.dataProgramada.toDate();
    dataProgramada.setHours(0, 0, 0, 0);
    
    return dataProgramada < hoje;
  };

  const mesAnterior = () => {
    if (mesAtual === 0) {
      setMesAtual(11);
      setAnoAtual(anoAtual - 1);
    } else {
      setMesAtual(mesAtual - 1);
    }
  };

  const proximoMes = () => {
    if (mesAtual === 11) {
      setMesAtual(0);
      setAnoAtual(anoAtual + 1);
    } else {
      setMesAtual(mesAtual + 1);
    }
  };

  const getNomeMes = () => {
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                   'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    return meses[mesAtual];
  };

  const getDiasDoMes = () => {
    const primeiroDia = new Date(anoAtual, mesAtual, 1);
    const ultimoDia = new Date(anoAtual, mesAtual + 1, 0);
    const diasNoMes = ultimoDia.getDate();
    const diaSemanaInicio = primeiroDia.getDay();

    const dias = [];
    
    for (let i = 0; i < diaSemanaInicio; i++) {
      dias.push(null);
    }
    
    for (let dia = 1; dia <= diasNoMes; dia++) {
      dias.push(dia);
    }

    return dias;
  };

  const getMetasDoDia = (dia) => {
    if (!dia) return [];
    
    return metasDoMes.filter(meta => {
      if (!meta.dataProgramada) return false;
      const dataMeta = meta.dataProgramada.toDate();
      return dataMeta.getDate() === dia &&
             dataMeta.getMonth() === mesAtual &&
             dataMeta.getFullYear() === anoAtual;
    });
  };

  const ehHoje = (dia) => {
    if (!dia) return false;
    const hoje = new Date();
    return dia === hoje.getDate() &&
           mesAtual === hoje.getMonth() &&
           anoAtual === hoje.getFullYear();
  };

  // ✅ NOVAS: Funções para modal de dia completo
  const abrirModalDia = (dia, event) => {
    if (event) event.stopPropagation();
    const metas = getMetasDoDia(dia);
    setDiaExpandido(dia);
    setMetasDoDiaExpandido(metas);
    setModalDiaAberto(true);
  };

  const fecharModalDia = () => {
    setModalDiaAberto(false);
    setDiaExpandido(null);
    setMetasDoDiaExpandido([]);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="flex items-center justify-between px-4 py-4 mx-auto max-w-7xl">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/aluno/dashboard')}
              className="text-gray-600 hover:text-gray-800"
            >
              ← Voltar
            </button>
            <h1 className="text-2xl font-bold text-blue-600">Minhas Metas</h1>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setVisualizacao('lista')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                visualizacao === 'lista'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              📋 Lista
            </button>
            <button
              onClick={() => setVisualizacao('calendario')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                visualizacao === 'calendario'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              📅 Calendário
            </button>
          </div>
        </div>
      </header>

      <div className="px-4 py-8 mx-auto max-w-7xl">
        {/* Alerta de metas atrasadas */}
        {metasAtrasadas > 0 && visualizacao === 'lista' && (
          <div className="p-4 mb-6 border border-red-200 rounded-lg bg-red-50">
            <p className="font-medium text-red-800">
              🚨 Você tem <strong>{metasAtrasadas}</strong> meta{metasAtrasadas > 1 ? 's' : ''} atrasada{metasAtrasadas > 1 ? 's' : ''}!
            </p>
          </div>
        )}

        {/* VISUALIZAÇÃO LISTA */}
        {visualizacao === 'lista' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-xl font-semibold text-gray-800">Todas as Metas</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFiltro('todas')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      filtro === 'todas'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Todas
                  </button>
                  <button
                    onClick={() => setFiltro('pendentes')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      filtro === 'pendentes'
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Pendentes
                  </button>
                  <button
                    onClick={() => setFiltro('concluidas')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      filtro === 'concluidas'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Concluídas
                  </button>
                  <button
                    onClick={() => setFiltro('atrasadas')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      filtro === 'atrasadas'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Atrasadas
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              {carregando ? (
                <div className="py-8 text-center">
                  <div className="w-12 h-12 mx-auto border-b-2 border-blue-600 rounded-full animate-spin"></div>
                  <p className="mt-4 text-gray-600">Carregando...</p>
                </div>
              ) : metasFiltradas.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-gray-600">Nenhuma meta encontrada</p>
                </div>
              ) : (
                <div>
                  {(() => {
                    const grupos = agruparMetasPorPeriodo(metasFiltradas);
                    
                    // Componente de renderização de seção
                    const RenderSecao = ({ titulo, icone, metas, secao, cor }) => {
                      if (metas.length === 0) return null;

                      const expandida = secoesExpandidas[secao];
                      const limite = limitePorSecao[secao];
                      const metasVisiveis = metas.slice(0, limite);
                      const temMais = metas.length > limite;

                      return (
                        <div className="mb-4">
                          {/* Header da Seção */}
                          <button
                            onClick={() => toggleSecao(secao)}
                            className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition ${
                              cor === 'red' ? 'bg-red-50 border-red-200 hover:bg-red-100' :
                              cor === 'blue' ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' :
                              cor === 'orange' ? 'bg-orange-50 border-orange-200 hover:bg-orange-100' :
                              cor === 'purple' ? 'bg-purple-50 border-purple-200 hover:bg-purple-100' :
                              'bg-gray-50 border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{icone}</span>
                              <div className="text-left">
                                <h3 className={`font-semibold ${
                                  cor === 'red' ? 'text-red-800' :
                                  cor === 'blue' ? 'text-blue-800' :
                                  cor === 'orange' ? 'text-orange-800' :
                                  cor === 'purple' ? 'text-purple-800' :
                                  'text-gray-800'
                                }`}>
                                  {titulo}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {metas.filter(m => !m.concluida).length} pendentes • {metas.filter(m => m.concluida).length} concluídas
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                cor === 'red' ? 'bg-red-200 text-red-800' :
                                cor === 'blue' ? 'bg-blue-200 text-blue-800' :
                                cor === 'orange' ? 'bg-orange-200 text-orange-800' :
                                cor === 'purple' ? 'bg-purple-200 text-purple-800' :
                                'bg-gray-200 text-gray-800'
                              }`}>
                                {metas.length}
                              </span>
                              <svg 
                                className={`w-5 h-5 transition-transform ${expandida ? 'rotate-180' : ''}`}
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </button>

                          {/* Lista de Metas */}
                          {expandida && (
                            <div className="mt-2 space-y-2">
                              {metasVisiveis.map(meta => {
                                const atrasada = verificarAtrasada(meta);

                                return (
                                  <div
                                    key={meta.id}
                                    onClick={() => abrirModal(meta)}
                                    className={`border rounded-lg p-4 transition cursor-pointer ${
                                      meta.concluida
                                        ? 'bg-green-50 border-green-200'
                                        : atrasada
                                        ? 'bg-red-50 border-red-200'
                                        : 'bg-white border-gray-200 hover:shadow-md'
                                    }`}
                                  >
                                    <div className="flex items-start gap-3">
                                      {/* ✅ Indicador visual (não clicável) */}
                                      <div className="flex-shrink-0 mt-1">
                                        {meta.concluida ? (
                                          <span className="flex items-center justify-center w-5 h-5 text-white bg-green-600 rounded-full">
                                            ✓
                                          </span>
                                        ) : (
                                          <span className="flex items-center justify-center w-5 h-5 border-2 border-gray-400 rounded-full">
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex-1">
                                        <p className={`font-medium ${
                                          meta.concluida ? 'text-green-700 line-through' : 'text-gray-800'
                                        }`}>
                                          {meta.assuntoTitulo || meta.assuntoId}
                                        </p>
                                        <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-600">
                                          <span>📅 {formatarData(meta.dataProgramada)}</span>
                                          <span>⏱ {meta.tempoEstimado} min</span>
                                          <span className="capitalize">📚 {meta.tipoEstudo}</span>
                                        </div>
                                        {meta.observacoes && (
                                          <p className="mt-2 text-sm text-gray-600">{meta.observacoes}</p>
                                        )}
                                      </div>
                                      {/* ✅ NOVO: Botão Reagendar */}
                                      {!meta.concluida && (
                                        <button
                                          onClick={(e) => handleReagendar(meta.id, e)}
                                          disabled={reagendando}
                                          className="px-3 py-1.5 text-xs font-semibold text-white transition bg-orange-600 rounded-lg hover:bg-orange-700 disabled:bg-gray-400"
                                        >
                                          ⏰
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}

                              {/* Botão Ver Mais */}
                              {temMais && (
                                <button
                                  onClick={() => verMais(secao)}
                                  className="w-full py-2 text-sm font-medium text-blue-600 transition border border-blue-200 rounded-lg hover:bg-blue-50"
                                >
                                  Ver mais {metas.length - limite} metas ▼
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    };
                    
                    return (
                      <>
                        <RenderSecao 
                          titulo="🚨 Atrasadas"
                          icone="🔴"
                          metas={grupos.atrasadas}
                          secao="atrasadas"
                          cor="red"
                        />
                        
                        <RenderSecao 
                          titulo="⚡ Hoje"
                          icone="📍"
                          metas={grupos.hoje}
                          secao="hoje"
                          cor="blue"
                        />
                        
                        <RenderSecao 
                          titulo="📅 Amanhã"
                          icone="➡️"
                          metas={grupos.amanha}
                          secao="amanha"
                          cor="orange"
                        />
                        
                        <RenderSecao 
                          titulo="📆 Esta Semana"
                          icone="📊"
                          metas={grupos.semana}
                          secao="semana"
                          cor="purple"
                        />
                        
                        <RenderSecao 
                          titulo="🔮 Futuro"
                          icone="🗓️"
                          metas={grupos.futuro}
                          secao="futuro"
                          cor="gray"
                        />
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        )}

        {/* VISUALIZAÇÃO CALENDÁRIO */}
        {visualizacao === 'calendario' && (
          <div className="bg-white rounded-lg shadow">
            {/* Navegação do Calendário */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <button
                onClick={mesAnterior}
                className="p-2 text-gray-600 transition rounded-lg hover:bg-gray-100"
              >
                ←
              </button>
              <h2 className="text-xl font-semibold text-gray-800">
                {getNomeMes()} {anoAtual}
              </h2>
              <button
                onClick={proximoMes}
                className="p-2 text-gray-600 transition rounded-lg hover:bg-gray-100"
              >
                →
              </button>
            </div>

            {/* Grid do Calendário */}
            <div className="p-6">
              {carregando ? (
                <div className="py-8 text-center">
                  <div className="w-12 h-12 mx-auto border-b-2 border-blue-600 rounded-full animate-spin"></div>
                  <p className="mt-4 text-gray-600">Carregando...</p>
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-2">
                  {/* Cabeçalho dos dias da semana */}
                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(dia => (
                    <div key={dia} className="py-2 text-sm font-semibold text-center text-gray-600">
                      {dia}
                    </div>
                  ))}

                  {/* Dias do mês */}
                  {getDiasDoMes().map((dia, index) => {
                    const metasDoDia = getMetasDoDia(dia);
                    const isHoje = ehHoje(dia);

                    return (
                      <div
                        key={index}
                        className={`min-h-[120px] p-2 border rounded-lg ${
                          !dia
                            ? 'bg-gray-50'
                            : isHoje
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 bg-white hover:shadow-md transition'
                        }`}
                      >
                        {dia && (
                          <>
                            <div className={`text-sm font-semibold mb-1 ${
                              isHoje ? 'text-blue-600' : 'text-gray-700'
                            }`}>
                              {dia}
                            </div>
                            
                            {/* Metas do dia */}
                            <div className="space-y-1">
                              {metasDoDia.slice(0, 3).map(meta => (
                                <div
                                  key={meta.id}
                                  onClick={() => abrirModal(meta)}
                                  className={`text-xs p-1.5 rounded cursor-pointer ${
                                    meta.concluida
                                      ? 'bg-green-100 text-green-700 line-through'
                                      : verificarAtrasada(meta)
                                      ? 'bg-red-100 text-red-700'
                                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="flex-1 truncate">
                                      {meta.assuntoTitulo || meta.assuntoId}
                                    </span>
                                    {/* ✅ NOVO: Ícone de reagendar no calendário */}
                                    {!meta.concluida && (
                                      <button
                                        onClick={(e) => handleReagendar(meta.id, e)}
                                        className="flex-shrink-0 transition hover:scale-125"
                                        title="Reagendar"
                                      >
                                        ⏰
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                              {metasDoDia.length > 3 && (
                                <button
                                  onClick={(e) => abrirModalDia(dia, e)}
                                  className="w-full py-1 mt-1 text-xs font-medium text-blue-600 transition rounded hover:bg-blue-100 hover:text-blue-700"
                                >
                                  +{metasDoDia.length - 3} metas
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ✅ NOVO: Modal de Metas do Dia Completo */}
      {modalDiaAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800">
                📅 Metas do dia {diaExpandido} de {getNomeMes()}
              </h3>
              <button
                onClick={fecharModalDia}
                className="text-2xl leading-none text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            {/* Lista de Metas */}
            <div className="p-6 space-y-3">
              {metasDoDiaExpandido.length === 0 ? (
                <p className="text-center text-gray-500">Nenhuma meta neste dia</p>
              ) : (
                metasDoDiaExpandido.map(meta => {
                  const atrasada = verificarAtrasada(meta);
                  
                  return (
                    <div
                      key={meta.id}
                      className={`border rounded-lg p-4 ${
                        meta.concluida
                          ? 'bg-green-50 border-green-200'
                          : atrasada
                          ? 'bg-red-50 border-red-200'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* ✅ Indicador visual (não clicável) */}
                        <div className="flex-shrink-0 mt-1">
                          {meta.concluida ? (
                            <span className="flex items-center justify-center w-5 h-5 text-white bg-green-600 rounded-full">
                              ✓
                            </span>
                          ) : (
                            <span className="flex items-center justify-center w-5 h-5 border-2 border-gray-400 rounded-full">
                            </span>
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <p className={`font-medium ${
                            meta.concluida ? 'text-green-700 line-through' : 'text-gray-800'
                          }`}>
                            {meta.assuntoTitulo || meta.assuntoId}
                          </p>
                          <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-600">
                            <span>📅 {formatarData(meta.dataProgramada)}</span>
                            <span>⏱ {meta.tempoEstimado} min</span>
                            <span className="capitalize">📚 {meta.tipoEstudo}</span>
                          </div>
                          {meta.observacoes && (
                            <p className="mt-2 text-sm text-gray-600">{meta.observacoes}</p>
                          )}
                        </div>

                        <div className="flex flex-col gap-2">
                          {/* Botão Ver Detalhes */}
                          <button
                            onClick={() => {
                              fecharModalDia();
                              abrirModal(meta);
                            }}
                            className="px-3 py-1.5 text-xs font-semibold text-white transition bg-blue-600 rounded-lg hover:bg-blue-700"
                            title="Ver detalhes e comentários"
                          >
                            👁️ Ver
                          </button>
                          
                          {/* Botão Reagendar */}
                          {!meta.concluida && (
                            <button
                              onClick={(e) => {
                                fecharModalDia();
                                handleReagendar(meta.id, e);
                              }}
                              disabled={reagendando}
                              className="px-3 py-1.5 text-xs font-semibold text-white transition bg-orange-600 rounded-lg hover:bg-orange-700 disabled:bg-gray-400"
                              title="Preciso de mais tempo"
                            >
                              ⏰
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer com Estatísticas */}
            <div className="sticky bottom-0 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-gray-700">
                  Total: {metasDoDiaExpandido.length} metas
                </span>
                <div className="flex gap-4">
                  <span className="text-green-600">
                    ✅ {metasDoDiaExpandido.filter(m => m.concluida).length} concluídas
                  </span>
                  <span className="text-orange-600">
                    ⏳ {metasDoDiaExpandido.filter(m => !m.concluida).length} pendentes
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {modalAberto && metaSelecionada && (
        <ModalMetaComComentarios
          meta={metaSelecionada}
          onClose={fecharModal}
          onAtualizar={fecharModal}
        />
      )}
    </div>
  );
};

export default MinhasMetas;