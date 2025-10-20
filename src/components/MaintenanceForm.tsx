import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns/format';
import { useQuery } from '@tanstack/react-query';
import { getAllAssets, Asset } from '@/integrations/supabase/assets';
// Não precisamos importar MaintenanceRecord do integrations/supabase/maintenance_records aqui para initialData

const maintenanceRecordFormSchema = z.object({
  asset_id: z.string().min(1, { message: 'Ativo é obrigatório.' }),
  maintenance_type: z.string().min(1, { message: 'Tipo de manutenção é obrigatório.' }),
  description: z.string().optional().nullable(),
  scheduled_date: z.date({ required_error: 'Data agendada é obrigatória.' }),
  completion_date: z.date().optional().nullable(),
  cost: z.preprocess(
    (val) => (val === '' ? null : Number(val)),
    z.number().positive('Custo deve ser um número positivo.').optional().nullable()
  ),
  status: z.string().default('Agendada'),
  notes: z.string().optional().nullable(),
  technician_name: z.string().optional().nullable(),
});

export type MaintenanceRecordFormValues = z.infer<typeof maintenanceRecordFormSchema>;

// Definindo um tipo para initialData que corresponde à estrutura do objeto 'editingRecord'
// da página Maintenance.tsx, sem a necessidade de 'user_id' e permitindo 'string | Date' para datas.
interface MaintenanceFormInitialData {
  id: string;
  asset_id: string;
  maintenance_type: string;
  description?: string | null;
  scheduled_date: string | Date;
  completion_date?: string | Date | null;
  cost?: number | null;
  status: string;
  notes?: string | null;
  technician_name?: string | null;
}

type MaintenanceFormProps = {
  initialData?: MaintenanceFormInitialData | null; // Usando o novo tipo
  onSubmit: (data: MaintenanceRecordFormValues) => void;
  isSubmitting: boolean;
};

const MaintenanceForm = ({ initialData, onSubmit, isSubmitting }: MaintenanceFormProps) => {
  const form = useForm<MaintenanceRecordFormValues>({
    resolver: zodResolver(maintenanceRecordFormSchema),
    defaultValues: {
      asset_id: initialData?.asset_id || '',
      maintenance_type: initialData?.maintenance_type || '',
      description: initialData?.description || '',
      scheduled_date: initialData?.scheduled_date ? new Date(initialData.scheduled_date) : undefined,
      completion_date: initialData?.completion_date ? new Date(initialData.completion_date) : undefined,
      cost: initialData?.cost || undefined,
      status: initialData?.status || 'Agendada',
      notes: initialData?.notes || '',
      technician_name: initialData?.technician_name || '',
    },
  });

  const { data: assets, isLoading: isLoadingAssets } = useQuery<Asset[]>({
    queryKey: ['allAssets'],
    queryFn: getAllAssets,
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        asset_id: initialData.asset_id,
        maintenance_type: initialData.maintenance_type,
        description: initialData.description || '',
        scheduled_date: initialData.scheduled_date ? new Date(initialData.scheduled_date) : undefined,
        completion_date: initialData.completion_date ? new Date(initialData.completion_date) : undefined,
        cost: initialData.cost || undefined,
        status: initialData.status,
        notes: initialData.notes || '',
        technician_name: initialData.technician_name || '',
      });
    } else {
      form.reset();
    }
  }, [initialData, form]);

  const statusOptions = ['Agendada', 'Em Andamento', 'Concluída', 'Cancelada'];
  const maintenanceTypeOptions = ['Preventiva', 'Corretiva', 'Preditiva', 'Inspeção'];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="asset_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ativo</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um ativo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {isLoadingAssets ? (
                    <SelectItem value="loading" disabled>Carregando ativos...</SelectItem>
                  ) : (
                    assets?.map((asset: Asset) => (
                      <SelectItem key={asset.id} value={asset.id}>
                        {asset.name} ({asset.tag_code})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="maintenance_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Manutenção</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {maintenanceTypeOptions.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="scheduled_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data Agendada</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal", // Alterado para w-full para melhor responsividade
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Selecione uma data</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value || undefined}
                    onSelect={field.onChange}
                    disabled={(date) => date < new Date("1900-01-01")}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="completion_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data de Conclusão (Opcional)</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal", // Alterado para w-full para melhor responsividade
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Selecione uma data</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value || undefined}
                    onSelect={field.onChange}
                    disabled={(date) => date < new Date("1900-01-01")}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="cost"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Custo (R$)</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" {...field} value={field.value === undefined || field.value === null ? '' : field.value} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {statusOptions.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="technician_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Técnico</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {initialData ? (isSubmitting ? 'Salvando...' : 'Salvar Alterações') : (isSubmitting ? 'Registrando...' : 'Registrar Manutenção')}
        </Button>
      </form>
    </Form>
  );
};

export default MaintenanceForm;