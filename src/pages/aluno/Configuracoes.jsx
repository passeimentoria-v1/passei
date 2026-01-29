import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  buscarDadosPerfil,
  uploadFotoPerfil,
  removerFotoPerfil,
  atualizarNome,
  alterarSenha
} from '../../services/perfilService';

export const Configuracoes = () => {
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();

  // Estados de dados
  const [dados, setDados] = useState(null);
  const [nome, setNome] = useState('');
  const [fotoURL, setFotoURL] = useState('');
  
  // Estados de senha
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  // Estados de UI
  const [abaAtiva, setAbaAtiva] = useState('perfil');
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [uploadando, setUploadando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setCarregando(true);
    const resultado = await buscarDadosPerfil(usuario.uid);
    
    if (resultado.sucesso) {
      setDados(resultado.dados);
      setNome(resultado.dados.nome || '');
      setFotoURL(resultado.dados.fotoURL || '');
    }
    
    setCarregando(false);
  };

  const handleUploadFoto = async (e) => {
    const arquivo = e.target.files[0];
    if (!arquivo) return;

    setUploadando(true);
    setErro('');

    const resultado = await uploadFotoPerfil(usuario.uid, arquivo);

    if (resultado.sucesso) {
      setFotoURL(resultado.fotoURL);
      setSucesso('Foto atualizada com sucesso!');
      setTimeout(() => setSucesso(''), 3000);
    } else {
      setErro(resultado.erro);
    }

    setUploadando(false);
  };

  const handleRemoverFoto = async () => {
    if (!window.confirm('Deseja realmente remover sua foto de perfil?')) return;

    setUploadando(true);
    const resultado = await removerFotoPerfil(usuario.uid);

    if (resultado.sucesso) {
      setFotoURL('');
      setSucesso('Foto removida com sucesso!');
      setTimeout(() => setSucesso(''), 3000);
    } else {
      setErro(resultado.erro);
    }

    setUploadando(false);
  };

  const handleSalvarNome = async (e) => {
    e.preventDefault();
    setSalvando(true);
    setErro('');

    const resultado = await atualizarNome(usuario.uid, nome);

    if (resultado.sucesso) {
      setSucesso('Nome atualizado com sucesso!');
      setTimeout(() => setSucesso(''), 3000);
    } else {
      setErro(resultado.erro);
    }

    setSalvando(false);
  };

  const handleAlterarSenha = async (e) => {
    e.preventDefault();
    setErro('');

    if (novaSenha.length < 6) {
      setErro('A nova senha deve ter no mínimo 6 caracteres');
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setErro('As senhas não coincidem');
      return;
    }

    setSalvando(true);

    const resultado = await alterarSenha(senhaAtual, novaSenha);

    if (resultado.sucesso) {
      setSucesso('Senha alterada com sucesso!');
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');
      setTimeout(() => setSucesso(''), 3000);
    } else {
      setErro(resultado.erro);
    }

    setSalvando(false);
  };

  const handleLogout = async () => {
    if (window.confirm('Deseja realmente sair?')) {
      await logout();
      navigate('/login');
    }
  };

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

  const iniciais = nome ? nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '??';

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="flex items-center gap-4 px-4 py-4 mx-auto max-w-7xl">
          <button
            onClick={() => navigate(dados?.tipo === 'aluno' ? '/aluno/dashboard' : '/mentor/dashboard')}
            className="text-gray-600 hover:text-gray-800"
          >
            ← Voltar
          </button>
          <h1 className="text-2xl font-bold text-blue-600">Configurações</h1>
        </div>
      </header>

      <div className="max-w-4xl px-4 py-8 mx-auto">
        {sucesso && (
          <div className="flex items-center gap-2 p-4 mb-4 text-green-700 border border-green-200 rounded-lg bg-green-50">
            <span>✓</span>
            <span>{sucesso}</span>
          </div>
        )}

        {erro && (
          <div className="flex items-center gap-2 p-4 mb-4 text-red-600 border border-red-200 rounded-lg bg-red-50">
            <span>⚠</span>
            <span>{erro}</span>
          </div>
        )}

        {/* Card de Perfil Resumido */}
        <div className="p-6 mb-6 bg-white rounded-lg shadow">
          <div className="flex items-center gap-6">
            {/* Foto de Perfil */}
            <div className="relative">
              <div className="flex items-center justify-center w-24 h-24 overflow-hidden rounded-full shadow-lg bg-gradient-to-br from-blue-500 to-purple-600">
                {fotoURL ? (
                  <img
                    src={fotoURL}
                    alt="Foto de perfil"
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <span className="text-3xl font-bold text-white">{iniciais}</span>
                )}
              </div>
              
              {uploadando && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                  <div className="w-8 h-8 border-b-2 border-white rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-800">{nome}</h2>
              <p className="text-gray-600">{dados?.email}</p>
              <div className="flex gap-2 mt-2">
                <span className="px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 rounded-full">
                  {dados?.tipo === 'aluno' ? '👨‍🎓 Aluno' : '👨‍🏫 Mentor'}
                </span>
                {dados?.cursoNome && (
                  <span className="px-3 py-1 text-sm font-medium text-purple-700 bg-purple-100 rounded-full">
                    📚 {dados.cursoNome}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Abas */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setAbaAtiva('perfil')}
                className={`flex-1 px-6 py-4 font-medium transition ${
                  abaAtiva === 'perfil'
                    ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="mr-2 text-xl">👤</span>
                Perfil
              </button>
              <button
                onClick={() => setAbaAtiva('seguranca')}
                className={`flex-1 px-6 py-4 font-medium transition ${
                  abaAtiva === 'seguranca'
                    ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="mr-2 text-xl">🔒</span>
                Segurança
              </button>
              <button
                onClick={() => setAbaAtiva('conta')}
                className={`flex-1 px-6 py-4 font-medium transition ${
                  abaAtiva === 'conta'
                    ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="mr-2 text-xl">⚙️</span>
                Conta
              </button>
            </div>
          </div>

          {/* CONTEÚDO - PERFIL */}
          {abaAtiva === 'perfil' && (
            <div className="p-6 space-y-6">
              {/* Upload de Foto */}
              <div>
                <h3 className="mb-4 text-lg font-semibold text-gray-800">Foto de Perfil</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-20 h-20 overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
                    {fotoURL ? (
                      <img src={fotoURL} alt="Perfil" className="object-cover w-full h-full" />
                    ) : (
                      <span className="text-2xl font-bold text-white">{iniciais}</span>
                    )}
                  </div>
                  
                  <div className="flex gap-3">
                    <label className="px-4 py-2 text-white transition bg-blue-600 rounded-lg cursor-pointer hover:bg-blue-700">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleUploadFoto}
                        disabled={uploadando}
                        className="hidden"
                      />
                      {uploadando ? 'Enviando...' : '📸 Alterar Foto'}
                    </label>
                    
                    {fotoURL && (
                      <button
                        onClick={handleRemoverFoto}
                        disabled={uploadando}
                        className="px-4 py-2 text-white transition bg-red-600 rounded-lg hover:bg-red-700"
                      >
                        🗑️ Remover
                      </button>
                    )}
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-500">JPG, PNG ou WEBP. Máximo 5MB.</p>
              </div>

              {/* Formulário Nome */}
              <div>
                <h3 className="mb-4 text-lg font-semibold text-gray-800">Informações Pessoais</h3>
                <form onSubmit={handleSalvarNome} className="space-y-4">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      Nome Completo
                    </label>
                    <input
                      type="text"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      E-mail
                    </label>
                    <input
                      type="email"
                      value={dados?.email}
                      disabled
                      className="w-full px-4 py-2 text-gray-600 bg-gray-100 border border-gray-300 rounded-lg cursor-not-allowed"
                    />
                    <p className="mt-1 text-xs text-gray-500">O e-mail não pode ser alterado</p>
                  </div>

                  {dados?.tipo === 'aluno' && (
                    <>
                      {dados.cursoNome && (
                        <div>
                          <label className="block mb-2 text-sm font-medium text-gray-700">
                            Curso Vinculado
                          </label>
                          <div className="w-full px-4 py-2 font-medium text-blue-700 border border-blue-300 rounded-lg bg-blue-50">
                            📚 {dados.cursoNome}
                          </div>
                        </div>
                      )}

                      {dados.mentorNome && (
                        <div>
                          <label className="block mb-2 text-sm font-medium text-gray-700">
                            Mentor
                          </label>
                          <div className="w-full px-4 py-2 font-medium text-purple-700 border border-purple-300 rounded-lg bg-purple-50">
                            👨‍🏫 {dados.mentorNome}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  <button
                    type="submit"
                    disabled={salvando}
                    className="w-full py-3 font-semibold text-white transition bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {salvando ? 'Salvando...' : '💾 Salvar Alterações'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* CONTEÚDO - SEGURANÇA */}
          {abaAtiva === 'seguranca' && (
            <div className="p-6">
              <h3 className="mb-4 text-lg font-semibold text-gray-800">Alterar Senha</h3>
              
              <form onSubmit={handleAlterarSenha} className="space-y-4">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Senha Atual
                  </label>
                  <input
                    type="password"
                    value={senhaAtual}
                    onChange={(e) => setSenhaAtual(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Digite sua senha atual"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Nova Senha
                  </label>
                  <input
                    type="password"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Confirmar Nova Senha
                  </label>
                  <input
                    type="password"
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Digite novamente"
                  />
                </div>

                <button
                  type="submit"
                  disabled={salvando}
                  className="w-full py-3 font-semibold text-white transition bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {salvando ? 'Alterando...' : '🔑 Alterar Senha'}
                </button>
              </form>

              <div className="p-4 mt-6 border border-yellow-200 rounded-lg bg-yellow-50">
                <p className="text-sm text-yellow-800">
                  💡 <strong>Dica:</strong> Use uma senha forte com letras, números e símbolos.
                </p>
              </div>
            </div>
          )}

          {/* CONTEÚDO - CONTA */}
          {abaAtiva === 'conta' && (
            <div className="p-6 space-y-6">
              {/* Informações */}
              <div>
                <h3 className="mb-4 text-lg font-semibold text-gray-800">Informações da Conta</h3>
                <div className="p-4 space-y-3 rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Tipo de Conta:</span>
                    <span className="font-medium text-gray-800">
                      {dados?.tipo === 'aluno' ? '👨‍🎓 Aluno' : '👨‍🏫 Mentor'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">ID do Usuário:</span>
                    <span className="font-mono text-xs text-gray-600">{usuario.uid}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Membro desde:</span>
                    <span className="text-gray-800">
                      {dados?.dataCriacao ? new Date(dados.dataCriacao.toDate()).toLocaleDateString('pt-BR') : '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Logout */}
              <div>
                <h3 className="mb-4 text-lg font-semibold text-gray-800">Sessão</h3>
                <button
                  onClick={handleLogout}
                  className="w-full py-3 font-semibold text-white transition bg-red-600 rounded-lg hover:bg-red-700"
                >
                  🚪 Sair da Conta
                </button>
              </div>

              {/* Zona de Perigo */}
              <div className="pt-6 border-t border-gray-200">
                <h3 className="mb-4 text-lg font-semibold text-red-600">⚠️ Zona de Perigo</h3>
                <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                  <p className="mb-3 text-sm text-red-700">
                    Esta ação é irreversível e apagará todos os seus dados permanentemente.
                  </p>
                  <button
                    onClick={() => alert('Funcionalidade em desenvolvimento. Entre em contato com o suporte para excluir sua conta.')}
                    className="px-4 py-2 text-white transition bg-red-600 rounded-lg hover:bg-red-700"
                  >
                    🗑️ Excluir Conta
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Configuracoes;