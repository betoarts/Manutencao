import { supabase } from './client';
import { startOfMonth } from 'date-fns/startOfMonth';
import { subMonths } from 'date-fns/subMonths';
import { format } from 'date-fns/format';

export const getDashboardKPIs = async () => {
  const { count: assetsInMaintenance, error: assetsError } = await supabase
    .from('assets')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'in_maintenance');
  if (assetsError) throw assetsError;

  const { count: openWorkOrders, error: ordersError } = await supabase
    .from('maintenance_records')
    .select('*', { count: 'exact', head: true })
    .in('status', ['Agendada', 'Em Andamento']);
  if (ordersError) throw ordersError;

  const { count: upcomingMaintenances, error: upcomingError } = await supabase
    .from('maintenance_records')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'Agendada')
    .gte('scheduled_date', new Date().toISOString());
  if (upcomingError) throw upcomingError;

  const { count: openRequests, error: requestsError } = await supabase
    .from('maintenance_requests')
    .select('*', { count: 'exact', head: true })
    .in('status', ['Novo', 'Em Andamento', 'Standby']); // Incluindo 'Novo' e 'Standby'
  if (requestsError) throw requestsError;

  // Novos KPIs
  const { count: totalAssets, error: totalAssetsError } = await supabase
    .from('assets')
    .select('*', { count: 'exact', head: true });
  if (totalAssetsError) throw totalAssetsError;

  const { data: completedMaintenanceCosts, error: costsError } = await supabase
    .from('maintenance_records')
    .select('cost')
    .eq('status', 'Concluída');
  if (costsError) throw costsError;

  const totalCost = completedMaintenanceCosts?.reduce((sum, record) => sum + (Number(record.cost) || 0), 0) || 0;
  const averageMaintenanceCost = completedMaintenanceCosts?.length > 0 ? totalCost / completedMaintenanceCosts.length : 0;

  const { count: overdueTasks, error: overdueTasksError } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')
    .lt('due_date', format(new Date(), 'yyyy-MM-dd')); // Comparar apenas a data
  if (overdueTasksError) throw overdueTasksError;


  return {
    assetsInMaintenance: assetsInMaintenance ?? 0,
    openWorkOrders: openWorkOrders ?? 0,
    upcomingMaintenances: upcomingMaintenances ?? 0,
    openRequests: openRequests ?? 0,
    totalAssets: totalAssets ?? 0, // Novo KPI
    averageMaintenanceCost: averageMaintenanceCost, // Novo KPI
    overdueTasks: overdueTasks ?? 0, // Novo KPI
  };
};

export const getMaintenanceCostsLast6Months = async () => {
  const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5));

  const { data, error } = await supabase
    .from('maintenance_records')
    .select('completion_date, cost')
    .eq('status', 'Concluída')
    .gte('completion_date', format(sixMonthsAgo, 'yyyy-MM-dd'))
    .order('completion_date', { ascending: true });

  if (error) throw error;

  // Process data on the client-side for the chart
  const monthlyCosts: { [key: string]: number } = {};

  for (let i = 5; i >= 0; i--) {
    const month = format(subMonths(new Date(), i), 'yyyy-MM');
    monthlyCosts[month] = 0;
  }

  data.forEach(record => {
    if (record.completion_date && record.cost) {
      const month = format(new Date(record.completion_date), 'yyyy-MM');
      if (monthlyCosts[month] !== undefined) {
        monthlyCosts[month] += Number(record.cost);
      }
    }
  });

  return Object.entries(monthlyCosts).map(([month, cost]) => ({
    name: format(new Date(month + '-02'), 'MMM/yy'), // Use day 02 to avoid timezone issues
    Custo: cost,
  }));
};

export const getAssetStatusDistribution = async () => {
  const { data, error } = await supabase.rpc('get_asset_status_distribution');
  if (error) throw error;

  const statusMap: { [key: string]: string } = {
    'active': 'Ativo',
    'in_maintenance': 'Em Manutenção',
    'depreciated': 'Depreciado'
  };

  return data.map((item: { status: string; count: number }) => ({
    name: statusMap[item.status] || item.status,
    value: item.count,
  }));
};

// Nova função para obter a distribuição de ativos por departamento
export const getAssetsByDepartmentDistribution = async () => {
  const { data, error } = await supabase.rpc('get_assets_by_department_distribution');
  if (error) throw error;
  return data.map((item: { department_name: string; count: number }) => ({
    name: item.department_name,
    value: item.count,
  }));
};