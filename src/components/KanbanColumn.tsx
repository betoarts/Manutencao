import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import KanbanCard from './KanbanCard';

interface MaintenanceRecord {
  id: string;
  asset_id: string;
  maintenance_type: string;
  description?: string;
  scheduled_date: string | Date;
  completion_date?: string | Date;
  cost?: number;
  status: 'Agendada' | 'Em Andamento' | 'Concluída' | 'Cancelada';
  notes?: string;
  created_at: string;
  technician_name?: string;
  assets: { name: string, tag_code: string } | null;
  maintenance_products: { product_name: string; quantity_used: number }[];
}

interface KanbanColumnProps {
  id: string;
  title: string;
  records: MaintenanceRecord[];
  onCardClick: (record: MaintenanceRecord) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ id, title, records, onCardClick }) => {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div className="flex-1 min-w-[300px] bg-gray-100 dark:bg-gray-900 rounded-lg p-4">
      <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">{title} ({records.length})</h3>
      <SortableContext
        id={id}
        items={records.map(r => r.id)}
        strategy={verticalListSortingStrategy}
      >
        <div ref={setNodeRef} className="min-h-[200px]">
          {records.map(record => (
            <KanbanCard key={record.id} record={record} onCardClick={onCardClick} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
};

export default KanbanColumn;