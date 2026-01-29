import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  criarConvite, 
  buscarConvitesMentor, 
  desativarConvite 
} from '../../services/conviteService';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase.config';

export const Convites = () => {
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [convites, setConvites] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [cursoSelecionado, setCursoSelecionado] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [gerandoConvite, setGerandoConvite] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setCarregando(true);
    
    // Carregar cursos
    const cursosRef = collection(db, 'cursos');
    const qCursos = query(cursosRef, where('ativo', '==', true));
    const snapshotCursos = await getDocs(qCursos);
    const listaCursos = snapshotCursos.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setCursos(listaCursos);
    
    // Carregar convites
    const resultado = await buscarConvitesMentor(usuario.uid);
    if (resultado.sucesso) {
      setConvites(resultado.convites);
    }
    
    setCarregando(false);
  };

  const handleGerarConvite = async () => {
    if (!cursoSelecionado) {
      alert('Selecione um curso antes de gerar o convite');
      return;
    }

    setGerandoConvite(true);
    
    const resultado = await criarConvite(usuario.uid, cursoSelecionado);
    
    if (resultado.sucesso) {
      alert(`Convite criado com sucesso!\n\nCódigo: ${resultado.codigo}\n\nCompartilhe este código com seu aluno.`);
      carregarDados();
      setCursoSelecionado('');
    } else {
      alert('Erro ao criar convite');
    }
    
    setGerandoConvite(false);
  };

  const handleDesativar = async (conviteId) => {
    if (window.confirm('Deseja realmente desativar este convite?')) {
      const resultado = await desativarConvite(conviteId);
      
      if (resultado.sucesso) {
        carregarDados();
      }
    }
  };

  const copiarCodigo = (codigo) => {
    navigator.clipboard.writeText(codigo);
    alert('Código copiado para a área de transferência!');
  };

  const formatarData = (timestamp) => {
    if (!timestamp) return '-';
    return timestamp.toDate().toLocaleDateString('pt-BR');
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
          <h1 className="text-2xl font-bold text-blue-600">Convites</h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Gerar Novo Convite */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Gerar Novo Convite</h2>
          
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selecione o Curso/Edital *
              </label>
              <select
                value={cursoSelecionado}
                onChange={(e) => setCursoSelecionado(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Selecione um curso</option>
                {cursos.map(curso => (
                  <option key={curso.id} value={curso.id}>
                    {curso.nome}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={handleGerarConvite}
                disabled={gerandoConvite || !cursoSelecionado}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {gerandoConvite ? 'Gerando...' : 'Gerar Convite'}
              </button>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
            <p>💡 <strong>Dica:</strong> O aluno será automaticamente matriculado no curso selecionado ao aceitar o convite.</p>
          </div>
        </div>

        {/* Lista de Convites */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Seus Convites</h2>
          </div>

          <div className="p-6">
            {carregando ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Carregando...</p>
              </div>
            ) : convites.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Nenhum convite criado ainda</p>
              </div>
            ) : (
              <div className="space-y-3">
                {convites.map(convite => (
                  <div 
                    key={convite.id}
                    className={`border rounded-lg p-4 ${
                      convite.ativo 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <code className="px-3 py-1 bg-gray-800 text-white rounded-lg font-mono text-lg font-bold">
                            {convite.codigo}
                          </code>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            convite.ativo 
                              ? 'bg-green-600 text-white' 
                              : 'bg-gray-600 text-white'
                          }`}>
                            {convite.ativo ? 'Ativo' : 'Utilizado'}
                          </span>
                          {convite.cursoNome && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                              📚 {convite.cursoNome}
                            </span>
                          )}
                        </div>
                        
                        <div className="text-sm text-gray-600">
                          <p>Criado em: {formatarData(convite.dataCriacao)}</p>
                          {!convite.ativo && convite.dataUtilizado && (
                            <p>Utilizado em: {formatarData(convite.dataUtilizado)}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {convite.ativo && (
                          <>
                            <button
                              onClick={() => copiarCodigo(convite.codigo)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                            >
                              Copiar
                            </button>
                            <button
                              onClick={() => handleDesativar(convite.id)}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                            >
                              Desativar
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Instruções */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">📋 Como funciona?</h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Selecione o curso em que o aluno será matriculado</li>
            <li>Clique em "Gerar Convite" para criar um código único</li>
            <li>Compartilhe o código com seu aluno</li>
            <li>O aluno usa o código no cadastro para se vincular a você automaticamente</li>
            <li>Após usado, o convite é automaticamente desativado</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default Convites;