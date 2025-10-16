import { useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import { useQuery } from '@tanstack/react-query';
import { getInventory } from '@/integrations/supabase/inventory';
import { getPurchasesByProductName } from '@/integrations/supabase/purchases';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/formatters';
import { Skeleton } from '@/components/ui/skeleton';
import { Printer, FileDown, Search } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PurchaseDetail {
  id: string;
  purchase_date?: string | Date;
  quantity: number | null;
  cost?: number;
  vendor?: string;
  assets: { name: string } | null;
}

const Inventory = () => {
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState('');

  const { data: inventory, isLoading, error } = useQuery({
    queryKey: ['inventory'],
    queryFn: getInventory,
  });

  const { data: purchaseDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['purchaseDetails', selectedProduct],
    queryFn: () => getPurchasesByProductName(selectedProduct!),
    enabled: !!selectedProduct && isModalOpen,
  });

  const filteredInventory = useMemo(() => {
    if (!inventory) return [];
    return inventory.filter(item =>
      item.name.toLowerCase().includes(filter.toLowerCase())
    );
  }, [inventory, filter]);

  const handleProductClick = (productName: string) => {
    setSelectedProduct(productName);
    setIsModalOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleGeneratePDF = () => {
    const doc = new jsPDF();
    doc.text("Relatório de Estoque", 14, 16);
    autoTable(doc, {
      head: [['Nome do Produto', 'Quantidade em Estoque']],
      body: filteredInventory.map(item => [item.name, item.quantity]),
      startY: 20,
    });
    doc.save('relatorio_estoque.pdf');
  };

  if (isLoading) {
    return <Layout><div className="container mx-auto py-8 text-center"><p>Carregando estoque...</p></div></Layout>;
  }

  if (error) {
    return <Layout><div className="container mx-auto py-8 text-center text-red-500"><p>Erro ao carregar estoque: {error.message}</p></div></Layout>;
  }

  return (
    <Layout>
      <div className="container mx-auto py-8">
        <div className="print:hidden">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Controle de Estoque</h2>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Estoque de Produtos</CardTitle>
            <CardDescription>
              Filtre, visualize e gere relatórios do seu estoque.
            </CardDescription>
            <div className="flex flex-col sm:flex-row gap-4 pt-4 print:hidden">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Filtrar por nome do produto..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handlePrint} variant="outline">
                  <Printer className="mr-2 h-4 w-4" />
                  Imprimir
                </Button>
                <Button onClick={handleGeneratePDF}>
                  <FileDown className="mr-2 h-4 w-4" />
                  Gerar PDF
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredInventory && filteredInventory.length > 0 ? (
              <div className="overflow-x-auto"> {/* Adicionado overflow-x-auto */}
                <Table className="min-w-full"> {/* Adicionado min-w-full */}
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome do Produto</TableHead>
                      <TableHead className="text-right">Quantidade em Estoque</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInventory.map((item) => (
                      <TableRow key={item.name}>
                        <TableCell className="font-medium">
                          <Button
                            variant="link"
                            onClick={() => handleProductClick(item.name)}
                            className="p-0 h-auto text-base print:text-black print:no-underline"
                          >
                            {item.name}
                          </Button>
                        </TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400">Nenhum produto encontrado.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Histórico de Compras: {selectedProduct}</DialogTitle>
          </DialogHeader>
          <div className="py-4 max-h-[60vh] overflow-y-auto">
            {isLoadingDetails ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : purchaseDetails && purchaseDetails.length > 0 ? (
              <div className="overflow-x-auto"> {/* Adicionado overflow-x-auto */}
                <Table className="min-w-full"> {/* Adicionado min-w-full */}
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Custo</TableHead>
                      <TableHead>Fornecedor</TableHead>
                      <TableHead>Ativo Associado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseDetails.map((detail: PurchaseDetail) => (
                      <TableRow key={detail.id}>
                        <TableCell>{detail.purchase_date ? format(new Date(detail.purchase_date), 'dd/MM/yyyy') : 'N/A'}</TableCell>
                        <TableCell>{detail.quantity}</TableCell>
                        <TableCell>{formatCurrency(detail.cost)}</TableCell>
                        <TableCell>{detail.vendor || 'N/A'}</TableCell>
                        <TableCell>{detail.assets?.name || 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-center text-gray-500">Nenhum histórico de compra encontrado para este produto.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Inventory;