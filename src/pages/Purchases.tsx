import { useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPurchase, getPurchases, updatePurchase, deletePurchase, Purchase } from '@/integrations/supabase/purchases';
import PurchaseForm from '@/components/PurchaseForm';
import { toast } from 'sonner';
import { Pencil, Trash2, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/formatters';

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

    // Convertendo Purchase para o formato esperado pelo formulário (NewPurchase & { id: string })
    // Garantindo que quantity e cost sejam number | null para corresponder ao tipo NewPurchase
    return {
      id: editingPurchase.id,
      asset_id: editingPurchase.asset_id,
      product_name: editingPurchase.product_name,
      quantity: editingPurchase.quantity !== null && editingPurchase.quantity !== undefined ? Number(editingPurchase.quantity) : null,
      vendor: editingPurchase.vendor,
      supplier_id: editingPurchase.supplier_id, // Incluindo supplier_id
      // purchase_date já é string | null, não precisa de instanceof Date
      purchase_date: editingPurchase.purchase_date,
      cost: editingPurchase.cost !== null && editingPurchase.cost !== undefined ? Number(editingPurchase.cost) : null,
      invoice_number: editingPurchase.invoice_number,
      notes: editingPurchase.notes,
      purchase_type: editingPurchase.purchase_type,
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
                    <TableCell>{purchase.suppliers?.name || purchase.vendor || 'N/A'}</TableCell> {/* Prioriza o nome do fornecedor ligado */}
                    <TableCell>{purchase.purchase_date ? format(new Date(purchase.purchase_date as string), 'dd/MM/yyyy') : 'N/A'}</TableCell>
                    <TableCell>{formatCurrency(purchase.cost)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(purchase)} className="mr-2">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(purchase.id)}>
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