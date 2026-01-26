import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { criarConvite, buscarConvitesMentor, desativarConvite } from '../../services/conviteService';

export const Convites = () => {
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [convites, setConvites] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [criando, setCriando] = useState(false);

  useEffect(() => {
    carregarConvites();
  }, []);

  const carregarConvites = async () => {
    const resultado = await buscarConvitesMentor(usuario.uid);
    if (resultado.sucesso) {
      setConvites(resultado.convites);
    }
    setCarregando(false);
  };

  const handleCriarConvite = async () => {
    setCriando(true);
    const resultado = await criarConvite(usuario.uid, usuario.nome);
    
    if (resultado.sucesso) {
      carregarConvites();
    }
    
    setCriando(false);
  };

  const handleDesativar = async (conviteId) => {
    if (confirm('Deseja realmente desativar este convite?')) {
      await desativarConvite(conviteId);
      carregarConvites();
    }
  };

  const copiarCodigo = (codigo) => {
    navigator.clipboard.writeText(codigo);
    alert('Código copiado!');
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
          <h1 className="text-2xl font-bold text-blue-600">Códigos de Convite</h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Gerar Novo Convite</h2>
          <p className="text-sm text-gray-600 mb-4">
            Crie um código de convite para que seus alunos possam se cadastrar na plataforma.
          </p>
          <button
            onClick={handleCriarConvite}
            disabled={criando}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-300"
          >
            {criando ? 'Gerando...' : '+ Gerar Código'}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Meus Convites</h2>
          </div>

          <div className="p-6">
            {carregando ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : convites.length === 0 ? (
              <p className="text-center text-gray-600 py-8">Nenhum convite criado</p>
            ) : (
              <div className="space-y-3">
                {convites.map(convite => (
                  <div key={convite.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl font-mono font-bold text-blue-600">
                            {convite.codigo}
                          </span>
                          <button
                            onClick={() => copiarCodigo(convite.codigo)}
                            className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded hover:bg-gray-200 transition"
                          >
                            📋 Copiar
                          </button>
                        </div>
                        <p className="text-sm text-gray-600">
                          Usos restantes: <strong>{convite.usosRestantes}</strong>
                        </p>
                      </div>
                      <button
                        onClick={() => handleDesativar(convite.id)}
                        className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition text-sm"
                      >
                        Desativar
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

export default Convites;