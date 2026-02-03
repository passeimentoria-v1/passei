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

  const [etapa, setEtapa] = useState(1);
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

  // ✅ NOVAS: Configurações avançadas
  const [tempoPorDisciplina, setTempoPorDisciplina] = useState(60);
  const [disciplinasPorDia, setDisciplinasPorDia] = useState(3);

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

  // ✅ NOVA: Selecionar todos os assuntos de uma disciplina
  const selecionarTodosDisciplina = (disciplinaId) => {
    const assuntosDaDisciplina = assuntos.filter(a => a.disciplinaId === disciplinaId && !a.oculto);
    const novosAssuntos = [...assuntosSelecionados];
    
    assuntosDaDisciplina.forEach(assunto => {
      if (!novosAssuntos.find(a => a.id === assunto.id)) {
        novosAssuntos.push(assunto);
      }
    });
    
    setAssuntosSelecionados(novosAssuntos);
  };

  // ✅ NOVA: Desselecionar todos de uma disciplina
  const desselecionarTodosDisciplina = (disciplinaId) => {
    setAssuntosSelecionados(
      assuntosSelecionados.filter(a => a.disciplinaId !== disciplinaId)
    );
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

    // TODOS OS ASSUNTOS TERÃO A MESMA DATA
    // Usa a string diretamente para evitar problemas de timezone
    const metas = assuntosSelecionados.map((assunto) => {
      return {
        alunoId: alunoSelecionado,
        cursoId: cursoSelecionado,
        disciplinaId: assunto.disciplinaId,
        assuntoId: assunto.id,
        assuntoTitulo: assunto.titulo,
        dataProgramada: dataInicio, // USA A STRING DIRETAMENTE (formato: "2026-01-31")
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
        <div className="flex items-center gap-4 px-4 py-4 mx-auto max-w-7xl">
          <button
            onClick={() => navigate('/mentor/dashboard')}
            className="text-gray-600 hover:text-gray-800"
          >
            ← Voltar
          </button>
          <h1 className="text-2xl font-bold text-blue-600">Criar Metas para Aluno</h1>
        </div>
      </header>

      <div className="max-w-4xl px-4 py-8 mx-auto">
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
          <div className="w-full h-2 bg-gray-200 rounded-full">
            <div
              className="h-2 transition-all bg-blue-600 rounded-full"
              style={{ width: `${(etapa / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        {erro && (
          <div className="p-3 mb-4 text-sm text-red-600 border border-red-200 rounded-lg bg-red-50">
            {erro}
          </div>
        )}

        {sucesso && (
          <div className="p-3 mb-4 text-green-700 border border-green-200 rounded-lg bg-green-50">
            ✓ Metas criadas com sucesso! Redirecionando...
          </div>
        )}

        {/* Etapa 1: Selecionar Aluno e Curso */}
        {etapa === 1 && (
          <div className="p-6 bg-white rounded-lg shadow">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">Selecione o Aluno e o Curso</h2>

            <div className="space-y-4">
              {/* Selecionar Aluno */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Aluno</label>
                {alunos.length === 0 ? (
                  <p className="text-sm text-gray-500">Nenhum aluno cadastrado</p>
                ) : (
                  <select
                    value={alunoSelecionado || ''}
                    onChange={(e) => setAlunoSelecionado(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
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
                <label className="block mb-2 text-sm font-medium text-gray-700">Curso/Edital</label>
                {cursos.length === 0 ? (
                  <p className="text-sm text-gray-500">Nenhum curso cadastrado</p>
                ) : (
                  <select
                    value={cursoSelecionado || ''}
                    onChange={(e) => handleSelecionarCurso(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full py-3 font-semibold text-white transition bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Próximo
              </button>
            </div>
          </div>
        )}

        {/* Etapa 2: Selecionar Assuntos */}
        {etapa === 2 && (
          <div className="p-6 bg-white rounded-lg shadow">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">Selecione os Assuntos</h2>

            {carregando ? (
              <div className="py-8 text-center">
                <div className="w-12 h-12 mx-auto border-b-2 border-blue-600 rounded-full animate-spin"></div>
              </div>
            ) : disciplinas.length === 0 ? (
              <p className="py-8 text-center text-gray-600">Nenhuma disciplina encontrada</p>
            ) : (
              <div className="space-y-3">
                {disciplinas.map(disciplina => (
                  <div key={disciplina.id} className="border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between p-4">
                      <button
                        onClick={() => handleSelecionarDisciplina(disciplina.id)}
                        className="flex-1 font-medium text-left text-gray-800"
                      >
                        <span className="font-medium text-gray-800">{disciplina.nome}</span>
                        <span className="ml-2 text-sm text-gray-500">
                          ({disciplina.totalAssuntos} assuntos)
                        </span>
                      </button>

                      {/* ✅ NOVOS: Botões de seleção múltipla */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => selecionarTodosDisciplina(disciplina.id)}
                          className="px-3 py-1 text-xs text-green-700 transition bg-green-100 rounded hover:bg-green-200"
                        >
                          ☑️ Selecionar Todos
                        </button>
                        <button
                          onClick={() => desselecionarTodosDisciplina(disciplina.id)}
                          className="px-3 py-1 text-xs text-gray-700 transition bg-gray-100 rounded hover:bg-gray-200"
                        >
                          ☐ Desselecionar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {assuntos.length > 0 && (
              <div className="mt-6">
                <h3 className="mb-3 font-semibold text-gray-800">
                  Assuntos Carregados ({assuntosSelecionados.length} selecionados)
                </h3>
                <div className="space-y-2 overflow-y-auto max-h-96">
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
                            className="w-4 h-4 mt-1"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800">{assunto.titulo}</p>
                            <p className="mt-1 text-xs text-gray-500">
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
                className="flex-1 py-3 font-semibold text-gray-700 transition bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Voltar
              </button>
              <button
                onClick={() => setEtapa(3)}
                disabled={assuntosSelecionados.length === 0}
                className="flex-1 py-3 font-semibold text-white transition bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Próximo
              </button>
            </div>
          </div>
        )}

        {/* Etapa 3: Definir Cronograma */}
        {etapa === 3 && (
          <div className="p-6 bg-white rounded-lg shadow">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">Definir Cronograma</h2>

            <div className="space-y-4">
              <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                <p className="text-sm text-blue-800">
                  ℹ️ Serão criadas <strong>{assuntosSelecionados.length} metas</strong> para a mesma data.
                </p>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Data para as Metas
                </label>
                <input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Tipo de Estudo
                </label>
                <select
                  value={tipoEstudo}
                  onChange={(e) => setTipoEstudo(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="expresso">Expresso (rápido)</option>
                  <option value="regular">Regular (normal)</option>
                  <option value="calma">Calma (detalhado)</option>
                </select>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Observações (opcional)
                </label>
                <textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  rows="3"
                  placeholder="Adicione observações para o aluno..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* ✅ NOVO: Configurações Avançadas */}
              <div className="pt-4 mt-4 border-t border-gray-200">
                <h3 className="mb-3 font-semibold text-gray-800">⚙️ Configurações Avançadas</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      Tempo máximo por disciplina (min)
                    </label>
                    <input
                      type="number"
                      value={tempoPorDisciplina}
                      onChange={(e) => setTempoPorDisciplina(e.target.value)}
                      min="15"
                      max="180"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">Tempo máximo de estudo por matéria</p>
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      Disciplinas por dia
                    </label>
                    <input
                      type="number"
                      value={disciplinasPorDia}
                      onChange={(e) => setDisciplinasPorDia(e.target.value)}
                      min="1"
                      max="10"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">Quantas matérias diferentes por dia</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setEtapa(2)}
                  className="flex-1 py-3 font-semibold text-gray-700 transition bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Voltar
                </button>
                <button
                  onClick={handleCriarMetas}
                  disabled={carregando}
                  className="flex-1 py-3 font-semibold text-white transition bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
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