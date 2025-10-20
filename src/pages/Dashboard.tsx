import Layout from '@/components/Layout';
import { useQuery } from '@tanstack/react-query';
import { getDashboardKPIs, getMaintenanceCostsLast6Months, getAssetStatusDistribution, getAssetsByDepartmentDistribution } from '@/integrations/supabase/dashboard';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { formatCurrency } from '@/lib/formatters'; // Importando o formatador de moeda
import LoadingSpinner from '@/components/LoadingSpinner'; // Importando o LoadingSpinner
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ExternalLink, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
// import { format } from 'date-fns/format'; // Removed unused import

const Dashboard = () => {
  const { data: kpis, isLoading: isLoadingKPIs } = useQuery({
    queryKey: ['dashboardKPIs'],
    queryFn: getDashboardKPIs,
  });

  const { data: maintenanceCostChartData, isLoading: isLoadingMaintenanceCostChart } = useQuery({
    queryKey: ['maintenanceCostsChart'],
    queryFn: getMaintenanceCostsLast6Months,
  });

  const { data: assetStatusData, isLoading: isLoadingAssetStatusChart } = useQuery({
    queryKey: ['assetStatusDistribution'],
    queryFn: getAssetStatusDistribution,
  });

  const { data: assetsByDepartmentData, isLoading: isLoadingAssetsByDepartmentChart } = useQuery({
    queryKey: ['assetsByDepartmentDistribution'],
    queryFn: getAssetsByDepartmentDistribution,
  });

  // Query para buscar chamados abertos com detalhes
  const { data: openRequestsData, isLoading: isLoadingOpenRequests } = useQuery({
    queryKey: ['openRequestsDetails'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maintenance_requests')
        .select('*')
        .in('status', ['Novo', 'Em Andamento', 'Standby'])
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  const PIE_COLORS: { [key: string]: string } = {
    'Ativo': '#22c55e', // green-500
    'Em Manutenção': '#f59e0b', // amber-500
    'Depreciado': '#ef4444', // red-500
  };

  // Cores para o gráfico de barras de departamentos (exemplo, pode ser ajustado)
  const DEPARTMENT_BAR_COLOR = '#3b82f6'; // blue-500

  // Função para determinar a cor e ícone do status do chamado
  const getRequestStatusInfo = (status: string) => {
    switch (status) {
      case 'Novo':
        return { color: 'text-red-600', bgColor: 'bg-red-100', icon: AlertCircle };
      case 'Em Andamento':
        return { color: 'text-blue-600', bgColor: 'bg-blue-100', icon: Clock };
      case 'Standby':
        return { color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: AlertTriangle };
      default:
        return { color: 'text-gray-600', bgColor: 'bg-gray-100', icon: CheckCircle };
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-8">
        <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Visão Geral do Sistema</h2>
        
        {/* Card destacado para chamados abertos */}
        {kpis?.openRequests && kpis.openRequests > 0 && (
          <Card className="mb-8 border-l-4 border-l-red-500 bg-red-50 dark:bg-red-950/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-red-800 dark:text-red-200">
                      Chamados Abertos Requerem Atenção
                    </CardTitle>
                    <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                      {kpis.openRequests} chamado(s) aguardando resolução
                    </p>
                  </div>
                </div>
                <Link to="/requests">
                  <Button variant="outline" size="sm" className="border-red-300 text-red-700 hover:bg-red-100">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ver Chamados
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingOpenRequests ? (
                <div className="flex items-center justify-center py-4">
                  <LoadingSpinner size="sm" />
                </div>
              ) : openRequestsData && openRequestsData.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Últimos chamados abertos:
                  </p>
                  {openRequestsData.slice(0, 3).map((request: any) => {
                    const statusInfo = getRequestStatusInfo(request.status);
                    const StatusIcon = statusInfo.icon;
                    return (
                      <div key={request.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border">
                        <div className="flex items-center space-x-3">
                          <div className={`p-1 rounded-full ${statusInfo.bgColor}`}>
                            <StatusIcon className={`h-4 w-4 ${statusInfo.color}`} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white text-sm">
                              {request.title || 'Chamado sem título'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(request.created_at).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusInfo.bgColor} ${statusInfo.color}`}>
                          {request.status}
                        </span>
                      </div>
                    );
                  })}
                  {openRequestsData.length > 3 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                      +{openRequestsData.length - 3} outros chamados abertos
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  Nenhum chamado aberto encontrado
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Card de resumo de chamados - sempre visível */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <AlertCircle className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-xl text-gray-900 dark:text-white">
                    Resumo de Chamados
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    Visão geral dos chamados de manutenção
                  </p>
                </div>
              </div>
              <Link to="/requests">
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Gerenciar Chamados
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {isLoadingKPIs ? '...' : kpis?.openRequests || 0}
                </div>
                <div className="text-sm text-red-600 dark:text-red-300">Abertos</div>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {isLoadingKPIs ? '...' : (kpis?.openWorkOrders || 0)}
                </div>
                <div className="text-sm text-blue-600 dark:text-blue-300">Em Andamento</div>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {isLoadingKPIs ? '...' : (kpis?.upcomingMaintenances || 0)}
                </div>
                <div className="text-sm text-green-600 dark:text-green-300">Agendados</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex flex-col items-center justify-center">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Total de Ativos</h3>
            {isLoadingKPIs ? (
              <LoadingSpinner size="xl" />
            ) : (
              <p className="text-4xl font-bold text-indigo-600">{kpis?.totalAssets}</p>
            )}
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex flex-col items-center justify-center">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Ativos em Manutenção</h3>
            {isLoadingKPIs ? (
              <LoadingSpinner size="xl" />
            ) : (
              <p className="text-4xl font-bold text-blue-600">{kpis?.assetsInMaintenance}</p>
            )}
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex flex-col items-center justify-center">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Ordens de Serviço Abertas</h3>
            {isLoadingKPIs ? (
              <LoadingSpinner size="xl" />
            ) : (
              <p className="text-4xl font-bold text-yellow-600">{kpis?.openWorkOrders}</p>
            )}
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex flex-col items-center justify-center">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Próximas Manutenções</h3>
            {isLoadingKPIs ? (
              <LoadingSpinner size="xl" />
            ) : (
              <p className="text-4xl font-bold text-green-600">{kpis?.upcomingMaintenances}</p>
            )}
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex flex-col items-center justify-center">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Chamados em Andamento</h3>
            {isLoadingKPIs ? (
              <LoadingSpinner size="xl" />
            ) : (
              <p className="text-4xl font-bold text-purple-600">{kpis?.openRequests}</p>
            )}
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex flex-col items-center justify-center">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Custo Médio Manutenção</h3>
            {isLoadingKPIs ? (
              <LoadingSpinner size="xl" />
            ) : (
              <p className="text-4xl font-bold text-teal-600">{formatCurrency(kpis?.averageMaintenanceCost)}</p>
            )}
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex flex-col items-center justify-center">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Tarefas Atrasadas</h3>
            {isLoadingKPIs ? (
              <LoadingSpinner size="xl" />
            ) : (
              <p className="text-4xl font-bold text-red-600">{kpis?.overdueTasks}</p>
            )}
          </div>
        </div>
        
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Custos de Manutenção (Últimos 6 Meses)</h3>
            <div className="h-80 flex items-center justify-center">
              {isLoadingMaintenanceCostChart ? (
                <LoadingSpinner size="xl" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={maintenanceCostChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip formatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)} />
                    <Legend />
                    <Bar dataKey="Custo" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Distribuição de Ativos por Status</h3>
            <div className="h-80 flex items-center justify-center">
              {isLoadingAssetStatusChart ? (
                <LoadingSpinner size="xl" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={assetStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    >
                      {assetStatusData?.map((entry: { name: string }, index: number) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[entry.name]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value} ativo(s)`, name]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Distribuição de Ativos por Departamento</h3>
            <div className="h-80 flex items-center justify-center">
              {isLoadingAssetsByDepartmentChart ? (
                <LoadingSpinner size="xl" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={assetsByDepartmentData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value: number, name: string) => [`${value} ativo(s)`, name]} />
                    <Legend />
                    <Bar dataKey="value" name="Ativos" fill={DEPARTMENT_BAR_COLOR} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;