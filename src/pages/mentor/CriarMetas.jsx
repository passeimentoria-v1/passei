import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { buscarCursosPorMentor } from '../../services/cursoService';
import { buscarAlunosPorMentor, criarMetasEmLote } from '../../services/metaService';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase.config';

export const CriarMetas = () => {
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [etapa, setEtapa] = useState(1); // 1: Selecionar aluno, 2: Selecionar assuntos, 3: Definir datas
  const [alunos, setAlunos] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [disciplinas, setDisciplinas] = useState([]);
  const [assuntos, setAssuntos] = useState([]);

  const [alunoSelecionado, setAlunoSelecionado] = useState(null);
  const [cursoSelecionado, setCursoSelecionado] = useState(null);
  const [assuntosSelecionados, setAssuntosSelecionados] = useState([]);

  const [dataInicio, setDataInicio] = useState('');
  const [tipoEstudo, setTipoEstudo] = useState('regular');
  const [observacoes, setObservacoes] = useState('');

  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    carregarAlunos();
    carregarCursos();
  }, []);

  const carregarAlunos = async () => {
    const resultado = await buscarAlunosPorMentor(usuario.uid);
    if (resultado.sucesso) {
      setAlunos(resultado.alunos);
    }
  };

  const carregarCursos = async () => {
    const resultado = await buscarCursosPorMentor(usuario.uid);
    if (resultado.sucesso) {
      setCursos(resultado.cursos);
    }
  };

  const carregarDisciplinas = async (cursoId) => {
    try {
      const disciplinasRef = collection(db, 'cursos/' + cursoId + '/disciplinas');
      const q = query(disciplinasRef, orderBy('ordem', 'asc'));
      const snapshot = await getDocs(q);

      const lista = [];
      snapshot.forEach((doc) => {
        lista.push({ id: doc.id, ...doc.data() });
      });

      setDisciplinas(lista);
    } catch (error) {
      console.error('Erro ao carregar disciplinas:', error);
    }
  };

  const carregarAssuntosDisciplina = async (cursoId, disciplinaId) => {
    try {
      const path = 'cursos/' + cursoId + '/disciplinas/' + disciplinaId + '/assuntos';
      const assuntosRef = collection(db, path);
      const q = query(assuntosRef, orderBy('ordem', 'asc'));
      const snapshot = await getDocs(q);

      const lista = [];
      snapshot.forEach((doc) => {
        lista.push({ 
          id: doc.id, 
          disciplinaId: disciplinaId,
          ...doc.data() 
        });
      });

      return lista;
    } catch (error) {
      console.error('Erro ao carregar assuntos:', error);
      return [];
    }
  };

  const handleSelecionarCurso = async (cursoId) => {
    setCursoSelecionado(cursoId);
    setCarregando(true);
    await carregarDisciplinas(cursoId);
    setCarregando(false);
  };

  const handleSelecionarDisciplina = async (disciplinaId) => {
    setCarregando(true);
    const assuntosDisciplina = await carregarAssuntosDisciplina(cursoSelecionado, disciplinaId);
    setAssuntos(prev => [...prev, ...assuntosDisciplina]);
    setCarregando(false);
  };

  const toggleAssunto = (assunto) => {
    const existe = assuntosSelecionados.find(a => a.id === assunto.id);
    if (existe) {
      setAssuntosSelecionados(assuntosSelecionados.filter(a => a.id !== assunto.id));
    } else {
      setAssuntosSelecionados([...assuntosSelecionados, assunto]);
    }
  };

  const handleCriarMetas = async () => {
    if (!dataInicio) {
      setErro('Selecione a data de início');
      return;
    }

    if (assuntosSelecionados.length === 0) {
      setErro('Selecione pelo menos um assunto');
      return;
    }

    setCarregando(true);
    setErro('');

    const dataAtual = new Date(dataInicio);
    const metas = assuntosSelecionados.map((assunto, index) => {
      const dataMeta = new Date(dataAtual);
      dataMeta.setDate(dataMeta.getDate() + index);

      return {
        alunoId: alunoSelecionado,
        cursoId: cursoSelecionado,
        disciplinaId: assunto.disciplinaId,
        assuntoId: assunto.id,
        assuntoTitulo: assunto.titulo,  // ← ADICIONADO!
        dataProgramada: dataMeta.toISOString().split('T')[0],
        tipoEstudo: tipoEstudo,
        tempoEstimado: assunto.tempos?.[tipoEstudo] || 0,
        observacoes: observacoes,
        mentorId: usuario.uid
      };
    });

    const resultado = await criarMetasEmLote(metas);

    if (resultado.sucesso) {
      setSucesso(true);
      setTimeout(() => {
        navigate('/mentor/dashboard');
      }, 2000);
    } else {
      setErro('Erro ao criar metas');
    }

    setCarregando(false);
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
          <h1 className="text-2xl font-bold text-blue-600">Criar Metas para Aluno</h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${etapa >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              1. Selecionar Aluno e Curso
            </span>
            <span className={`text-sm font-medium ${etapa >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              2. Selecionar Assuntos
            </span>
            <span className={`text-sm font-medium ${etapa >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              3. Definir Cronograma
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${(etapa / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        {erro && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {erro}
          </div>
        )}

        {sucesso && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
            ✓ Metas criadas com sucesso! Redirecionando...
          </div>
        )}

        {/* Etapa 1: Selecionar Aluno e Curso */}
        {etapa === 1 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Selecione o Aluno e o Curso</h2>

            <div className="space-y-4">
              {/* Selecionar Aluno */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Aluno</label>
                {alunos.length === 0 ? (
                  <p className="text-sm text-gray-500">Nenhum aluno cadastrado</p>
                ) : (
                  <select
                    value={alunoSelecionado || ''}
                    onChange={(e) => setAlunoSelecionado(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Selecione um aluno</option>
                    {alunos.map(aluno => (
                      <option key={aluno.id} value={aluno.id}>
                        {aluno.nome} - {aluno.email}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Selecionar Curso */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Curso/Edital</label>
                {cursos.length === 0 ? (
                  <p className="text-sm text-gray-500">Nenhum curso cadastrado</p>
                ) : (
                  <select
                    value={cursoSelecionado || ''}
                    onChange={(e) => handleSelecionarCurso(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    disabled={!alunoSelecionado}
                  >
                    <option value="">Selecione um curso</option>
                    {cursos.map(curso => (
                      <option key={curso.id} value={curso.id}>
                        {curso.nome}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <button
                onClick={() => setEtapa(2)}
                disabled={!alunoSelecionado || !cursoSelecionado}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Próximo
              </button>
            </div>
          </div>
        )}

        {/* Etapa 2: Selecionar Assuntos */}
        {etapa === 2 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Selecione os Assuntos</h2>

            {carregando ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : disciplinas.length === 0 ? (
              <p className="text-center text-gray-600 py-8">Nenhuma disciplina encontrada</p>
            ) : (
              <div className="space-y-3">
                {disciplinas.map(disciplina => (
                  <div key={disciplina.id} className="border border-gray-200 rounded-lg">
                    <button
                      onClick={() => handleSelecionarDisciplina(disciplina.id)}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
                    >
                      <span className="font-medium text-gray-800">{disciplina.nome}</span>
                      <span className="text-sm text-gray-500">
                        Carregar {disciplina.totalAssuntos} assuntos
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {assuntos.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold text-gray-800 mb-3">
                  Assuntos Carregados ({assuntosSelecionados.length} selecionados)
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {assuntos.map(assunto => {
                    const selecionado = assuntosSelecionados.find(a => a.id === assunto.id);
                    return (
                      <div
                        key={assunto.id}
                        onClick={() => toggleAssunto(assunto)}
                        className={`p-3 rounded-lg border cursor-pointer transition ${
                          selecionado
                            ? 'bg-blue-50 border-blue-300'
                            : 'bg-white border-gray-200 hover:border-blue-200'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={!!selecionado}
                            readOnly
                            className="mt-1 w-4 h-4"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800">{assunto.titulo}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              ⏱ Regular: {assunto.tempos?.regular || 0} min
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEtapa(1)}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Voltar
              </button>
              <button
                onClick={() => setEtapa(3)}
                disabled={assuntosSelecionados.length === 0}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Próximo
              </button>
            </div>
          </div>
        )}

        {/* Etapa 3: Definir Cronograma */}
        {etapa === 3 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Definir Cronograma</h2>

            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  ℹ️ Serão criadas <strong>{assuntosSelecionados.length} metas</strong>, uma por dia a partir da data inicial.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Início
                </label>
                <input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Estudo
                </label>
                <select
                  value={tipoEstudo}
                  onChange={(e) => setTipoEstudo(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="expresso">Expresso (rápido)</option>
                  <option value="regular">Regular (normal)</option>
                  <option value="calma">Calma (detalhado)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações (opcional)
                </label>
                <textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  rows="3"
                  placeholder="Adicione observações para o aluno..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setEtapa(2)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  Voltar
                </button>
                <button
                  onClick={handleCriarMetas}
                  disabled={carregando}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {carregando ? 'Criando...' : 'Criar Metas'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CriarMetas;