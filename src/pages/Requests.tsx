import { useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMaintenanceRequests, updateMaintenanceRequest, deleteMaintenanceRequest, MaintenanceRequest } from '@/integrations/supabase/maintenance_requests';
import { toast } from 'sonner';
import { Search, Pencil, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useDebounce } from '@/hooks/use-debounce';
import RequestKanbanBoard from '@/components/RequestKanbanBoard';
import RequestDetailModal from '@/components/RequestDetailModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import RequestForm, { RequestFormValues } from '@/components/RequestForm'; // Importando o novo formulário

const KANBAN_COLUMNS = ['Novo', 'Em Andamento', 'Standby', 'Concluído', 'Cancelado'];

const Requests = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | string>('all');
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null); // Para o modal de detalhes
  const [isFormOpen, setIsFormOpen] = useState(false); // Para o modal de edição
  const [editingRequest, setEditingRequest] = useState<MaintenanceRequest | null>(null); // Para o formulário de edição
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const { data: requests, isLoading, error } = useQuery<MaintenanceRequest[]>({
    queryKey: ['maintenance_requests'],
    queryFn: getMaintenanceRequests,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MaintenanceRequest> }) => updateMaintenanceRequest(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance_requests'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardKPIs'] }); // Invalida KPIs para atualizar contagem de chamados
      toast.success('Chamado atualizado com sucesso!');
      setIsFormOpen(false); // Fechar formulário após sucesso
      setEditingRequest(null); // Limpar estado de edição
    },
    onError: (err) => {
      toast.error(`Erro ao atualizar chamado: ${err.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMaintenanceRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance_requests'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardKPIs'] }); // Invalida KPIs
      toast.success('Chamado excluído com sucesso!');
    },
    onError: (err) => {
      toast.error(`Erro ao excluir chamado: ${err.message}`);
    },
  });

  const handleStatusChange = (id: string, newStatus: string) => {
    const requestToUpdate = requests?.find(req => req.id === id);
    if (!requestToUpdate || requestToUpdate.status === newStatus) return;

    const updates: Partial<MaintenanceRequest> = { status: newStatus };
    const now = format(new Date(), 'yyyy-MM-dd HH:mm:ss');

    // Lógica para atualizar started_at e completed_at
    if (newStatus === 'Em Andamento' && !requestToUpdate.started_at) {
      updates.started_at = now;
    } else if (newStatus === 'Concluído' && !requestToUpdate.completed_at) {
      updates.completed_at = now;
    } else if (newStatus !== 'Concluído' && requestToUpdate.completed_at) {
      updates.completed_at = null; // Limpa a data de conclusão se sair do status 'Concluído'
    } else if (newStatus !== 'Em Andamento' && newStatus !== 'Concluído' && requestToUpdate.started_at) {
      updates.started_at = null; // Limpa a data de início se sair de 'Em Andamento' e não for para 'Concluído'
    }

    updateMutation.mutate({ id, data: updates });
  };

  const handleCardClick = (request: MaintenanceRequest) => {
    setSelectedRequest(request);
  };

  const handleEditRequest = (request: MaintenanceRequest) => {
    setEditingRequest(request);
    setIsFormOpen(true);
  };

  const handleDeleteRequest = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este chamado?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleFormSubmit = (data: RequestFormValues) => {
    const { requester_name, requester_email, requester_phone, description, status, technician_name, started_at, completed_at, ...customFields } = data;

    const custom_data: Record<string, any> = {};
    Object.keys(customFields).forEach(key => {
      if (customFields[key] !== undefined && customFields[key] !== null && customFields[key] !== '') {
        custom_data[key] = customFields[key];
      }
    });

    const updates: Partial<MaintenanceRequest> = {
      requester_name,
      requester_email: requester_email || null,
      requester_phone: requester_phone || null,
      description,
      status,
      technician_name: technician_name || null,
      started_at: started_at ? format(started_at, 'yyyy-MM-dd HH:mm:ss') : null,
      completed_at: completed_at ? format(completed_at, 'yyyy-MM-dd HH:mm:ss') : null,
      custom_data: Object.keys(custom_data).length > 0 ? custom_data : null,
    };

    if (editingRequest) {
      updateMutation.mutate({ id: editingRequest.id, data: updates });
    }
    // Não há criação de chamado por este formulário na página de Requests, apenas edição.
  };

  const filteredRequests = useMemo(() => {
    let filtered = requests || [];

    if (filterStatus !== 'all') {
      filtered = filtered.filter(request => request.status === filterStatus);
    }

    if (debouncedSearchTerm) {
      filtered = filtered.filter(request =>
        request.requester_name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        request.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        request.status.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        request.technician_name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        JSON.stringify(request.custom_data || {}).toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [requests, filterStatus, debouncedSearchTerm]);

  const getStatusBadge = (status: string) => {
    const styles: { [key: string]: string } = {
      'Novo': 'bg-blue-100 text-blue-800',
      'Em Andamento': 'bg-yellow-100 text-yellow-800',
      'Standby': 'bg-orange-100 text-orange-800',
      'Concluído': 'bg-green-100 text-green-800',
      'Cancelado': 'bg-red-100 text-red-800',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Layout>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Chamados Recebidos</h2>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Buscar chamados..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="w-full sm:w-auto">
            <Label htmlFor="filter-status" className="sr-only">Filtrar por Status</Label>
            <Select onValueChange={(value: 'all' | string) => setFilterStatus(value)} defaultValue={filterStatus}>
              <SelectTrigger id="filter-status" className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {KANBAN_COLUMNS.map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="kanban">
          <TabsList className="mb-4">
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
            <TabsTrigger value="list">Lista</TabsTrigger>
          </TabsList>
          <TabsContent value="kanban">
            {isLoading ? (
              <p className="text-center text-gray-500 dark:text-gray-400">Carregando chamados...</p>
            ) : error ? (
              <p className="text-center text-red-500">Erro ao carregar chamados: {error.message}</p>
            ) : filteredRequests.length > 0 ? (
              <RequestKanbanBoard
                requests={filteredRequests}
                onStatusChange={handleStatusChange}
                onCardClick={handleCardClick}
                isUpdating={updateMutation.isPending} // Passando o estado de carregamento
              />
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400">Nenhum chamado encontrado.</p>
            )}
          </TabsContent>
          <TabsContent value="list">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              {isLoading ? (
                <p className="text-center text-gray-500 dark:text-gray-400">Carregando chamados...</p>
              ) : error ? (
                <p className="text-center text-red-500">Erro ao carregar chamados: {error.message}</p>
              ) : filteredRequests.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table className="min-w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Solicitante</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Técnico</TableHead>
                        <TableHead>Aberto em</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">{request.requester_name}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{request.description}</TableCell>
                          <TableCell><Badge className={getStatusBadge(request.status)}>{request.status}</Badge></TableCell>
                          <TableCell>{request.technician_name || 'N/A'}</TableCell>
                          <TableCell>{format(new Date(request.created_at), 'dd/MM/yyyy HH:mm')}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => handleEditRequest(request)} className="mr-2">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDeleteRequest(request.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-center text-gray-500 dark:text-gray-400">Nenhum chamado encontrado.</p>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <RequestDetailModal
          request={selectedRequest}
          onOpenChange={(isOpen) => !isOpen && setSelectedRequest(null)}
        />

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingRequest ? 'Editar Chamado' : 'Novo Chamado'}</DialogTitle>
            </DialogHeader>
            <RequestForm
              initialData={editingRequest}
              onSubmit={handleFormSubmit}
              isSubmitting={updateMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Requests;