import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  buscarMetasAluno, 
  concluirMeta, 
  desconcluirMeta,
  calcularEstatisticasMetas 
} from '../../services/metaService';
import {
  buscarRegistrosAluno,
  calcularEstatisticasQuestoes
} from '../../services/questoesService';
import {
  buscarEstatisticasFlashcards
} from '../../services/flashcardService';
import ModalMetaComComentarios from '../../components/ModalMetaComComentarios';

export const AlunoDashboard = () => {
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();

  const [metas, setMetas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState('todas');
  const [metaSelecionada, setMetaSelecionada] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  
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
  
  const [statsMetas, setStatsMetas] = useState({
    total: 0,
    concluidas: 0,
    pendentes: 0,
    atrasadas: 0,
    hoje: 0,
    percentual: 0
  });
  const [statsQuestoes, setStatsQuestoes] = useState({
    totalQuestoes: 0,
    mediaAcerto: 0,
    totalRegistros: 0
  });
  const [statsFlashcards, setStatsFlashcards] = useState({
    total: 0,
    paraRevisar: 0,
    revisados: 0,
    novos: 0
  });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setCarregando(true);

    // Carregar metas
    const resultadoMetas = await buscarMetasAluno(usuario.uid);
    if (resultadoMetas.sucesso) {
      setMetas(resultadoMetas.metas);
      const estatisticasMetas = calcularEstatisticasMetas(resultadoMetas.metas);
      setStatsMetas(estatisticasMetas);
    }

    // Carregar questões
    const resultadoQuestoes = await buscarRegistrosAluno(usuario.uid, 100);
    if (resultadoQuestoes.sucesso) {
      const estatisticasQuestoes = calcularEstatisticasQuestoes(resultadoQuestoes.registros);
      setStatsQuestoes(estatisticasQuestoes);
    }

    // Carregar flashcards
    const resultadoFlashcards = await buscarEstatisticasFlashcards(usuario.uid);
    if (resultadoFlashcards.sucesso) {
      setStatsFlashcards(resultadoFlashcards.estatisticas);
    }

    setCarregando(false);
  };

  const handleToggleMeta = async (metaId, concluida, event) => {
    // Previne que o click do checkbox abra o modal
    event.stopPropagation();
    
    const resultado = concluida 
      ? await desconcluirMeta(metaId) 
      : await concluirMeta(metaId);

    if (resultado.sucesso) {
      carregarDados();
    }
  };

  const handleAbrirModal = (meta) => {
    setMetaSelecionada(meta);
    setMostrarModal(true);
  };

  const handleFecharModal = () => {
    setMostrarModal(false);
    setMetaSelecionada(null);
    carregarDados();
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // ✅ NOVAS: Funções para organização de metas
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

    // ✅ NOVO: Ordenar cada grupo por data (mais recente primeiro)
    Object.keys(grupos).forEach(chave => {
      grupos[chave].sort((a, b) => {
        const dataA = a.dataProgramada.toDate();
        const dataB = b.dataProgramada.toDate();
        return dataA - dataB; // Crescente (mais próximo primeiro)
      });
    });

    return grupos;
  };

  const formatarData = (timestamp) => {
    if (!timestamp) return '';
    const data = timestamp.toDate();
    return data.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'short',
      year: 'numeric'
    });
  };

  const metasFiltradas = metas.filter(meta => {
    if (filtro === 'pendentes') return !meta.concluida;
    if (filtro === 'concluidas') return meta.concluida;
    return true;
  });

  const metasHoje = metas.filter(meta => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataMeta = meta.dataProgramada.toDate();
    dataMeta.setHours(0, 0, 0, 0);
    return dataMeta.getTime() === hoje.getTime();
  });

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="flex items-center justify-between px-4 py-4 mx-auto max-w-7xl">
          {/* ESQUERDA */}
          <div>
            <h1 className="text-2xl font-bold text-blue-600">Passar - Aluno</h1>
            <p className="text-sm text-gray-600">Bem-vindo, {usuario.nome}</p>
          </div>

          {/* DIREITA: [⚙][Sair] colado à direita */}
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => navigate("/aluno/configuracoes")}
              className="p-2 text-gray-400 transition rounded-lg hover:text-gray-600 hover:bg-gray-100"
              title="Configurações"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            <button
              onClick={handleLogout}
              className="px-4 py-2 text-white transition bg-red-500 rounded-lg hover:bg-red-600"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="px-4 py-8 mx-auto max-w-7xl">
        {/* Botões de Ação */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={() => navigate('/aluno/registrar-questoes')}
            className="inline-flex items-center gap-2 px-6 py-3 font-semibold text-white transition bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <span>📝</span>
            <span>Registrar Questões</span>
          </button>
          <button
            onClick={() => navigate('/aluno/questoes')}
            className="inline-flex items-center gap-2 px-6 py-3 font-semibold text-white transition bg-purple-600 rounded-lg hover:bg-purple-700"
          >
            <span>📊</span>
            <span>Ver Histórico</span>
          </button>
         <button
            onClick={() => navigate('/aluno/flashcards')}
            className="inline-flex items-center gap-2 px-6 py-3 font-semibold text-white transition bg-indigo-600 rounded-lg hover:bg-indigo-700"
          >
            <span>🎴</span>
            <span>Flashcards</span>
          </button>
          <button
            onClick={() => navigate('/aluno/relatorios')}
            className="inline-flex items-center gap-2 px-6 py-3 font-semibold text-white transition bg-green-600 rounded-lg hover:bg-green-700"
          >
            <span>📊</span>
            <span>Ver Relatórios</span>
          </button>
          <Link
            to="/aluno/metas"
            className="inline-flex items-center gap-2 px-6 py-3 font-semibold text-white transition bg-purple-600 rounded-lg hover:bg-purple-700"
          >
            <span>🎯</span>
            <span>Minhas Metas</span>
          </Link>
          <Link
            to="/aluno/configuracoes-estudo"
            className="inline-flex items-center gap-2 px-6 py-3 font-semibold text-white transition bg-orange-600 rounded-lg hover:bg-orange-700"
          >
            <span>⚙️</span>
            <span>Configurar Estudo</span>
          </Link>
          <button 
            onClick={() => navigate(`/aluno/otimizar-cronograma`)}
            className="inline-flex items-center gap-2 px-6 py-3 font-semibold text-white transition bg-purple-600 rounded-lg hover:bg-purple-700"
          >
            <span>🔄</span>
            <span>Otimizar Cronograma</span>
          </button>
          {statsFlashcards.paraRevisar > 0 && (
            <button
              onClick={() => navigate('/aluno/flashcards/revisar')}
              className="inline-flex items-center gap-2 px-6 py-3 font-semibold text-white transition bg-orange-600 rounded-lg hover:bg-orange-700 animate-pulse"
            >
              <span>🔥</span>
              <span>Revisar Agora ({statsFlashcards.paraRevisar})</span>
            </button>
          )}
        </div>

        {/* Cards de Estatísticas - Metas */}
        <div className="mb-4">
          <h2 className="mb-3 text-lg font-semibold text-gray-700">📅 Metas</h2>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="p-4 bg-white rounded-lg shadow">
              <p className="text-sm text-gray-600">Total</p>
              <p className="mt-1 text-3xl font-bold text-gray-800">{statsMetas.total}</p>
            </div>

            <div className="p-4 bg-white rounded-lg shadow">
              <p className="text-sm text-gray-600">Concluídas</p>
              <p className="mt-1 text-3xl font-bold text-green-600">{statsMetas.concluidas}</p>
            </div>

            <div className="p-4 bg-white rounded-lg shadow">
              <p className="text-sm text-gray-600">Pendentes</p>
              <p className="mt-1 text-3xl font-bold text-orange-600">{statsMetas.pendentes}</p>
            </div>

            <div className="p-4 bg-white rounded-lg shadow">
              <p className="text-sm text-gray-600">Progresso</p>
              <p className="mt-1 text-3xl font-bold text-blue-600">{statsMetas.percentual}%</p>
            </div>
          </div>
        </div>

        {/* Cards de Estatísticas - Questões */}
        <div className="mb-4">
          <h2 className="mb-3 text-lg font-semibold text-gray-700">📝 Questões</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 bg-white rounded-lg shadow">
              <p className="text-sm text-gray-600">Total de Questões</p>
              <p className="mt-1 text-3xl font-bold text-gray-800">{statsQuestoes.totalQuestoes}</p>
            </div>

            <div className="p-4 bg-white rounded-lg shadow">
              <p className="text-sm text-gray-600">Média de Acerto</p>
              <p className="mt-1 text-3xl font-bold text-blue-600">{statsQuestoes.mediaAcerto}%</p>
            </div>

            <div className="p-4 bg-white rounded-lg shadow">
              <p className="text-sm text-gray-600">Registros</p>
              <p className="mt-1 text-3xl font-bold text-purple-600">{statsQuestoes.totalRegistros}</p>
            </div>
          </div>
        </div>

        {/* Cards de Estatísticas - Flashcards */}
        <div className="mb-6">
          <h2 className="mb-3 text-lg font-semibold text-gray-700">🎴 Flashcards</h2>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="p-4 bg-white rounded-lg shadow">
              <p className="text-sm text-gray-600">Total</p>
              <p className="mt-1 text-3xl font-bold text-gray-800">{statsFlashcards.total}</p>
            </div>

            <div className="p-4 bg-white rounded-lg shadow">
              <p className="text-sm text-gray-600">Para Revisar Hoje</p>
              <p className="mt-1 text-3xl font-bold text-orange-600">{statsFlashcards.paraRevisar}</p>
            </div>

            <div className="p-4 bg-white rounded-lg shadow">
              <p className="text-sm text-gray-600">Já Revisados</p>
              <p className="mt-1 text-3xl font-bold text-green-600">{statsFlashcards.revisados}</p>
            </div>

            <div className="p-4 bg-white rounded-lg shadow">
              <p className="text-sm text-gray-600">Novos</p>
              <p className="mt-1 text-3xl font-bold text-indigo-600">{statsFlashcards.novos}</p>
            </div>
          </div>
        </div>

        {/* Alerta de Metas Atrasadas */}
        {statsMetas.atrasadas > 0 && (
          <div className="p-4 mb-6 border border-red-200 rounded-lg bg-red-50">
            <p className="font-medium text-red-800">
              🚨 Você tem <strong>{statsMetas.atrasadas}</strong> meta{statsMetas.atrasadas > 1 ? 's' : ''} atrasada{statsMetas.atrasadas > 1 ? 's' : ''}!
            </p>
          </div>
        )}

        {/* Metas de Hoje */}
        {metasHoje.length > 0 && (
          <div className="p-4 mb-6 border border-blue-200 rounded-lg bg-blue-50">
            <h3 className="mb-3 font-semibold text-blue-800">📅 Metas de Hoje ({metasHoje.length})</h3>
            <div className="space-y-2">
              {metasHoje.map(meta => (
                <div 
                  key={meta.id} 
                  className="flex items-center gap-3 p-3 transition bg-white rounded-lg cursor-pointer hover:shadow-md"
                  onClick={() => handleAbrirModal(meta)}
                >
                  {/* ✅ Indicador visual (não clicável) */}
                  <div className="flex-shrink-0">
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
                    <span className={`${meta.concluida ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                      {meta.assuntoTitulo || meta.assuntoId}
                    </span>
                    <span className="ml-2 text-sm text-gray-500">
                      ({meta.tempoEstimado} min - {meta.tipoEstudo})
                    </span>
                  </div>
                  {meta.status && meta.status !== 'Pendente' && (
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      meta.status === 'Com dúvida' ? 'bg-yellow-100 text-yellow-700' :
                      meta.status === 'Em andamento' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {meta.status === 'Com dúvida' && '❓'}
                      {meta.status === 'Em andamento' && '🔄'}
                      {' '}{meta.status}
                    </span>
                  )}
                  {meta.concluida && (
                    <span className="font-bold text-green-600">✓</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filtros e Lista de Metas ORGANIZADA */}
        <div className="mb-6 bg-white rounded-lg shadow">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Minhas Metas</h2>
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
                  
                  // ✅ Componente de renderização de seção
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
                              const hoje = new Date();
                              hoje.setHours(0, 0, 0, 0);
                              const dataMeta = meta.dataProgramada.toDate();
                              dataMeta.setHours(0, 0, 0, 0);
                              const atrasada = !meta.concluida && dataMeta < hoje;

                              return (
                                <div
                                  key={meta.id}
                                  onClick={() => handleAbrirModal(meta)}
                                  className={`border rounded-lg p-3 transition cursor-pointer ${
                                    meta.concluida
                                      ? 'bg-green-50 border-green-200'
                                      : atrasada
                                      ? 'bg-red-50 border-red-200'
                                      : 'bg-white border-gray-200 hover:shadow-md'
                                  }`}
                                >
                                  <div className="flex items-start gap-3">
                                    {/* ✅ Indicador visual (não clicável) */}
                                    <div className="flex-shrink-0 mt-0.5">
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
                                      <p className={`font-medium text-sm ${
                                        meta.concluida ? 'text-green-700 line-through' : 'text-gray-800'
                                      }`}>
                                        {meta.assuntoTitulo || meta.assuntoId}
                                      </p>
                                      <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-600">
                                        <span className="flex items-center gap-1">
                                          📅 {formatarData(meta.dataProgramada)}
                                        </span>
                                        <span className="flex items-center gap-1">
                                          ⏱ {meta.tempoEstimado} min
                                        </span>
                                        <span className="flex items-center gap-1 capitalize">
                                          📚 {meta.tipoEstudo}
                                        </span>
                                      </div>
                                    </div>
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
      </div>

      {/* Modal */}
      {mostrarModal && metaSelecionada && (
        <ModalMetaComComentarios
          meta={metaSelecionada}
          onClose={handleFecharModal}
        />
      )}
    </div>
  );
};

export default AlunoDashboard;