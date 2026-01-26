import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  adicionarComentario, 
  buscarComentariosMeta 
} from '../services/comentarioService';
import { atualizarStatusMeta } from '../services/metaService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase.config';

export const ModalMetaComComentariosMentor = ({ meta, onClose, onAtualizar }) => {
  const { usuario } = useAuth();
  const [comentarios, setComentarios] = useState([]);
  const [novoComentario, setNovoComentario] = useState('');
  const [status, setStatus] = useState(meta.status || 'Com dúvida');
  const [carregandoComentarios, setCarregandoComentarios] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [aluno, setAluno] = useState(null);

  useEffect(() => {
    carregarDados();
  }, [meta.id]);

  const carregarDados = async () => {
    setCarregandoComentarios(true);
    
    // Carregar comentários
    const resultadoComentarios = await buscarComentariosMeta(meta.id);
    if (resultadoComentarios.sucesso) {
      setComentarios(resultadoComentarios.comentarios);
    }

    // Carregar dados do aluno
    try {
      const alunoDoc = await getDoc(doc(db, 'users', meta.alunoId));
      if (alunoDoc.exists()) {
        setAluno({ id: alunoDoc.id, ...alunoDoc.data() });
      }
    } catch (error) {
      console.error('Erro ao carregar aluno:', error);
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
      autorTipo: 'mentor',
      texto: novoComentario.trim()
    };

    const resultado = await adicionarComentario(dadosComentario);

    if (resultado.sucesso) {
      setNovoComentario('');
      await carregarDados();
    }

    setEnviando(false);
  };

  const handleResolverDuvida = async () => {
    const resultado = await atualizarStatusMeta(meta.id, 'Em andamento');
    
    if (resultado.sucesso) {
      setStatus('Em andamento');
      if (onAtualizar) onAtualizar();
      
      // Adicionar comentário automático
      const dadosComentario = {
        metaId: meta.id,
        alunoId: meta.alunoId,
        autorId: usuario.uid,
        autorNome: usuario.nome,
        autorTipo: 'mentor',
        texto: '✅ Dúvida marcada como resolvida pelo mentor.'
      };
      await adicionarComentario(dadosComentario);
      await carregarDados();
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

  const formatarData = (timestamp) => {
    if (!timestamp) return '';
    const data = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return data.toLocaleDateString('pt-BR', { 
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 px-6 py-4 bg-white border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 text-sm font-medium text-yellow-700 bg-yellow-100 rounded-full">
                  ❓ Dúvida do Aluno
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-800">
                {meta.assuntoTitulo || meta.assuntoId}
              </h3>
              {aluno && (
                <p className="mt-1 text-sm text-gray-600">
                  👨‍🎓 Aluno: <strong>{aluno.nome}</strong> ({aluno.email})
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="ml-4 text-2xl leading-none text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Informações da Meta */}
          <div className="p-4 rounded-lg bg-gray-50">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Data Programada</p>
                <p className="font-medium">📅 {formatarData(meta.dataProgramada)}</p>
              </div>
              <div>
                <p className="text-gray-600">Tempo Estimado</p>
                <p className="font-medium">⏱ {meta.tempoEstimado} min</p>
              </div>
              <div>
                <p className="text-gray-600">Tipo de Estudo</p>
                <p className="font-medium capitalize">📚 {meta.tipoEstudo}</p>
              </div>
              <div>
                <p className="text-gray-600">Status Atual</p>
                <p className="font-medium">
                  {status === 'Com dúvida' && '❓ Com Dúvida'}
                  {status === 'Em andamento' && '🔄 Em Andamento'}
                  {status === 'Pendente' && '⏳ Pendente'}
                  {meta.concluida && '✅ Concluída'}
                </p>
              </div>
            </div>
            {meta.observacoes && (
              <div className="pt-3 mt-3 border-t border-gray-200">
                <p className="text-sm text-gray-600">Observações do Aluno</p>
                <p className="mt-1 text-gray-800">{meta.observacoes}</p>
              </div>
            )}
          </div>

          {/* Botão de Resolver Dúvida */}
          {status === 'Com dúvida' && (
            <button
              onClick={handleResolverDuvida}
              className="w-full py-3 font-semibold text-white transition bg-green-600 rounded-lg hover:bg-green-700"
            >
              ✅ Marcar Dúvida como Resolvida
            </button>
          )}

          {/* Seção de Comentários */}
          <div>
            <h4 className="flex items-center gap-2 mb-3 text-lg font-semibold text-gray-800">
              💬 Conversas ({comentarios.length})
            </h4>

            {/* Lista de Comentários */}
            <div className="mb-4 space-y-3 overflow-y-auto max-h-96">
              {carregandoComentarios ? (
                <p className="py-4 text-center text-gray-500">Carregando...</p>
              ) : comentarios.length === 0 ? (
                <div className="py-8 text-center rounded-lg bg-gray-50">
                  <p className="mb-2 text-gray-500">
                    Nenhum comentário ainda.
                  </p>
                  <p className="text-sm text-gray-400">
                    Seja o primeiro a responder à dúvida do aluno!
                  </p>
                </div>
              ) : (
                comentarios.map((comentario) => (
                  <div
                    key={comentario.id}
                    className={`p-4 rounded-lg ${
                      comentario.autorTipo === 'mentor'
                        ? 'bg-blue-50 border-l-4 border-blue-500'
                        : 'bg-yellow-50 border-l-4 border-yellow-500'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">
                          {comentario.autorTipo === 'mentor' ? '👨‍🏫' : '👨‍🎓'}
                        </span>
                        <div>
                          <p className="font-semibold text-gray-800">
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
                    <p className="text-gray-700">{comentario.texto}</p>
                  </div>
                ))
              )}
            </div>

            {/* Campo de Resposta */}
            <div className="pt-4 border-t border-gray-200">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Responder ao aluno
              </label>
              <div className="flex gap-2">
                <textarea
                  value={novoComentario}
                  onChange={(e) => setNovoComentario(e.target.value)}
                  placeholder="Digite sua resposta ou orientação..."
                  rows="4"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg outline-none resize-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={handleEnviarComentario}
                disabled={!novoComentario.trim() || enviando}
                className="w-full py-3 mt-2 font-semibold text-white transition bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {enviando ? 'Enviando...' : '📤 Enviar Resposta'}
              </button>
            </div>
          </div>

          {/* Sugestões de Resposta */}
          <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
            <p className="mb-2 text-sm font-medium text-blue-800">
              💡 Sugestões de resposta:
            </p>
            <div className="space-y-1 text-sm text-blue-700">
              <button
                onClick={() => setNovoComentario('Ótima pergunta! Vou te ajudar com isso...')}
                className="block w-full p-2 text-left transition rounded hover:bg-blue-100"
              >
                "Ótima pergunta! Vou te ajudar com isso..."
              </button>
              <button
                onClick={() => setNovoComentario('Sugiro revisar o material sobre...')}
                className="block w-full p-2 text-left transition rounded hover:bg-blue-100"
              >
                "Sugiro revisar o material sobre..."
              </button>
              <button
                onClick={() => setNovoComentario('Vamos esclarecer esse ponto juntos...')}
                className="block w-full p-2 text-left transition rounded hover:bg-blue-100"
              >
                "Vamos esclarecer esse ponto juntos..."
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalMetaComComentariosMentor;