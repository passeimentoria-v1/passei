import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { buscarMetasAtrasadas, reprogramarMeta } from '../../services/metaService';

export const ReprogramarMetas = () => {
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [metas, setMetas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [reprogramando, setReprogramando] = useState(null);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  useEffect(() => {
    carregarMetasAtrasadas();
  }, []);

  const carregarMetasAtrasadas = async () => {
    setCarregando(true);
    const resultado = await buscarMetasAtrasadas(usuario.uid);

    if (resultado.sucesso) {
      setMetas(resultado.metas);
    } else {
      setErro(resultado.erro);
    }

    setCarregando(false);
  };

  const getProximoDia = () => {
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    amanha.setHours(0, 0, 0, 0);
    return amanha;
  };

  const handleReprogramar = async (metaId, assuntoTitulo) => {
    setErro('');
    setReprogramando(metaId);

    const proximoDia = getProximoDia();
    const resultado = await reprogramarMeta(metaId, proximoDia.toISOString());

    if (resultado.sucesso) {
      setSucesso(`"${assuntoTitulo}" reprogramada para amanhã com sucesso!`);
      carregarMetasAtrasadas();
      setTimeout(() => setSucesso(''), 3000);
    } else {
      setErro(resultado.erro);
    }

    setReprogramando(null);
  };

  const formatarData = (timestamp) => {
    if (!timestamp) return '';
    const data = timestamp.toDate();
    return data.toLocaleDateString('pt-BR');
  };

  const calcularDiasAtraso = (dataProgramada) => {
    if (!dataProgramada) return 0;
    const hoje = new Date();
    const programada = dataProgramada.toDate();
    const diff = Math.floor((hoje - programada) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  const getDataAmanha = () => {
    const amanha = getProximoDia();
    return amanha.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="flex items-center gap-4 px-4 py-4 mx-auto max-w-7xl">
          <button
            onClick={() => navigate('/aluno/metas')}
            className="text-gray-600 hover:text-gray-800"
          >
            ← Voltar
          </button>
          <h1 className="text-2xl font-bold text-blue-600">Reprogramar Metas Atrasadas</h1>
        </div>
      </header>

      <div className="max-w-4xl px-4 py-8 mx-auto">
        {sucesso && (
          <div className="p-4 mb-4 text-green-700 border border-green-200 rounded-lg bg-green-50">
            ✓ {sucesso}
          </div>
        )}

        {erro && (
          <div className="p-3 mb-4 text-sm text-red-600 border border-red-200 rounded-lg bg-red-50">
            {erro}
          </div>
        )}

        {carregando ? (
          <div className="p-8 bg-white rounded-lg shadow">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto border-b-2 border-blue-600 rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-600">Carregando metas atrasadas...</p>
            </div>
          </div>
        ) : metas.length === 0 ? (
          <div className="p-8 bg-white rounded-lg shadow">
            <div className="text-center">
              <div className="mb-4 text-6xl">✅</div>
              <h2 className="mb-2 text-xl font-semibold text-gray-800">
                Parabéns! Você não tem metas atrasadas!
              </h2>
              <p className="mb-4 text-gray-600">Continue mantendo o ritmo de estudos.</p>
              <button
                onClick={() => navigate('/aluno/metas')}
                className="px-6 py-2 text-white transition bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Ver Todas as Metas
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="p-4 mb-6 border border-blue-200 rounded-lg bg-blue-50">
              <div className="flex items-start gap-3">
                <span className="text-2xl">💡</span>
                <div>
                  <h3 className="mb-1 font-semibold text-blue-800">
                    Reprogramação Automática
                  </h3>
                  <p className="text-sm text-blue-700">
                    Você tem {metas.length} meta{metas.length > 1 ? 's' : ''} atrasada{metas.length > 1 ? 's' : ''}. 
                    Clique em "Reprogramar" e a meta será automaticamente reagendada para <strong>{getDataAmanha()}</strong>.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {metas.map((meta) => (
                <div key={meta.id} className="p-6 bg-white rounded-lg shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="mb-2 text-lg font-semibold text-gray-800">
                        {meta.assuntoTitulo}
                      </h3>
                      
                      {meta.observacoes && (
                        <p className="mb-3 text-sm text-gray-600">{meta.observacoes}</p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">📅 Data original:</span>
                          <span className="font-medium text-gray-800">
                            {formatarData(meta.dataProgramada)}
                          </span>
                        </div>
                        
                        <div className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-full">
                          {calcularDiasAtraso(meta.dataProgramada)} dias de atraso
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-3 text-sm">
                        <span className="text-gray-600">➡️ Nova data:</span>
                        <span className="font-semibold text-green-600">{getDataAmanha()}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleReprogramar(meta.id, meta.assuntoTitulo)}
                      disabled={reprogramando === meta.id}
                      className="flex items-center gap-2 px-4 py-2 text-white transition bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {reprogramando === meta.id ? (
                        <>
                          <div className="w-4 h-4 border-b-2 border-white rounded-full animate-spin"></div>
                          <span>Reprogramando...</span>
                        </>
                      ) : (
                        <>
                          <span>📅</span>
                          <span>Reprogramar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 mt-6 border border-yellow-200 rounded-lg bg-yellow-50">
              <p className="text-sm text-yellow-800">
                💡 <strong>Dica:</strong> As metas serão automaticamente reprogramadas para o próximo dia útil. 
                Organize seu tempo de estudos e cumpra suas metas dentro do prazo!
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ReprogramarMetas;