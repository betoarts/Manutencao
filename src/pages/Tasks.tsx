import { useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTasks, createTask, updateTask, deleteTask, TaskData } from '@/integrations/supabase/tasks';
import TaskForm, { TaskFormValues } from '@/components/TaskForm';
import TaskCard from '@/components/TaskCard';
import { toast } from 'sonner';
import { PlusCircle, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useDebounce } from '@/hooks/use-debounce';
import { useSupabase } from '@/integrations/supabase/SessionContextProvider';
import { format } from 'date-fns/format'; // Importação adicionada

interface Task extends TaskData {
  id: string;
  created_at: string;
}

const Tasks = () => {
  const queryClient = useQueryClient();
  const { session } = useSupabase();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const { data: tasks, isLoading, error } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: getTasks,
    enabled: !!session, // Only fetch tasks if user is authenticated
  });

  const createMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Tarefa criada com sucesso!');
      setIsFormOpen(false);
    },
    onError: (err) => {
      toast.error(`Erro ao criar tarefa: ${err.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TaskData> }) => updateTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Tarefa atualizada com sucesso!');
      setIsFormOpen(false);
      setEditingTask(null);
    },
    onError: (err) => {
      toast.error(`Erro ao atualizar tarefa: ${err.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Tarefa excluída com sucesso!');
    },
    onError: (err) => {
      toast.error(`Erro ao excluir tarefa: ${err.message}`);
    },
  });

  const handleFormSubmit = (data: TaskFormValues) => {
    const formattedData: TaskData = {
      ...data,
      due_date: data.due_date ? format(data.due_date, 'yyyy-MM-dd') : null,
      completed_at: data.status === 'completed' && !editingTask?.completed_at ? new Date().toISOString() : editingTask?.completed_at || null,
    };

    if (editingTask) {
      updateMutation.mutate({ id: editingTask.id, data: formattedData });
    } else {
      createMutation.mutate(formattedData);
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta tarefa?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleComplete = (id: string, currentStatus: 'pending' | 'completed') => {
    const taskToUpdate = tasks?.find(t => t.id === id);
    if (!taskToUpdate) return;

    const newStatus = currentStatus === 'pending' ? 'completed' : 'pending';
    const completed_at = newStatus === 'completed' ? new Date().toISOString() : null;
    const completed_by = newStatus === 'completed' ? taskToUpdate.completed_by || session?.user?.user_metadata?.full_name || session?.user?.email : null;

    updateMutation.mutate({
      id,
      data: { status: newStatus, completed_at, completed_by },
    });
  };

  const filteredTasks = useMemo(() => {
    let filtered = tasks || [];

    if (filterStatus !== 'all') {
      filtered = filtered.filter(task => task.status === filterStatus);
    }

    if (debouncedSearchTerm) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        task.completed_by?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [tasks, filterStatus, debouncedSearchTerm]);

  return (
    <Layout>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Minhas Tarefas</h2>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingTask(null); setIsFormOpen(true); }}>
                <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Tarefa
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}</DialogTitle>
              </DialogHeader>
              <TaskForm
                initialData={editingTask ? {
                  ...editingTask,
                  due_date: editingTask.due_date ? new Date(editingTask.due_date) : undefined,
                } : undefined}
                onSubmit={handleFormSubmit}
                isSubmitting={createMutation.isPending || updateMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Buscar tarefas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="w-full sm:w-auto">
            <Label htmlFor="filter-status" className="sr-only">Filtrar por Status</Label>
            <Select onValueChange={(value: 'all' | 'pending' | 'completed') => setFilterStatus(value)} defaultValue={filterStatus}>
              <SelectTrigger id="filter-status" className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="completed">Concluídas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <p className="text-center text-gray-500 dark:text-gray-400">Carregando tarefas...</p>
        ) : error ? (
          <p className="text-center text-red-500">Erro ao carregar tarefas: {error.message}</p>
        ) : filteredTasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleComplete={handleToggleComplete}
              />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400">Nenhuma tarefa encontrada.</p>
        )}
      </div>
    </Layout>
  );
};

export default Tasks;