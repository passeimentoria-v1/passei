import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase.config';

export const CursoDetalhes = () => {
  const { cursoId } = useParams();
  const navigate = useNavigate();

  const [curso, setCurso] = useState(null);
  const [disciplinas, setDisciplinas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [disciplinaSelecionada, setDisciplinaSelecionada] = useState(null);
  const [assuntos, setAssuntos] = useState([]);

  useEffect(() => {
    carregarCurso();
    carregarDisciplinas();
  }, []);

  const carregarCurso = async () => {
    try {
      const cursoDoc = await getDoc(doc(db, 'cursos', cursoId));
      if (cursoDoc.exists()) {
        setCurso({ id: cursoDoc.id, ...cursoDoc.data() });
      }
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const carregarDisciplinas = async () => {
    try {
      const disciplinasRef = collection(db, 'cursos/' + cursoId + '/disciplinas');
      const q = query(disciplinasRef, orderBy('ordem', 'asc'));
      const snapshot = await getDocs(q);

      const lista = [];
      snapshot.forEach((doc) => {
        lista.push({ id: doc.id, ...doc.data() });
      });

      setDisciplinas(lista);
      setCarregando(false);
    } catch (error) {
      console.error('Erro:', error);
      setCarregando(false);
    }
  };

  const carregarAssuntos = async (disciplinaId) => {
    try {
      const path = 'cursos/' + cursoId + '/disciplinas/' + disciplinaId + '/assuntos';
      const assuntosRef = collection(db, path);
      const q = query(assuntosRef, orderBy('ordem', 'asc'));
      const snapshot = await getDocs(q);

      const lista = [];
      snapshot.forEach((doc) => {
        lista.push({ id: doc.id, ...doc.data() });
      });

      setAssuntos(lista);
      setDisciplinaSelecionada(disciplinaId);
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const toggleDisciplina = (disciplinaId) => {
    if (disciplinaSelecionada === disciplinaId) {
      setDisciplinaSelecionada(null);
      setAssuntos([]);
    } else {
      carregarAssuntos(disciplinaId);
    }
  };

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!curso) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600">Curso não encontrado</p>
      </div>
    );
  }

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
          <div>
            <h1 className="text-2xl font-bold text-blue-600">{curso.nome}</h1>
            <p className="text-sm text-gray-600">
              {curso.totalDisciplinas} disciplinas - {curso.totalAssuntos} assuntos
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Informações</h2>
          
          {curso.descricao && (
            <div className="mb-3">
              <p className="text-sm text-gray-600">Descrição</p>
              <p className="text-gray-800">{curso.descricao}</p>
            </div>
          )}

          {curso.arquivoOriginal && curso.arquivoOriginal.url && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Arquivo Original</p>

              <a
                href={curso.arquivoOriginal.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {curso.arquivoOriginal.nome}
              </a>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Disciplinas</h2>
          </div>

          <div className="p-6">
            {disciplinas.length === 0 && (
              <p className="text-center text-gray-600 py-8">Nenhuma disciplina</p>
            )}

            <div className="space-y-2">
              {disciplinas.map((disciplina) => (
                <div key={disciplina.id} className="border border-gray-200 rounded-lg">
                  <button
                    onClick={() => toggleDisciplina(disciplina.id)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: disciplina.cor || '#3B82F6' }}
                      ></div>
                      <span className="font-medium text-gray-800">{disciplina.nome}</span>
                      <span className="text-sm text-gray-500">
                        ({disciplina.totalAssuntos})
                      </span>
                    </div>
                    <span className="text-gray-400">
                      {disciplinaSelecionada === disciplina.id ? '▲' : '▼'}
                    </span>
                  </button>

                  {disciplinaSelecionada === disciplina.id && (
                    <div className="px-4 pb-4 border-t border-gray-200">
                      {assuntos.length === 0 && (
                        <p className="text-center text-gray-500 py-4">Carregando...</p>
                      )}

                      {assuntos.length > 0 && (
                        <div className="space-y-2 mt-3">
                          {assuntos.map((assunto) => (
                            <div key={assunto.id} className="bg-gray-50 rounded p-3">
                              <p className="text-gray-800 font-medium text-sm">
                                {assunto.titulo}
                              </p>
                              <div className="flex gap-4 mt-2 text-xs text-gray-600">
                                <span>⏱ {assunto.tempos?.regular || 0} min</span>
                                <span>📝 {assunto.numeroQuestoes || 0} questões</span>
                                {assunto.suplementar && (
                                  <span className="text-orange-600">⭐ Suplementar</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CursoDetalhes;