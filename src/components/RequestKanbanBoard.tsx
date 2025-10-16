import React, { useMemo } from 'react';
import { DndContext, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import RequestKanbanColumn from './RequestKanbanColumn';

interface MaintenanceRequest {
  id: string;
  status: string;
  requester_name: string;
  description: string;
  created_at: string;
  started_at?: string | null;
  completed_at?: string | null;
}

interface RequestKanbanBoardProps {
  requests: MaintenanceRequest[];
  onStatusChange: (id: string, status: string) => void;
  onCardClick: (request: MaintenanceRequest) => void;
}

const KANBAN_COLUMNS = ['Novo', 'Em Andamento', 'Standby', 'Concluído'];

const RequestKanbanBoard: React.FC<RequestKanbanBoardProps> = ({ requests, onStatusChange, onCardClick }) => {
  const sensors = useSensors(useSensor(PointerSensor));

  const columns = useMemo(() => {
    const grouped: { [key: string]: MaintenanceRequest[] } = {
      'Novo': [],
      'Em Andamento': [],
      'Standby': [],
      'Concluído': [],
    };
    requests.forEach(request => {
      if (grouped[request.status]) {
        grouped[request.status].push(request);
      } else {
        grouped['Novo'].push(request);
      }
    });
    return grouped;
  }, [requests]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const activeRequest = requests.find(r => r.id === active.id);
      const newStatus = over.id as string;

      if (activeRequest && activeRequest.status !== newStatus && KANBAN_COLUMNS.includes(newStatus)) {
        onStatusChange(active.id as string, newStatus);
      }
    }
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-6 overflow-x-auto p-2">
        {KANBAN_COLUMNS.map(col => (
          <RequestKanbanColumn key={col} id={col} title={col} requests={columns[col]} onCardClick={onCardClick} />
        ))}
      </div>
    </DndContext>
  );
};

export default RequestKanbanBoard;