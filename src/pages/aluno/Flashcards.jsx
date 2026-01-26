import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  buscarFlashcardsAluno,
  buscarFlashcardsParaRevisar,
  buscarEstatisticasFlashcards,
  deletarFlashcard
} from '../../services/flashcardService';

export const Flashcards = () => {
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [flashcards, setFlashcards] = useState([]);
  const [flashcardsParaRevisar, setFlashcardsParaRevisar] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    paraRevisar: 0,
    revisados: 0,
    novos: 0
  });
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState('todos'); // todos, paraRevisar

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setCarregando(true);

    // Buscar todos os flashcards
    const resultadoTodos = await buscarFlashcardsAluno(usuario.uid);
    if (resultadoTodos.sucesso) {
      setFlashcards(resultadoTodos.flashcards);
    }

    // Buscar flashcards para revisar
    const resultadoRevisar = await buscarFlashcardsParaRevisar(usuario.uid);
    if (resultadoRevisar.sucesso) {
      setFlashcardsParaRevisar(resultadoRevisar.flashcards);
    }

    // Buscar estatísticas
    const resultadoStats = await buscarEstatisticasFlashcards(usuario.uid);
    if (resultadoStats.sucesso) {
      setStats(resultadoStats.estatisticas);
    }

    setCarregando(false);
  };

  const handleDeletar = async (flashcardId) => {
    if (confirm('Deseja realmente deletar este flashcard?')) {
      const resultado = await deletarFlashcard(flashcardId);
      if (resultado.sucesso) {
        carregarDados();
      }
    }
  };

  const formatarData = (timestamp) => {
    if (!timestamp) return '';
    const data = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return data.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'short'
    });
  };

  const flashcardsFiltrados = filtro === 'paraRevisar' 
    ? flashcardsParaRevisar 
    : flashcards;

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/aluno/dashboard')}
              className="text-gray-600 hover:text-gray-800"
            >
              ← Voltar
            </button>
            <h1 className="text-2xl font-bold text-blue-600">Meus Flashcards</h1>
          </div>
          <button
            onClick={() => navigate('/aluno/flashcards/criar')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            + Criar Flashcard
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Botão de Revisão em Destaque */}
        {stats.paraRevisar > 0 && (
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-lg p-6 mb-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  📚 {stats.paraRevisar} flashcard{stats.paraRevisar > 1 ? 's' : ''} para revisar hoje!
                </h2>
                <p className="text-blue-100">
                  Continue seu progresso e revise agora
                </p>
              </div>
              <button
                onClick={() => navigate('/aluno/flashcards/revisar')}
                className="px-8 py-4 bg-white text-blue-600 rounded-lg font-bold text-lg hover:bg-gray-100 transition shadow-lg"
              >
                Começar Revisão →
              </button>
            </div>
          </div>
        )}

        {/* Cards de Estatísticas */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Total de Flashcards</p>
            <p className="text-3xl font-bold text-gray-800 mt-1">{stats.total}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Para Revisar Hoje</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">{stats.paraRevisar}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Já Revisados</p>
            <p className="text-3xl font-bold text-green-600 mt-1">{stats.revisados}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Novos</p>
            <p className="text-3xl font-bold text-purple-600 mt-1">{stats.novos}</p>
          </div>
        </div>

        {/* Flashcards por Disciplina */}
        {stats.porDisciplina && Object.keys(stats.porDisciplina).length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Flashcards por Disciplina
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(stats.porDisciplina).map(([disciplina, total]) => (
                <div key={disciplina} className="p-4 bg-blue-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-600">{total}</p>
                  <p className="text-sm text-gray-600 mt-1">{disciplina}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">Lista de Flashcards</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setFiltro('todos')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filtro === 'todos'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Todos ({stats.total})
              </button>
              <button
                onClick={() => setFiltro('paraRevisar')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filtro === 'paraRevisar'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Para Revisar ({stats.paraRevisar})
              </button>
            </div>
          </div>

          <div className="p-6">
            {carregando ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Carregando flashcards...</p>
              </div>
            ) : flashcardsFiltrados.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">
                  {filtro === 'paraRevisar' 
                    ? 'Nenhum flashcard para revisar hoje! 🎉'
                    : 'Nenhum flashcard criado ainda'}
                </p>
                {filtro === 'todos' && (
                  <button
                    onClick={() => navigate('/aluno/flashcards/criar')}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Criar Primeiro Flashcard
                  </button>
                )}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {flashcardsFiltrados.map(flashcard => {
                  const hoje = new Date();
                  hoje.setHours(23, 59, 59, 999);
                  const proximaRevisao = flashcard.proximaRevisao.toDate();
                  const paraRevisarHoje = proximaRevisao <= hoje;

                  return (
                    <div
                      key={flashcard.id}
                      className={`border rounded-lg p-4 hover:shadow-md transition ${
                        paraRevisarHoje ? 'border-orange-300 bg-orange-50' : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <p className="text-xs text-gray-500">{flashcard.disciplinaNome}</p>
                          <p className="text-xs text-gray-500">{flashcard.assuntoTitulo}</p>
                        </div>
                        {paraRevisarHoje && (
                          <span className="px-2 py-1 bg-orange-500 text-white text-xs rounded-full">
                            Revisar
                          </span>
                        )}
                      </div>

                      <div className="mb-3">
                        <p className="text-sm font-semibold text-gray-800 mb-2">
                          {flashcard.frente}
                        </p>
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {flashcard.verso}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div>
                          <span>📅 Próxima: {formatarData(flashcard.proximaRevisao)}</span>
                        </div>
                        <button
                          onClick={() => handleDeletar(flashcard.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          🗑️
                        </button>
                      </div>

                      <div className="mt-2 text-xs text-gray-400">
                        {flashcard.totalRevisoes > 0 
                          ? `Revisado ${flashcard.totalRevisoes}x`
                          : 'Ainda não revisado'}
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

export default Flashcards;