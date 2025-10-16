import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface RequestStatusSelectorProps {
  currentStatus: string;
  onStatusChange: (newStatus: string) => void;
  isUpdating: boolean;
}

const KANBAN_COLUMNS = ['Novo', 'Em Andamento', 'Standby', 'Concluído', 'Cancelado'];

const RequestStatusSelector: React.FC<RequestStatusSelectorProps> = ({ 
  currentStatus,
  onStatusChange,
  isUpdating,
}) => {
  const handleStatusChange = (newStatus: string) => {
    if (newStatus !== currentStatus) {
      onStatusChange(newStatus);
    }
  };

  return (
    <Select onValueChange={handleStatusChange} defaultValue={currentStatus} disabled={isUpdating}>
      <SelectTrigger className="w-[140px] h-8 text-xs">
        <SelectValue placeholder="Mudar Status" />
      </SelectTrigger>
      <SelectContent>
        {KANBAN_COLUMNS.map(status => (
          <SelectItem key={status} value={status}>{status}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default RequestStatusSelector;