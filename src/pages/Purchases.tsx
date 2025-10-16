import { useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'; // Importado DialogDescription
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPurchase, getPurchases, updatePurchase, deletePurchase } from '@/integrations/supabase/purchases';
import PurchaseForm from '@/components/PurchaseForm';
import { toast } from 'sonner';
import { Pencil, Trash2, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/formatters';

interface Purchase {
  id: string;
  asset_id: string | null;
  product_name: string | null;
  quantity: number | null;
  vendor?: string;
  purchase_date?: string | Date;
  cost?: number;
  invoice_number?: string;
  notes?: string;
  created_at: string;
  purchase_type: 'product' | 'asset'; // Adicionada a nova coluna
  assets: { name: string } | null; // From the join
}

const Purchases = () => {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);

  const { data: purchases, isLoading, error } = useQuery<Purchase[]>({
    queryKey: ['purchases'],
    queryFn: getPurchases,
  });

  const createPurchaseMutation = useMutation({
    mutationFn: createPurchase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Compra registrada com sucesso!');
      setIsFormOpen(false);
    },
    onError: (err) => {
      toast.error(`Erro ao registrar compra: ${err.message}`);
    },
  });

  const updatePurchaseMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updatePurchase>[1] }) => updatePurchase(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Compra atualizada com sucesso!');
      setIsFormOpen(false);
      setEditingPurchase(null);
    },
    onError: (err) => {
      toast.error(`Erro ao atualizar compra: ${err.message}`);
    },
  });

  const deletePurchaseMutation = useMutation({
    mutationFn: deletePurchase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Compra excluída com sucesso!');
    },
    onError: (err) => {
      toast.error(`Erro ao excluir compra: ${err.message}`);
    },
  });

  const handleFormSubmitSuccess = () => {
    setIsFormOpen(false);
    setEditingPurchase(null);
  };

  const handleEdit = (purchase: Purchase) => {
    setEditingPurchase(purchase);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este registro de compra?')) {
      deletePurchaseMutation.mutate(id);
    }
  };

  const initialDataForForm = useMemo(() => {
    if (!editingPurchase) return null;

    return {
      ...editingPurchase,
      // Garante que purchase_date seja string ou undefined/null para corresponder a NewPurchase
      purchase_date: editingPurchase.purchase_date instanceof Date 
                     ? format(editingPurchase.purchase_date, 'yyyy-MM-dd') 
                     : editingPurchase.purchase_date,
      cost: editingPurchase.cost !== undefined && editingPurchase.cost !== null ? Number(editingPurchase.cost) : undefined,
      quantity: editingPurchase.quantity !== undefined && editingPurchase.quantity !== null ? Number(editingPurchase.quantity) : undefined,
    };
  }, [editingPurchase]);

  if (isLoading) {
    return <Layout><div className="container mx-auto py-8 text-center"><p>Carregando compras...</p></div></Layout>;
  }

  if (error) {
    return <Layout><div className="container mx-auto py-8 text-center text-red-500"><p>Erro ao carregar compras: {error.message}</p></div></Layout>;
  }

  return (
    <Layout>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Registros de Compra</h2>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingPurchase(null); setIsFormOpen(true); }}>
                <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Compra
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingPurchase ? 'Editar Compra' : 'Adicionar Nova Compra'}</DialogTitle>
                <DialogDescription>
                  {editingPurchase ? 'Edite os detalhes da compra existente.' : 'Preencha os detalhes para registrar uma nova compra.'}
                </DialogDescription>
              </DialogHeader>
              <PurchaseForm
                initialData={initialDataForForm}
                onSuccess={handleFormSubmitSuccess}
                isSubmitting={createPurchaseMutation.isPending || updatePurchaseMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          {purchases && purchases.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Produto/Serviço</TableHead>
                  <TableHead>Ativo Associado</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Data da Compra</TableHead>
                  <TableHead>Custo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell className="font-medium">{purchase.purchase_type === 'asset' ? 'Ativo' : 'Produto'}</TableCell>
                    <TableCell className="font-medium">{purchase.product_name || 'N/A'}</TableCell>
                    <TableCell>{purchase.assets?.name || 'N/A (Estoque)'}</TableCell>
                    <TableCell>{purchase.quantity || 'N/A'}</TableCell>
                    <TableCell>{purchase.vendor || 'N/A'}</TableCell>
                    <TableCell>{purchase.purchase_date ? format(new Date(purchase.purchase_date as string), 'dd/MM/yyyy') : 'N/A'}</TableCell>
                    <TableCell>{formatCurrency(purchase.cost)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(purchase)} className="mr-2">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(purchase.id)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400">Nenhum registro de compra encontrado.</p>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Purchases;