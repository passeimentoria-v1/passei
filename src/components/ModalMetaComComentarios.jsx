import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  adicionarComentario, 
  buscarComentariosMeta 
} from '../services/comentarioService';
import { 
  atualizarStatusMeta,
  concluirMeta,
  desconcluirMeta
} from '../services/metaService';

export const ModalMetaComComentarios = ({ meta, onClose, onAtualizar }) => {
  const { usuario } = useAuth();
  const [comentarios, setComentarios] = useState([]);
  const [novoComentario, setNovoComentario] = useState('');
  const [status, setStatus] = useState(meta.status || 'Pendente');
  const [carregandoComentarios, setCarregandoComentarios] = useState(true);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    carregarComentarios();
  }, [meta.id]);

  const carregarComentarios = async () => {
    setCarregandoComentarios(true);
    const resultado = await buscarComentariosMeta(meta.id);
    
    if (resultado.sucesso) {
      setComentarios(resultado.comentarios);
    }
    
    setCarregandoComentarios(false);
  };

  const handleEnviarComentario = async () => {
    if (!novoComentario.trim()) return;

    setEnviando(true);

    const dadosComentario = {
      metaId: meta.id,
      alunoId: meta.alunoId,
      autorId: usuario.uid,
      autorNome: usuario.nome,
      autorTipo: usuario.tipo,
      texto: novoComentario.trim()
    };

    const resultado = await adicionarComentario(dadosComentario);

    if (resultado.sucesso) {
      setNovoComentario('');
      await carregarComentarios();
    }

    setEnviando(false);
  };

  const handleAlterarStatus = async (novoStatus) => {
    const resultado = await atualizarStatusMeta(meta.id, novoStatus);
    
    if (resultado.sucesso) {
      setStatus(novoStatus);
      if (onAtualizar) onAtualizar();
    }
  };

  const handleToggleConcluida = async () => {
    const resultado = meta.concluida
      ? await desconcluirMeta(meta.id)
      : await concluirMeta(meta.id);

    if (resultado.sucesso) {
      if (onAtualizar) onAtualizar();
      onClose();
    }
  };

  const formatarDataHora = (timestamp) => {
    if (!timestamp) return '';
    const data = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return data.toLocaleString('pt-BR', { 
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCorStatus = (status) => {
    switch (status) {
      case 'Pendente':
        return 'bg-gray-100 text-gray-700';
      case 'Em andamento':
        return 'bg-blue-100 text-blue-700';
      case 'Com dúvida':
        return 'bg-yellow-100 text-yellow-700';
      case 'Concluída':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-start justify-between px-6 py-4 bg-white border-b border-gray-200">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-800">
              {meta.assuntoTitulo || meta.assuntoId}
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              📅 {formatarDataHora(meta.dataProgramada)} • ⏱ {meta.tempoEstimado} min
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 text-2xl leading-none text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status da Meta */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Status da Meta
            </label>
            <div className="flex flex-wrap gap-2">
              {['Pendente', 'Em andamento', 'Com dúvida'].map((statusOption) => (
                <button
                  key={statusOption}
                  onClick={() => handleAlterarStatus(statusOption)}
                  disabled={meta.concluida}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    status === statusOption
                      ? getCorStatus(statusOption)
                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                  } ${meta.concluida ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {statusOption === 'Pendente' && '⏳'}
                  {statusOption === 'Em andamento' && '🔄'}
                  {statusOption === 'Com dúvida' && '❓'}
                  {' '}{statusOption}
                </button>
              ))}
            </div>
            {status === 'Com dúvida' && (
              <p className="mt-2 text-sm text-yellow-600">
                💡 Seu mentor será notificado sobre sua dúvida
              </p>
            )}
          </div>

          {/* Informações da Meta */}
          <div className="p-4 rounded-lg bg-gray-50">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Tipo de Estudo</p>
                <p className="font-medium capitalize">📚 {meta.tipoEstudo}</p>
              </div>
              <div>
                <p className="text-gray-600">Status de Conclusão</p>
                <p className="font-medium">
                  {meta.concluida ? '✅ Concluída' : '⏳ Pendente'}
                </p>
              </div>
            </div>
            {meta.observacoes && (
              <div className="pt-3 mt-3 border-t border-gray-200">
                <p className="text-sm text-gray-600">Observações</p>
                <p className="mt-1 text-gray-800">{meta.observacoes}</p>
              </div>
            )}
          </div>

          {/* Seção de Comentários */}
          <div>
            <h4 className="flex items-center gap-2 mb-3 text-lg font-semibold text-gray-800">
              💬 Comentários ({comentarios.length})
            </h4>

            {/* Lista de Comentários */}
            <div className="mb-4 space-y-3 overflow-y-auto max-h-64">
              {carregandoComentarios ? (
                <p className="py-4 text-center text-gray-500">Carregando...</p>
              ) : comentarios.length === 0 ? (
                <p className="py-4 text-center text-gray-500">
                  Nenhum comentário ainda. Seja o primeiro a comentar!
                </p>
              ) : (
                comentarios.map((comentario) => (
                  <div
                    key={comentario.id}
                    className={`p-3 rounded-lg ${
                      comentario.autorTipo === 'mentor'
                        ? 'bg-blue-50 border border-blue-200'
                        : 'bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {comentario.autorTipo === 'mentor' ? '👨‍🏫' : '👨‍🎓'}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">
                            {comentario.autorNome}
                          </p>
                          <p className="text-xs text-gray-500">
                            {comentario.autorTipo === 'mentor' ? 'Mentor' : 'Aluno'}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400">
                        {formatarDataHora(comentario.dataCriacao)}
                      </p>
                    </div>
                    <p className="text-sm text-gray-700">{comentario.texto}</p>
                  </div>
                ))
              )}
            </div>

            {/* Campo de Novo Comentário */}
            <div className="flex gap-2">
              <textarea
                value={novoComentario}
                onChange={(e) => setNovoComentario(e.target.value)}
                placeholder="Escreva um comentário ou tire uma dúvida..."
                rows="3"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg outline-none resize-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleEnviarComentario}
                disabled={!novoComentario.trim() || enviando}
                className="self-end px-6 font-semibold text-white transition bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {enviando ? '...' : 'Enviar'}
              </button>
            </div>
          </div>

          {/* Botão de Concluir Meta */}
          {!meta.concluida && (
            <button
              onClick={handleToggleConcluida}
              className="w-full py-3 font-semibold text-white transition bg-green-600 rounded-lg hover:bg-green-700"
            >
              ✓ Marcar como Concluída
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalMetaComComentarios;