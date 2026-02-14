import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { atualizarConfiguracoesEstudo, buscarConfiguracoesEstudo } from '../../services/Userservice';

export const ConfiguracoesEstudo = () => {
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const diasDaSemana = [
    { id: 'segunda', nome: 'Segunda-feira', abrev: 'Seg' },
    { id: 'terca', nome: 'Terça-feira', abrev: 'Ter' },
    { id: 'quarta', nome: 'Quarta-feira', abrev: 'Qua' },
    { id: 'quinta', nome: 'Quinta-feira', abrev: 'Qui' },
    { id: 'sexta', nome: 'Sexta-feira', abrev: 'Sex' },
    { id: 'sabado', nome: 'Sábado', abrev: 'Sáb' },
    { id: 'domingo', nome: 'Domingo', abrev: 'Dom' }
  ];

  const configuracoesDefault = {
    horasPorDia: {
      segunda: 4,
      terca: 4,
      quarta: 4,
      quinta: 4,
      sexta: 4,
      sabado: 0,
      domingo: 0
    }
  };

  const [configuracoes, setConfiguracoes] = useState(configuracoesDefault);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => {
    // Só carrega se o usuário estiver disponível
    if (usuario && usuario.uid) {
      carregarConfiguracoes();
    } else {
      setCarregando(false);
    }
  }, [usuario]);

  const carregarConfiguracoes = async () => {
    // Verificação adicional de segurança
    if (!usuario || !usuario.uid) {
      console.log('⚠️ Usuário não disponível ainda');
      setCarregando(false);
      return;
    }

    try {
      setCarregando(true);
      console.log('🔍 Carregando configurações do Firebase...');
      
      const resultado = await buscarConfiguracoesEstudo(usuario.uid);
      console.log('📦 Resultado do Firebase:', resultado);
      
      if (resultado.sucesso && resultado.configuracoes) {
        const configSalvas = resultado.configuracoes;
        console.log('✅ Configurações encontradas:', configSalvas);
        
        // Verificar se já está no novo formato (objeto com dias da semana)
        if (configSalvas.horasPorDia && typeof configSalvas.horasPorDia === 'object' && 
            configSalvas.horasPorDia.segunda !== undefined) {
          // Já está no formato correto
          console.log('✅ Formato correto detectado, carregando...');
          
          // Remover diasPorSemana se existir (campo obsoleto)
          const { diasPorSemana, ...configLimpa } = configSalvas;
          setConfiguracoes(configLimpa);
        } else {
          // Formato antigo, precisa migrar
          console.log('⚠️ Formato antigo detectado, migrando...');
          const horasDefault = typeof configSalvas.horasPorDia === 'number' 
            ? configSalvas.horasPorDia 
            : 4;
          
          const configMigradas = {
            horasPorDia: {
              segunda: horasDefault,
              terca: horasDefault,
              quarta: horasDefault,
              quinta: horasDefault,
              sexta: horasDefault,
              sabado: 0,
              domingo: 0
            }
          };
          
          setConfiguracoes(configMigradas);
          
          // Salvar o formato migrado automaticamente
          console.log('💾 Salvando formato migrado automaticamente...');
          await atualizarConfiguracoesEstudo(usuario.uid, configMigradas);
        }
      } else {
        console.log('ℹ️ Nenhuma configuração encontrada, usando padrão');
        setConfiguracoes(configuracoesDefault);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar configurações:', error);
      setErro('Erro ao carregar configurações. Usando valores padrão.');
    } finally {
      setCarregando(false);
    }
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    
    // Verificar se usuário está disponível
    if (!usuario || !usuario.uid) {
      setErro('Usuário não autenticado');
      return;
    }

    setErro('');
    setSucesso('');
    setSalvando(true);

    try {
      console.log('💾 Salvando configurações:', configuracoes);

      // Validações
      const diasComHoras = contarDiasComHoras();
      
      if (diasComHoras === 0) {
        setErro('Configure pelo menos 1 dia com horas de estudo');
        setSalvando(false);
        return;
      }

      // Verificar se há horas inválidas
      const horasInvalidas = Object.values(configuracoes.horasPorDia).some(
        horas => horas < 0 || horas > 12
      );

      if (horasInvalidas) {
        setErro('Horas por dia devem estar entre 0 e 12');
        setSalvando(false);
        return;
      }

      const resultado = await atualizarConfiguracoesEstudo(usuario.uid, configuracoes);
      console.log('📤 Resultado do salvamento:', resultado);

      if (resultado.sucesso) {
        setSucesso('Configurações salvas com sucesso!');
        console.log('✅ Configurações salvas com sucesso!');
        console.log('📊 Dias com horas configuradas:', diasComHoras);
        
        // Recarregar para confirmar que salvou
        setTimeout(async () => {
          const verificacao = await buscarConfiguracoesEstudo(usuario.uid);
          console.log('🔍 Verificação pós-salvamento:', verificacao);
        }, 500);
        
        setTimeout(() => {
          setSucesso('');
        }, 3000);
      } else {
        console.error('❌ Erro ao salvar:', resultado.erro);
        setErro(resultado.erro || 'Erro ao salvar configurações');
      }
    } catch (error) {
      console.error('❌ Erro no handleSalvar:', error);
      setErro('Erro ao salvar configurações');
    } finally {
      setSalvando(false);
    }
  };

  const contarDiasComHoras = () => {
    return Object.values(configuracoes.horasPorDia).filter(horas => horas > 0).length;
  };

  const calcularTotalHorasSemana = () => {
    return Object.values(configuracoes.horasPorDia)
      .reduce((total, horas) => total + horas, 0)
      .toFixed(1);
  };

  const calcularMediaHorasDia = () => {
    const diasComHoras = contarDiasComHoras();
    if (diasComHoras === 0) return 0;
    return (parseFloat(calcularTotalHorasSemana()) / diasComHoras).toFixed(1);
  };

  const atualizarHorasDia = (dia, valor) => {
    const novoValor = parseFloat(valor) || 0;
    console.log(`📝 Atualizando ${dia}: ${novoValor}h`);
    
    setConfiguracoes(prev => ({
      ...prev,
      horasPorDia: {
        ...prev.horasPorDia,
        [dia]: novoValor
      }
    }));
  };

  const aplicarHorasParaTodos = (horas) => {
    console.log(`🔄 Aplicando ${horas}h para todos os dias`);
    const novasHoras = {};
    diasDaSemana.forEach(dia => {
      novasHoras[dia.id] = horas;
    });
    setConfiguracoes({
      horasPorDia: novasHoras
    });
  };

  // Se o usuário não está autenticado, redirecionar
  if (!usuario) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto border-b-2 border-blue-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

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
            <p className="text-sm text-gray-600">Defina sua disponibilidade semanal</p>
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
          <h2 className="mb-4 text-xl font-bold">📊 Resumo da Disponibilidade</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <div className="p-4 bg-white rounded-lg bg-opacity-20 backdrop-blur">
              <p className="text-sm opacity-90">Dias/Semana</p>
              <p className="text-3xl font-bold">{contarDiasComHoras()}</p>
            </div>
            <div className="p-4 bg-white rounded-lg bg-opacity-20 backdrop-blur">
              <p className="text-sm opacity-90">Total/Semana</p>
              <p className="text-3xl font-bold">{calcularTotalHorasSemana()}h</p>
            </div>
            <div className="p-4 bg-white rounded-lg bg-opacity-20 backdrop-blur">
              <p className="text-sm opacity-90">Média/Dia</p>
              <p className="text-3xl font-bold">{calcularMediaHorasDia()}h</p>
            </div>
          </div>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSalvar} className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">⚙️ Disponibilidade por Dia</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Configure quantas horas você tem disponível em cada dia da semana
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => aplicarHorasParaTodos(4)}
                  className="px-3 py-1 text-sm text-blue-600 transition border border-blue-600 rounded-lg hover:bg-blue-50"
                >
                  4h para todos
                </button>
                <button
                  type="button"
                  onClick={() => aplicarHorasParaTodos(0)}
                  className="px-3 py-1 text-sm text-gray-600 transition border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Limpar tudo
                </button>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {diasDaSemana.map((dia) => (
              <div key={dia.id} className="flex items-center gap-4">
                <div className="w-32">
                  <p className="font-medium text-gray-700">{dia.nome}</p>
                  <p className="text-xs text-gray-500">{dia.abrev}</p>
                </div>
                
                <div className="flex items-center flex-1 gap-4">
                  <input
                    type="range"
                    min="0"
                    max="12"
                    step="0.5"
                    value={configuracoes.horasPorDia[dia.id]}
                    onChange={(e) => atualizarHorasDia(dia.id, e.target.value)}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: configuracoes.horasPorDia[dia.id] > 0 
                        ? `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${(configuracoes.horasPorDia[dia.id] / 12) * 100}%, #E5E7EB ${(configuracoes.horasPorDia[dia.id] / 12) * 100}%, #E5E7EB 100%)`
                        : '#E5E7EB'
                    }}
                  />
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="12"
                      step="0.5"
                      value={configuracoes.horasPorDia[dia.id]}
                      onChange={(e) => atualizarHorasDia(dia.id, e.target.value)}
                      className="w-20 px-3 py-2 text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <span className="text-sm font-medium text-gray-600">horas</span>
                  </div>
                </div>

                {configuracoes.horasPorDia[dia.id] === 0 && (
                  <span className="px-2 py-1 text-xs font-medium text-gray-500 bg-gray-100 rounded">
                    Sem estudo
                  </span>
                )}
                
                {configuracoes.horasPorDia[dia.id] > 0 && configuracoes.horasPorDia[dia.id] < 2 && (
                  <span className="px-2 py-1 text-xs font-medium text-yellow-700 bg-yellow-100 rounded">
                    Pouco tempo
                  </span>
                )}
                
                {configuracoes.horasPorDia[dia.id] >= 2 && configuracoes.horasPorDia[dia.id] <= 6 && (
                  <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded">
                    Ideal
                  </span>
                )}
                
                {configuracoes.horasPorDia[dia.id] > 6 && (
                  <span className="px-2 py-1 text-xs font-medium text-orange-700 bg-orange-100 rounded">
                    Muito tempo
                  </span>
                )}
              </div>
            ))}

            {/* Resumo visual */}
            <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
              <h3 className="mb-3 font-semibold text-blue-900">📈 Distribuição Semanal</h3>
              <div className="flex items-end justify-between h-32 gap-2">
                {diasDaSemana.map((dia) => (
                  <div key={dia.id} className="flex flex-col items-center flex-1 gap-2">
                    <div className="relative flex-1 w-full">
                      <div 
                        className="absolute bottom-0 w-full transition-all bg-blue-500 rounded-t"
                        style={{ 
                          height: `${(configuracoes.horasPorDia[dia.id] / 12) * 100}%`,
                          minHeight: configuracoes.horasPorDia[dia.id] > 0 ? '4px' : '0'
                        }}
                      ></div>
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-medium text-gray-700">{dia.abrev}</p>
                      <p className="text-xs font-bold text-blue-600">
                        {configuracoes.horasPorDia[dia.id]}h
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-4 text-xs text-gray-500">
                <span>0h</span>
                <span>12h</span>
              </div>
            </div>

            {/* Análise */}
            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
              <h3 className="mb-2 font-semibold text-gray-900">💡 Análise da Disponibilidade</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Dias de estudo na semana:</span>
                  <span className="font-bold text-blue-600">
                    {contarDiasComHoras()} {contarDiasComHoras() === 1 ? 'dia' : 'dias'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Total de horas semanais:</span>
                  <span className="font-bold text-blue-600">
                    {calcularTotalHorasSemana()}h
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Média de horas por dia útil:</span>
                  <span className="font-bold text-blue-600">
                    {calcularMediaHorasDia()}h
                  </span>
                </div>
                
                {contarDiasComHoras() === 0 && (
                  <div className="p-3 mt-3 text-xs text-red-700 border border-red-200 rounded bg-red-50">
                    ⚠️ Configure pelo menos 1 dia com horas de estudo para criar seu cronograma.
                  </div>
                )}
                
                {contarDiasComHoras() > 0 && parseFloat(calcularTotalHorasSemana()) < 10 && (
                  <div className="p-3 mt-3 text-xs text-yellow-700 border border-yellow-200 rounded bg-yellow-50">
                    ⚠️ Atenção: Menos de 10 horas semanais pode dificultar o progresso nos estudos.
                  </div>
                )}
                
                {parseFloat(calcularTotalHorasSemana()) >= 10 && parseFloat(calcularTotalHorasSemana()) <= 40 && (
                  <div className="p-3 mt-3 text-xs text-green-700 border border-green-200 rounded bg-green-50">
                    ✓ Excelente! Uma carga horária equilibrada e sustentável.
                  </div>
                )}
                
                {parseFloat(calcularTotalHorasSemana()) > 40 && (
                  <div className="p-3 mt-3 text-xs text-orange-700 border border-orange-200 rounded bg-orange-50">
                    ⚠️ Cuidado: Muitas horas pode levar ao esgotamento. Reserve tempo para descanso.
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
              disabled={salvando || contarDiasComHoras() === 0}
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
              <span>Distribua as horas de forma equilibrada ao longo da semana</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-green-600">✓</span>
              <span>Evite concentrar todo o estudo em poucos dias - a constância é mais efetiva</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-green-600">✓</span>
              <span>Reserve pelo menos 1 dia de descanso completo por semana</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-green-600">✓</span>
              <span>Entre 2 a 6 horas por dia é considerado o tempo ideal para a maioria dos estudantes</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ConfiguracoesEstudo;
