import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../firebase.config';
import { validarConvite, aceitarConvite } from '../services/conviteService';

export const Registro = () => {
  const navigate = useNavigate();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [codigoConvite, setCodigoConvite] = useState('');

  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');

    // Validações
    if (senha.length < 6) {
      setErro('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem');
      return;
    }

    // Validar código de convite
    if (!codigoConvite) {
      setErro('Código de convite é obrigatório');
      return;
    }

    setCarregando(true);
    const resultadoValidacao = await validarConvite(codigoConvite);

    if (!resultadoValidacao.valido) {
      setErro(resultadoValidacao.mensagem);
      setCarregando(false);
      return;
    }

    const conviteData = resultadoValidacao.convite;

    try {
      // Criar usuário no Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
      const user = userCredential.user;

      // Criar documento do aluno no Firestore
      await setDoc(doc(db, 'users', user.uid), {
        nome,
        email,
        tipo: 'aluno',
        ativo: true,
        dataCriacao: Timestamp.now(),
        mentorId: conviteData.mentorId,
        cursoId: conviteData.cursoId
      });

      // Aceitar convite
      await aceitarConvite(user.uid, conviteData.id, conviteData.mentorId, conviteData.cursoId);

      // Redirecionar para dashboard do aluno
      navigate('/aluno/dashboard');
    } catch (error) {
      console.error('Erro ao criar conta:', error);
      
      if (error.code === 'auth/email-already-in-use') {
        setErro('Este e-mail já está cadastrado');
      } else if (error.code === 'auth/invalid-email') {
        setErro('E-mail inválido');
      } else if (error.code === 'auth/weak-password') {
        setErro('Senha muito fraca');
      } else {
        setErro('Erro ao criar conta. Tente novamente.');
      }
    }

    setCarregando(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-blue-600">Passei</h1>
          <p className="text-gray-600 mt-2">Cadastro de Aluno</p>
        </div>

        {erro && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {erro}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Código de Convite */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Código de Convite *
            </label>
            <input
              type="text"
              value={codigoConvite}
              onChange={(e) => setCodigoConvite(e.target.value.toUpperCase())}
              required
              maxLength={8}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono uppercase"
              placeholder="XXXXXXXX"
            />
            <p className="mt-1 text-xs text-blue-600">
              💡 Solicite o código de convite ao seu mentor
            </p>
          </div>

          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome Completo
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Seu nome completo"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="seu@email.com"
            />
          </div>

          {/* Senha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Senha
            </label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          {/* Confirmar Senha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirmar Senha
            </label>
            <input
              type="password"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Confirme sua senha"
            />
          </div>

          {/* Botão Cadastrar */}
          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {carregando ? 'Criando conta...' : 'Criar Conta'}
          </button>
        </form>

        {/* Link para Login */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Já tem uma conta?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-blue-600 font-semibold hover:underline"
            >
              Faça login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Registro;