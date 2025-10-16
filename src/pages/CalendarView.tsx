import React, { useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import { Calendar, dateFnsLocalizer, Event } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useQuery } from '@tanstack/react-query';
import { getMaintenanceRecords } from '@/integrations/supabase/maintenance';
import { getTasks } from '@/integrations/supabase/tasks';
import { MaintenanceRecord } from '@/integrations/supabase/maintenance'; // Importado do arquivo correto
import { TaskData } from '@/integrations/supabase/tasks';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const locales = {
  'pt-BR': ptBR,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Estendendo a interface Event para incluir as propriedades personalizadas
interface CalendarEvent extends Event {
  id: string | number; // Adicionado explicitamente
  type: 'maintenance' | 'task';
  originalData: MaintenanceRecord | (TaskData & { id: string });
  resource?: { status: string }; // Adicionado explicitamente
}

const CalendarView: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: maintenanceRecords, isLoading: isLoadingMaintenance } = useQuery<MaintenanceRecord[]>({
    queryKey: ['maintenance_records'],
    queryFn: getMaintenanceRecords,
  });

  const { data: tasks, isLoading: isLoadingTasks } = useQuery<(TaskData & { id: string })[]>({
    queryKey: ['tasks'],
    queryFn: getTasks,
  });

  const events = useMemo(() => {
    const allEvents: CalendarEvent[] = [];

    maintenanceRecords?.forEach(record => {
      const startDate = new Date(record.scheduled_date);
      const endDate = record.completion_date ? new Date(record.completion_date) : startDate;
      allEvents.push({
        id: record.id,
        title: `Manutenção: ${record.assets?.name || 'Ativo Desconhecido'}`,
        start: startDate,
        end: endDate,
        allDay: true,
        type: 'maintenance',
        originalData: record,
        resource: { status: record.status },
      });
    });

    tasks?.forEach(task => {
      if (task.due_date) {
        const dueDate = new Date(task.due_date);
        allEvents.push({
          id: task.id,
          title: `Tarefa: ${task.title}`,
          start: dueDate,
          end: dueDate,
          allDay: true,
          type: 'task',
          originalData: task,
          resource: { status: task.status },
        });
      }
    });

    return allEvents;
  }, [maintenanceRecords, tasks]);

  const eventPropGetter = (event: CalendarEvent) => {
    let backgroundColor = '';
    let textColor = '';

    if (event.type === 'maintenance' && event.resource) { // Verificação adicionada para resource
      switch (event.resource.status) {
        case 'Agendada':
          backgroundColor = 'bg-blue-500';
          textColor = 'text-white';
          break;
        case 'Em Andamento':
          backgroundColor = 'bg-yellow-500';
          textColor = 'text-white';
          break;
        case 'Concluída':
          backgroundColor = 'bg-green-500';
          textColor = 'text-white';
          break;
        case 'Cancelada':
          backgroundColor = 'bg-red-500';
          textColor = 'text-white';
          break;
        default:
          backgroundColor = 'bg-gray-500';
          textColor = 'text-white';
      }
    } else if (event.type === 'task' && event.resource) { // Verificação adicionada para resource
      switch (event.resource.status) {
        case 'pending':
          backgroundColor = 'bg-orange-500';
          textColor = 'text-white';
          break;
        case 'completed':
          backgroundColor = 'bg-emerald-500';
          textColor = 'text-white';
          break;
        default:
          backgroundColor = 'bg-gray-500';
          textColor = 'text-white';
      }
    }

    return {
      className: cn(backgroundColor, textColor, 'rounded-md p-1 text-xs'),
      style: {
        backgroundColor: 'transparent', // Tailwind classes will handle this
      },
    };
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  if (isLoadingMaintenance || isLoadingTasks) {
    return <Layout><div className="container mx-auto py-8 text-center">Carregando calendário...</div></Layout>;
  }

  return (
    <Layout>
      <div className="container mx-auto py-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Calendário de Manutenções e Tarefas</h2>
        <div className="h-[700px] bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            messages={{
              next: 'Próximo',
              previous: 'Anterior',
              today: 'Hoje',
              month: 'Mês',
              week: 'Semana',
              day: 'Dia',
              agenda: 'Agenda',
              date: 'Data',
              time: 'Hora',
              event: 'Evento',
              noEventsInRange: 'Nenhum evento neste período.',
              showMore: (total: number) => `+ Ver mais (${total})`, // Tipo adicionado
            }}
            culture="pt-BR"
            eventPropGetter={eventPropGetter}
            onSelectEvent={handleSelectEvent}
          />
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
            <DialogDescription>
              {selectedEvent?.type === 'maintenance' ? 'Detalhes da Manutenção' : 'Detalhes da Tarefa'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            {selectedEvent?.type === 'maintenance' && selectedEvent.originalData && (
              <>
                <p><strong>Ativo:</strong> {(selectedEvent.originalData as MaintenanceRecord).assets?.name || 'N/A'}</p>
                <p><strong>Tipo:</strong> {(selectedEvent.originalData as MaintenanceRecord).maintenance_type}</p>
                <p><strong>Status:</strong> <Badge>{(selectedEvent.originalData as MaintenanceRecord).status}</Badge></p>
                <p><strong>Agendado para:</strong> {format(selectedEvent.start as Date, 'dd/MM/yyyy')}</p>
                {(selectedEvent.originalData as MaintenanceRecord).completion_date && (
                  <p><strong>Concluído em:</strong> {format(new Date((selectedEvent.originalData as MaintenanceRecord).completion_date as string), 'dd/MM/yyyy')}</p>
                )}
                {(selectedEvent.originalData as MaintenanceRecord).technician_name && (
                  <p><strong>Técnico:</strong> {(selectedEvent.originalData as MaintenanceRecord).technician_name}</p>
                )}
                {(selectedEvent.originalData as MaintenanceRecord).description && (
                  <p><strong>Descrição:</strong> {(selectedEvent.originalData as MaintenanceRecord).description}</p>
                )}
              </>
            )}
            {selectedEvent?.type === 'task' && selectedEvent.originalData && (
              <>
                <p><strong>Título:</strong> {(selectedEvent.originalData as (TaskData & { id: string })).title}</p>
                <p><strong>Status:</strong> <Badge>{(selectedEvent.originalData as (TaskData & { id: string })).status === 'pending' ? 'Pendente' : 'Concluída'}</Badge></p>
                {(selectedEvent.originalData as (TaskData & { id: string })).due_date && (
                  <p><strong>Vencimento:</strong> {format(new Date((selectedEvent.originalData as (TaskData & { id: string })).due_date as string), 'dd/MM/yyyy')}</p>
                )}
                {(selectedEvent.originalData as (TaskData & { id: string })).description && (
                  <p><strong>Descrição:</strong> {(selectedEvent.originalData as (TaskData & { id: string })).description}</p>
                )}
                {(selectedEvent.originalData as (TaskData & { id: string })).completed_by && (
                  <p><strong>Concluído por:</strong> {(selectedEvent.originalData as (TaskData & { id: string })).completed_by}</p>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default CalendarView;