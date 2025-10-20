import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { format } from 'date-fns/format';
import { Badge } from '@/components/ui/badge';

interface MaintenanceRequest {
  id: string;
  requester_name: string;
  requester_email?: string | null;
  requester_phone?: string | null;
  description: string;
  created_at: string;
  status: string;
  technician_name?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  custom_data?: Record<string, any> | null;
}

interface RequestDetailModalProps {
  request: MaintenanceRequest | null;
  onOpenChange: (isOpen: boolean) => void;
}

const RequestDetailModal: React.FC<RequestDetailModalProps> = ({ request, onOpenChange }) => {
  if (!request) return null;

  const customDataEntries = request.custom_data ? Object.entries(request.custom_data).filter(([, value]) => value) : [];

  return (
    <Dialog open={!!request} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle>Detalhes do Chamado</DialogTitle>
              <DialogDescription>
                Aberto por {request.requester_name} em {format(new Date(request.created_at), 'dd/MM/yyyy \'às\' HH:mm')}
              </DialogDescription>
            </div>
            <Badge>{request.status}</Badge>
          </div>
        </DialogHeader>
        <div className="py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-sm text-gray-500">Solicitante</h4>
              <p>{request.requester_name}</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-gray-500">Telefone</h4>
              <p>{request.requester_phone || 'Não informado'}</p>
            </div>
            <div className="sm:col-span-2">
              <h4 className="font-semibold text-sm text-gray-500">Email</h4>
              <p>{request.requester_email || 'Não informado'}</p>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-sm text-gray-500">Descrição do Problema</h4>
            <p className="p-2 bg-gray-50 dark:bg-gray-800 rounded-md mt-1 whitespace-pre-wrap">{request.description}</p>
          </div>
          
          {customDataEntries.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm text-gray-500 mb-2">Informações Adicionais</h4>
              <div className="space-y-2 rounded-md border p-3">
                {customDataEntries.map(([key, value]) => (
                  <div key={key} className="grid grid-cols-3 gap-4 text-sm">
                    <span className="font-medium text-gray-600 dark:text-gray-400 col-span-1">{key}</span>
                    <span className="col-span-2">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border-t pt-4 mt-4">
            <h4 className="font-semibold text-sm mb-2">Histórico do Atendimento</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div>
                <h4 className="font-semibold text-sm text-gray-500">Iniciado em</h4>
                <p>{request.started_at ? format(new Date(request.started_at), 'dd/MM/yyyy HH:mm') : 'Pendente'}</p>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-500">Concluído em</h4>
                <p>{request.completed_at ? format(new Date(request.completed_at), 'dd/MM/yyyy HH:mm') : 'Pendente'}</p>
              </div>
              <div className="sm:col-span-2">
                <h4 className="font-semibold text-sm text-gray-500">Técnico Responsável</h4>
                <p>{request.technician_name || 'Não atribuído'}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RequestDetailModal;