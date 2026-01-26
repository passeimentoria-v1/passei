import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { buscarCursosPorMentor } from '../../services/cursoService';
import { buscarAlunosPorMentor } from '../../services/metaService';

export const MentorDashboard = () => {
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();

  const [cursos, setCursos] = useState([]);
  const [alunos, setAlunos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setCarregando(true);
    
    const resultadoCursos = await buscarCursosPorMentor(usuario.uid);
    if (resultadoCursos.sucesso) {
      setCursos(resultadoCursos.cursos);
    } else {
      setErro(resultadoCursos.erro);
    }

    const resultadoAlunos = await buscarAlunosPorMentor(usuario.uid);
    if (resultadoAlunos.sucesso) {
      setAlunos(resultadoAlunos.alunos);
    }

    setCarregando(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const formatarData = (data) => {
    if (!data) return '';
    const date = data.toDate ? data.toDate() : new Date(data);
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-blue-600">Passei - Mentor</h1>
            <p className="text-sm text-gray-600">Bem-vindo, {usuario.nome}</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          >
            Sair
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Botões de Ação */}
        <div className="flex flex-wrap gap-3 mb-6">
          <Link
            to="/mentor/upload-edital"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition inline-flex items-center gap-2"
          >
            <span>📚</span>
            <span>Novo Curso/Edital</span>
          </Link>
          <Link
            to="/mentor/criar-metas"
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition inline-flex items-center gap-2"
          >
            <span>🎯</span>
            <span>Criar Metas</span>
          </Link>
          <Link
            to="/mentor/convites"
            className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition inline-flex items-center gap-2"
          >
            <span>🎟️</span>
            <span>Gerenciar Convites</span>
          </Link>
          <Link
            to="/mentor/acompanhamento"
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition inline-flex items-center gap-2"
          >
            <span>📊</span>
            <span>Acompanhar Alunos</span>
          </Link>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid gap-6 md:grid-cols-3 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Cursos</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{cursos.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">📚</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Alunos</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{alunos.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">👨‍🎓</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Metas Criadas</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">0</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">🎯</span>
              </div>
            </div>
          </div>
        </div>

        {erro && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {erro}
          </div>
        )}

        {/* Lista de Alunos */}
        {alunos.length > 0 && (
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Meus Alunos</h2>
            </div>
            <div className="p-6">
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {alunos.map(aluno => (
                  <div key={aluno.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-xl">👨‍🎓</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{aluno.nome}</p>
                        <p className="text-sm text-gray-500">{aluno.email}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Lista de Cursos */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Meus Cursos</h2>
          </div>

          <div className="p-6">
            {carregando ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Carregando cursos...</p>
              </div>
            ) : cursos.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">Nenhum curso cadastrado ainda</p>
                <Link
                  to="/mentor/upload-edital"
                  className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Criar Primeiro Curso
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {cursos.map((curso) => (
                  <div
                    key={curso.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer"
                    onClick={() => navigate('/mentor/curso/' + curso.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-800 text-lg">
                        {curso.nome}
                      </h3>
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                        Ativo
                      </span>
                    </div>

                    {curso.descricao && (
                      <p className="text-sm text-gray-600 mb-3">
                        {curso.descricao.substring(0, 100)}
                        {curso.descricao.length > 100 ? '...' : ''}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                      <div className="flex items-center gap-1">
                        <span>📚</span>
                        <span>{curso.totalDisciplinas} disciplinas</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>📝</span>
                        <span>{curso.totalAssuntos} assuntos</span>
                      </div>
                    </div>

                    <div className="text-xs text-gray-400">
                      Criado em {formatarData(curso.dataCriacao)}
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

export default MentorDashboard;