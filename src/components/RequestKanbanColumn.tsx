import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import RequestKanbanCard from './RequestKanbanCard';

interface MaintenanceRequest {
  id: string;
  requester_name: string;
  description: string;
  created_at: string;
  status: string;
  started_at?: string | null;
  completed_at?: string | null;
}

interface RequestKanbanColumnProps {
  id: string;
  title: string;
  requests: MaintenanceRequest[];
  onCardClick: (request: MaintenanceRequest) => void;
}

const RequestKanbanColumn: React.FC<RequestKanbanColumnProps> = ({ id, title, requests, onCardClick }) => {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div className="flex-1 min-w-[300px] bg-gray-100 dark:bg-gray-900 rounded-lg p-4">
      <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">{title} ({requests.length})</h3>
      <SortableContext
        id={id}
        items={requests.map(r => r.id)}
        strategy={verticalListSortingStrategy}
      >
        <div ref={setNodeRef} className="min-h-[200px]">
          {requests.map(request => (
            <RequestKanbanCard key={request.id} request={request} onCardClick={onCardClick} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
};

export default RequestKanbanColumn;