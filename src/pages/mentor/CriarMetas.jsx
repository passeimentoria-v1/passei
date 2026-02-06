import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { buscarCursosPorMentor } from '../../services/cursoService';
import { buscarAlunosPorMentor, criarMetasEmLote } from '../../services/metaService';
import { buscarConfiguracoesEstudo } from '../../services/Userservice';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase.config';
import { distribuirMetasAutomaticamente, converterParaMetas } from '../../utils/algoritmoDistribuicao';

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

  // ✅ NOVOS: Estados para distribuição automática
  const [configAluno, setConfigAluno] = useState(null);
  const [modoDistribuicao, setModoDistribuicao] = useState('automatico');
  const [distribuicao, setDistribuicao] = useState(null);
  const [mostrarPreview, setMostrarPreview] = useState(false);

  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    carregarAlunos();
    carregarCursos();
  }, []);

  // ✅ Carregar configurações quando aluno é selecionado
  useEffect(() => {
    if (alunoSelecionado) {
      carregarConfig();
    }
  }, [alunoSelecionado]);

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

  const carregarConfig = async () => {
    const resultado = await buscarConfiguracoesEstudo(alunoSelecionado);
    setConfigAluno(resultado.sucesso ? resultado.configuracoes : {
      diasPorSemana: 5,
      horasPorDia: 4
    });
  };

  const carregarDisciplinas = async (cursoId) => {
    try {
      const ref = collection(db, `cursos/${cursoId}/disciplinas`);
      const q = query(ref, orderBy('ordem', 'asc'));
      const snapshot = await getDocs(q);
      const lista = [];
      snapshot.forEach(doc => lista.push({ id: doc.id, ...doc.data() }));
      setDisciplinas(lista);
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const carregarAssuntosDisciplina = async (cursoId, disciplinaId) => {
    try {
      const ref = collection(db, `cursos/${cursoId}/disciplinas/${disciplinaId}/assuntos`);
      const q = query(ref, orderBy('ordem', 'asc'));
      const snapshot = await getDocs(q);
      const lista = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        if (!data.oculto) {
          lista.push({ id: doc.id, disciplinaId, ...data });
        }
      });
      return lista;
    } catch (error) {
      console.error('Erro:', error);
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
    const novos = await carregarAssuntosDisciplina(cursoSelecionado, disciplinaId);
    setAssuntos(prev => [...prev, ...novos]);
    setCarregando(false);
  };

  const toggleAssunto = (assunto) => {
    setAssuntosSelecionados(prev =>
      prev.find(a => a.id === assunto.id)
        ? prev.filter(a => a.id !== assunto.id)
        : [...prev, assunto]
    );
  };

  const selecionarTodosDisciplina = (disciplinaId) => {
    const daDisc = assuntos.filter(a => a.disciplinaId === disciplinaId);
    const novos = [...assuntosSelecionados];
    daDisc.forEach(a => {
      if (!novos.find(n => n.id === a.id)) novos.push(a);
    });
    setAssuntosSelecionados(novos);
  };

  const desselecionarTodosDisciplina = (disciplinaId) => {
    setAssuntosSelecionados(prev => prev.filter(a => a.disciplinaId !== disciplinaId));
  };

  // ✅ Calcular distribuição automática
  const handleCalcularDistribuicao = () => {
    if (!dataInicio) {
      setErro('Selecione a data de início');
      return;
    }

    setCarregando(true);
    setErro('');

    const resultado = distribuirMetasAutomaticamente({
      assuntos: assuntosSelecionados,
      configuracoes: configAluno,
      dataInicio,
      tipoEstudo
    });

    if (resultado.sucesso) {
      setDistribuicao(resultado.distribuicao);
      setMostrarPreview(true);
    } else {
      setErro(resultado.erro);
    }

    setCarregando(false);
  };

  // ✅ Criar metas automático
  const handleCriarMetasAuto = async () => {
    setCarregando(true);
    
    const metas = converterParaMetas(
      distribuicao,
      alunoSelecionado,
      cursoSelecionado,
      usuario.uid,
      observacoes,
      tipoEstudo
    );

    const resultado = await criarMetasEmLote(metas);

    if (resultado.sucesso) {
      setSucesso(true);
      setTimeout(() => navigate('/mentor/dashboard'), 2000);
    } else {
      setErro('Erro ao criar metas');
    }

    setCarregando(false);
  };

  // Criar metas manual (mesma data)
  const handleCriarMetasManual = async () => {
    if (!dataInicio) {
      setErro('Selecione a data');
      return;
    }

    setCarregando(true);

    const metas = assuntosSelecionados.map(a => ({
      alunoId: alunoSelecionado,
      cursoId: cursoSelecionado,
      disciplinaId: a.disciplinaId,
      assuntoId: a.id,
      assuntoTitulo: a.titulo,
      dataProgramada: dataInicio,
      tipoEstudo,
      tempoEstimado: a.tempos?.[tipoEstudo] || 60,
      observacoes,
      mentorId: usuario.uid
    }));

    const resultado = await criarMetasEmLote(metas);

    if (resultado.sucesso) {
      setSucesso(true);
      setTimeout(() => navigate('/mentor/dashboard'), 2000);
    } else {
      setErro('Erro ao criar metas');
    }

    setCarregando(false);
  };

  const nomeAluno = alunos.find(a => a.id === alunoSelecionado)?.nome || '';

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="flex items-center gap-4 px-4 py-4 mx-auto max-w-7xl">
          <button onClick={() => navigate('/mentor/dashboard')} className="text-gray-600 hover:text-gray-800">
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
              3. Distribuir no Calendário
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full">
            <div className="h-2 transition-all bg-blue-600 rounded-full" style={{ width: `${(etapa / 3) * 100}%` }}></div>
          </div>
        </div>

        {erro && (
          <div className="p-3 mb-4 text-sm text-red-600 border border-red-200 rounded-lg bg-red-50">{erro}</div>
        )}

        {sucesso && (
          <div className="p-3 mb-4 text-green-700 border border-green-200 rounded-lg bg-green-50">
            ✓ Metas criadas! Redirecionando...
          </div>
        )}

        {/* ETAPA 1 */}
        {etapa === 1 && (
          <div className="p-6 bg-white rounded-lg shadow">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">Selecione o Aluno e o Curso</h2>

            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Aluno</label>
                <select
                  value={alunoSelecionado || ''}
                  onChange={(e) => setAlunoSelecionado(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione um aluno</option>
                  {alunos.map(a => (
                    <option key={a.id} value={a.id}>{a.nome} - {a.email}</option>
                  ))}
                </select>
              </div>

              {configAluno && alunoSelecionado && (
                <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                  <p className="mb-2 text-sm font-semibold text-blue-800">
                    📊 Disponibilidade de {nomeAluno}:
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-sm text-blue-700">
                    <div>📅 {configAluno.diasPorSemana} dias/semana</div>
                    <div>⏰ {configAluno.horasPorDia}h/dia</div>
                  </div>
                </div>
              )}

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Curso/Edital</label>
                <select
                  value={cursoSelecionado || ''}
                  onChange={(e) => handleSelecionarCurso(e.target.value)}
                  disabled={!alunoSelecionado}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione um curso</option>
                  {cursos.map(c => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => setEtapa(2)}
                disabled={!alunoSelecionado || !cursoSelecionado}
                className="w-full py-3 font-semibold text-white transition bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
              >
                Próximo
              </button>
            </div>
          </div>
        )}

        {/* ETAPA 2 */}
        {etapa === 2 && (
          <div className="p-6 bg-white rounded-lg shadow">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">Selecione os Assuntos</h2>

            {carregando ? (
              <div className="py-8 text-center">
                <div className="w-12 h-12 mx-auto border-b-2 border-blue-600 rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="space-y-3">
                {disciplinas.map(d => (
                  <div key={d.id} className="border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between p-4">
                      <button
                        onClick={() => handleSelecionarDisciplina(d.id)}
                        className="flex-1 font-medium text-left text-gray-800"
                      >
                        {d.nome} <span className="text-sm text-gray-500">({d.totalAssuntos})</span>
                      </button>
                      <div className="flex gap-2">
                        <button
                          onClick={() => selecionarTodosDisciplina(d.id)}
                          className="px-3 py-1 text-xs text-green-700 bg-green-100 rounded hover:bg-green-200"
                        >
                          ☑️ Todos
                        </button>
                        <button
                          onClick={() => desselecionarTodosDisciplina(d.id)}
                          className="px-3 py-1 text-xs text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                        >
                          ☐ Limpar
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
                  Assuntos ({assuntosSelecionados.length} selecionados)
                </h3>
                <div className="space-y-2 overflow-y-auto max-h-96">
                  {assuntos.map(a => {
                    const sel = assuntosSelecionados.find(s => s.id === a.id);
                    return (
                      <div
                        key={a.id}
                        onClick={() => toggleAssunto(a)}
                        className={`p-3 rounded-lg border cursor-pointer ${
                          sel ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input type="checkbox" checked={!!sel} readOnly className="w-4 h-4" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{a.titulo}</p>
                            <p className="text-xs text-gray-500">Regular: {a.tempos?.regular || 0}min</p>
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
                className="flex-1 py-3 font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Voltar
              </button>
              <button
                onClick={() => setEtapa(3)}
                disabled={assuntosSelecionados.length === 0}
                className="flex-1 py-3 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
              >
                Próximo
              </button>
            </div>
          </div>
        )}

        {/* ETAPA 3 */}
        {etapa === 3 && (
          <div className="p-6 bg-white rounded-lg shadow">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">Distribuir no Calendário</h2>

            {/* Resumo */}
            <div className="p-4 mb-6 border border-blue-200 rounded-lg bg-blue-50">
              <p className="mb-2 text-sm font-semibold text-blue-800">📊 Resumo:</p>
              <div className="grid grid-cols-2 gap-2 text-sm text-blue-700">
                <div>• Aluno: <strong>{nomeAluno}</strong></div>
                <div>• Assuntos: <strong>{assuntosSelecionados.length}</strong></div>
                <div>• Disponibilidade: <strong>{configAluno?.diasPorSemana} dias/sem</strong></div>
                <div>• Tempo/dia: <strong>{configAluno?.horasPorDia}h</strong></div>
              </div>
            </div>

            {/* Modo */}
            <div className="mb-6">
              <label className="block mb-2 text-sm font-medium text-gray-700">Modo</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setModoDistribuicao('automatico')}
                  className={`p-4 border-2 rounded-lg ${
                    modoDistribuicao === 'automatico' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div className="mb-2 text-2xl">🤖</div>
                  <div className="font-semibold">Automático</div>
                  <div className="mt-1 text-xs text-gray-600">Distribui pelos dias disponíveis</div>
                </button>

                <button
                  onClick={() => setModoDistribuicao('manual')}
                  className={`p-4 border-2 rounded-lg ${
                    modoDistribuicao === 'manual' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div className="mb-2 text-2xl">✋</div>
                  <div className="font-semibold">Manual</div>
                  <div className="mt-1 text-xs text-gray-600">Mesma data (modo antigo)</div>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Data Início</label>
                <input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => {
                    setDataInicio(e.target.value);
                    setMostrarPreview(false);
                  }}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Tipo de Estudo</label>
                <select
                  value={tipoEstudo}
                  onChange={(e) => {
                    setTipoEstudo(e.target.value);
                    setMostrarPreview(false);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="expresso">Expresso (rápido)</option>
                  <option value="regular">Regular (normal)</option>
                  <option value="calma">Calma (detalhado)</option>
                </select>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Observações</label>
                <textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  rows="3"
                  placeholder="Opcional..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* MODO AUTOMÁTICO */}
              {modoDistribuicao === 'automatico' && (
                <>
                  {!mostrarPreview && (
                    <button
                      onClick={handleCalcularDistribuicao}
                      disabled={!dataInicio || carregando}
                      className="flex items-center justify-center w-full gap-2 py-3 font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:bg-gray-300"
                    >
                      {carregando ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
                          Calculando...
                        </>
                      ) : (
                        <>🤖 Distribuir Automaticamente</>
                      )}
                    </button>
                  )}

                  {/* PREVIEW */}
                  {mostrarPreview && distribuicao && (
                    <div className="mt-6">
                      <h3 className="mb-3 font-semibold text-gray-800">📅 Preview do Calendário:</h3>
                      
                      <div className="p-4 mb-4 border border-green-200 rounded-lg bg-green-50">
                        <p className="text-sm text-green-800">
                          ✓ {assuntosSelecionados.length} assuntos em {distribuicao.length} dias
                        </p>
                      </div>

                      <div className="space-y-3 overflow-y-auto max-h-96">
                        {distribuicao.map((dia, i) => (
                          <div key={i} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="font-semibold text-gray-800">
                                  {dia.diaSemana}, {dia.dataFormatada}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {dia.assuntos.length} assuntos • {dia.tempoTotal}min de {dia.tempoDisponivel}min
                                </p>
                              </div>
                              <div className="text-lg font-bold text-blue-600">
                                {Math.round((dia.tempoTotal / dia.tempoDisponivel) * 100)}%
                              </div>
                            </div>
                            
                            <div className="mt-2 space-y-1">
                              {dia.assuntos.map((a, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                                  <span>•</span>
                                  <span className="flex-1">{a.titulo}</span>
                                  <span className="text-gray-500">{a.tempoEstimado}min</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={handleCriarMetasAuto}
                        disabled={carregando}
                        className="w-full py-3 mt-4 font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-300"
                      >
                        {carregando ? 'Criando...' : '✅ Confirmar e Criar Metas'}
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* MODO MANUAL */}
              {modoDistribuicao === 'manual' && (
                <>
                  <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
                    <p className="text-sm text-yellow-800">
                      ℹ️ Modo manual: {assuntosSelecionados.length} metas na mesma data.
                    </p>
                  </div>

                  <button
                    onClick={handleCriarMetasManual}
                    disabled={!dataInicio || carregando}
                    className="w-full py-3 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
                  >
                    {carregando ? 'Criando...' : '🎯 Criar Metas (Mesma Data)'}
                  </button>
                </>
              )}
            </div>

            <button
              onClick={() => {
                setEtapa(2);
                setMostrarPreview(false);
                setDistribuicao(null);
              }}
              className="w-full py-3 mt-4 font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              ← Voltar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CriarMetas;
