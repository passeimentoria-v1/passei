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
        <div className="flex items-center justify-between px-4 py-4 mx-auto max-w-7xl">
          <div>
            <h1 className="text-2xl font-bold text-blue-600">Passei - Mentor</h1>
            <p className="text-sm text-gray-600">Bem-vindo, {usuario.nome}</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-white transition bg-red-500 rounded-lg hover:bg-red-600"
          >
            Sair
          </button>
        </div>
      </header>

      <div className="px-4 py-8 mx-auto max-w-7xl">
        {/* Botões de Ação */}
        <div className="flex flex-wrap gap-3 mb-6">
          <Link
            to="/mentor/upload-edital"
            className="inline-flex items-center gap-2 px-6 py-3 font-semibold text-white transition bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <span>📚</span>
            <span>Novo Curso/Edital</span>
          </Link>
          <Link
            to="/mentor/criar-metas"
            className="inline-flex items-center gap-2 px-6 py-3 font-semibold text-white transition bg-green-600 rounded-lg hover:bg-green-700"
          >
            <span>🎯</span>
            <span>Criar Metas</span>
          </Link>
          <Link
            to="/mentor/convites"
            className="inline-flex items-center gap-2 px-6 py-3 font-semibold text-white transition bg-purple-600 rounded-lg hover:bg-purple-700"
          >
            <span>🎟️</span>
            <span>Gerenciar Convites</span>
          </Link>
          <Link
            to="/mentor/acompanhamento"
            className="inline-flex items-center gap-2 px-6 py-3 font-semibold text-white transition bg-indigo-600 rounded-lg hover:bg-indigo-700"
          >
            <span>📊</span>
            <span>Acompanhar Alunos</span>
          </Link>
          <button
            onClick={() => navigate('/mentor/duvidas')}
            className="inline-flex items-center gap-2 px-6 py-3 font-semibold text-white transition bg-yellow-600 rounded-lg hover:bg-yellow-700"
          >
            <span>❓</span>
            <span>Dúvidas dos Alunos</span>
          </button>
          <button
            onClick={() => navigate('/mentor/relatorios')}
            className="inline-flex items-center gap-2 px-6 py-3 font-semibold text-white transition bg-green-600 rounded-lg hover:bg-green-700"
          >
            <span>📊</span>
            <span>Relatórios</span>
          </button>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid gap-6 mb-6 md:grid-cols-3">
          <div className="p-6 bg-white rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Cursos</p>
                <p className="mt-1 text-3xl font-bold text-gray-800">{cursos.length}</p>
              </div>
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full">
                <span className="text-2xl">📚</span>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Alunos</p>
                <p className="mt-1 text-3xl font-bold text-gray-800">{alunos.length}</p>
              </div>
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full">
                <span className="text-2xl">👨‍🎓</span>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Metas Criadas</p>
                <p className="mt-1 text-3xl font-bold text-gray-800">0</p>
              </div>
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full">
                <span className="text-2xl">🎯</span>
              </div>
            </div>
          </div>
        </div>

        {erro && (
          <div className="p-3 mb-4 text-sm text-red-600 border border-red-200 rounded-lg bg-red-50">
            {erro}
          </div>
        )}

        {/* Lista de Alunos */}
        {alunos.length > 0 && (
          <div className="mb-6 bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Meus Alunos</h2>
            </div>
            <div className="p-6">
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {alunos.map(aluno => (
                  <div key={aluno.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
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
              <div className="py-8 text-center">
                <div className="w-12 h-12 mx-auto border-b-2 border-blue-600 rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-600">Carregando cursos...</p>
              </div>
            ) : cursos.length === 0 ? (
              <div className="py-8 text-center">
                <p className="mb-4 text-gray-600">Nenhum curso cadastrado ainda</p>
                <Link
                  to="/mentor/upload-edital"
                  className="inline-block px-6 py-2 text-white transition bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Criar Primeiro Curso
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {cursos.map((curso) => (
                  <div
                    key={curso.id}
                    className="p-4 transition border border-gray-200 rounded-lg cursor-pointer hover:shadow-md"
                    onClick={() => navigate('/mentor/curso/' + curso.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {curso.nome}
                      </h3>
                      <span className="px-2 py-1 text-xs text-green-700 bg-green-100 rounded-full">
                        Ativo
                      </span>
                    </div>

                    {curso.descricao && (
                      <p className="mb-3 text-sm text-gray-600">
                        {curso.descricao.substring(0, 100)}
                        {curso.descricao.length > 100 ? '...' : ''}
                      </p>
                    )}

                    <div className="flex items-center gap-4 mb-3 text-sm text-gray-500">
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