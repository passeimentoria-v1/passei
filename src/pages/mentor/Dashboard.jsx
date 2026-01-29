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
          
          {/* Botão de Configurações Discreto */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/mentor/configuracoes')}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
              title="Configurações"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-white transition bg-red-500 rounded-lg hover:bg-red-600"
            >
              Sair
            </button>
          </div>
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

        {/* Lista de Alunos COM FOTOS */}
        {alunos.length > 0 && (
          <div className="mb-6 bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Meus Alunos</h2>
            </div>
            <div className="p-6">
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {alunos.map(aluno => {
                  // Gerar iniciais do nome
                  const iniciais = aluno.nome 
                    ? aluno.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                    : '?';
                  
                  return (
                    <div 
                      key={aluno.id} 
                      className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition cursor-pointer"
                      onClick={() => navigate(`/mentor/aluno/${aluno.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        {/* Foto de Perfil ou Avatar com Iniciais */}
                        <div className="relative flex-shrink-0">
                          {aluno.fotoURL ? (
                            // Se tem foto, mostra a foto
                            <img
                              src={aluno.fotoURL}
                              alt={aluno.nome}
                              className="w-12 h-12 rounded-full object-cover border-2 border-blue-200"
                            />
                          ) : (
                            // Se não tem foto, mostra avatar com iniciais
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-2 border-blue-200">
                              <span className="text-white text-sm font-bold">{iniciais}</span>
                            </div>
                          )}
                          
                          {/* Indicador de Status Online (opcional) */}
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                        </div>
                        
                        {/* Informações do Aluno */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 truncate">{aluno.nome}</p>
                          <p className="text-sm text-gray-500 truncate">{aluno.email}</p>
                        </div>
                        
                        {/* Seta indicando clicável */}
                        <div className="text-gray-400">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
                        <span>📄</span>
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