import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';

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

interface KanbanCardProps {
  record: MaintenanceRecord;
  onCardClick: (record: MaintenanceRecord) => void;
}

const KanbanCard: React.FC<KanbanCardProps> = ({ record, onCardClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: record.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      onClick={() => onCardClick(record)}
    >
      <Card className="mb-4 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="p-4">
          <CardTitle className="text-base font-semibold">{record.assets?.name || 'Ativo não encontrado'}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 text-sm text-gray-600 dark:text-gray-400">
          <p><strong>Tipo:</strong> {record.maintenance_type}</p>
          <p><strong>Agendado para:</strong> {format(new Date(record.scheduled_date), 'dd/MM/yyyy')}</p>
          {record.maintenance_products && record.maintenance_products.length > 0 && (
            <div className="mt-2">
              <p className="font-semibold text-xs text-gray-500 dark:text-gray-400">Produtos:</p>
              <ul className="list-disc list-inside text-xs">
                {record.maintenance_products.map((product, index) => (
                  <li key={index}>{product.product_name} ({product.quantity_used})</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default KanbanCard;