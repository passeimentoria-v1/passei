import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const RecuperarSenha = () => {
  const { resetarSenha } = useAuth();

  const [email, setEmail] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCarregando(true);
    setErro('');
    setMensagem('');

    if (!email) {
      setErro('Digite seu email');
      setCarregando(false);
      return;
    }

    const resultado = await resetarSenha(email);

    if (resultado.sucesso) {
      setMensagem(resultado.mensagem);
      setEmail('');
    } else {
      setErro(resultado.erro);
    }

    setCarregando(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-blue-600 mb-2">Passei</h1>
          <p className="text-gray-600">Plataforma de Mentoria para Concursos</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Recuperar Senha</h2>
          <p className="text-gray-600 mb-6">
            Digite seu email e enviaremos um link para redefinir sua senha
          </p>

          {mensagem && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              {mensagem}
            </div>
          )}

          {erro && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {erro}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErro('');
                  setMensagem('');
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="seu@email.com"
              />
            </div>

            <button
              type="submit"
              disabled={carregando}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              {carregando ? 'Enviando...' : 'Enviar Link de Recuperação'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Lembrou a senha?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
              Fazer login
            </Link>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          © 2025 Passei. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
};

export default RecuperarSenha;