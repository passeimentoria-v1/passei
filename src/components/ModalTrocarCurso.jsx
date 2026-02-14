import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase.config';
import { trocarCursoAluno } from '../services/trocaCursoService';

export const ModalTrocarCurso = ({ aluno, onClose, onSucesso }) => {
  const [cursos, setCursos] = useState([]);
  const [cursoSelecionado, setCursoSelecionado] = useState('');
  const [cursoAtualNome, setCursoAtualNome] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState('');
  const [etapa, setEtapa] = useState(1); // 1: selecionar, 2: confirmar, 3: resultado

  const [resumoTroca, setResumoTroca] = useState(null);

  useEffect(() => {
    carregarNomeCursoAtual();
    carregarCursos();
  }, []);

  const carregarNomeCursoAtual = async () => {
    if (!aluno.cursoId) {
      console.log('⚠️ Aluno não tem cursoId definido');
      return;
    }
    
    try {
      console.log('🔍 Buscando nome do curso atual:', aluno.cursoId);
      const cursoRef = doc(db, 'cursos', aluno.cursoId);
      const cursoSnap = await getDoc(cursoRef);
      
      if (cursoSnap.exists()) {
        const nomeCurso = cursoSnap.data().nome || cursoSnap.data().titulo || aluno.cursoId;
        console.log('✅ Nome do curso atual:', nomeCurso);
        setCursoAtualNome(nomeCurso);
      } else {
        console.warn('⚠️ Curso atual não encontrado no Firestore');
        setCursoAtualNome(aluno.cursoId);
      }
    } catch (error) {
      console.error('❌ Erro ao buscar nome do curso:', error);
      setCursoAtualNome(aluno.cursoId);
    }
  };

  const carregarCursos = async () => {
    setCarregando(true);
    setErro('');
    
    try {
      console.log('📚 Iniciando busca de cursos...');
      console.log('👤 Aluno:', aluno);
      console.log('🎓 MentorId:', aluno.mentorId);
      console.log('📖 CursoId atual:', aluno.cursoId);

      // Buscar TODOS os cursos primeiro
      const cursosRef = collection(db, 'cursos');
      const snapshotTodos = await getDocs(cursosRef);
      
      console.log(`📊 Total de cursos no banco: ${snapshotTodos.size}`);

      if (snapshotTodos.size === 0) {
        setErro('Nenhum curso encontrado no sistema');
        setCarregando(false);
        return;
      }

      // Logar todos os cursos para debug
      snapshotTodos.forEach(doc => {
        const data = doc.data();
        console.log('📘 Curso encontrado:', {
          id: doc.id,
          nome: data.nome || data.titulo,
          mentorId: data.mentorId,
          ativo: data.ativo
        });
      });

      // Agora filtrar por mentorId
      let listaCursos;
      
      if (aluno.mentorId) {
        console.log('🔍 Filtrando cursos do mentor:', aluno.mentorId);
        listaCursos = snapshotTodos.docs
          .filter(doc => {
            const data = doc.data();
            const mesmoMentor = data.mentorId === aluno.mentorId;
            const cursoAtual = doc.id === aluno.cursoId;
            const ativo = data.ativo !== false;
            
            console.log(`📄 Curso ${doc.id}:`, {
              mesmoMentor,
              cursoAtual,
              ativo,
              incluir: mesmoMentor && !cursoAtual && ativo
            });
            
            return mesmoMentor && !cursoAtual && ativo;
          })
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
      } else {
        console.warn('⚠️ Aluno não tem mentorId, mostrando todos os cursos');
        listaCursos = snapshotTodos.docs
          .filter(doc => doc.id !== aluno.cursoId)
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
      }

      console.log(`✅ Cursos disponíveis para troca: ${listaCursos.length}`);
      listaCursos.forEach(curso => {
        console.log(`  - ${curso.nome || curso.titulo} (${curso.id})`);
      });

      setCursos(listaCursos);

      if (listaCursos.length === 0) {
        setErro('Não há outros cursos disponíveis para este mentor');
      }

    } catch (error) {
      console.error('❌ Erro ao carregar cursos:', error);
      setErro('Erro ao carregar cursos disponíveis: ' + error.message);
    } finally {
      setCarregando(false);
    }
  };

  const handleAvancar = () => {
    if (!cursoSelecionado) {
      setErro('Selecione um curso');
      return;
    }
    setErro('');
    setEtapa(2);
  };

  const handleConfirmarTroca = async () => {
    setProcessando(true);
    setErro('');

    try {
      console.log('🔄 Iniciando troca de curso...');
      console.log('De:', aluno.cursoId);
      console.log('Para:', cursoSelecionado);

      const resultado = await trocarCursoAluno(
        aluno.id,
        aluno.cursoId,
        cursoSelecionado
      );

      if (resultado.sucesso) {
        console.log('✅ Troca concluída!');
        setResumoTroca(resultado.resumo);
        setEtapa(3);
        
        // Chamar callback de sucesso após 2 segundos
        setTimeout(() => {
          onSucesso();
        }, 2000);
      } else {
        console.error('❌ Erro na troca:', resultado.erro);
        setErro(resultado.erro);
      }
    } catch (error) {
      console.error('❌ Erro ao trocar curso:', error);
      setErro('Erro ao processar troca de curso: ' + error.message);
    } finally {
      setProcessando(false);
    }
  };

  const cursoSelecionadoObj = cursos.find(c => c.id === cursoSelecionado);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-2xl p-6 mx-4 bg-white rounded-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            🔄 Trocar Curso do Aluno
          </h2>
          <button
            onClick={onClose}
            disabled={processando}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {erro && (
          <div className="p-4 mb-4 text-red-600 border border-red-200 rounded-lg bg-red-50">
            ⚠️ {erro}
          </div>
        )}

        {/* ETAPA 1: Selecionar Curso */}
        {etapa === 1 && (
          <>
            <div className="mb-6">
              <p className="mb-2 text-sm font-semibold text-gray-700">Aluno:</p>
              <p className="text-lg text-gray-800">{aluno.nome}</p>
            </div>

            <div className="p-4 mb-6 border border-blue-200 rounded-lg bg-blue-50">
              <p className="mb-1 text-sm font-semibold text-blue-900">Curso Atual:</p>
              <p className="text-lg font-bold text-blue-700">
                {cursoAtualNome || 'Carregando...'}
              </p>
            </div>

            {carregando ? (
              <div className="py-8 text-center">
                <div className="w-8 h-8 mx-auto border-b-2 border-blue-600 rounded-full animate-spin"></div>
                <p className="mt-2 text-sm text-gray-600">Carregando cursos...</p>
              </div>
            ) : cursos.length === 0 ? (
              <div className="p-6 text-center border border-gray-200 rounded-lg bg-gray-50">
                <p className="mb-2 text-gray-600">
                  {erro || 'Não há outros cursos disponíveis para este mentor.'}
                </p>
                <button
                  onClick={carregarCursos}
                  className="px-4 py-2 mt-3 text-sm font-semibold text-blue-600 transition border border-blue-600 rounded-lg hover:bg-blue-50"
                >
                  🔄 Tentar Novamente
                </button>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <label className="block mb-3 text-sm font-semibold text-gray-700">
                    Selecione o Novo Curso:
                  </label>
                  <div className="space-y-2 overflow-y-auto max-h-64">
                    {cursos.map(curso => (
                      <button
                        key={curso.id}
                        onClick={() => {
                          console.log('📌 Curso selecionado:', curso.id);
                          setCursoSelecionado(curso.id);
                          setErro('');
                        }}
                        className={`w-full p-4 text-left border-2 rounded-lg transition ${
                          cursoSelecionado === curso.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <p className="font-semibold text-gray-800">
                          {curso.nome || curso.titulo || curso.id}
                        </p>
                        {curso.descricao && (
                          <p className="mt-1 text-sm text-gray-600">{curso.descricao}</p>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="px-6 py-3 text-gray-700 transition bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAvancar}
                    disabled={!cursoSelecionado}
                    className="flex-1 px-6 py-3 font-semibold text-white transition bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    Avançar →
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {/* ETAPA 2: Confirmar */}
        {etapa === 2 && (
          <>
            <div className="p-4 mb-6 border border-yellow-200 rounded-lg bg-yellow-50">
              <p className="mb-2 font-semibold text-yellow-900">⚠️ Atenção!</p>
              <p className="text-sm text-yellow-800">
                Esta ação irá trocar o curso do aluno. O que vai acontecer:
              </p>
            </div>

            <div className="mb-6 space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">📦</span>
                <div>
                  <p className="font-semibold text-gray-800">Metas Arquivadas</p>
                  <p className="text-sm text-gray-600">
                    Todas as metas do curso "{cursoAtualNome}" serão arquivadas
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-2xl">✅</span>
                <div>
                  <p className="font-semibold text-gray-800">Questões Mantidas</p>
                  <p className="text-sm text-gray-600">
                    Questões de disciplinas que existem no novo curso serão mantidas
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-2xl">📦</span>
                <div>
                  <p className="font-semibold text-gray-800">Questões Arquivadas</p>
                  <p className="text-sm text-gray-600">
                    Questões de disciplinas que não existem no novo curso serão arquivadas
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-2xl">📦</span>
                <div>
                  <p className="font-semibold text-gray-800">Flashcards Arquivados</p>
                  <p className="text-sm text-gray-600">
                    Todos os flashcards do curso antigo serão arquivados
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 mb-6 border border-blue-200 rounded-lg bg-blue-50">
              <p className="mb-2 text-sm font-semibold text-blue-900">Novo Curso:</p>
              <p className="text-lg font-bold text-blue-700">
                {cursoSelecionadoObj?.nome || cursoSelecionadoObj?.titulo || cursoSelecionado}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setEtapa(1)}
                disabled={processando}
                className="px-6 py-3 text-gray-700 transition bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                ← Voltar
              </button>
              <button
                onClick={handleConfirmarTroca}
                disabled={processando}
                className="flex-1 px-6 py-3 font-semibold text-white transition bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
              >
                {processando ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
                    Processando...
                  </span>
                ) : (
                  '✓ Confirmar Troca'
                )}
              </button>
            </div>
          </>
        )}

        {/* ETAPA 3: Resultado */}
        {etapa === 3 && resumoTroca && (
          <>
            <div className="p-6 mb-6 text-center border border-green-200 rounded-lg bg-green-50">
              <div className="mb-4 text-6xl">✅</div>
              <p className="mb-2 text-2xl font-bold text-green-900">
                Troca Concluída!
              </p>
              <p className="text-green-700">
                O curso do aluno foi alterado com sucesso
              </p>
            </div>

            <div className="p-4 mb-6 space-y-3 border border-gray-200 rounded-lg bg-gray-50">
              <p className="font-semibold text-gray-800">📊 Resumo da Operação:</p>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-white rounded">
                  <p className="text-gray-600">Metas Arquivadas</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {resumoTroca.metasArquivadas}
                  </p>
                </div>

                <div className="p-3 bg-white rounded">
                  <p className="text-gray-600">Questões Mantidas</p>
                  <p className="text-2xl font-bold text-green-600">
                    {resumoTroca.questoesMantidas}
                  </p>
                </div>

                <div className="p-3 bg-white rounded">
                  <p className="text-gray-600">Questões Arquivadas</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {resumoTroca.questoesArquivadas}
                  </p>
                </div>

                <div className="p-3 bg-white rounded">
                  <p className="text-gray-600">Flashcards Arquivados</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {resumoTroca.flashcardsArquivados}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full px-6 py-3 font-semibold text-white transition bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Fechar
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ModalTrocarCurso;