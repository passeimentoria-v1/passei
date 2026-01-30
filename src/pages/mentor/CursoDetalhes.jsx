import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase.config';
import { adicionarDisciplina, excluirDisciplina, adicionarAssunto, excluirAssunto } from '../../services/cursoService';

export const CursoDetalhes = () => {
  const { cursoId } = useParams();
  const navigate = useNavigate();

  const [curso, setCurso] = useState(null);
  const [disciplinas, setDisciplinas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [disciplinaSelecionada, setDisciplinaSelecionada] = useState(null);
  const [assuntos, setAssuntos] = useState([]);

  // Estados modais
  const [modalDisciplinaAberto, setModalDisciplinaAberto] = useState(false);
  const [modalAssuntoAberto, setModalAssuntoAberto] = useState(false);
  const [disciplinaParaAssunto, setDisciplinaParaAssunto] = useState(null);

  // Estados formulário disciplina
  const [novaDisciplinaNome, setNovaDisciplinaNome] = useState('');
  const [novaDisciplinaCor, setNovaDisciplinaCor] = useState('#3B82F6');
  
  // Estados formulário assunto
  const [novoAssunto, setNovoAssunto] = useState({
    titulo: '',
    paginasOuMinutos: 0,
    expresso: 0,
    regular: 0,
    calma: 0,
    dicaEstudo: '',
    dicaRevisoes: '',
    dicaQuestoes: '',
    pesoResumos: 1,
    pesoRevisoes: 1,
    pesoQuestoes: 1,
    numeroQuestoes: 1,
    linkEstudo: '',
    linkResumo: '',
    linkQuestoes: '',
    referencia: '',
    suplementar: false
  });

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

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

  // DISCIPLINA
  const abrirModalDisciplina = () => {
    setModalDisciplinaAberto(true);
    setNovaDisciplinaNome('');
    setNovaDisciplinaCor('#3B82F6');
    setErro('');
  };

  const fecharModalDisciplina = () => {
    setModalDisciplinaAberto(false);
    setNovaDisciplinaNome('');
    setNovaDisciplinaCor('#3B82F6');
    setErro('');
  };

  const handleAdicionarDisciplina = async (e) => {
    e.preventDefault();
    setErro('');
    setSalvando(true);

    const resultado = await adicionarDisciplina(cursoId, {
      nome: novaDisciplinaNome,
      cor: novaDisciplinaCor,
      ordem: disciplinas.length
    });

    if (resultado.sucesso) {
      setSucesso('Disciplina adicionada com sucesso!');
      fecharModalDisciplina();
      carregarDisciplinas();
      carregarCurso();
      setTimeout(() => setSucesso(''), 3000);
    } else {
      setErro(resultado.erro);
    }

    setSalvando(false);
  };

  const handleExcluirDisciplina = async (disciplinaId, disciplinaNome) => {
    if (!window.confirm(`Tem certeza que deseja excluir a disciplina "${disciplinaNome}"?\n\nTodos os assuntos desta disciplina também serão excluídos!`)) {
      return;
    }

    const resultado = await excluirDisciplina(cursoId, disciplinaId);

    if (resultado.sucesso) {
      setSucesso('Disciplina excluída com sucesso!');
      carregarDisciplinas();
      carregarCurso();
      setDisciplinaSelecionada(null);
      setAssuntos([]);
      setTimeout(() => setSucesso(''), 3000);
    } else {
      setErro(resultado.erro);
      setTimeout(() => setErro(''), 3000);
    }
  };

  // ASSUNTO
  const abrirModalAssunto = (disciplinaId) => {
    setDisciplinaParaAssunto(disciplinaId);
    setModalAssuntoAberto(true);
    setNovoAssunto({
      titulo: '',
      paginasOuMinutos: 0,
      expresso: 0,
      regular: 0,
      calma: 0,
      dicaEstudo: '',
      dicaRevisoes: '',
      dicaQuestoes: '',
      pesoResumos: 1,
      pesoRevisoes: 1,
      pesoQuestoes: 1,
      numeroQuestoes: 1,
      linkEstudo: '',
      linkResumo: '',
      linkQuestoes: '',
      referencia: '',
      suplementar: false
    });
    setErro('');
  };

  const fecharModalAssunto = () => {
    setModalAssuntoAberto(false);
    setDisciplinaParaAssunto(null);
  };

  const handleAdicionarAssunto = async (e) => {
    e.preventDefault();
    setErro('');
    setSalvando(true);

    const resultado = await adicionarAssunto(cursoId, disciplinaParaAssunto, {
      ...novoAssunto,
      ordem: assuntos.length
    });

    if (resultado.sucesso) {
      setSucesso('Assunto adicionado com sucesso!');
      fecharModalAssunto();
      carregarAssuntos(disciplinaParaAssunto);
      carregarDisciplinas();
      carregarCurso();
      setTimeout(() => setSucesso(''), 3000);
    } else {
      setErro(resultado.erro);
    }

    setSalvando(false);
  };

  const handleExcluirAssunto = async (disciplinaId, assuntoId, assuntoTitulo) => {
    if (!window.confirm(`Tem certeza que deseja excluir o assunto "${assuntoTitulo}"?`)) {
      return;
    }

    const resultado = await excluirAssunto(cursoId, disciplinaId, assuntoId);

    if (resultado.sucesso) {
      setSucesso('Assunto excluído com sucesso!');
      carregarAssuntos(disciplinaId);
      carregarDisciplinas();
      carregarCurso();
      setTimeout(() => setSucesso(''), 3000);
    } else {
      setErro(resultado.erro);
      setTimeout(() => setErro(''), 3000);
    }
  };

  const coresDisponiveis = [
    { nome: 'Azul', valor: '#3B82F6' },
    { nome: 'Verde', valor: '#10B981' },
    { nome: 'Vermelho', valor: '#EF4444' },
    { nome: 'Amarelo', valor: '#F59E0B' },
    { nome: 'Roxo', valor: '#8B5CF6' },
    { nome: 'Rosa', valor: '#EC4899' },
    { nome: 'Laranja', valor: '#F97316' },
    { nome: 'Ciano', valor: '#06B6D4' }
  ];

  if (carregando) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto border-b-2 border-blue-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!curso) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-gray-600">Curso não encontrado</p>
      </div>
    );
  }

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
          <div>
            <h1 className="text-2xl font-bold text-blue-600">{curso.nome}</h1>
            <p className="text-sm text-gray-600">
              {curso.totalDisciplinas} disciplinas - {curso.totalAssuntos} assuntos
            </p>
          </div>
        </div>
      </header>

      <div className="px-4 py-8 mx-auto max-w-7xl">
        {sucesso && (
          <div className="p-4 mb-4 text-green-700 border border-green-200 rounded-lg bg-green-50">
            ✓ {sucesso}
          </div>
        )}

        {erro && !modalDisciplinaAberto && !modalAssuntoAberto && (
          <div className="p-3 mb-4 text-sm text-red-600 border border-red-200 rounded-lg bg-red-50">
            {erro}
          </div>
        )}

        <div className="p-6 mb-6 bg-white rounded-lg shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">Informações</h2>
          
          {curso.descricao && (
            <div className="mb-3">
              <p className="text-sm text-gray-600">Descrição</p>
              <p className="text-gray-800">{curso.descricao}</p>
            </div>
          )}

          {curso.arquivoOriginal && curso.arquivoOriginal.url && (
            <div>
              <p className="mb-1 text-sm text-gray-600">Arquivo Original</p>
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
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Disciplinas</h2>
            <button
              onClick={abrirModalDisciplina}
              className="flex items-center gap-2 px-4 py-2 text-white transition bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              <span>+</span>
              <span>Adicionar Disciplina</span>
            </button>
          </div>

          <div className="p-6">
            {disciplinas.length === 0 && (
              <p className="py-8 text-center text-gray-600">Nenhuma disciplina</p>
            )}

            <div className="space-y-2">
              {disciplinas.map((disciplina) => (
                <div key={disciplina.id} className="border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <button
                      onClick={() => toggleDisciplina(disciplina.id)}
                      className="flex items-center justify-between flex-1 px-4 py-3 hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: disciplina.cor || '#3B82F6' }}
                        ></div>
                        <span className="font-medium text-gray-800">{disciplina.nome}</span>
                        <span className="text-sm text-gray-500">
                          ({disciplina.totalAssuntos || 0})
                        </span>
                      </div>
                      <span className="text-gray-400">
                        {disciplinaSelecionada === disciplina.id ? '▲' : '▼'}
                      </span>
                    </button>
                    
                    <button
                      onClick={() => handleExcluirDisciplina(disciplina.id, disciplina.nome)}
                      className="px-4 py-3 text-red-600 transition hover:bg-red-50"
                      title="Excluir disciplina"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  {disciplinaSelecionada === disciplina.id && (
                    <div className="px-4 pb-4 border-t border-gray-200">
                      <div className="flex justify-end mt-3 mb-2">
                        <button
                          onClick={() => abrirModalAssunto(disciplina.id)}
                          className="px-3 py-1 text-sm text-white transition bg-green-600 rounded hover:bg-green-700"
                        >
                          + Adicionar Assunto
                        </button>
                      </div>

                      {assuntos.length === 0 && (
                        <p className="py-4 text-center text-gray-500">Nenhum assunto cadastrado</p>
                      )}

                      {assuntos.length > 0 && (
                        <div className="space-y-2">
                          {assuntos.map((assunto) => (
                            <div key={assunto.id} className="flex items-start justify-between p-3 rounded bg-gray-50">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-800">
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
                              <button
                                onClick={() => handleExcluirAssunto(disciplina.id, assunto.id, assunto.titulo)}
                                className="ml-2 text-red-600 transition hover:text-red-800"
                                title="Excluir assunto"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
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

      {/* MODAL DISCIPLINA */}
      {modalDisciplinaAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="w-full max-w-md bg-white rounded-lg shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Adicionar Disciplina</h2>
              <button
                onClick={fecharModalDisciplina}
                className="text-gray-400 transition hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAdicionarDisciplina} className="p-6">
              {erro && (
                <div className="p-3 mb-4 text-sm text-red-600 border border-red-200 rounded-lg bg-red-50">
                  {erro}
                </div>
              )}

              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Nome da Disciplina *
                </label>
                <input
                  type="text"
                  value={novaDisciplinaNome}
                  onChange={(e) => setNovaDisciplinaNome(e.target.value)}
                  required
                  placeholder="Ex: Direito Constitucional"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mb-6">
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Cor da Disciplina
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {coresDisponiveis.map((cor) => (
                    <button
                      key={cor.valor}
                      type="button"
                      onClick={() => setNovaDisciplinaCor(cor.valor)}
                      className={`w-full h-12 rounded-lg border-2 transition ${
                        novaDisciplinaCor === cor.valor
                          ? 'border-gray-800 scale-110'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      style={{ backgroundColor: cor.valor }}
                      title={cor.nome}
                    ></button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={salvando}
                  className="flex-1 px-4 py-2 text-white transition bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {salvando ? 'Salvando...' : 'Adicionar'}
                </button>
                <button
                  type="button"
                  onClick={fecharModalDisciplina}
                  className="px-4 py-2 text-gray-700 transition bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ASSUNTO */}
      {modalAssuntoAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black bg-opacity-50">
          <div className="w-full max-w-2xl my-8 bg-white rounded-lg shadow-xl">
            <div className="sticky top-0 flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Adicionar Assunto</h2>
              <button
                onClick={fecharModalAssunto}
                className="text-gray-400 transition hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAdicionarAssunto} className="p-6 space-y-4">
              {erro && (
                <div className="p-3 text-sm text-red-600 border border-red-200 rounded-lg bg-red-50">
                  {erro}
                </div>
              )}

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Título *</label>
                <input
                  type="text"
                  value={novoAssunto.titulo}
                  onChange={(e) => setNovoAssunto({...novoAssunto, titulo: e.target.value})}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Páginas/Min Vídeo</label>
                  <input
                    type="number"
                    value={novoAssunto.paginasOuMinutos}
                    onChange={(e) => setNovoAssunto({...novoAssunto, paginasOuMinutos: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Nº Questões</label>
                  <input
                    type="number"
                    value={novoAssunto.numeroQuestoes}
                    onChange={(e) => setNovoAssunto({...novoAssunto, numeroQuestoes: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Min Expresso</label>
                  <input
                    type="number"
                    value={novoAssunto.expresso}
                    onChange={(e) => setNovoAssunto({...novoAssunto, expresso: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Min Regular</label>
                  <input
                    type="number"
                    value={novoAssunto.regular}
                    onChange={(e) => setNovoAssunto({...novoAssunto, regular: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Min Calma</label>
                  <input
                    type="number"
                    value={novoAssunto.calma}
                    onChange={(e) => setNovoAssunto({...novoAssunto, calma: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={novoAssunto.suplementar}
                    onChange={(e) => setNovoAssunto({...novoAssunto, suplementar: e.target.checked})}
                    className="rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Assunto Suplementar</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="submit"
                  disabled={salvando}
                  className="flex-1 px-4 py-2 text-white transition bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {salvando ? 'Salvando...' : 'Adicionar'}
                </button>
                <button
                  type="button"
                  onClick={fecharModalAssunto}
                  className="px-4 py-2 text-gray-700 transition bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CursoDetalhes;