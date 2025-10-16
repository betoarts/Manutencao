import { useState, useMemo } from 'react'; // Removido useEffect
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAssets, createAsset, updateAsset, deleteAsset, Asset, NewAsset } from '@/integrations/supabase/assets';
import { toast } from 'sonner';
import { PlusCircle, Search, Trash2, Pencil } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useDebounce } from '@/hooks/use-debounce';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext } from '@/components/ui/pagination';
import { formatCurrency } from '@/lib/formatters';
import AssetForm from '@/components/AssetForm';
import type { AssetFormValues } from '@/components/AssetForm'; // Corrigido para import type

const PAGE_SIZE = 9;

const Assets = () => {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | string>('all');
  const [page, setPage] = useState(1);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const { data, isLoading, error } = useQuery<{ data: Asset[]; count: number }>({
    queryKey: ['assets', debouncedSearchTerm, page, filterStatus],
    queryFn: () => getAssets({ searchTerm: debouncedSearchTerm, page, pageSize: PAGE_SIZE }),
  });

  const assets = data?.data ?? [];
  const totalCount = data?.count ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const createMutation = useMutation({
    mutationFn: createAsset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Ativo criado com sucesso!');
      setIsFormOpen(false);
      setEditingAsset(null);
    },
    onError: (err) => {
      toast.error(`Erro ao criar ativo: ${err.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<NewAsset> }) => updateAsset(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Ativo atualizado com sucesso!');
      setIsFormOpen(false);
      setEditingAsset(null);
    },
    onError: (err) => {
      toast.error(`Erro ao atualizar ativo: ${err.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAsset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Ativo excluído com sucesso!');
    },
    onError: (err) => {
      toast.error(`Erro ao excluir ativo: ${err.message}`);
    },
  });

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este ativo?')) {
      deleteMutation.mutate(id);
    }
  };

  const onSubmit = (data: AssetFormValues) => {
    const formattedData = {
      ...data,
      acquisition_date: data.acquisition_date ? format(data.acquisition_date, 'yyyy-MM-dd') : null,
      supplier: data.supplier === '' ? null : data.supplier,
      department_id: data.department_id === '' ? null : data.department_id,
      custodian_id: data.custodian_id === '' ? null : data.custodian_id,
    };

    if (editingAsset) {
      updateMutation.mutate({ id: editingAsset.id, data: formattedData });
    } else {
      createMutation.mutate(formattedData);
    }
  };

  const statusOptions = ['active', 'in_maintenance', 'depreciated'];

  const displayedAssets = useMemo(() => {
    if (!assets) return [];
    if (filterStatus === 'all') {
      return assets;
    }
    return assets.filter(asset => asset.status === filterStatus);
  }, [assets, filterStatus]);

  return (
    <Layout>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Gestão de Ativos</h2>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingAsset(null)}>
                <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Ativo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingAsset ? 'Editar Ativo' : 'Adicionar Novo Ativo'}</DialogTitle>
              </DialogHeader>
              <AssetForm
                initialData={editingAsset ? {
                  ...editingAsset,
                  acquisition_date: editingAsset.acquisition_date ? new Date(editingAsset.acquisition_date) : undefined,
                  value: editingAsset.value !== null && editingAsset.value !== undefined ? Number(editingAsset.value) : undefined,
                  useful_life_years: editingAsset.useful_life_years !== null && editingAsset.useful_life_years !== undefined ? Number(editingAsset.useful_life_years) : undefined,
                  status: editingAsset.status as AssetFormValues['status'], // Corrigido: Type assertion para status
                } : undefined}
                onSubmit={onSubmit}
                isSubmitting={createMutation.isPending || updateMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Buscar ativos..."
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
                {statusOptions.map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <p className="text-center text-gray-500 dark:text-gray-400">Carregando ativos...</p>
        ) : error ? (
          <p className="text-center text-red-500">Erro ao carregar ativos: {error.message}</p>
        ) : displayedAssets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedAssets.map((asset: Asset) => (
              <Card key={asset.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle>{asset.name}</CardTitle>
                  <CardDescription className="flex justify-between items-center">
                    <span>{asset.tag_code}</span>
                    <Badge variant="secondary">{asset.status}</Badge>
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  {asset.description && <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{asset.description}</p>}
                  {asset.acquisition_date && <p className="text-xs text-gray-500 dark:text-gray-400">Aquisição: {format(new Date(asset.acquisition_date), 'dd/MM/yyyy')}</p>}
                  {asset.value && <p className="text-xs text-gray-500 dark:text-gray-400">Valor: {formatCurrency(asset.value)}</p>}
                </CardContent>
                <CardFooter className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(asset)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(asset.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400">Nenhum ativo encontrado.</p>
        )}

        {totalPages > 1 && (
          <Pagination className="mt-8">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" onClick={() => setPage(prev => Math.max(1, prev - 1))} />
              </PaginationItem>
              {[...Array(totalPages)].map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink href="#" isActive={page === i + 1} onClick={() => setPage(i + 1)}>
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext href="#" onClick={() => setPage(prev => Math.min(totalPages, prev + 1))} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </Layout>
  );
};

export default Assets;