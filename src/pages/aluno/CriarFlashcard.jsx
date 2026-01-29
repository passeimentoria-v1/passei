import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { criarFlashcard } from '../../services/flashcardService';
import { 
  buscarDisciplinasCurso,
  buscarAssuntosDisciplina 
} from '../../services/questoesService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase.config';

export const CriarFlashcard = () => {
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [cursoId, setCursoId] = useState('');
  const [cursoNome, setCursoNome] = useState('');
  const [disciplinas, setDisciplinas] = useState([]);
  const [assuntos, setAssuntos] = useState([]);

  const [disciplinaSelecionada, setDisciplinaSelecionada] = useState('');
  const [assuntoSelecionado, setAssuntoSelecionado] = useState('');

  const [frente, setFrente] = useState('');
  const [verso, setVerso] = useState('');
  const [dica, setDica] = useState('');

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
          // Se o usuário tem um curso associado
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

    if (!frente || !verso) {
      setErro('Preencha a frente e o verso do flashcard');
      return;
    }

    setCarregando(true);

    const disciplina = disciplinas.find(d => d.id === disciplinaSelecionada);
    const assunto = assuntos.find(a => a.id === assuntoSelecionado);

    const dadosFlashcard = {
      criadoPor: usuario.uid,
      tipoUsuario: 'aluno',
      alunoId: usuario.uid,
      cursoId: cursoId,
      disciplinaId: disciplinaSelecionada,
      disciplinaNome: disciplina?.nome || '',
      assuntoId: assuntoSelecionado,
      assuntoTitulo: assunto?.titulo || '',
      frente,
      verso,
      dica
    };

    const resultado = await criarFlashcard(dadosFlashcard);

    if (resultado.sucesso) {
      setSucesso(true);
      setFrente('');
      setVerso('');
      setDica('');
      
      setTimeout(() => {
        setSucesso(false);
      }, 3000);
    } else {
      setErro(resultado.erro);
    }

    setCarregando(false);
  };

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
            onClick={() => navigate('/aluno/flashcards')}
            className="text-gray-600 hover:text-gray-800"
          >
            ← Voltar
          </button>
          <h1 className="text-2xl font-bold text-blue-600">Criar Flashcard</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {sucesso && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            ✓ Flashcard criado com sucesso!
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

            <div className="border-t border-gray-200 pt-4"></div>

            {/* Frente do Card */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Frente (Pergunta) *
              </label>
              <textarea
                value={frente}
                onChange={(e) => setFrente(e.target.value)}
                required
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Ex: O que é a Lei de Licitações?"
              />
            </div>

            {/* Verso do Card */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verso (Resposta) *
              </label>
              <textarea
                value={verso}
                onChange={(e) => setVerso(e.target.value)}
                required
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Ex: Lei 14.133/2021 que estabelece normas gerais de licitação..."
              />
            </div>

            {/* Dica */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dica (opcional)
              </label>
              <input
                type="text"
                value={dica}
                onChange={(e) => setDica(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Ex: Lei 14.133/2021"
              />
            </div>

            {/* Preview */}
            {frente && verso && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-800 mb-2">📋 Preview:</p>
                <div className="bg-white rounded-lg p-4 shadow">
                  <p className="font-semibold text-gray-800 mb-2">Frente:</p>
                  <p className="text-gray-700 mb-4">{frente}</p>
                  <div className="border-t border-gray-200 pt-4">
                    <p className="font-semibold text-gray-800 mb-2">Verso:</p>
                    <p className="text-gray-700">{verso}</p>
                  </div>
                  {dica && (
                    <p className="text-sm text-gray-500 mt-2 italic">💡 Dica: {dica}</p>
                  )}
                </div>
              </div>
            )}

            {/* Botão Criar */}
            <button
              type="submit"
              disabled={carregando || !cursoId}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {carregando ? 'Criando...' : 'Criar Flashcard'}
            </button>
          </form>
        </div>

        {/* Dicas */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="font-semibold text-blue-800 mb-2">💡 Dicas para criar bons flashcards:</p>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Seja objetivo e direto na pergunta</li>
            <li>• Evite perguntas muito longas ou complexas</li>
            <li>• Use exemplos práticos na resposta</li>
            <li>• Adicione dicas quando necessário (números de leis, datas, etc)</li>
            <li>• Um conceito por flashcard</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CriarFlashcard;