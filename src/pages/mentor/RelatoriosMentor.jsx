import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { gerarRelatorioMentor } from '../../services/relatorioService';

export const RelatoriosMentor = () => {
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [relatorio, setRelatorio] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState('todos');

  useEffect(() => {
    carregarRelatorio();
  }, []);

  const carregarRelatorio = async () => {
    setCarregando(true);
    
    const resultado = await gerarRelatorioMentor(usuario.uid);

    if (resultado.sucesso) {
      setRelatorio(resultado.relatorio);
    }

    setCarregando(false);
  };

  const alunosFiltrados = () => {
    if (!relatorio) return [];
    
    switch (filtro) {
      case 'atrasados':
        return relatorio.alunos.filter(a => a.metas.pendentes > 0);
      case 'em_dia':
        return relatorio.alunos.filter(a => a.metas.pendentes === 0);
      default:
        return relatorio.alunos;
    }
  };

  const formatarData = (data) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  if (carregando) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto border-b-2 border-blue-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Gerando relatório...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="flex items-center justify-between px-4 py-4 mx-auto max-w-7xl">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/mentor/dashboard')}
              className="text-gray-600 hover:text-gray-800"
            >
              ← Voltar
            </button>
            <h1 className="text-2xl font-bold text-blue-600">Relatório Semanal</h1>
          </div>
        </div>
      </header>

      <div className="px-4 py-8 mx-auto max-w-7xl">
        {/* Período */}
        <div className="p-4 mb-6 border border-blue-200 rounded-lg bg-blue-50">
          <p className="font-semibold text-blue-800">
            📅 Período: {formatarData(relatorio?.periodo.inicio)} até {formatarData(relatorio?.periodo.fim)}
          </p>
        </div>

        {/* Performance Geral */}
        <div className="p-6 mb-6 bg-white rounded-lg shadow">
          <h3 className="mb-4 text-lg font-semibold text-gray-800">📊 Performance Geral</h3>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="p-4 text-center rounded-lg bg-blue-50">
              <p className="text-3xl font-bold text-blue-600">{relatorio?.performanceGeral.totalAlunos}</p>
              <p className="mt-1 text-sm text-gray-600">Total de Alunos</p>
            </div>
            <div className="p-4 text-center rounded-lg bg-green-50">
              <p className="text-3xl font-bold text-green-600">
                {relatorio?.performanceGeral.metasConcluidas}/{relatorio?.performanceGeral.metasTotais}
              </p>
              <p className="mt-1 text-sm text-gray-600">Metas Concluídas</p>
            </div>
            <div className="p-4 text-center rounded-lg bg-purple-50">
              <p className="text-3xl font-bold text-purple-600">{relatorio?.performanceGeral.questoesTotais}</p>
              <p className="mt-1 text-sm text-gray-600">Questões Resolvidas</p>
            </div>
            <div className="p-4 text-center rounded-lg bg-yellow-50">
              <p className="text-3xl font-bold text-yellow-600">{relatorio?.performanceGeral.mediaAcertoGeral}%</p>
              <p className="mt-1 text-sm text-gray-600">Média de Acerto</p>
            </div>
          </div>
        </div>

        {/* Alunos Atrasados - Alerta */}
        {relatorio?.alunosAtrasados?.length > 0 && (
          <div className="p-6 mb-6 border border-red-200 rounded-lg bg-red-50">
            <h3 className="flex items-center gap-2 mb-4 text-lg font-semibold text-red-800">
              <span>🚨</span>
              <span>Alunos que Precisam de Atenção ({relatorio.alunosAtrasados.length})</span>
            </h3>
            <div className="space-y-3">
              {relatorio.alunosAtrasados.slice(0, 5).map((aluno) => (
                <div key={aluno.aluno.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-800">{aluno.aluno.nome}</p>
                    <p className="text-sm text-gray-600">{aluno.aluno.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-red-600">{aluno.metas.pendentes} metas pendentes</p>
                    <p className="text-xs text-gray-600">{aluno.metas.percentualConclusao}% concluído</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ranking dos Melhores */}
        {relatorio?.ranking?.length > 0 && (
          <div className="p-6 mb-6 bg-white rounded-lg shadow">
            <h3 className="flex items-center gap-2 mb-4 text-lg font-semibold text-gray-800">
              <span>🏆</span>
              <span>Top 10 Alunos da Semana</span>
            </h3>
            <div className="space-y-2">
              {relatorio.ranking.map((aluno, index) => (
                <div key={aluno.aluno.id} className="flex items-center gap-4 p-3 transition rounded-lg hover:bg-gray-50">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    index === 0 ? 'bg-yellow-400 text-yellow-900' :
                    index === 1 ? 'bg-gray-300 text-gray-700' :
                    index === 2 ? 'bg-orange-400 text-orange-900' :
                    'bg-gray-200 text-gray-600'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{aluno.aluno.nome}</p>
                    <p className="text-sm text-gray-600">{aluno.metas.concluidas} metas concluídas</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">{aluno.metas.percentualConclusao}%</p>
                    <p className="text-xs text-gray-600">{aluno.questoes.mediaAcerto}% acerto</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lista Completa de Alunos */}
        <div className="bg-white rounded-lg shadow">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Todos os Alunos</h3>
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
                onClick={() => setFiltro('em_dia')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filtro === 'em_dia'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Em Dia
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-3">
              {alunosFiltrados().map((aluno) => (
                <div
                  key={aluno.aluno.id}
                  className="p-4 transition border rounded-lg cursor-pointer hover:shadow-md"
                  onClick={() => navigate(`/mentor/aluno/${aluno.aluno.id}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-lg font-semibold text-gray-800">{aluno.aluno.nome}</p>
                      <p className="text-sm text-gray-600">{aluno.aluno.email}</p>
                    </div>
                    {aluno.metas.pendentes > 0 && (
                      <span className="px-3 py-1 text-sm font-medium text-red-700 bg-red-100 rounded-full">
                        🚨 {aluno.metas.pendentes} pendentes
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-600">Metas</p>
                      <p className="text-lg font-bold text-gray-800">
                        {aluno.metas.concluidas}/{aluno.metas.total}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Conclusão</p>
                      <p className="text-lg font-bold text-blue-600">{aluno.metas.percentualConclusao}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Questões</p>
                      <p className="text-lg font-bold text-purple-600">{aluno.questoes.total}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Taxa Acerto</p>
                      <p className={`text-lg font-bold ${
                        aluno.questoes.mediaAcerto >= 70 ? 'text-green-600' :
                        aluno.questoes.mediaAcerto >= 50 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>{aluno.questoes.mediaAcerto}%</p>
                    </div>
                  </div>

                  {/* Barra de progresso */}
                  <div className="mt-3">
                    <div className="w-full h-2 bg-gray-200 rounded-full">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          aluno.metas.percentualConclusao >= 70 ? 'bg-green-600' :
                          aluno.metas.percentualConclusao >= 40 ? 'bg-yellow-600' :
                          'bg-red-600'
                        }`}
                        style={{ width: `${aluno.metas.percentualConclusao}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RelatoriosMentor;