import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  uploadExcel,
  processarExcel,
  organizarPorDisciplina,
  criarCursoCompleto
} from '../../services/cursoService';

export const UploadEdital = () => {
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [etapa, setEtapa] = useState(1); // 1: Form, 2: Upload, 3: Processando, 4: Sucesso
  const [arquivo, setArquivo] = useState(null);
  const [dadosCurso, setDadosCurso] = useState({
    nome: '',
    descricao: ''
  });
  const [progresso, setProgresso] = useState({
    mensagem: '',
    porcentagem: 0
  });
  const [erro, setErro] = useState('');
  const [cursoId, setCursoId] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    
    if (!file) return;
    
    // Validar tipo de arquivo
    const extensao = file.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls'].includes(extensao)) {
      setErro('Por favor, selecione um arquivo Excel (.xlsx ou .xls)');
      return;
    }
    
    // Validar tamanho (máx 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErro('Arquivo muito grande. Máximo 10MB');
      return;
    }
    
    setArquivo(file);
    setErro('');
  };

  const handleInputChange = (e) => {
    setDadosCurso({
      ...dadosCurso,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!dadosCurso.nome) {
      setErro('Digite o nome do curso');
      return;
    }
    
    if (!arquivo) {
      setErro('Selecione um arquivo Excel');
      return;
    }
    
    setEtapa(2);
    setErro('');
    
    try {
      // 1. Processar Excel
      setProgresso({ mensagem: 'Lendo arquivo Excel...', porcentagem: 20 });
      const resultadoProcessamento = await processarExcel(arquivo);
      
      if (!resultadoProcessamento.sucesso) {
        throw new Error(resultadoProcessamento.erro);
      }
      
      // 2. Organizar dados
      setProgresso({ mensagem: 'Organizando disciplinas e assuntos...', porcentagem: 40 });
      const disciplinas = organizarPorDisciplina(resultadoProcessamento.dados);
      
      // 3. Upload do arquivo
      setProgresso({ mensagem: 'Fazendo upload do arquivo...', porcentagem: 60 });
      const tempCursoId = Date.now().toString(); // ID temporário para upload
      const resultadoUpload = await uploadExcel(arquivo, tempCursoId);
      
      if (!resultadoUpload.sucesso) {
        throw new Error(resultadoUpload.erro);
      }
      
      // 4. Criar curso no Firestore
      setProgresso({ mensagem: 'Salvando dados no banco...', porcentagem: 80 });
      const resultadoCriacao = await criarCursoCompleto(
        dadosCurso,
        disciplinas,
        usuario.uid,
        {
          nome: resultadoUpload.nome,
          url: resultadoUpload.url
        }
      );
      
      if (!resultadoCriacao.sucesso) {
        throw new Error(resultadoCriacao.erro);
      }
      
      // 5. Sucesso!
      setProgresso({ mensagem: 'Curso criado com sucesso!', porcentagem: 100 });
      setCursoId(resultadoCriacao.cursoId);
      setEtapa(3);
      
    } catch (error) {
      console.error('Erro:', error);
      setErro(error.message || 'Erro ao processar arquivo');
      setEtapa(1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/mentor/dashboard')}
              className="text-gray-600 hover:text-gray-800"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-blue-600">Novo Curso/Edital</h1>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Etapa 1: Formulário */}
        {etapa === 1 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Upload de Edital
            </h2>
            
            {erro && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {erro}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nome do Curso */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Curso/Edital *
                </label>
                <input
                  type="text"
                  name="nome"
                  value={dadosCurso.nome}
                  onChange={handleInputChange}
                  placeholder="Ex: PC-AL 2025, PF 2026"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição (opcional)
                </label>
                <textarea
                  name="descricao"
                  value={dadosCurso.descricao}
                  onChange={handleInputChange}
                  placeholder="Informações adicionais sobre o edital..."
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Upload de Arquivo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Arquivo Excel (.xlsx) *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer"
                  >
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <p className="mt-2 text-sm text-gray-600">
                      {arquivo ? (
                        <span className="font-medium text-blue-600">{arquivo.name}</span>
                      ) : (
                        <>
                          <span className="font-medium text-blue-600">Clique para selecionar</span>
                          {' '}ou arraste o arquivo
                        </>
                      )}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Excel (.xlsx ou .xls) até 10MB
                    </p>
                  </label>
                </div>
              </div>

              {/* Botão Enviar */}
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Processar e Criar Curso
              </button>
            </form>
          </div>
        )}

        {/* Etapa 2: Processando */}
        {etapa === 2 && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                {progresso.mensagem}
              </h2>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progresso.porcentagem}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500 mt-2">{progresso.porcentagem}%</p>
            </div>
          </div>
        )}

        {/* Etapa 3: Sucesso */}
        {etapa === 3 && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Curso criado com sucesso!
              </h2>
              <p className="text-gray-600 mb-6">
                O edital foi processado e está pronto para uso
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => navigate('/mentor/dashboard')}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Ver Meus Cursos
                </button>
                <button
                  onClick={() => {
                    setEtapa(1);
                    setArquivo(null);
                    setDadosCurso({ nome: '', descricao: '' });
                  }}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  Criar Outro
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadEdital;