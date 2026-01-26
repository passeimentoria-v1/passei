import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  buscarFlashcardsParaRevisar,
  revisarFlashcard 
} from '../../services/flashcardService';

export const RevisarFlashcards = () => {
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [flashcards, setFlashcards] = useState([]);
  const [indiceAtual, setIndiceAtual] = useState(0);
  const [mostrarVerso, setMostrarVerso] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [concluido, setConcluido] = useState(false);

  useEffect(() => {
    carregarFlashcards();
  }, []);

  const carregarFlashcards = async () => {
    setCarregando(true);
    const resultado = await buscarFlashcardsParaRevisar(usuario.uid);

    if (resultado.sucesso) {
      setFlashcards(resultado.flashcards);
      
      if (resultado.flashcards.length === 0) {
        setConcluido(true);
      }
    }

    setCarregando(false);
  };

  const handleResposta = async (facilidade) => {
    setProcessando(true);
    
    const flashcardAtual = flashcards[indiceAtual];
    await revisarFlashcard(flashcardAtual.id, facilidade);

    // Próximo flashcard
    if (indiceAtual < flashcards.length - 1) {
      setIndiceAtual(indiceAtual + 1);
      setMostrarVerso(false);
    } else {
      setConcluido(true);
    }

    setProcessando(false);
  };

  const handleMostrarResposta = () => {
    setMostrarVerso(true);
  };

  const handlePular = () => {
    if (indiceAtual < flashcards.length - 1) {
      setIndiceAtual(indiceAtual + 1);
      setMostrarVerso(false);
    } else {
      setConcluido(true);
    }
  };

  const progresso = flashcards.length > 0 
    ? Math.round(((indiceAtual + 1) / flashcards.length) * 100) 
    : 0;

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando flashcards...</p>
        </div>
      </div>
    );
  }

  if (concluido || flashcards.length === 0) {
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
            <h1 className="text-2xl font-bold text-blue-600">Revisão Concluída</h1>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 py-16">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-5xl">🎉</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Parabéns!
            </h2>
            <p className="text-gray-600 mb-6">
              {flashcards.length === 0 
                ? 'Você não tem flashcards para revisar hoje!'
                : `Você revisou ${flashcards.length} flashcard${flashcards.length > 1 ? 's' : ''} hoje!`}
            </p>

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => navigate('/aluno/flashcards')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Ver Todos os Flashcards
              </button>
              <button
                onClick={() => navigate('/aluno/dashboard')}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Ir para Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const flashcardAtual = flashcards[indiceAtual];

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/aluno/flashcards')}
                className="text-gray-600 hover:text-gray-800"
              >
                ← Sair
              </button>
              <h1 className="text-2xl font-bold text-blue-600">Revisão de Flashcards</h1>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Progresso</p>
              <p className="text-lg font-bold text-blue-600">
                {indiceAtual + 1} / {flashcards.length}
              </p>
            </div>
          </div>

          {/* Barra de Progresso */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progresso}%` }}
            ></div>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Informações do Flashcard */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="text-blue-700">
                <strong>Disciplina:</strong> {flashcardAtual.disciplinaNome}
              </span>
              <span className="text-blue-700">
                <strong>Assunto:</strong> {flashcardAtual.assuntoTitulo}
              </span>
            </div>
            <button
              onClick={handlePular}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Pular →
            </button>
          </div>
        </div>

        {/* Card do Flashcard */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden" style={{ minHeight: '400px' }}>
          <div className="p-8">
            {!mostrarVerso ? (
              // FRENTE DO CARD
              <div className="flex flex-col items-center justify-center" style={{ minHeight: '300px' }}>
                <p className="text-sm font-medium text-gray-500 mb-4">PERGUNTA</p>
                <p className="text-2xl text-gray-800 text-center mb-8">
                  {flashcardAtual.frente}
                </p>

                {flashcardAtual.dica && (
                  <div className="mb-8 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      💡 <strong>Dica:</strong> {flashcardAtual.dica}
                    </p>
                  </div>
                )}

                <button
                  onClick={handleMostrarResposta}
                  className="px-8 py-4 bg-blue-600 text-white text-lg rounded-lg font-semibold hover:bg-blue-700 transition shadow-lg"
                >
                  Mostrar Resposta
                </button>
              </div>
            ) : (
              // VERSO DO CARD
              <div className="flex flex-col" style={{ minHeight: '300px' }}>
                {/* Pergunta (pequena) */}
                <div className="mb-6 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-500 mb-1">PERGUNTA</p>
                  <p className="text-sm text-gray-700">{flashcardAtual.frente}</p>
                </div>

                {/* Resposta */}
                <div className="flex-1 mb-6">
                  <p className="text-sm font-medium text-gray-500 mb-3">RESPOSTA</p>
                  <p className="text-xl text-gray-800 leading-relaxed">
                    {flashcardAtual.verso}
                  </p>
                </div>

                {/* Botões de Avaliação */}
                <div>
                  <p className="text-center text-sm font-medium text-gray-600 mb-4">
                    Como você avalia sua memória deste flashcard?
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => handleResposta(0)}
                      disabled={processando}
                      className="py-4 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="block text-2xl mb-1">😰</span>
                      <span className="block text-sm">Difícil</span>
                      <span className="block text-xs opacity-75">Revisar amanhã</span>
                    </button>

                    <button
                      onClick={() => handleResposta(1)}
                      disabled={processando}
                      className="py-4 bg-yellow-500 text-white rounded-lg font-semibold hover:bg-yellow-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="block text-2xl mb-1">😐</span>
                      <span className="block text-sm">Médio</span>
                      <span className="block text-xs opacity-75">Em alguns dias</span>
                    </button>

                    <button
                      onClick={() => handleResposta(2)}
                      disabled={processando}
                      className="py-4 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="block text-2xl mb-1">😊</span>
                      <span className="block text-sm">Fácil</span>
                      <span className="block text-xs opacity-75">Intervalo maior</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              <span>Difícil: Revisar em 1 dia</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
              <span>Médio: Revisar em 6 dias</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Fácil: Intervalo aumentado</span>
            </div>
          </div>
        </div>

        {/* Atalhos de Teclado */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700 mb-2">⌨️ Atalhos de teclado:</p>
          <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
            <div><kbd className="px-2 py-1 bg-white border rounded">Espaço</kbd> Mostrar resposta</div>
            <div><kbd className="px-2 py-1 bg-white border rounded">1</kbd> Difícil</div>
            <div><kbd className="px-2 py-1 bg-white border rounded">2</kbd> Médio</div>
            <div><kbd className="px-2 py-1 bg-white border rounded">3</kbd> Fácil</div>
            <div><kbd className="px-2 py-1 bg-white border rounded">→</kbd> Pular</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevisarFlashcards;