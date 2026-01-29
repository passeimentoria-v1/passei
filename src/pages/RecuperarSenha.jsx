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
    <div className="flex items-center justify-center min-h-screen px-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-5xl font-bold text-blue-600">Passar</h1>
          <p className="text-gray-600">Plataforma de Mentoria para Concursos</p>
        </div>

        <div className="p-8 bg-white shadow-xl rounded-2xl">
          <h2 className="mb-2 text-2xl font-bold text-gray-800">Recuperar Senha</h2>
          <p className="mb-6 text-gray-600">
            Digite seu email e enviaremos um link para redefinir sua senha
          </p>

          {mensagem && (
            <div className="p-3 mb-4 text-sm text-green-700 border border-green-200 rounded-lg bg-green-50">
              {mensagem}
            </div>
          )}

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
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErro('');
                  setMensagem('');
                }}
                className="w-full px-4 py-2 transition border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="seu@email.com"
              />
            </div>

            <button
              type="submit"
              disabled={carregando}
              className="w-full py-3 font-semibold text-white transition bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              {carregando ? 'Enviando...' : 'Enviar Link de Recuperação'}
            </button>
          </form>

          <div className="mt-6 text-sm text-center text-gray-600">
            Lembrou a senha?{' '}
            <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700">
              Fazer login
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

export default RecuperarSenha;