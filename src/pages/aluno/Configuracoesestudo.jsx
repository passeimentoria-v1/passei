import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { atualizarConfiguracoesEstudo, buscarConfiguracoesEstudo } from '../../services/userService';

export const ConfiguracoesEstudo = () => {
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [configuracoes, setConfiguracoes] = useState({
    diasPorSemana: 5,
    horasPorDia: 4,
    tempoPorDisciplina: 60,
    disciplinasPorDia: 3
  });

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => {
    carregarConfiguracoes();
  }, []);

  const carregarConfiguracoes = async () => {
    setCarregando(true);
    const resultado = await buscarConfiguracoesEstudo(usuario.uid);
    
    if (resultado.sucesso) {
      setConfiguracoes(resultado.configuracoes);
    }
    
    setCarregando(false);
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    setErro('');
    setSucesso('');
    setSalvando(true);

    // Validações
    if (configuracoes.diasPorSemana < 1 || configuracoes.diasPorSemana > 7) {
      setErro('Dias por semana deve estar entre 1 e 7');
      setSalvando(false);
      return;
    }

    if (configuracoes.horasPorDia < 0.5 || configuracoes.horasPorDia > 12) {
      setErro('Horas por dia deve estar entre 0.5 e 12');
      setSalvando(false);
      return;
    }

    if (configuracoes.tempoPorDisciplina < 15 || configuracoes.tempoPorDisciplina > 180) {
      setErro('Tempo por disciplina deve estar entre 15 e 180 minutos');
      setSalvando(false);
      return;
    }

    if (configuracoes.disciplinasPorDia < 1 || configuracoes.disciplinasPorDia > 10) {
      setErro('Disciplinas por dia deve estar entre 1 e 10');
      setSalvando(false);
      return;
    }

    const resultado = await atualizarConfiguracoesEstudo(usuario.uid, configuracoes);

    if (resultado.sucesso) {
      setSucesso('Configurações salvas com sucesso!');
      setTimeout(() => {
        setSucesso('');
      }, 3000);
    } else {
      setErro(resultado.erro || 'Erro ao salvar configurações');
    }

    setSalvando(false);
  };

  const calcularTotalHoras = () => {
    return (configuracoes.diasPorSemana * configuracoes.horasPorDia).toFixed(1);
  };

  const calcularTempoDisponivel = () => {
    const totalMinutosPorDia = configuracoes.horasPorDia * 60;
    const tempoGasto = configuracoes.disciplinasPorDia * configuracoes.tempoPorDisciplina;
    return totalMinutosPorDia - tempoGasto;
  };

  if (carregando) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto border-b-2 border-blue-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="flex items-center max-w-4xl gap-4 px-4 py-4 mx-auto">
          <button
            onClick={() => navigate('/aluno/dashboard')}
            className="text-gray-600 hover:text-gray-800"
          >
            ← Voltar
          </button>
          <div>
            <h1 className="text-2xl font-bold text-blue-600">Configurações de Estudo</h1>
            <p className="text-sm text-gray-600">Personalize seu cronograma de estudos</p>
          </div>
        </div>
      </header>

      <div className="max-w-4xl px-4 py-8 mx-auto">
        {sucesso && (
          <div className="p-4 mb-4 text-green-700 border border-green-200 rounded-lg bg-green-50">
            ✓ {sucesso}
          </div>
        )}

        {erro && (
          <div className="p-4 mb-4 text-red-600 border border-red-200 rounded-lg bg-red-50">
            ⚠️ {erro}
          </div>
        )}

        {/* Card de Resumo */}
        <div className="p-6 mb-6 text-white rounded-lg shadow-lg bg-gradient-to-r from-blue-500 to-purple-600">
          <h2 className="mb-4 text-xl font-bold">📊 Seu Plano de Estudos</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="p-4 bg-white rounded-lg bg-opacity-20 backdrop-blur">
              <p className="text-sm opacity-90">Dias/Semana</p>
              <p className="text-3xl font-bold">{configuracoes.diasPorSemana}</p>
            </div>
            <div className="p-4 bg-white rounded-lg bg-opacity-20 backdrop-blur">
              <p className="text-sm opacity-90">Horas/Dia</p>
              <p className="text-3xl font-bold">{configuracoes.horasPorDia}h</p>
            </div>
            <div className="p-4 bg-white rounded-lg bg-opacity-20 backdrop-blur">
              <p className="text-sm opacity-90">Total/Semana</p>
              <p className="text-3xl font-bold">{calcularTotalHoras()}h</p>
            </div>
            <div className="p-4 bg-white rounded-lg bg-opacity-20 backdrop-blur">
              <p className="text-sm opacity-90">Disciplinas/Dia</p>
              <p className="text-3xl font-bold">{configuracoes.disciplinasPorDia}</p>
            </div>
          </div>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSalvar} className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">⚙️ Configurações</h2>
            <p className="mt-1 text-sm text-gray-600">
              Defina quantos dias e horas você tem disponível para estudar
            </p>
          </div>

          <div className="p-6 space-y-6">
            {/* Dias por Semana */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                📅 Quantos dias por semana você pode estudar?
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="7"
                  value={configuracoes.diasPorSemana}
                  onChange={(e) => setConfiguracoes({...configuracoes, diasPorSemana: parseInt(e.target.value)})}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="w-20 text-center">
                  <span className="text-2xl font-bold text-blue-600">{configuracoes.diasPorSemana}</span>
                  <p className="text-xs text-gray-500">
                    {configuracoes.diasPorSemana === 1 ? 'dia' : 'dias'}
                  </p>
                </div>
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>1 dia</span>
                <span>7 dias</span>
              </div>
            </div>

            {/* Horas por Dia */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                ⏰ Quantas horas por dia você pode dedicar aos estudos?
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0.5"
                  max="12"
                  step="0.5"
                  value={configuracoes.horasPorDia}
                  onChange={(e) => setConfiguracoes({...configuracoes, horasPorDia: parseFloat(e.target.value)})}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="w-20 text-center">
                  <span className="text-2xl font-bold text-blue-600">{configuracoes.horasPorDia}</span>
                  <p className="text-xs text-gray-500">horas</p>
                </div>
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>30 min</span>
                <span>12 horas</span>
              </div>
            </div>

            {/* Tempo por Disciplina */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                📚 Tempo máximo por disciplina (minutos)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="15"
                  max="180"
                  step="15"
                  value={configuracoes.tempoPorDisciplina}
                  onChange={(e) => setConfiguracoes({...configuracoes, tempoPorDisciplina: parseInt(e.target.value)})}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="w-20 text-center">
                  <span className="text-2xl font-bold text-blue-600">{configuracoes.tempoPorDisciplina}</span>
                  <p className="text-xs text-gray-500">min</p>
                </div>
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>15 min</span>
                <span>3 horas</span>
              </div>
            </div>

            {/* Disciplinas por Dia */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                🎯 Quantas disciplinas diferentes por dia?
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={configuracoes.disciplinasPorDia}
                  onChange={(e) => setConfiguracoes({...configuracoes, disciplinasPorDia: parseInt(e.target.value)})}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="w-20 text-center">
                  <span className="text-2xl font-bold text-blue-600">{configuracoes.disciplinasPorDia}</span>
                  <p className="text-xs text-gray-500">
                    {configuracoes.disciplinasPorDia === 1 ? 'matéria' : 'matérias'}
                  </p>
                </div>
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>1 disciplina</span>
                <span>10 disciplinas</span>
              </div>
            </div>

            {/* Tempo Disponível/Usado */}
            <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
              <h3 className="mb-2 font-semibold text-blue-900">💡 Análise do Plano</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Total de tempo disponível por dia:</span>
                  <span className="font-bold text-blue-600">
                    {(configuracoes.horasPorDia * 60).toFixed(0)} minutos
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Tempo planejado para disciplinas:</span>
                  <span className="font-bold text-blue-600">
                    {configuracoes.disciplinasPorDia * configuracoes.tempoPorDisciplina} minutos
                  </span>
                </div>
                <div className="flex justify-between pt-2 mt-2 border-t border-blue-300">
                  <span className="font-medium text-gray-700">Tempo livre (intervalos/revisão):</span>
                  <span className={`font-bold ${
                    calcularTempoDisponivel() >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {calcularTempoDisponivel()} minutos
                  </span>
                </div>
                
                {calcularTempoDisponivel() < 0 && (
                  <div className="p-3 mt-3 text-xs text-red-700 border border-red-200 rounded bg-red-50">
                    ⚠️ Atenção: O tempo planejado excede o tempo disponível! Ajuste as configurações.
                  </div>
                )}
                
                {calcularTempoDisponivel() >= 0 && calcularTempoDisponivel() < 30 && (
                  <div className="p-3 mt-3 text-xs text-yellow-700 border border-yellow-200 rounded bg-yellow-50">
                    ⚠️ Pouco tempo livre. Considere reduzir disciplinas ou aumentar tempo disponível.
                  </div>
                )}
                
                {calcularTempoDisponivel() >= 30 && (
                  <div className="p-3 mt-3 text-xs text-green-700 border border-green-200 rounded bg-green-50">
                    ✓ Ótimo! Você terá tempo para intervalos e revisões.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3 px-6 py-4 rounded-b-lg bg-gray-50">
            <button
              type="button"
              onClick={() => navigate('/aluno/dashboard')}
              className="px-6 py-2 text-gray-700 transition bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando || calcularTempoDisponivel() < 0}
              className="flex-1 px-6 py-2 font-semibold text-white transition bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {salvando ? 'Salvando...' : '💾 Salvar Configurações'}
            </button>
          </div>
        </form>

        {/* Dicas */}
        <div className="p-6 mt-6 bg-white rounded-lg shadow">
          <h3 className="mb-3 font-semibold text-gray-800">💡 Dicas para um bom planejamento:</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="font-bold text-green-600">✓</span>
              <span>Seja realista com o tempo disponível - considere trabalho, família e descanso</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-green-600">✓</span>
              <span>Deixe sempre um tempo livre para revisões e imprevistos (mínimo 30 min)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-green-600">✓</span>
              <span>Variar disciplinas no mesmo dia ajuda a manter o foco e evitar fadiga mental</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-green-600">✓</span>
              <span>60-90 minutos por disciplina é o tempo ideal para absorção efetiva</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-green-600">✓</span>
              <span>Estudar 5-6 dias por semana com 1-2 dias de descanso é mais sustentável</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ConfiguracoesEstudo;