import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { validarConvite, usarConvite } from '../services/conviteService';

export const Registro = () => {
  const navigate = useNavigate();
  const { registrar, loginGoogle } = useAuth();

  const [etapa, setEtapa] = useState(1);

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    tipo: '',
    codigoConvite: '',
    mentorId: '',
    mentorNome: ''
  });

  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [validandoConvite, setValidandoConvite] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setErro('');
  };

  const selecionarTipo = (tipo) => {
    setFormData({ ...formData, tipo });
    setEtapa(2);
  };

  const handleValidarConvite = async () => {
    if (!formData.codigoConvite) {
      setErro('Digite o código de convite');
      return;
    }

    setValidandoConvite(true);
    setErro('');

    const resultado = await validarConvite(formData.codigoConvite);

    if (resultado.valido) {
      setFormData({
        ...formData,
        mentorId: resultado.mentorId,
        mentorNome: resultado.mentorNome,
        conviteId: resultado.conviteId
      });
      setEtapa(3);
    } else {
      setErro(resultado.erro);
    }

    setValidandoConvite(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCarregando(true);
    setErro('');

    const { nome, email, senha, confirmarSenha, tipo } = formData;

    if (!nome || !email || !senha || !confirmarSenha) {
      setErro('Preencha todos os campos');
      setCarregando(false);
      return;
    }

    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem');
      setCarregando(false);
      return;
    }

    if (senha.length < 6) {
      setErro('A senha deve ter no mínimo 6 caracteres');
      setCarregando(false);
      return;
    }

    const resultado = await registrar({
      nome,
      email,
      senha,
      tipo,
      mentorId: tipo === 'aluno' ? formData.mentorId : null
    });

    if (resultado.sucesso) {
      // Se for aluno e usou convite, decrementar usos
      if (tipo === 'aluno' && formData.conviteId) {
        await usarConvite(formData.conviteId);
      }

      if (tipo === 'mentor') {
        navigate('/mentor/dashboard');
      } else {
        navigate('/aluno/dashboard');
      }
    } else {
      setErro(resultado.erro);
    }

    setCarregando(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-blue-600 mb-2">Passei</h1>
          <p className="text-gray-600">Plataforma de Mentoria para Concursos</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Etapa 1: Escolher tipo */}
          {etapa === 1 && (
            <>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Criar Conta</h2>
              <p className="text-gray-600 mb-6">Como você quer usar a plataforma?</p>

              <div className="space-y-3">
                <button
                  onClick={() => selecionarTipo('aluno')}
                  className="w-full p-4 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition">
                      <span className="text-2xl">👨‍🎓</span>
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-800">Sou Aluno</h3>
                      <p className="text-sm text-gray-600">Vou estudar com meu mentor</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => selecionarTipo('mentor')}
                  className="w-full p-4 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition">
                      <span className="text-2xl">👨‍🏫</span>
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-800">Sou Mentor</h3>
                      <p className="text-sm text-gray-600">Vou acompanhar meus alunos</p>
                    </div>
                  </div>
                </button>
              </div>

              <div className="mt-6 text-center text-sm text-gray-600">
                Já tem uma conta?{' '}
                <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
                  Faça login
                </Link>
              </div>
            </>
          )}

          {/* Etapa 2: Validar código de convite (só para alunos) */}
          {etapa === 2 && formData.tipo === 'aluno' && (
            <>
              <button
                onClick={() => setEtapa(1)}
                className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
              >
                ← Voltar
              </button>

              <h2 className="text-2xl font-bold text-gray-800 mb-2">Código de Convite</h2>
              <p className="text-gray-600 mb-6">Digite o código fornecido pelo seu mentor</p>

              {erro && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {erro}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código de Convite
                  </label>
                  <input
                    type="text"
                    name="codigoConvite"
                    value={formData.codigoConvite}
                    onChange={handleChange}
                    placeholder="Ex: ABC12345"
                    maxLength="8"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase text-center text-xl font-mono tracking-wider"
                  />
                </div>

                <button
                  onClick={handleValidarConvite}
                  disabled={validandoConvite || !formData.codigoConvite}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {validandoConvite ? 'Validando...' : 'Validar Código'}
                </button>
              </div>
            </>
          )}

          {/* Etapa 3: Preencher dados (ou etapa 2 para mentores) */}
          {((etapa === 3 && formData.tipo === 'aluno') || (etapa === 2 && formData.tipo === 'mentor')) && (
            <>
              <button
                onClick={() => setEtapa(formData.tipo === 'aluno' ? 2 : 1)}
                className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
              >
                ← Voltar
              </button>

              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {formData.tipo === 'mentor' ? 'Cadastro de Mentor' : 'Cadastro de Aluno'}
              </h2>

              {formData.tipo === 'aluno' && formData.mentorNome && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700">
                    ✓ Mentor: <strong>{formData.mentorNome}</strong>
                  </p>
                </div>
              )}

              <p className="text-gray-600 mb-6">Preencha seus dados</p>

              {erro && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {erro}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome Completo
                  </label>
                  <input
                    name="nome"
                    type="text"
                    required
                    value={formData.nome}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Seu nome completo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="seu@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Senha
                  </label>
                  <input
                    name="senha"
                    type="password"
                    required
                    value={formData.senha}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmar Senha
                  </label>
                  <input
                    name="confirmarSenha"
                    type="password"
                    required
                    value={formData.confirmarSenha}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Repita a senha"
                  />
                </div>

                <button
                  type="submit"
                  disabled={carregando}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-blue-300 disabled:cursor-not-allowed mt-2"
                >
                  {carregando ? 'Cadastrando...' : 'Cadastrar'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          © 2025 Passei. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
};

export default Registro;