import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase.config';
import { 
  buscarEstatisticasAluno,
  buscarMetasAlunoPorMentor,
  buscarQuestoesAlunoPorMentor
} from '../../services/acompanhamentoService';
import ModalTrocarCurso from '../../components/ModalTrocarCurso';

export const AlunoDetalhes = () => {
  const { alunoId } = useParams();
  const navigate = useNavigate();

  const [aluno, setAluno] = useState(null);
  const [estatisticas, setEstatisticas] = useState(null);
  const [metas, setMetas] = useState([]);
  const [questoes, setQuestoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [abaSelecionada, setAbaSelecionada] = useState('visaoGeral'); // visaoGeral, metas, questoes
  const [mostrarModalTrocaCurso, setMostrarModalTrocaCurso] = useState(false);

  useEffect(() => {
    carregarDados();
  }, [alunoId]);

  const carregarDados = async () => {
    setCarregando(true);

    // Buscar dados do aluno
    const alunoDoc = await getDoc(doc(db, 'users', alunoId));
    if (alunoDoc.exists()) {
      setAluno({ id: alunoDoc.id, ...alunoDoc.data() });
    }

    // Buscar estatísticas
    const resultadoEstatisticas = await buscarEstatisticasAluno(alunoId);
    if (resultadoEstatisticas.sucesso) {
      setEstatisticas(resultadoEstatisticas.estatisticas);
    }

    // Buscar metas
    const resultadoMetas = await buscarMetasAlunoPorMentor(alunoId);
    if (resultadoMetas.sucesso) {
      setMetas(resultadoMetas.metas);
    }

    // Buscar questões
    const resultadoQuestoes = await buscarQuestoesAlunoPorMentor(alunoId);
    if (resultadoQuestoes.sucesso) {
      setQuestoes(resultadoQuestoes.questoes);
    }

    setCarregando(false);
  };

  const handleTrocaCursoSucesso = () => {
    setMostrarModalTrocaCurso(false);
    carregarDados(); // Recarregar dados atualizados do aluno
  };

  const formatarData = (timestamp) => {
    if (!timestamp) return '';
    const data = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return data.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'short',
      year: 'numeric'
    });
  };

  const formatarDataHora = (timestamp) => {
    if (!timestamp) return '';
    const data = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return data.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  if (carregando || !aluno || !estatisticas) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto border-b-2 border-blue-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Carregando dados do aluno...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="px-4 py-4 mx-auto max-w-7xl">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate('/mentor/acompanhamento')}
              className="text-gray-600 hover:text-gray-800"
            >
              ← Voltar
            </button>
            <h1 className="text-2xl font-bold text-blue-600">Detalhes do Aluno</h1>
          </div>

          {/* Cabeçalho do Aluno */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full">
                {aluno.fotoPerfil ? (
                  <img
                    src={aluno.fotoPerfil}
                    alt={aluno.nome}
                    className="w-20 h-20 rounded-full"
                  />
                ) : (
                  <span className="text-4xl">👨‍🎓</span>
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{aluno.nome}</h2>
                <p className="text-gray-600">{aluno.email}</p>
              </div>
            </div>

            {/* Botão Trocar Curso */}
            <button
              onClick={() => setMostrarModalTrocaCurso(true)}
              className="inline-flex items-center gap-2 px-4 py-2 font-semibold text-white transition bg-purple-600 rounded-lg shadow-lg hover:bg-purple-700"
            >
              <span>🔄</span>
              <span>Trocar Curso</span>
            </button>
          </div>
        </div>
      </header>

      <div className="px-4 py-8 mx-auto max-w-7xl">
        {/* Abas */}
        <div className="mb-6 bg-white rounded-lg shadow">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setAbaSelecionada('visaoGeral')}
              className={`px-6 py-3 font-medium transition ${
                abaSelecionada === 'visaoGeral'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Visão Geral
            </button>
            <button
              onClick={() => setAbaSelecionada('metas')}
              className={`px-6 py-3 font-medium transition ${
                abaSelecionada === 'metas'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Metas ({metas.length})
            </button>
            <button
              onClick={() => setAbaSelecionada('questoes')}
              className={`px-6 py-3 font-medium transition ${
                abaSelecionada === 'questoes'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Questões ({questoes.length})
            </button>
          </div>
        </div>

        {/* ABA: VISÃO GERAL */}
        {abaSelecionada === 'visaoGeral' && (
          <div className="space-y-6">
            {/* Cards de Estatísticas */}
            <div className="grid gap-4 md:grid-cols-4">
              <div className="p-4 bg-white rounded-lg shadow">
                <p className="text-sm text-gray-600">Total de Metas</p>
                <p className="mt-1 text-3xl font-bold text-gray-800">
                  {estatisticas.metas.total}
                </p>
              </div>

              <div className="p-4 bg-white rounded-lg shadow">
                <p className="text-sm text-gray-600">Metas Concluídas</p>
                <p className="mt-1 text-3xl font-bold text-green-600">
                  {estatisticas.metas.concluidas}
                </p>
              </div>

              <div className="p-4 bg-white rounded-lg shadow">
                <p className="text-sm text-gray-600">Metas Atrasadas</p>
                <p className="mt-1 text-3xl font-bold text-red-600">
                  {estatisticas.metas.atrasadas}
                </p>
              </div>

              <div className="p-4 bg-white rounded-lg shadow">
                <p className="text-sm text-gray-600">Progresso</p>
                <p className="mt-1 text-3xl font-bold text-blue-600">
                  {estatisticas.metas.progresso}%
                </p>
              </div>
            </div>

            {/* Progresso Visual */}
            <div className="p-6 bg-white rounded-lg shadow">
              <h3 className="mb-4 text-lg font-semibold text-gray-800">
                Progresso de Metas
              </h3>
              <div className="mb-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    {estatisticas.metas.concluidas} de {estatisticas.metas.total} metas concluídas
                  </span>
                  <span className="text-sm font-bold text-gray-800">
                    {estatisticas.metas.progresso}%
                  </span>
                </div>
                <div className="w-full h-4 bg-gray-200 rounded-full">
                  <div
                    className={`h-4 rounded-full transition-all ${getCorProgresso(estatisticas.metas.progresso)}`}
                    style={{ width: `${estatisticas.metas.progresso}%` }}
                  ></div>
                </div>
              </div>

              {estatisticas.metas.atrasadas > 0 && (
                <div className="p-3 mt-4 border border-red-200 rounded-lg bg-red-50">
                  <p className="text-sm text-red-700">
                    🚨 <strong>{estatisticas.metas.atrasadas}</strong> metas atrasadas!
                  </p>
                </div>
              )}
            </div>

            {/* Estatísticas de Questões */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 bg-white rounded-lg shadow">
                <p className="text-sm text-gray-600">Total de Questões</p>
                <p className="mt-1 text-3xl font-bold text-gray-800">
                  {estatisticas.questoes.total}
                </p>
              </div>

              <div className="p-4 bg-white rounded-lg shadow">
                <p className="text-sm text-gray-600">Taxa de Acerto</p>
                <p className={`text-3xl font-bold mt-1 ${getCorPercentual(estatisticas.questoes.mediaAcerto)}`}>
                  {estatisticas.questoes.mediaAcerto}%
                </p>
              </div>

              <div className="p-4 bg-white rounded-lg shadow">
                <p className="text-sm text-gray-600">Registros</p>
                <p className="mt-1 text-3xl font-bold text-purple-600">
                  {estatisticas.questoes.totalRegistros}
                </p>
              </div>
            </div>

            {/* Desempenho por Disciplina */}
            {estatisticas.questoes.porDisciplina && 
             Object.keys(estatisticas.questoes.porDisciplina).length > 0 && (
              <div className="p-6 bg-white rounded-lg shadow">
                <h3 className="mb-4 text-lg font-semibold text-gray-800">
                  Desempenho por Disciplina
                </h3>
                <div className="space-y-4">
                  {Object.entries(estatisticas.questoes.porDisciplina)
                    .sort((a, b) => b[1].percentual - a[1].percentual)
                    .map(([disciplina, dados]) => (
                      <div key={disciplina} className="pb-4 border-b border-gray-200 last:border-0">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-800">{disciplina}</span>
                          <span className={`font-bold text-lg ${getCorPercentual(dados.percentual)}`}>
                            {dados.percentual}%
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mb-2 text-sm text-gray-600">
                          <span>📊 {dados.total} questões</span>
                          <span className="text-green-600">✓ {dados.acertos}</span>
                          <span className="text-red-600">✗ {dados.erros}</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full">
                          <div
                            className={`h-2 rounded-full ${
                              dados.percentual >= 70 ? 'bg-green-500' :
                              dados.percentual >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${dados.percentual}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Últimas Atividades */}
            {estatisticas.ultimasAtividades && estatisticas.ultimasAtividades.length > 0 && (
              <div className="p-6 bg-white rounded-lg shadow">
                <h3 className="mb-4 text-lg font-semibold text-gray-800">
                  Últimas Atividades
                </h3>
                <div className="space-y-3">
                  {estatisticas.ultimasAtividades.map((atividade, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 rounded-lg bg-gray-50"
                    >
                      <span className="text-2xl">{atividade.icone}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">
                          {atividade.descricao}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatarDataHora(atividade.data)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ABA: METAS */}
        {abaSelecionada === 'metas' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">
                Todas as Metas ({metas.length})
              </h3>
            </div>
            <div className="p-6">
              {metas.length === 0 ? (
                <p className="py-8 text-center text-gray-600">Nenhuma meta criada ainda</p>
              ) : (
                <div className="space-y-3">
                  {metas.map(meta => {
                    const hoje = new Date();
                    hoje.setHours(0, 0, 0, 0);
                    const dataMeta = meta.dataProgramada.toDate();
                    dataMeta.setHours(0, 0, 0, 0);
                    const atrasada = !meta.concluida && dataMeta < hoje;

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
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className={`font-medium ${
                              meta.concluida ? 'text-green-700 line-through' : 'text-gray-800'
                            }`}>
                              {meta.assuntoTitulo || meta.assuntoId}
                            </p>
                            <div className="flex gap-3 mt-2 text-sm text-gray-600">
                              <span>📅 {formatarData(meta.dataProgramada)}</span>
                              <span>⏱ {meta.tempoEstimado} min</span>
                              <span className="capitalize">📚 {meta.tipoEstudo}</span>
                            </div>
                            {meta.observacoes && (
                              <p className="mt-2 text-sm italic text-gray-600">
                                "{meta.observacoes}"
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {meta.concluida ? (
                              <span className="px-3 py-1 text-xs text-white bg-green-600 rounded-full">
                                ✓ Concluída
                              </span>
                            ) : atrasada ? (
                              <span className="px-3 py-1 text-xs text-white bg-red-600 rounded-full">
                                🚨 Atrasada
                              </span>
                            ) : (
                              <span className="px-3 py-1 text-xs text-orange-700 bg-orange-100 rounded-full">
                                ⏳ Pendente
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ABA: QUESTÕES */}
        {abaSelecionada === 'questoes' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">
                Histórico de Questões ({questoes.length})
              </h3>
            </div>
            <div className="p-6">
              {questoes.length === 0 ? (
                <p className="py-8 text-center text-gray-600">Nenhum registro de questões</p>
              ) : (
                <div className="space-y-3">
                  {questoes.map(questao => (
                    <div
                      key={questao.id}
                      className="p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800">
                            {questao.assuntoTitulo}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {questao.disciplinaNome}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <span className="text-gray-600">
                              📊 {questao.totalQuestoes} questões
                            </span>
                            <span className="font-medium text-green-600">
                              ✓ {questao.acertos} acertos
                            </span>
                            <span className="font-medium text-red-600">
                              ✗ {questao.erros} erros
                            </span>
                          </div>
                          {questao.observacoes && (
                            <p className="mt-2 text-sm italic text-gray-600">
                              "{questao.observacoes}"
                            </p>
                          )}
                          <p className="mt-2 text-xs text-gray-400">
                            {formatarDataHora(questao.dataRegistro)}
                          </p>
                        </div>
                        <span className={`text-2xl font-bold ${getCorPercentual(questao.percentualAcerto)}`}>
                          {questao.percentualAcerto}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Troca de Curso */}
      {mostrarModalTrocaCurso && (
        <ModalTrocarCurso
          aluno={aluno}
          onClose={() => setMostrarModalTrocaCurso(false)}
          onSucesso={handleTrocaCursoSucesso}
        />
      )}
    </div>
  );
};

export default AlunoDetalhes;