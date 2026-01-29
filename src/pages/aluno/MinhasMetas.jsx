import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { buscarMetasAluno, buscarMetasPorMes, concluirMeta, desconcluirMeta } from '../../services/metaService';

export const MinhasMetas = () => {
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [visualizacao, setVisualizacao] = useState('lista');
  const [metas, setMetas] = useState([]);
  const [metasFiltradas, setMetasFiltradas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState('todas');
  const [metasAtrasadas, setMetasAtrasadas] = useState(0);

  // Estados do calendário
  const [mesAtual, setMesAtual] = useState(new Date().getMonth());
  const [anoAtual, setAnoAtual] = useState(new Date().getFullYear());
  const [metasDoMes, setMetasDoMes] = useState([]);

  // Estados do modal
  const [metaSelecionada, setMetaSelecionada] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);

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

  const abrirModal = (meta) => {
    setMetaSelecionada(meta);
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setMetaSelecionada(null);
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
              className={`px-4 py-2 rounded-lg transition ${
                visualizacao === 'lista'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              📋 Lista
            </button>
            <button
              onClick={() => setVisualizacao('calendario')}
              className={`px-4 py-2 rounded-lg transition ${
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
        {metasAtrasadas > 0 && visualizacao === 'lista' && (
          <div className="p-4 mb-6 border border-red-200 rounded-lg bg-red-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <h3 className="font-semibold text-red-800">
                    Você tem {metasAtrasadas} meta{metasAtrasadas > 1 ? 's' : ''} atrasada{metasAtrasadas > 1 ? 's' : ''}
                  </h3>
                  <p className="text-sm text-red-600">
                    Reprograme suas metas para voltar ao ritmo!
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/aluno/reprogramar-metas')}
                className="px-4 py-2 font-medium text-white transition bg-red-600 rounded-lg hover:bg-red-700"
              >
                📅 Reprogramar Metas
              </button>
            </div>
          </div>
        )}

        {/* VISUALIZAÇÃO LISTA */}
        {visualizacao === 'lista' && (
          <>
            <div className="grid gap-4 mb-6 md:grid-cols-4">
              <div className="p-4 bg-white rounded-lg shadow">
                <p className="text-sm text-gray-600">Total de Metas</p>
                <p className="mt-1 text-3xl font-bold text-gray-800">{metas.length}</p>
              </div>

              <div className="p-4 bg-white rounded-lg shadow">
                <p className="text-sm text-gray-600">Pendentes</p>
                <p className="mt-1 text-3xl font-bold text-blue-600">
                  {metas.filter(m => !m.concluida).length}
                </p>
              </div>

              <div className="p-4 bg-white rounded-lg shadow">
                <p className="text-sm text-gray-600">Concluídas</p>
                <p className="mt-1 text-3xl font-bold text-green-600">
                  {metas.filter(m => m.concluida).length}
                </p>
              </div>

              <div className="p-4 bg-white rounded-lg shadow">
                <p className="text-sm text-gray-600">Atrasadas</p>
                <p className="mt-1 text-3xl font-bold text-red-600">{metasAtrasadas}</p>
              </div>
            </div>

            <div className="p-4 mb-6 bg-white rounded-lg shadow">
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
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Pendentes
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
              </div>
            </div>

            {carregando ? (
              <div className="p-8 bg-white rounded-lg shadow">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto border-b-2 border-blue-600 rounded-full animate-spin"></div>
                  <p className="mt-4 text-gray-600">Carregando metas...</p>
                </div>
              </div>
            ) : metasFiltradas.length === 0 ? (
              <div className="p-8 bg-white rounded-lg shadow">
                <p className="text-center text-gray-600">Nenhuma meta encontrada neste filtro</p>
              </div>
            ) : (
              <div className="space-y-4">
                {metasFiltradas.map((meta) => {
                  const atrasada = verificarAtrasada(meta);

                  return (
                    <div
                      key={meta.id}
                      className={`bg-white rounded-lg shadow p-6 ${
                        atrasada ? 'border-l-4 border-red-500' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-800">
                              {meta.assuntoTitulo}
                            </h3>
                            {atrasada && (
                              <span className="px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-full">
                                Atrasada
                              </span>
                            )}
                            {meta.concluida && (
                              <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                                ✓ Concluída
                              </span>
                            )}
                          </div>

                          {meta.observacoes && (
                            <p className="mb-3 text-sm text-gray-600">{meta.observacoes}</p>
                          )}

                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div>
                              <span>📅 Data: </span>
                              <span className="font-medium">{formatarData(meta.dataProgramada)}</span>
                            </div>
                            {meta.tipoEstudo && (
                              <div>
                                <span>📚 Tipo: </span>
                                <span>{meta.tipoEstudo}</span>
                              </div>
                            )}
                            {meta.tempoEstimado > 0 && (
                              <div>
                                <span>⏱️ Tempo: </span>
                                <span>{meta.tempoEstimado}h</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {!meta.concluida ? (
                          <button
                            onClick={() => handleConcluir(meta.id)}
                            className="px-4 py-2 text-sm text-white transition bg-green-600 rounded-lg hover:bg-green-700"
                          >
                            ✓ Concluir
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDesconcluir(meta.id)}
                            className="px-4 py-2 text-sm text-white transition bg-gray-400 rounded-lg hover:bg-gray-500"
                          >
                            ↻ Reabrir
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* VISUALIZAÇÃO CALENDÁRIO */}
        {visualizacao === 'calendario' && (
          <div className="p-6 bg-white rounded-lg shadow">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={mesAnterior}
                className="px-4 py-2 transition bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                ← Anterior
              </button>
              <h2 className="text-xl font-bold text-gray-800">
                {getNomeMes()} {anoAtual}
              </h2>
              <button
                onClick={proximoMes}
                className="px-4 py-2 transition bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Próximo →
              </button>
            </div>

            {carregando ? (
              <div className="py-8 text-center">
                <div className="w-12 h-12 mx-auto border-b-2 border-blue-600 rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-600">Carregando calendário...</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(dia => (
                    <div key={dia} className="text-sm font-semibold text-center text-gray-600">
                      {dia}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {getDiasDoMes().map((dia, index) => {
                    const metasDoDia = getMetasDoDia(dia);
                    const hoje = ehHoje(dia);

                    return (
                      <div
                        key={index}
                        className={`min-h-24 p-2 border rounded-lg ${
                          !dia ? 'bg-gray-50' : 'bg-white hover:bg-gray-50'
                        } ${hoje ? 'border-blue-500 border-2' : 'border-gray-200'}`}
                      >
                        {dia && (
                          <>
                            <div className={`text-sm font-semibold mb-1 ${
                              hoje ? 'text-blue-600' : 'text-gray-700'
                            }`}>
                              {dia}
                            </div>
                            <div className="space-y-1">
                              {metasDoDia.map(meta => (
                                <div
                                  key={meta.id}
                                  className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 transition ${
                                    meta.concluida
                                      ? 'bg-green-100 text-green-700'
                                      : verificarAtrasada(meta)
                                      ? 'bg-red-100 text-red-700'
                                      : 'bg-blue-100 text-blue-700'
                                  }`}
                                  onClick={() => abrirModal(meta)}
                                  title={meta.assuntoTitulo}
                                >
                                  {meta.concluida ? '✓ ' : ''}
                                  {meta.assuntoTitulo.substring(0, 15)}
                                  {meta.assuntoTitulo.length > 15 ? '...' : ''}
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-center gap-6 mt-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-100 rounded"></div>
                    <span>Pendente</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-100 rounded"></div>
                    <span>Concluída</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-100 rounded"></div>
                    <span>Atrasada</span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* MODAL DE DETALHES DA META */}
      {modalAberto && metaSelecionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header do Modal */}
            <div className="sticky top-0 flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Detalhes da Meta</h2>
              <button
                onClick={fecharModal}
                className="text-gray-400 transition hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="p-6">
              {/* Status Badge */}
              <div className="flex items-center gap-3 mb-4">
                {metaSelecionada.concluida ? (
                  <span className="px-3 py-1 text-sm font-medium text-green-700 bg-green-100 rounded-full">
                    ✓ Meta Concluída
                  </span>
                ) : verificarAtrasada(metaSelecionada) ? (
                  <span className="px-3 py-1 text-sm font-medium text-red-700 bg-red-100 rounded-full">
                    ⚠️ Meta Atrasada
                  </span>
                ) : (
                  <span className="px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 rounded-full">
                    📋 Meta Pendente
                  </span>
                )}
              </div>

              {/* Título */}
              <h3 className="mb-4 text-2xl font-bold text-gray-800">
                {metaSelecionada.assuntoTitulo}
              </h3>

              {/* Informações */}
              <div className="mb-6 space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">📅</span>
                  <div>
                    <p className="text-sm text-gray-600">Data Programada</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {formatarDataCompleta(metaSelecionada.dataProgramada)}
                    </p>
                  </div>
                </div>

                {metaSelecionada.tipoEstudo && (
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">📚</span>
                    <div>
                      <p className="text-sm text-gray-600">Tipo de Estudo</p>
                      <p className="text-lg font-semibold text-gray-800">
                        {metaSelecionada.tipoEstudo}
                      </p>
                    </div>
                  </div>
                )}

                {metaSelecionada.tempoEstimado > 0 && (
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">⏱️</span>
                    <div>
                      <p className="text-sm text-gray-600">Tempo Estimado</p>
                      <p className="text-lg font-semibold text-gray-800">
                        {metaSelecionada.tempoEstimado} hora{metaSelecionada.tempoEstimado > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                )}

                {metaSelecionada.observacoes && (
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">📝</span>
                    <div>
                      <p className="text-sm text-gray-600">Observações</p>
                      <p className="mt-1 text-gray-800">{metaSelecionada.observacoes}</p>
                    </div>
                  </div>
                )}

                {metaSelecionada.concluida && metaSelecionada.dataConclusao && (
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">✅</span>
                    <div>
                      <p className="text-sm text-gray-600">Data de Conclusão</p>
                      <p className="text-lg font-semibold text-green-600">
                        {formatarDataCompleta(metaSelecionada.dataConclusao)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Botões de Ação */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                {!metaSelecionada.concluida ? (
                  <button
                    onClick={() => handleConcluir(metaSelecionada.id)}
                    className="flex-1 px-6 py-3 font-semibold text-white transition bg-green-600 rounded-lg hover:bg-green-700"
                  >
                    ✓ Marcar como Concluída
                  </button>
                ) : (
                  <button
                    onClick={() => handleDesconcluir(metaSelecionada.id)}
                    className="flex-1 px-6 py-3 font-semibold text-white transition bg-gray-400 rounded-lg hover:bg-gray-500"
                  >
                    ↻ Reabrir Meta
                  </button>
                )}
                <button
                  onClick={fecharModal}
                  className="px-6 py-3 font-semibold text-gray-700 transition bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MinhasMetas;