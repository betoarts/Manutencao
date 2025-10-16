import { useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createMaintenanceRecord, getMaintenanceRecords, updateMaintenanceRecord, deleteMaintenanceRecord, addProductsToMaintenance } from '@/integrations/supabase/maintenance';
import { recordStockUsage } from '@/integrations/supabase/purchases';
import MaintenanceForm from '@/components/MaintenanceForm';
import KanbanBoard from '@/components/KanbanBoard';
import { toast } from 'sonner';
import { Pencil, Trash2, PlusCircle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import MaintenanceDetailModal from '@/components/MaintenanceDetailModal';

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

const Maintenance = () => {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MaintenanceRecord | null>(null);
  const [completingRecord, setCompletingRecord] = useState<MaintenanceRecord | null>(null);
  const [technicianName, setTechnicianName] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<MaintenanceRecord | null>(null);

  const { data: records, isLoading, error } = useQuery<MaintenanceRecord[]>({
    queryKey: ['maintenance_records'],
    queryFn: getMaintenanceRecords,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { products, ...maintenanceData } = data;
      const newRecord = await createMaintenanceRecord(maintenanceData);
      if (products && products.length > 0) {
        await addProductsToMaintenance(newRecord.id, products);
        const notes = `Uso na manutenção do ativo: ${records?.find(r => r.asset_id === newRecord.asset_id)?.assets?.name || 'N/A'}`;
        await recordStockUsage(products, notes);
      }
      return newRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance_records'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Manutenção agendada com sucesso!');
      setIsFormOpen(false);
    },
    onError: (err: any) => toast.error(`Erro ao agendar manutenção: ${err.message}`),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { products, ...maintenanceData } = data;
      const updatedRecord = await updateMaintenanceRecord(id, maintenanceData);
      // Aqui, a lógica de atualização de produtos seria mais complexa (diffing),
      // por simplicidade, vamos focar na criação por enquanto.
      return updatedRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance_records'] });
      toast.success('Manutenção atualizada com sucesso!');
      setIsFormOpen(false);
      setEditingRecord(null);
      setCompletingRecord(null);
      setTechnicianName('');
    },
    onError: (err: any) => toast.error(`Erro ao atualizar manutenção: ${err.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMaintenanceRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance_records'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Manutenção excluída com sucesso!');
    },
    onError: (err: any) => toast.error(`Erro ao excluir manutenção: ${err.message}`),
  });

  const handleFormSubmit = (data: any) => {
    const formattedData = {
      ...data,
      scheduled_date: format(data.scheduled_date, 'yyyy-MM-dd'),
      completion_date: data.completion_date ? format(data.completion_date, 'yyyy-MM-dd') : undefined,
    };
    if (editingRecord) {
      updateMutation.mutate({ id: editingRecord.id, data: formattedData });
    } else {
      createMutation.mutate(formattedData);
    }
  };

  const handleEdit = (record: MaintenanceRecord) => {
    setEditingRecord({
      ...record,
      // Garante que scheduled_date e completion_date sejam strings ou undefined/null para corresponder a NewMaintenanceRecord
      scheduled_date: typeof record.scheduled_date === 'string' 
                      ? record.scheduled_date 
                      : format(record.scheduled_date, 'yyyy-MM-dd'),
      completion_date: record.completion_date 
                       ? (typeof record.completion_date === 'string' 
                          ? record.completion_date 
                          : format(record.completion_date, 'yyyy-MM-dd')) 
                       : undefined,
      cost: record.cost !== undefined && record.cost !== null ? Number(record.cost) : undefined,
    });
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleCompleteSubmit = () => {
    if (!completingRecord || !technicianName) {
      toast.error('Por favor, insira o nome do técnico.');
      return;
    }
    updateMutation.mutate({
      id: completingRecord.id,
      data: { status: 'Concluída', completion_date: format(new Date(), 'yyyy-MM-dd'), technician_name: technicianName },
    });
  };

  const handleStatusChange = (id: string, status: string) => {
    if (status === 'Concluída') {
      const recordToComplete = records?.find(r => r.id === id);
      if (recordToComplete) setCompletingRecord(recordToComplete);
    } else {
      updateMutation.mutate({ id, data: { status } });
    }
  };

  const handleCardClick = (record: MaintenanceRecord) => {
    setSelectedRecord(record);
  };

  const getStatusBadge = (status: string) => {
    const styles: { [key: string]: string } = {
      'Agendada': 'bg-blue-100 text-blue-800',
      'Em Andamento': 'bg-yellow-100 text-yellow-800',
      'Concluída': 'bg-green-100 text-green-800',
      'Cancelada': 'bg-red-100 text-red-800',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Layout>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Gestão de Manutenção</h2>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingRecord(null); setIsFormOpen(true); }}>
                <PlusCircle className="mr-2 h-4 w-4" /> Agendar Manutenção
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editingRecord ? 'Editar Manutenção' : 'Agendar Nova Manutenção'}</DialogTitle></DialogHeader>
              <MaintenanceForm
                initialData={editingRecord ? { ...editingRecord, id: editingRecord.id } : null} // Corrigido: passando initialData como NewMaintenanceRecord & { id: string } ou null
                onSubmit={handleFormSubmit}
                isSubmitting={createMutation.isPending || updateMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="kanban">
          <TabsList className="mb-4">
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
            <TabsTrigger value="list">Lista</TabsTrigger>
          </TabsList>
          <TabsContent value="kanban">
            {isLoading ? <p>Carregando...</p> : error ? <p className="text-red-500">Erro: {error.message}</p> :
              <KanbanBoard records={records || []} onStatusChange={handleStatusChange} onCardClick={handleCardClick} />
            }
          </TabsContent>
          <TabsContent value="list">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              {isLoading ? <p>Carregando...</p> : error ? <p className="text-red-500">Erro: {error.message}</p> : (
                records && records.length > 0 ? (
                  <div className="overflow-x-auto"> {/* Adicionado overflow-x-auto */}
                    <Table className="min-w-full"> {/* Adicionado min-w-full */}
                      <TableHeader><TableRow><TableHead>Ativo</TableHead><TableHead>Tipo</TableHead><TableHead>Data Agendada</TableHead><TableHead>Data Conclusão</TableHead><TableHead>Técnico</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {records.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell className="font-medium">{record.assets?.name || 'N/A'}</TableCell>
                            <TableCell>{record.maintenance_type}</TableCell>
                            <TableCell>{format(new Date(record.scheduled_date), 'dd/MM/yyyy')}</TableCell>
                            <TableCell>{record.completion_date ? format(new Date(record.completion_date), 'dd/MM/yyyy') : 'Pendente'}</TableCell>
                            <TableCell>{record.technician_name || 'N/A'}</TableCell>
                            <TableCell><span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(record.status)}`}>{record.status}</span></TableCell>
                            <TableCell className="text-right">
                              {record.status !== 'Concluída' && record.status !== 'Cancelada' && (
                                <Button variant="ghost" size="sm" onClick={() => setCompletingRecord(record)} className="mr-2 text-green-600 hover:text-green-800"><CheckCircle className="h-4 w-4" /></Button>
                              )}
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(record)} className="mr-2"><Pencil className="h-4 w-4" /></Button>
                              <Button variant="destructive" size="sm" onClick={() => handleDelete(record.id)} className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : <p className="text-center text-gray-500">Nenhum registro de manutenção encontrado.</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!completingRecord} onOpenChange={(isOpen) => !isOpen && setCompletingRecord(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle>Concluir Manutenção</DialogTitle></DialogHeader>
          <div className="py-4"><div className="grid gap-4"><Label htmlFor="technician-name">Nome do Técnico</Label><Input id="technician-name" value={technicianName} onChange={(e) => setTechnicianName(e.target.value)} placeholder="Insira o nome do técnico" /></div></div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleCompleteSubmit} disabled={updateMutation.isPending}>{updateMutation.isPending ? 'Salvando...' : 'Confirmar Conclusão'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MaintenanceDetailModal 
        record={selectedRecord} 
        onOpenChange={(isOpen) => !isOpen && setSelectedRecord(null)} 
      />
    </Layout>
  );
};

export default Maintenance;