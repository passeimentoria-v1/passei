import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import ptBR from 'date-fns/locale/pt-BR';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useAuth } from '../../contexts/AuthContext';
import { 
  buscarMetasAluno, 
  reagendarMeta,
  concluirMeta,
  desconcluirMeta
} from '../../services/metaService';

const locales = {
  'pt-BR': ptBR
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales
});

const messages = {
  allDay: 'Dia inteiro',
  previous: 'Anterior',
  next: 'Próximo',
  today: 'Hoje',
  month: 'Mês',
  week: 'Semana',
  day: 'Dia',
  agenda: 'Agenda',
  date: 'Data',
  time: 'Hora',
  event: 'Meta',
  noEventsInRange: 'Não há metas neste período',
  showMore: (total) => `+ ${total} mais`
};

export const CalendarioMetas = () => {
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [eventos, setEventos] = useState([]);
  const [metas, setMetas] = useState([]);
  const [metaSelecionada, setMetaSelecionada] = useState(null);
  const [mostrarDetalhes, setMostrarDetalhes] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [view, setView] = useState('month');
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    carregarMetas();
  }, []);

  const carregarMetas = async () => {
    setCarregando(true);
    const resultado = await buscarMetasAluno(usuario.uid);

    if (resultado.sucesso) {
      setMetas(resultado.metas);
      
      const eventosCalendario = resultado.metas.map((meta, index) => {
        const data = meta.dataProgramada.toDate();
        
        // Para views de semana/dia, adicionar horário
        const inicio = new Date(data);
        inicio.setHours(8 + (index % 10), 0, 0, 0);
        
        const fim = new Date(inicio);
        fim.setMinutes(fim.getMinutes() + (meta.tempoEstimado || 60));
        
        return {
          id: meta.id,
          title: meta.assuntoTitulo || meta.assuntoId,
          start: inicio,
          end: fim,
          resource: meta
        };
      });

      setEventos(eventosCalendario);
    }

    setCarregando(false);
  };

  const isAtrasada = (meta) => {
    if (meta.concluida) return false;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataMeta = meta.dataProgramada.toDate();
    dataMeta.setHours(0, 0, 0, 0);
    return dataMeta < hoje;
  };

  const handleSelectEvento = (evento) => {
    setMetaSelecionada(evento.resource);
    setMostrarDetalhes(true);
  };

  const handleMoverEvento = async ({ event, start }) => {
    const dataApenas = new Date(start);
    dataApenas.setHours(0, 0, 0, 0);
    
    const resultado = await reagendarMeta(event.id, dataApenas);

    if (resultado.sucesso) {
      carregarMetas();
    }
  };

  const handleToggleConcluida = async () => {
    if (!metaSelecionada) return;

    const resultado = metaSelecionada.concluida
      ? await desconcluirMeta(metaSelecionada.id)
      : await concluirMeta(metaSelecionada.id);

    if (resultado.sucesso) {
      setMostrarDetalhes(false);
      carregarMetas();
    }
  };

  const handleNavigate = (newDate) => {
    setDate(newDate);
  };

  const handleViewChange = (newView) => {
    setView(newView);
  };

  const eventStyleGetter = (event) => {
    const meta = event.resource;
    let backgroundColor = '#3B82F6';
    
    if (meta.concluida) {
      backgroundColor = '#10B981';
    } else if (isAtrasada(meta)) {
      backgroundColor = '#EF4444';
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.9,
        color: 'white',
        border: 'none',
        display: 'block'
      }
    };
  };

  const formatarData = (timestamp) => {
    if (!timestamp) return '';
    const data = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return data.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'long',
      year: 'numeric'
    });
  };

  const formatarDataAtual = () => {
    if (view === 'month') {
      return format(date, 'MMMM yyyy', { locale: ptBR });
    } else if (view === 'week') {
      return format(date, "'Semana de' dd MMM yyyy", { locale: ptBR });
    } else if (view === 'day') {
      return format(date, "dd 'de' MMMM yyyy", { locale: ptBR });
    }
    return '';
  };

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando calendário...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/aluno/dashboard')}
              className="text-gray-600 hover:text-gray-800"
            >
              ← Voltar
            </button>
            <div>
              <h1 className="text-2xl font-bold text-blue-600">Calendário de Metas</h1>
              <p className="text-sm text-gray-600 capitalize">{formatarDataAtual()}</p>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            <span className="font-semibold capitalize">
              {view === 'month' && '📅 Mês'}
              {view === 'week' && '📆 Semana'}
              {view === 'day' && '📋 Dia'}
              {view === 'agenda' && '📝 Agenda'}
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Legenda */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span className="text-sm text-gray-600">Pendente</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="text-sm text-gray-600">Atrasada</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-sm text-gray-600">Concluída</span>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              💡 Arraste as metas para reagendar
            </div>
          </div>
        </div>

        {/* Calendário */}
        <div className="bg-white rounded-lg shadow p-6" style={{ height: '700px' }}>
          <Calendar
            localizer={localizer}
            events={eventos}
            startAccessor="start"
            endAccessor="end"
            culture="pt-BR"
            messages={messages}
            onSelectEvent={handleSelectEvento}
            onEventDrop={handleMoverEvento}
            onNavigate={handleNavigate}
            onView={handleViewChange}
            view={view}
            date={date}
            eventPropGetter={eventStyleGetter}
            draggableAccessor={() => true}
            style={{ height: '100%' }}
            views={['month', 'week', 'day', 'agenda']}
            step={30}
            timeslots={2}
            min={new Date(1970, 1, 1, 7, 0, 0)}
            max={new Date(1970, 1, 1, 22, 0, 0)}
          />
        </div>
      </div>

      {/* Modal de Detalhes */}
      {mostrarDetalhes && metaSelecionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">Detalhes da Meta</h3>
              <button
                onClick={() => setMostrarDetalhes(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {/* Status */}
              <div>
                {metaSelecionada.concluida ? (
                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    ✓ Concluída
                  </span>
                ) : isAtrasada(metaSelecionada) ? (
                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                    🚨 Atrasada
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    ⏳ Pendente
                  </span>
                )}
              </div>

              {/* Assunto */}
              <div>
                <p className="text-sm text-gray-600">Assunto</p>
                <p className="text-lg font-semibold text-gray-800">
                  {metaSelecionada.assuntoTitulo || metaSelecionada.assuntoId}
                </p>
              </div>

              {/* Data */}
              <div>
                <p className="text-sm text-gray-600">Data Programada</p>
                <p className="text-gray-800">
                  📅 {formatarData(metaSelecionada.dataProgramada)}
                </p>
              </div>

              {/* Tempo */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Tempo Estimado</p>
                  <p className="text-gray-800">⏱ {metaSelecionada.tempoEstimado} min</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tipo de Estudo</p>
                  <p className="text-gray-800 capitalize">📚 {metaSelecionada.tipoEstudo}</p>
                </div>
              </div>

              {/* Observações */}
              {metaSelecionada.observacoes && (
                <div>
                  <p className="text-sm text-gray-600">Observações</p>
                  <p className="text-gray-800 text-sm bg-gray-50 p-3 rounded">
                    {metaSelecionada.observacoes}
                  </p>
                </div>
              )}

              {/* Botões */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleToggleConcluida}
                  className={`flex-1 py-3 rounded-lg font-semibold transition ${
                    metaSelecionada.concluida
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {metaSelecionada.concluida ? 'Marcar como Pendente' : 'Marcar como Concluída'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarioMetas;