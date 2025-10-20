import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { format } from 'date-fns/format';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/formatters';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface MaintenanceRecord {
  id: string;
  maintenance_type: string;
  description?: string | null;
  scheduled_date: string | Date;
  completion_date?: string | Date | null;
  cost?: number | null;
  status: string;
  notes?: string | null;
  technician_name?: string | null;
  assets: { name: string, tag_code: string } | null;
  maintenance_products: { product_name: string; quantity_used: number }[];
}

interface MaintenanceDetailModalProps {
  record: MaintenanceRecord | null;
  onOpenChange: (isOpen: boolean) => void;
}

const MaintenanceDetailModal: React.FC<MaintenanceDetailModalProps> = ({ record, onOpenChange }) => {
  if (!record) return null;

  const getStatusBadge = (status: string) => {
    const styles: { [key: string]: string } = {
      'Agendada': 'bg-blue-500',
      'Em Andamento': 'bg-yellow-500',
      'Concluída': 'bg-green-500',
      'Cancelada': 'bg-red-500',
    };
    return <Badge className={styles[status] || 'bg-gray-500'}>{status}</Badge>;
  };

  return (
    <Dialog open={!!record} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle>Detalhes da Manutenção</DialogTitle>
              <DialogDescription>
                {record.assets?.name} ({record.assets?.tag_code})
              </DialogDescription>
            </div>
            {getStatusBadge(record.status)}
          </div>
        </DialogHeader>
        <div className="py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-sm text-gray-500">Tipo de Manutenção</h4>
              <p>{record.maintenance_type}</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-gray-500">Custo</h4>
              <p>{formatCurrency(record.cost)}</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-gray-500">Data Agendada</h4>
              <p>{format(new Date(record.scheduled_date), 'dd/MM/yyyy')}</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-gray-500">Data de Conclusão</h4>
              <p>{record.completion_date ? format(new Date(record.completion_date), 'dd/MM/yyyy') : 'Pendente'}</p>
            </div>
             <div className="sm:col-span-2">
              <h4 className="font-semibold text-sm text-gray-500">Técnico Responsável</h4>
              <p>{record.technician_name || 'Não atribuído'}</p>
            </div>
          </div>
          
          {record.description && (
            <div>
              <h4 className="font-semibold text-sm text-gray-500">Descrição do Serviço</h4>
              <p className="p-2 bg-gray-50 dark:bg-gray-800 rounded-md mt-1 whitespace-pre-wrap">{record.description}</p>
            </div>
          )}

          {record.maintenance_products && record.maintenance_products.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm text-gray-500 mb-2">Produtos Utilizados</h4>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead className="text-right">Quantidade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {record.maintenance_products.map((product, index) => (
                      <TableRow key={index}>
                        <TableCell>{product.product_name}</TableCell>
                        <TableCell className="text-right">{product.quantity_used}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {record.notes && (
            <div>
              <h4 className="font-semibold text-sm text-gray-500">Notas Adicionais</h4>
              <p className="p-2 bg-gray-50 dark:bg-gray-800 rounded-md mt-1 whitespace-pre-wrap">{record.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MaintenanceDetailModal;