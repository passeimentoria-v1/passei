import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { buscarEstatisticasTodosAlunos } from '../../services/acompanhamentoService';

export const AcompanhamentoAlunos = () => {
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [alunos, setAlunos] = useState([]);
  const [alunosFiltrados, setAlunosFiltrados] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState('todos'); // todos, atrasados, emDia
  const [ordenacao, setOrdenacao] = useState('progresso'); // progresso, nome, atrasadas

  useEffect(() => {
    carregarAlunos();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [filtro, ordenacao, alunos]);

  const carregarAlunos = async () => {
    setCarregando(true);
    const resultado = await buscarEstatisticasTodosAlunos(usuario.uid);

    if (resultado.sucesso) {
      setAlunos(resultado.alunos);
      setAlunosFiltrados(resultado.alunos);
    }

    setCarregando(false);
  };

  const aplicarFiltros = () => {
    let filtrados = [...alunos];

    // Aplicar filtro
    if (filtro === 'atrasados') {
      filtrados = filtrados.filter(a => a.metas.atrasadas > 0);
    } else if (filtro === 'emDia') {
      filtrados = filtrados.filter(a => a.metas.atrasadas === 0);
    }

    // Aplicar ordenação
    if (ordenacao === 'progresso') {
      filtrados.sort((a, b) => b.metas.progresso - a.metas.progresso);
    } else if (ordenacao === 'nome') {
      filtrados.sort((a, b) => a.aluno.nome.localeCompare(b.aluno.nome));
    } else if (ordenacao === 'atrasadas') {
      filtrados.sort((a, b) => b.metas.atrasadas - a.metas.atrasadas);
    }

    setAlunosFiltrados(filtrados);
  };

  const getCorProgresso = (progresso) => {
    if (progresso >= 70) return 'bg-green-500';
    if (progresso >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getCorPercentual = (percentual) => {
    if (percentual >= 70) return 'text-green-600';
    if (percentual >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/mentor/dashboard')}
            className="text-gray-600 hover:text-gray-800"
          >
            ← Voltar
          </button>
          <h1 className="text-2xl font-bold text-blue-600">Acompanhamento de Alunos</h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Resumo Geral */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Total de Alunos</p>
            <p className="text-3xl font-bold text-gray-800 mt-1">{alunos.length}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Com Metas Atrasadas</p>
            <p className="text-3xl font-bold text-red-600 mt-1">
              {alunos.filter(a => a.metas.atrasadas > 0).length}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Progresso Médio</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">
              {alunos.length > 0
                ? Math.round(alunos.reduce((acc, a) => acc + a.metas.progresso, 0) / alunos.length)
                : 0}%
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Média de Acerto</p>
            <p className="text-3xl font-bold text-green-600 mt-1">
              {alunos.length > 0
                ? Math.round(alunos.reduce((acc, a) => acc + a.questoes.mediaAcerto, 0) / alunos.length)
                : 0}%
            </p>
          </div>
        </div>

        {/* Filtros e Ordenação */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setFiltro('todos')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filtro === 'todos'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFiltro('atrasados')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filtro === 'atrasados'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Atrasados
              </button>
              <button
                onClick={() => setFiltro('emDia')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filtro === 'emDia'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Em Dia
              </button>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Ordenar por:</label>
              <select
                value={ordenacao}
                onChange={(e) => setOrdenacao(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="progresso">Progresso</option>
                <option value="nome">Nome</option>
                <option value="atrasadas">Metas Atrasadas</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista de Alunos */}
        {carregando ? (
          <div className="bg-white rounded-lg shadow p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Carregando alunos...</p>
            </div>
          </div>
        ) : alunosFiltrados.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8">
            <p className="text-center text-gray-600">Nenhum aluno encontrado</p>
          </div>
        ) : (
          <div className="space-y-4">
            {alunosFiltrados.map((aluno) => (
              <div
                key={aluno.aluno.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer"
                onClick={() => navigate('/mentor/aluno/' + aluno.aluno.id)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                        {aluno.aluno.fotoPerfil ? (
                          <img
                            src={aluno.aluno.fotoPerfil}
                            alt={aluno.aluno.nome}
                            className="w-16 h-16 rounded-full"
                          />
                        ) : (
                          <span className="text-3xl">👨‍🎓</span>
                        )}
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-800">
                          {aluno.aluno.nome}
                        </h3>
                        <p className="text-sm text-gray-600">{aluno.aluno.email}</p>
                      </div>
                    </div>

                    {aluno.metas.atrasadas > 0 && (
                      <span className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded-full font-medium">
                        🚨 {aluno.metas.atrasadas} atrasadas
                      </span>
                    )}
                  </div>

                  {/* Progresso de Metas */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Progresso de Metas
                      </span>
                      <span className="text-sm font-bold text-gray-800">
                        {aluno.metas.progresso}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${getCorProgresso(aluno.metas.progresso)}`}
                        style={{ width: `${aluno.metas.progresso}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Estatísticas */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {aluno.metas.total}
                      </p>
                      <p className="text-xs text-gray-600">Metas Total</p>
                    </div>

                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {aluno.metas.concluidas}
                      </p>
                      <p className="text-xs text-gray-600">Concluídas</p>
                    </div>

                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">
                        {aluno.metas.pendentes}
                      </p>
                      <p className="text-xs text-gray-600">Pendentes</p>
                    </div>

                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">
                        {aluno.questoes.total}
                      </p>
                      <p className="text-xs text-gray-600">Questões</p>
                    </div>

                    <div className="text-center">
                      <p className={`text-2xl font-bold ${getCorPercentual(aluno.questoes.mediaAcerto)}`}>
                        {aluno.questoes.mediaAcerto}%
                      </p>
                      <p className="text-xs text-gray-600">Média Acerto</p>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between rounded-b-lg">
                  <p className="text-sm text-gray-600">
                    Clique para ver detalhes completos
                  </p>
                  <span className="text-gray-400">→</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AcompanhamentoAlunos;