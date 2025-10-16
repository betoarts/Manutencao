import Layout from '@/components/Layout';
import { useQuery } from '@tanstack/react-query';
import { getDashboardKPIs, getMaintenanceCostsLast6Months, getAssetStatusDistribution, getAssetsByDepartmentDistribution } from '@/integrations/supabase/dashboard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { formatCurrency } from '@/lib/formatters'; // Importando o formatador de moeda
import LoadingSpinner from '@/components/LoadingSpinner'; // Importando o LoadingSpinner

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

  const PIE_COLORS: { [key: string]: string } = {
    'Ativo': '#22c55e', // green-500
    'Em Manutenção': '#f59e0b', // amber-500
    'Depreciado': '#ef4444', // red-500
  };

  // Cores para o gráfico de barras de departamentos (exemplo, pode ser ajustado)
  const DEPARTMENT_BAR_COLOR = '#3b82f6'; // blue-500

  return (
    <Layout>
      <div className="container mx-auto py-8">
        <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Visão Geral do Sistema</h2>
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