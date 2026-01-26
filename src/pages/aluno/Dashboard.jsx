import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

export const AlunoDashboard = () => {
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();

  const [metas, setMetas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState('todas');
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

  const handleToggleMeta = async (metaId, concluida) => {
    const resultado = concluida 
      ? await desconcluirMeta(metaId) 
      : await concluirMeta(metaId);

    if (resultado.sucesso) {
      carregarDados();
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
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
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-blue-600">Passei - Aluno</h1>
            <p className="text-sm text-gray-600">Bem-vindo, {usuario.nome}</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          >
            Sair
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Botões de Ação */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={() => navigate('/aluno/registrar-questoes')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition inline-flex items-center gap-2"
          >
            <span>📝</span>
            <span>Registrar Questões</span>
          </button>
          <button
            onClick={() => navigate('/aluno/questoes')}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition inline-flex items-center gap-2"
          >
            <span>📊</span>
            <span>Ver Histórico</span>
          </button>
          <button
            onClick={() => navigate('/aluno/calendario')}
            className="px-6 py-3 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition inline-flex items-center gap-2"
          >
            <span>📅</span>
            <span>Calendário</span>
          </button>
          <button
            onClick={() => navigate('/aluno/flashcards')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition inline-flex items-center gap-2"
          >
            <span>🎴</span>
            <span>Flashcards</span>
          </button>
          {statsFlashcards.paraRevisar > 0 && (
            <button
              onClick={() => navigate('/aluno/flashcards/revisar')}
              className="px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition inline-flex items-center gap-2 animate-pulse"
            >
              <span>🔥</span>
              <span>Revisar Agora ({statsFlashcards.paraRevisar})</span>
            </button>
          
          )}
        </div>

        {/* Cards de Estatísticas - Metas */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">📅 Metas</h2>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{statsMetas.total}</p>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Concluídas</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{statsMetas.concluidas}</p>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Pendentes</p>
              <p className="text-3xl font-bold text-orange-600 mt-1">{statsMetas.pendentes}</p>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Progresso</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{statsMetas.percentual}%</p>
            </div>
          </div>
        </div>

        {/* Cards de Estatísticas - Questões */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">📝 Questões</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Total de Questões</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{statsQuestoes.totalQuestoes}</p>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Média de Acerto</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{statsQuestoes.mediaAcerto}%</p>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Registros</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">{statsQuestoes.totalRegistros}</p>
            </div>
          </div>
        </div>

        {/* Cards de Estatísticas - Flashcards */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">🎴 Flashcards</h2>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{statsFlashcards.total}</p>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Para Revisar Hoje</p>
              <p className="text-3xl font-bold text-orange-600 mt-1">{statsFlashcards.paraRevisar}</p>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Já Revisados</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{statsFlashcards.revisados}</p>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Novos</p>
              <p className="text-3xl font-bold text-indigo-600 mt-1">{statsFlashcards.novos}</p>
            </div>
          </div>
        </div>

        {/* Alerta de Metas Atrasadas */}
        {statsMetas.atrasadas > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 font-medium">
              🚨 Você tem <strong>{statsMetas.atrasadas}</strong> meta{statsMetas.atrasadas > 1 ? 's' : ''} atrasada{statsMetas.atrasadas > 1 ? 's' : ''}!
            </p>
          </div>
        )}

        {/* Metas de Hoje */}
        {metasHoje.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-800 mb-3">📅 Metas de Hoje ({metasHoje.length})</h3>
            <div className="space-y-2">
              {metasHoje.map(meta => (
                <div key={meta.id} className="flex items-center gap-3 bg-white p-3 rounded-lg">
                  <input
                    type="checkbox"
                    checked={meta.concluida}
                    onChange={() => handleToggleMeta(meta.id, meta.concluida)}
                    className="w-5 h-5 cursor-pointer"
                  />
                  <div className="flex-1">
                    <span className={`${meta.concluida ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                      {meta.assuntoTitulo || meta.assuntoId}
                    </span>
                    <span className="text-sm text-gray-500 ml-2">
                      ({meta.tempoEstimado} min - {meta.tipoEstudo})
                    </span>
                  </div>
                  {meta.concluida && (
                    <span className="text-green-600 font-bold">✓</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filtros e Lista de Metas */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
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
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Carregando...</p>
              </div>
            ) : metasFiltradas.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Nenhuma meta encontrada</p>
              </div>
            ) : (
              <div className="space-y-3">
                {metasFiltradas.map(meta => {
                  const hoje = new Date();
                  hoje.setHours(0, 0, 0, 0);
                  const dataMeta = meta.dataProgramada.toDate();
                  dataMeta.setHours(0, 0, 0, 0);
                  const atrasada = !meta.concluida && dataMeta < hoje;

                  return (
                    <div
                      key={meta.id}
                      className={`border rounded-lg p-4 transition ${
                        meta.concluida
                          ? 'bg-green-50 border-green-200'
                          : atrasada
                          ? 'bg-red-50 border-red-200'
                          : 'bg-white border-gray-200 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={meta.concluida}
                          onChange={() => handleToggleMeta(meta.id, meta.concluida)}
                          className="mt-1 w-5 h-5 cursor-pointer"
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className={`font-medium ${
                                meta.concluida ? 'text-green-700 line-through' : 'text-gray-800'
                              }`}>
                                {meta.assuntoTitulo || meta.assuntoId}
                              </p>
                              <div className="flex gap-3 mt-1 text-sm text-gray-600">
                                <span>📅 {formatarData(meta.dataProgramada)}</span>
                                <span>⏱ {meta.tempoEstimado} min</span>
                                <span className="capitalize">📚 {meta.tipoEstudo}</span>
                              </div>
                              {meta.observacoes && (
                                <p className="text-sm text-gray-600 mt-2">{meta.observacoes}</p>
                              )}
                            </div>
                            {meta.concluida ? (
                              <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full">
                                ✓ Concluída
                              </span>
                            ) : atrasada ? (
                              <span className="px-2 py-1 bg-red-600 text-white text-xs rounded-full">
                                🚨 Atrasada
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlunoDashboard;