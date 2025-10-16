import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Pencil, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  description?: string | null;
  due_date?: string | null;
  status: 'pending' | 'completed';
  completed_by?: string | null;
  completed_at?: string | null;
  created_at: string;
}

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onToggleComplete: (id: string, status: 'pending' | 'completed') => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit, onDelete, onToggleComplete }) => {
  const isCompleted = task.status === 'completed';

  return (
    <Card className={cn(
      "w-full transition-all duration-300 ease-in-out",
      isCompleted ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-700" : "bg-white dark:bg-gray-800"
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className={cn("text-lg font-semibold", isCompleted && "line-through text-gray-500 dark:text-gray-400")}>
          {task.title}
        </CardTitle>
        <Badge variant={isCompleted ? "default" : "secondary"} className={isCompleted ? "bg-green-600 hover:bg-green-600" : "bg-yellow-500 hover:bg-yellow-500"}>
          {isCompleted ? 'Concluída' : 'Pendente'}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-2">
        {task.description && (
          <p className={cn("text-sm text-gray-600 dark:text-gray-400", isCompleted && "line-through")}>
            {task.description}
          </p>
        )}
        {task.due_date && (
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Vencimento: {format(new Date(task.due_date), 'dd/MM/yyyy')}
          </p>
        )}
        {isCompleted && (
          <div className="text-xs text-gray-700 dark:text-gray-300">
            <p>Concluída por: {task.completed_by || 'N/A'}</p>
            <p>Em: {task.completed_at ? format(new Date(task.completed_at), 'dd/MM/yyyy HH:mm') : 'N/A'}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end gap-2 pt-4">
        <Button variant="outline" size="sm" onClick={() => onEdit(task)}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="destructive" size="sm" onClick={() => onDelete(task.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button
          variant={isCompleted ? "secondary" : "default"}
          size="sm"
          onClick={() => onToggleComplete(task.id, isCompleted ? 'pending' : 'completed')}
        >
          {isCompleted ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TaskCard;