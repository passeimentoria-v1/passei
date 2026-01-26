import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { buscarMetasComDuvidas } from '../../services/comentarioService';
import ModalMetaComComentariosMentor from '../../components/ModalMetaComComentariosMentor';

export const DuvidasAlunos = () => {
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [metasComDuvidas, setMetasComDuvidas] = useState([]);
  const [metaSelecionada, setMetaSelecionada] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarDuvidas();
  }, []);

  const carregarDuvidas = async () => {
    setCarregando(true);
    const resultado = await buscarMetasComDuvidas(usuario.uid);

    if (resultado.sucesso) {
      setMetasComDuvidas(resultado.metas);
    }

    setCarregando(false);
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

  const handleAbrirMeta = (meta) => {
    setMetaSelecionada(meta);
    setMostrarModal(true);
  };

  const handleFecharModal = () => {
    setMostrarModal(false);
    setMetaSelecionada(null);
    carregarDuvidas(); // Recarregar ao fechar
  };

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
            <h1 className="text-2xl font-bold text-blue-600">Dúvidas dos Alunos</h1>
          </div>
          <div className="px-4 py-2 font-semibold text-yellow-700 bg-yellow-100 rounded-lg">
            {metasComDuvidas.length} {metasComDuvidas.length === 1 ? 'Dúvida' : 'Dúvidas'}
          </div>
        </div>
      </header>

      <div className="px-4 py-8 mx-auto max-w-7xl">
        {carregando ? (
          <div className="p-8 bg-white rounded-lg shadow">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto border-b-2 border-blue-600 rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-600">Carregando dúvidas...</p>
            </div>
          </div>
        ) : metasComDuvidas.length === 0 ? (
          <div className="p-8 bg-white rounded-lg shadow">
            <div className="text-center">
              <div className="flex items-center justify-center w-20 h-20 mx-auto mb-4 bg-green-100 rounded-full">
                <span className="text-4xl">🎉</span>
              </div>
              <h2 className="mb-2 text-2xl font-bold text-gray-800">
                Nenhuma dúvida pendente!
              </h2>
              <p className="text-gray-600">
                Todos os seus alunos estão progredindo sem dificuldades no momento.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {metasComDuvidas.map((meta) => {
              // Buscar informações do aluno (nome)
              const isAtrasada = () => {
                const hoje = new Date();
                hoje.setHours(0, 0, 0, 0);
                const dataMeta = meta.dataProgramada.toDate();
                dataMeta.setHours(0, 0, 0, 0);
                return dataMeta < hoje;
              };

              return (
                <div
                  key={meta.id}
                  onClick={() => handleAbrirMeta(meta)}
                  className="transition bg-white rounded-lg shadow cursor-pointer hover:shadow-lg"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="px-3 py-1 text-sm font-medium text-yellow-700 bg-yellow-100 rounded-full">
                            ❓ Com Dúvida
                          </span>
                          {isAtrasada() && (
                            <span className="px-3 py-1 text-sm font-medium text-red-700 bg-red-100 rounded-full">
                              🚨 Atrasada
                            </span>
                          )}
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">
                          {meta.assuntoTitulo || meta.assuntoId}
                        </h3>
                        <p className="mt-1 text-sm text-gray-600">
                          Aluno ID: {meta.alunoId}
                        </p>
                      </div>
                      <button className="font-medium text-blue-600 hover:text-blue-800">
                        Ver Detalhes →
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-4 p-4 rounded-lg bg-gray-50">
                      <div>
                        <p className="text-sm text-gray-600">Data Programada</p>
                        <p className="font-medium text-gray-800">
                          📅 {formatarData(meta.dataProgramada)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Tempo Estimado</p>
                        <p className="font-medium text-gray-800">
                          ⏱ {meta.tempoEstimado} min
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Tipo de Estudo</p>
                        <p className="font-medium text-gray-800 capitalize">
                          📚 {meta.tipoEstudo}
                        </p>
                      </div>
                    </div>

                    {meta.observacoes && (
                      <div className="p-3 mt-4 border border-blue-200 rounded-lg bg-blue-50">
                        <p className="text-sm text-blue-800">
                          <strong>Observações:</strong> {meta.observacoes}
                        </p>
                      </div>
                    )}

                    {meta.dataAtualizacaoStatus && (
                      <p className="mt-3 text-xs text-gray-400">
                        Status atualizado em: {formatarData(meta.dataAtualizacaoStatus)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Dicas para o Mentor */}
        {metasComDuvidas.length > 0 && (
          <div className="p-6 mt-8 border border-blue-200 rounded-lg bg-blue-50">
            <h3 className="mb-3 text-lg font-semibold text-blue-800">
              💡 Dicas para ajudar seus alunos:
            </h3>
            <ul className="space-y-2 text-sm text-blue-700">
              <li>• Responda às dúvidas o mais rápido possível</li>
              <li>• Seja específico e use exemplos práticos</li>
              <li>• Sugira materiais complementares quando necessário</li>
              <li>• Pergunte se a dúvida foi esclarecida</li>
              <li>• Incentive o aluno a continuar estudando</li>
            </ul>
          </div>
        )}
      </div>

      {/* Modal de Detalhes */}
      {mostrarModal && metaSelecionada && (
        <ModalMetaComComentariosMentor
          meta={metaSelecionada}
          onClose={handleFecharModal}
          onAtualizar={carregarDuvidas}
        />
      )}
    </div>
  );
};

export default DuvidasAlunos;