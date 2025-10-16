import React, { useState, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { format, formatDistanceToNowStrict, formatDistanceStrict } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';

interface MaintenanceRequest {
  id: string;
  requester_name: string;
  description: string;
  created_at: string;
  status: string;
  started_at?: string | null;
  completed_at?: string | null;
}

interface RequestKanbanCardProps {
  request: MaintenanceRequest;
  onCardClick: (request: MaintenanceRequest) => void;
}

const RequestKanbanCard: React.FC<RequestKanbanCardProps> = ({ request, onCardClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: request.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [elapsedTime, setElapsedTime] = useState('');

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (request.status === 'Em Andamento' && request.started_at) {
      const updateElapsedTime = () => {
        const start = new Date(request.started_at as string);
        const duration = formatDistanceToNowStrict(start, {
          addSuffix: false,
          locale: ptBR,
          unit: 'minute',
        }).replace('minutos', 'min');
        setElapsedTime(duration);
      };
      updateElapsedTime();
      interval = setInterval(updateElapsedTime, 60000); // Update every minute
    }
    return () => clearInterval(interval);
  }, [request.status, request.started_at]);

  const totalTime = request.completed_at && request.started_at
    ? formatDistanceStrict(new Date(request.completed_at), new Date(request.started_at), {
        locale: ptBR,
        unit: 'minute',
      }).replace('minutos', 'min')
    : null;

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      onClick={() => onCardClick(request)}
    >
      <Card className={cn(
        "mb-4 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-300 ease-in-out cursor-pointer",
        isDragging && "shadow-2xl scale-105 z-10"
      )}>
        <CardHeader className="p-4">
          <CardTitle className="text-base font-semibold">{request.requester_name}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <p className="truncate"><strong>Descrição:</strong> {request.description}</p>
          <p><strong>Aberto em:</strong> {format(new Date(request.created_at), 'dd/MM/yyyy HH:mm')}</p>
          {elapsedTime && request.status === 'Em Andamento' && (
            <div className="flex items-center text-xs text-blue-600 dark:text-blue-400 pt-1">
              <Clock className="mr-1 h-3 w-3" />
              <span>Em andamento: ~{elapsedTime}</span>
            </div>
          )}
          {totalTime && request.status === 'Concluído' && (
            <div className="flex items-center text-xs text-green-600 dark:text-green-400 pt-1">
              <Clock className="mr-1 h-3 w-3" />
              <span>Tempo total: ~{totalTime}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RequestKanbanCard;