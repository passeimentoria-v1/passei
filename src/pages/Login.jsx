import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const Login = () => {
  const navigate = useNavigate();
  const { login, loginGoogle } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    senha: ''
  });

  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setErro('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCarregando(true);
    setErro('');

    const { email, senha } = formData;

    if (!email || !senha) {
      setErro('Preencha todos os campos');
      setCarregando(false);
      return;
    }

    const resultado = await login(email, senha);

    if (resultado.sucesso) {
      if (resultado.usuario.tipo === 'mentor') {
        navigate('/mentor/dashboard');
      } else {
        navigate('/aluno/dashboard');
      }
    } else {
      setErro(resultado.erro);
    }

    setCarregando(false);
  };

  const handleGoogleLogin = async () => {
    setCarregando(true);
    setErro('');

    const resultado = await loginGoogle('aluno');

    if (resultado.sucesso) {
      if (resultado.usuario.tipo === 'mentor') {
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
    <div className="flex items-center justify-center min-h-screen px-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-5xl font-bold text-blue-600">Passar</h1>
          <p className="text-gray-600">Plataforma de Mentoria para Concursos</p>
        </div>

        <div className="p-8 bg-white shadow-xl rounded-2xl">
          <h2 className="mb-6 text-2xl font-bold text-gray-800">Entrar</h2>

          {erro && (
            <div className="p-3 mb-4 text-sm text-red-600 border border-red-200 rounded-lg bg-red-50">
              {erro}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block mb-1 text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 transition border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label htmlFor="senha" className="block mb-1 text-sm font-medium text-gray-700">
                Senha
              </label>
              <input
                id="senha"
                name="senha"
                type="password"
                required
                value={formData.senha}
                onChange={handleChange}
                className="w-full px-4 py-2 transition border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            <div className="text-right">
              <Link
                to="/recuperar-senha"
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Esqueci minha senha
              </Link>
            </div>

            <button
              type="submit"
              disabled={carregando}
              className="w-full py-3 font-semibold text-white transition bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              {carregando ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-4 text-sm text-gray-500">ou</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          <div className="mt-6 text-sm text-center text-gray-600">
            Não tem uma conta?{' '}
            <Link to="/registro" className="font-semibold text-blue-600 hover:text-blue-700">
              Cadastre-se
            </Link>
          </div>
        </div>

        <p className="mt-6 text-sm text-center text-gray-500">
          © 2025 Passar. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
};

export default Login;