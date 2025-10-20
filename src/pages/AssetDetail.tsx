import { useState } from 'react';
import Layout from '@/components/Layout';
import { getAssetById, Asset } from '@/integrations/supabase/assets';
import { getMaintenanceRecordsByAssetId, MaintenanceRecord } from '@/integrations/supabase/maintenance';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns/format';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/formatters';
import MaintenanceDetailModal from '@/components/MaintenanceDetailModal';

const AssetDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [selectedMaintenanceRecord, setSelectedMaintenanceRecord] = useState<MaintenanceRecord | null>(null);

  const { data: asset, isLoading: isLoadingAsset, error: assetError } = useQuery<Asset | null>({
    queryKey: ['asset', id],
    queryFn: () => (id ? getAssetById(id) : Promise.resolve(null)),
    enabled: !!id,
  });

  const { data: maintenanceRecords, isLoading: isLoadingRecords, error: recordsError } = useQuery<MaintenanceRecord[]>({
    queryKey: ['maintenanceRecordsByAsset', id],
    queryFn: () => (id ? getMaintenanceRecordsByAssetId(id) : Promise.resolve([])),
    enabled: !!id,
  });

  const handleRowClick = (record: MaintenanceRecord) => {
    setSelectedMaintenanceRecord(record);
  };

  if (isLoadingAsset) {
    return <Layout><div className="container mx-auto py-8 text-center">Carregando detalhes do ativo...</div></Layout>;
  }

  if (assetError) {
    return <Layout><div className="container mx-auto py-8 text-center text-red-500">Erro ao carregar ativo: {assetError.message}</div></Layout>;
  }

  if (!asset) {
    return <Layout><div className="container mx-auto py-8 text-center">Ativo não encontrado.</div></Layout>;
  }

  return (
    <Layout>
      <div className="container mx-auto py-8">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              {asset.name} <Badge variant="secondary">{asset.status}</Badge>
            </CardTitle>
            <CardDescription>{asset.tag_code}</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Descrição:</p>
              <p>{asset.description || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Data de Aquisição:</p>
              <p>{asset.acquisition_date ? format(new Date(asset.acquisition_date), 'dd/MM/yyyy') : 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Fornecedor:</p>
              <p>{asset.supplier || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Valor:</p>
              <p>{asset.value ? formatCurrency(asset.value) : 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Vida Útil (Anos):</p>
              <p>{asset.useful_life_years || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>

        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Histórico de Manutenção</h3>
        {isLoadingRecords ? (
          <p className="text-center text-gray-500 dark:text-gray-400">Carregando histórico de manutenção...</p>
        ) : recordsError ? (
          <p className="text-center text-red-500">Erro ao carregar histórico: {recordsError.message}</p>
        ) : maintenanceRecords && maintenanceRecords.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Data Agendada</TableHead>
                <TableHead>Data Conclusão</TableHead>
                <TableHead>Custo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Técnico</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {maintenanceRecords.map((record) => (
                <TableRow key={record.id} onClick={() => handleRowClick(record)} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                  <TableCell>{record.maintenance_type}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{record.description || 'N/A'}</TableCell>
                  <TableCell>{format(new Date(record.scheduled_date), 'dd/MM/yyyy')}</TableCell>
                  <TableCell>{record.completion_date ? format(new Date(record.completion_date), 'dd/MM/yyyy') : 'N/A'}</TableCell>
                  <TableCell>{formatCurrency(record.cost)}</TableCell>
                  <TableCell><Badge>{record.status}</Badge></TableCell>
                  <TableCell>{record.technician_name || 'N/A'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400">Nenhum registro de manutenção para este ativo.</p>
        )}
      </div>

      <MaintenanceDetailModal
        record={selectedMaintenanceRecord}
        onOpenChange={(isOpen) => !isOpen && setSelectedMaintenanceRecord(null)}
      />
    </Layout>
  );
};

export default AssetDetail;