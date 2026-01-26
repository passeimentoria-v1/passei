import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  gerarRelatorioSemanalAluno, 
  gerarRelatorioMensalAluno 
} from '../../services/relatorioService';

export const RelatoriosAluno = () => {
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [tipoRelatorio, setTipoRelatorio] = useState('semanal');
  const [relatorio, setRelatorio] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarRelatorio();
  }, [tipoRelatorio]);

  const carregarRelatorio = async () => {
    setCarregando(true);
    
    const resultado = tipoRelatorio === 'semanal'
      ? await gerarRelatorioSemanalAluno(usuario.uid)
      : await gerarRelatorioMensalAluno(usuario.uid);

    if (resultado.sucesso) {
      setRelatorio(resultado.relatorio);
    }

    setCarregando(false);
  };

  const formatarData = (data) => {
    if (!data) return 'Data não disponível';
    
    try {
      // Se já for um objeto Date, usar direto; se não, criar novo Date
      const dataObj = data instanceof Date ? data : new Date(data);
      
      // Verificar se a data é válida
      if (isNaN(dataObj.getTime())) {
        return 'Data inválida';
      }
      
      return dataObj.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return 'Erro na data';
    }
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

  if (!relatorio) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <p className="font-semibold text-red-600">Erro ao carregar relatório</p>
          <button
            onClick={() => navigate('/aluno/dashboard')}
            className="px-4 py-2 mt-4 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Voltar ao Dashboard
          </button>
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
              onClick={() => navigate('/aluno/dashboard')}
              className="text-gray-600 hover:text-gray-800"
            >
              ← Voltar
            </button>
            <h1 className="text-2xl font-bold text-blue-600">Relatórios</h1>
          </div>

          {/* Toggle Semanal/Mensal */}
          <div className="flex gap-2">
            <button
              onClick={() => setTipoRelatorio('semanal')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                tipoRelatorio === 'semanal'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Semanal
            </button>
            <button
              onClick={() => setTipoRelatorio('mensal')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                tipoRelatorio === 'mensal'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Mensal
            </button>
          </div>
        </div>
      </header>

      <div className="px-4 py-8 mx-auto max-w-7xl">
        {/* Período */}
        <div className="p-4 mb-6 border border-blue-200 rounded-lg bg-blue-50">
          <p className="font-semibold text-blue-800">
            📅 Período: {formatarData(relatorio.periodo?.inicio)} até {formatarData(relatorio.periodo?.fim)}
          </p>
        </div>

        {/* Cards de Resumo */}
        <div className="grid gap-6 mb-6 md:grid-cols-3">
          {/* Metas */}
          <div className="p-6 bg-white rounded-lg shadow">
            <h3 className="flex items-center gap-2 mb-4 text-lg font-semibold text-gray-800">
              <span>📅</span>
              <span>Metas</span>
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total:</span>
                <span className="font-bold text-gray-800">{relatorio.metas?.total || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Concluídas:</span>
                <span className="font-bold text-green-600">{relatorio.metas?.concluidas || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pendentes:</span>
                <span className="font-bold text-orange-600">{relatorio.metas?.pendentes || 0}</span>
              </div>
              <div className="pt-3 border-t">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Conclusão:</span>
                  <span className="font-bold text-blue-600">{relatorio.metas?.percentualConclusao || 0}%</span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full">
                  <div
                    className="h-3 transition-all bg-blue-600 rounded-full"
                    style={{ width: `${relatorio.metas?.percentualConclusao || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Questões */}
          <div className="p-6 bg-white rounded-lg shadow">
            <h3 className="flex items-center gap-2 mb-4 text-lg font-semibold text-gray-800">
              <span>📝</span>
              <span>Questões</span>
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total:</span>
                <span className="font-bold text-gray-800">{relatorio.questoes?.total || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Acertos:</span>
                <span className="font-bold text-green-600">{relatorio.questoes?.acertos || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Erros:</span>
                <span className="font-bold text-red-600">{relatorio.questoes?.erros || 0}</span>
              </div>
              <div className="pt-3 border-t">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Taxa de Acerto:</span>
                  <span className={`font-bold ${
                    (relatorio.questoes?.mediaAcerto || 0) >= 70 ? 'text-green-600' :
                    (relatorio.questoes?.mediaAcerto || 0) >= 50 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>{relatorio.questoes?.mediaAcerto || 0}%</span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      (relatorio.questoes?.mediaAcerto || 0) >= 70 ? 'bg-green-600' :
                      (relatorio.questoes?.mediaAcerto || 0) >= 50 ? 'bg-yellow-600' :
                      'bg-red-600'
                    }`}
                    style={{ width: `${relatorio.questoes?.mediaAcerto || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Tempo Estudado */}
          <div className="p-6 bg-white rounded-lg shadow">
            <h3 className="flex items-center gap-2 mb-4 text-lg font-semibold text-gray-800">
              <span>⏱</span>
              <span>Tempo de Estudo</span>
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total:</span>
                <span className="font-bold text-gray-800">{relatorio.tempo?.totalHoras || 0}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Em minutos:</span>
                <span className="font-bold text-blue-600">{relatorio.tempo?.totalMinutos || 0} min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Média diária:</span>
                <span className="font-bold text-purple-600">{relatorio.tempo?.mediaDiaria || 0} min/dia</span>
              </div>
              <div className="pt-3 border-t">
                <div className="p-3 text-center rounded-lg bg-blue-50">
                  <p className="text-2xl font-bold text-blue-600">
                    {Math.round(relatorio.tempo?.totalHoras || 0)}h
                  </p>
                  <p className="text-xs text-blue-600">Tempo total</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Disciplinas com Dificuldade */}
        {relatorio.disciplinasComDificuldade?.length > 0 && (
          <div className="p-6 mb-6 bg-white rounded-lg shadow">
            <h3 className="flex items-center gap-2 mb-4 text-lg font-semibold text-gray-800">
              <span>⚠️</span>
              <span>Disciplinas que Precisam de Atenção</span>
            </h3>
            <div className="space-y-3">
              {relatorio.disciplinasComDificuldade.map((disciplina, index) => (
                <div key={index} className="p-4 border border-red-200 rounded-lg bg-red-50">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-800">{disciplina.nome}</h4>
                    <span className="px-3 py-1 text-sm font-bold text-white bg-red-600 rounded-full">
                      {disciplina.percentualAcerto}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>{disciplina.totalQuestoes} questões</span>
                    <span>{disciplina.erros} erros</span>
                  </div>
                  <div className="w-full h-2 mt-2 bg-red-200 rounded-full">
                    <div
                      className="h-2 bg-red-600 rounded-full"
                      style={{ width: `${disciplina.percentualAcerto}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Evolução Semanal (apenas no relatório mensal) */}
        {tipoRelatorio === 'mensal' && relatorio.evolucaoSemanal?.length > 0 && (
          <div className="p-6 bg-white rounded-lg shadow">
            <h3 className="flex items-center gap-2 mb-4 text-lg font-semibold text-gray-800">
              <span>📈</span>
              <span>Evolução do Percentual de Acerto</span>
            </h3>
            <div className="space-y-3">
              {relatorio.evolucaoSemanal.map((semana, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-20 text-sm font-medium text-gray-600">
                    Semana {semana.semana}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">{semana.totalQuestoes} questões</span>
                      <span className={`font-bold ${
                        semana.percentualAcerto >= 70 ? 'text-green-600' :
                        semana.percentualAcerto >= 50 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>{semana.percentualAcerto}%</span>
                    </div>
                    <div className="w-full h-3 bg-gray-200 rounded-full">
                      <div
                        className={`h-3 rounded-full transition-all ${
                          semana.percentualAcerto >= 70 ? 'bg-green-600' :
                          semana.percentualAcerto >= 50 ? 'bg-yellow-600' :
                          'bg-red-600'
                        }`}
                        style={{ width: `${semana.percentualAcerto}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RelatoriosAluno;