import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  buscarRegistrosAluno,
  calcularEstatisticasQuestoes,
  deletarRegistro
} from '../../services/questoesService';

export const HistoricoQuestoes = () => {
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [registros, setRegistros] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [stats, setStats] = useState({
    totalQuestoes: 0,
    totalAcertos: 0,
    totalErros: 0,
    mediaAcerto: 0,
    totalRegistros: 0
  });

  useEffect(() => {
    carregarRegistros();
  }, []);

  const carregarRegistros = async () => {
    setCarregando(true);
    const resultado = await buscarRegistrosAluno(usuario.uid);

    if (resultado.sucesso) {
      setRegistros(resultado.registros);
      const estatisticas = calcularEstatisticasQuestoes(resultado.registros);
      setStats(estatisticas);
    }

    setCarregando(false);
  };

  const handleDeletar = async (registroId) => {
    if (confirm('Deseja realmente deletar este registro?')) {
      const resultado = await deletarRegistro(registroId);
      if (resultado.sucesso) {
        carregarRegistros();
      }
    }
  };

  const formatarData = (timestamp) => {
    if (!timestamp) return '';
    const data = timestamp.toDate();
    return data.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCorPercentual = (percentual) => {
    if (percentual >= 70) return 'text-green-600';
    if (percentual >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

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
            <h1 className="text-2xl font-bold text-blue-600">Histórico de Questões</h1>
          </div>
          <button
            onClick={() => navigate('/aluno/registrar-questoes')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            + Registrar
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Cards de Estatísticas */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Total de Questões</p>
            <p className="text-3xl font-bold text-gray-800 mt-1">{stats.totalQuestoes}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Acertos</p>
            <p className="text-3xl font-bold text-green-600 mt-1">{stats.totalAcertos}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Erros</p>
            <p className="text-3xl font-bold text-red-600 mt-1">{stats.totalErros}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Média de Acerto</p>
            <p className={`text-3xl font-bold mt-1 ${getCorPercentual(stats.mediaAcerto)}`}>
              {stats.mediaAcerto}%
            </p>
          </div>
        </div>

        {/* Desempenho por Disciplina */}
        {stats.porDisciplina && Object.keys(stats.porDisciplina).length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Desempenho por Disciplina</h2>
            <div className="space-y-3">
              {Object.entries(stats.porDisciplina).map(([disciplina, dados]) => {
                const percentual = dados.total > 0 
                  ? Math.round((dados.acertos / dados.total) * 100) 
                  : 0;
                
                return (
                  <div key={disciplina} className="border-b border-gray-200 pb-3 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-800">{disciplina}</span>
                      <span className={`font-bold ${getCorPercentual(percentual)}`}>
                        {percentual}%
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>📊 {dados.total} questões</span>
                      <span className="text-green-600">✓ {dados.acertos}</span>
                      <span className="text-red-600">✗ {dados.erros}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className={`h-2 rounded-full ${
                          percentual >= 70 ? 'bg-green-500' :
                          percentual >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${percentual}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Lista de Registros */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">
              Registros Recentes ({stats.totalRegistros})
            </h2>
          </div>

          <div className="p-6">
            {carregando ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Carregando registros...</p>
              </div>
            ) : registros.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">Nenhum registro encontrado</p>
                <button
                  onClick={() => navigate('/aluno/registrar-questoes')}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Fazer Primeiro Registro
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {registros.map(registro => (
                  <div
                    key={registro.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-800">
                              {registro.assuntoTitulo}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {registro.disciplinaNome}
                            </p>
                          </div>
                          <span className={`text-2xl font-bold ${getCorPercentual(registro.percentualAcerto)}`}>
                            {registro.percentualAcerto}%
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-sm mb-2">
                          <span className="text-gray-600">
                            📊 {registro.totalQuestoes} questões
                          </span>
                          <span className="text-green-600 font-medium">
                            ✓ {registro.acertos} acertos
                          </span>
                          <span className="text-red-600 font-medium">
                            ✗ {registro.erros} erros
                          </span>
                        </div>

                        {registro.observacoes && (
                          <p className="text-sm text-gray-600 mt-2 italic">
                            "{registro.observacoes}"
                          </p>
                        )}

                        <p className="text-xs text-gray-400 mt-2">
                          {formatarData(registro.dataRegistro)}
                        </p>
                      </div>

                      <button
                        onClick={() => handleDeletar(registro.id)}
                        className="ml-4 px-3 py-1 text-red-600 hover:bg-red-50 rounded transition text-sm"
                      >
                        🗑️ Deletar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoricoQuestoes;