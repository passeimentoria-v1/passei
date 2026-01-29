import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  registrarQuestoes,
  buscarDisciplinasCurso,
  buscarAssuntosDisciplina 
} from '../../services/questoesService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase.config';

export const RegistrarQuestoes = () => {
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [cursoId, setCursoId] = useState('');
  const [cursoNome, setCursoNome] = useState('');
  const [disciplinas, setDisciplinas] = useState([]);
  const [assuntos, setAssuntos] = useState([]);

  const [disciplinaSelecionada, setDisciplinaSelecionada] = useState('');
  const [assuntoSelecionado, setAssuntoSelecionado] = useState('');

  const [totalQuestoes, setTotalQuestoes] = useState('');
  const [acertos, setAcertos] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const [carregando, setCarregando] = useState(false);
  const [carregandoDados, setCarregandoDados] = useState(true);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    carregarCursoDoAluno();
  }, []);

  const carregarCursoDoAluno = async () => {
    try {
      setCarregandoDados(true);
      
      // Buscar dados do usuário
      const userDoc = await getDoc(doc(db, 'users', usuario.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        if (userData.cursoId) {
          // Se o usuário já tem um curso associado
          setCursoId(userData.cursoId);
          
          // Buscar nome do curso
          const cursoDoc = await getDoc(doc(db, 'cursos', userData.cursoId));
          if (cursoDoc.exists()) {
            setCursoNome(cursoDoc.data().nome);
          }
          
          // Carregar disciplinas do curso
          const resultado = await buscarDisciplinasCurso(userData.cursoId);
          if (resultado.sucesso) {
            setDisciplinas(resultado.disciplinas);
          }
        } else {
          setErro('Você ainda não está matriculado em nenhum curso. Entre em contato com seu mentor.');
        }
      }
    } catch (error) {
      console.error('Erro ao carregar curso do aluno:', error);
      setErro('Erro ao carregar informações do curso.');
    } finally {
      setCarregandoDados(false);
    }
  };

  const handleSelecionarDisciplina = async (disciplinaId) => {
    setDisciplinaSelecionada(disciplinaId);
    setAssuntoSelecionado('');

    if (disciplinaId) {
      const resultado = await buscarAssuntosDisciplina(cursoId, disciplinaId);
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
      cursoId: cursoId,
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

  if (carregandoDados) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

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

        {/* Info do Curso */}
        {cursoNome && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-600">
              📚 <strong>Curso:</strong> {cursoNome}
            </p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Selecionar Disciplina */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Disciplina *
              </label>
              <select
                value={disciplinaSelecionada}
                onChange={(e) => handleSelecionarDisciplina(e.target.value)}
                required
                disabled={!cursoId}
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
              disabled={carregando || !cursoId}
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