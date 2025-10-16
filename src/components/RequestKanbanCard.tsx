import React, { useState, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Clock, Eye } from 'lucide-react';

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

// Função auxiliar para formatar a duração em HH:mm:ss
const formatDuration = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (num: number) => String(num).padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

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
  const [totalTime, setTotalTime] = useState<string | null>(null);

  // Efeito para o cronômetro em tempo real (Em Andamento)
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;

    if (request.status === 'Em Andamento' && request.started_at) {
      const startTime = new Date(request.started_at).getTime();
      
      const updateElapsedTime = () => {
        const now = Date.now();
        const duration = now - startTime;
        setElapsedTime(formatDuration(duration));
      };

      updateElapsedTime(); // Inicializa imediatamente
      interval = setInterval(updateElapsedTime, 1000); // Atualiza a cada segundo
    } else {
      setElapsedTime('');
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [request.status, request.started_at]);

  // Efeito para calcular o tempo total (Concluído)
  useEffect(() => {
    if (request.status === 'Concluído' && request.started_at && request.completed_at) {
      const start = new Date(request.started_at).getTime();
      const end = new Date(request.completed_at).getTime();
      const duration = end - start;
      setTotalTime(formatDuration(duration));
    } else {
      setTotalTime(null);
    }
  }, [request.status, request.started_at, request.completed_at]);

  const handleViewDetails = (e: React.MouseEvent) => {
    // Impede que o evento de clique se propague para o elemento pai (o card inteiro),
    // que também tem um onClick para abrir o modal.
    e.stopPropagation(); 
    onCardClick(request);
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      // Removido o onClick do div raiz para evitar conflitos com o DND.
      // A interação agora é feita pelo botão "Detalhes".
    >
      <Card className={cn(
        "mb-4 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-300 ease-in-out cursor-default", // Alterado para cursor-default
        isDragging && "shadow-2xl scale-105 z-10"
      )}>
        <CardHeader className="p-4">
          <CardTitle className="text-base font-semibold">{request.requester_name}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <p className="truncate"><strong>Descrição:</strong> {request.description}</p>
          <p><strong>Aberto em:</strong> {format(new Date(request.created_at), 'dd/MM/yyyy HH:mm')}</p>
          
          {elapsedTime && request.status === 'Em Andamento' && (
            <div className="flex items-center text-xs font-mono text-blue-600 dark:text-blue-400 pt-1">
              <Clock className="mr-1 h-3 w-3" />
              <span>Em andamento: {elapsedTime}</span>
            </div>
          )}
          
          {totalTime && request.status === 'Concluído' && (
            <div className="flex items-center text-xs font-mono text-green-600 dark:text-green-400 pt-1">
              <Clock className="mr-1 h-3 w-3" />
              <span>Tempo total: {totalTime}</span>
            </div>
          )}
        </CardContent>
        <CardFooter className="p-4 pt-0 flex justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleViewDetails}
            className="text-xs h-7"
          >
            <Eye className="h-4 w-4 mr-1" />
            Detalhes
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default RequestKanbanCard;