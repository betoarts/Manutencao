import React, { useMemo } from 'react';
import { DndContext, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import KanbanColumn from './KanbanColumn';

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

interface KanbanBoardProps {
  records: MaintenanceRecord[];
  onStatusChange: (id: string, status: string) => void;
  onCardClick: (record: MaintenanceRecord) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ records, onStatusChange, onCardClick }) => {
  const sensors = useSensors(useSensor(PointerSensor));

  const columns = useMemo(() => {
    const grouped: { [key: string]: MaintenanceRecord[] } = {
      'Agendada': [],
      'Em Andamento': [],
      'Concluída': [],
      'Cancelada': [],
    };
    records.forEach(record => {
      if (grouped[record.status]) {
        grouped[record.status].push(record);
      }
    });
    return grouped;
  }, [records]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const activeRecord = records.find(r => r.id === active.id);
      const newStatus = over.id as string;

      if (activeRecord && activeRecord.status !== newStatus) {
        onStatusChange(active.id as string, newStatus);
      }
    }
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-6 overflow-x-auto p-2">
        <KanbanColumn id="Agendada" title="Agendada" records={columns['Agendada']} onCardClick={onCardClick} />
        <KanbanColumn id="Em Andamento" title="Em Andamento" records={columns['Em Andamento']} onCardClick={onCardClick} />
        <KanbanColumn id="Concluída" title="Concluída" records={columns['Concluída']} onCardClick={onCardClick} />
        <KanbanColumn id="Cancelada" title="Cancelada" records={columns['Cancelada']} onCardClick={onCardClick} />
      </div>
    </DndContext>
  );
};

export default KanbanBoard;