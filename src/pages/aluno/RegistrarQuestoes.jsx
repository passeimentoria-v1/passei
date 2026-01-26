import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  registrarQuestoes,
  buscarDisciplinasCurso,
  buscarAssuntosDisciplina 
} from '../../services/questoesService';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase.config';

export const RegistrarQuestoes = () => {
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [cursos, setCursos] = useState([]);
  const [disciplinas, setDisciplinas] = useState([]);
  const [assuntos, setAssuntos] = useState([]);

  const [cursoSelecionado, setCursoSelecionado] = useState('');
  const [disciplinaSelecionada, setDisciplinaSelecionada] = useState('');
  const [assuntoSelecionado, setAssuntoSelecionado] = useState('');

  const [totalQuestoes, setTotalQuestoes] = useState('');
  const [acertos, setAcertos] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    carregarCursos();
  }, []);

  const carregarCursos = async () => {
    try {
      const cursosRef = collection(db, 'cursos');
      const q = query(cursosRef, where('ativo', '==', true));
      const snapshot = await getDocs(q);

      const lista = [];
      snapshot.forEach((doc) => {
        lista.push({ id: doc.id, ...doc.data() });
      });

      setCursos(lista);
    } catch (error) {
      console.error('Erro ao carregar cursos:', error);
    }
  };

  const handleSelecionarCurso = async (cursoId) => {
    setCursoSelecionado(cursoId);
    setDisciplinaSelecionada('');
    setAssuntoSelecionado('');
    setAssuntos([]);

    if (cursoId) {
      const resultado = await buscarDisciplinasCurso(cursoId);
      if (resultado.sucesso) {
        setDisciplinas(resultado.disciplinas);
      }
    }
  };

  const handleSelecionarDisciplina = async (disciplinaId) => {
    setDisciplinaSelecionada(disciplinaId);
    setAssuntoSelecionado('');

    if (disciplinaId) {
      const resultado = await buscarAssuntosDisciplina(cursoSelecionado, disciplinaId);
      if (resultado.sucesso) {
        setAssuntos(resultado.assuntos);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');

    const total = parseInt(totalQuestoes);
    const acertosNum = parseInt(acertos);

    if (total <= 0) {
      setErro('Total de questões deve ser maior que zero');
      return;
    }

    if (acertosNum > total) {
      setErro('Acertos não podem ser maiores que o total');
      return;
    }

    setCarregando(true);

    const disciplina = disciplinas.find(d => d.id === disciplinaSelecionada);
    const assunto = assuntos.find(a => a.id === assuntoSelecionado);

    const dadosRegistro = {
      alunoId: usuario.uid,
      cursoId: cursoSelecionado,
      disciplinaId: disciplinaSelecionada,
      disciplinaNome: disciplina?.nome || '',
      assuntoId: assuntoSelecionado,
      assuntoTitulo: assunto?.titulo || '',
      totalQuestoes: total,
      acertos: acertosNum,
      erros: total - acertosNum,
      observacoes
    };

    const resultado = await registrarQuestoes(dadosRegistro);

    if (resultado.sucesso) {
      setSucesso(true);
      setTimeout(() => {
        navigate('/aluno/questoes');
      }, 1500);
    } else {
      setErro(resultado.erro);
    }

    setCarregando(false);
  };

  const erros = totalQuestoes && acertos ? parseInt(totalQuestoes) - parseInt(acertos) : 0;
  const percentual = totalQuestoes > 0 ? Math.round((parseInt(acertos || 0) / parseInt(totalQuestoes)) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/aluno/dashboard')}
            className="text-gray-600 hover:text-gray-800"
          >
            ← Voltar
          </button>
          <h1 className="text-2xl font-bold text-blue-600">Registrar Questões</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {sucesso && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            ✓ Questões registradas com sucesso! Redirecionando...
          </div>
        )}

        {erro && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {erro}
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Selecionar Curso */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Curso/Edital *
              </label>
              <select
                value={cursoSelecionado}
                onChange={(e) => handleSelecionarCurso(e.target.value)}
                required
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

            {/* Selecionar Disciplina */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Disciplina *
              </label>
              <select
                value={disciplinaSelecionada}
                onChange={(e) => handleSelecionarDisciplina(e.target.value)}
                required
                disabled={!cursoSelecionado}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
              >
                <option value="">Selecione uma disciplina</option>
                {disciplinas.map(disciplina => (
                  <option key={disciplina.id} value={disciplina.id}>
                    {disciplina.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Selecionar Assunto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assunto *
              </label>
              <select
                value={assuntoSelecionado}
                onChange={(e) => setAssuntoSelecionado(e.target.value)}
                required
                disabled={!disciplinaSelecionada}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
              >
                <option value="">Selecione um assunto</option>
                {assuntos.map(assunto => (
                  <option key={assunto.id} value={assunto.id}>
                    {assunto.titulo}
                  </option>
                ))}
              </select>
            </div>

            {/* Total de Questões */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total de Questões *
              </label>
              <input
                type="number"
                value={totalQuestoes}
                onChange={(e) => setTotalQuestoes(e.target.value)}
                min="1"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Ex: 50"
              />
            </div>

            {/* Acertos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Acertos *
              </label>
              <input
                type="number"
                value={acertos}
                onChange={(e) => setAcertos(e.target.value)}
                min="0"
                max={totalQuestoes || 0}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Ex: 35"
              />
            </div>

            {/* Resumo */}
            {totalQuestoes && acertos && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-600">Acertos</p>
                    <p className="text-2xl font-bold text-green-600">{acertos}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Erros</p>
                    <p className="text-2xl font-bold text-red-600">{erros}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Percentual</p>
                    <p className="text-2xl font-bold text-blue-600">{percentual}%</p>
                  </div>
                </div>
              </div>
            )}

            {/* Observações */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observações (opcional)
              </label>
              <textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Dificuldades, anotações..."
              />
            </div>

            {/* Botão Salvar */}
            <button
              type="submit"
              disabled={carregando}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {carregando ? 'Salvando...' : 'Registrar Questões'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegistrarQuestoes;