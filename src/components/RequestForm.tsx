import React, { useEffect } from 'react';
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
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { getPublicFormFields } from '@/integrations/supabase/publicForm';
import { MaintenanceRequest } from '@/integrations/supabase/maintenance_requests';

// Esquema base para os campos padrão
const baseRequestFormSchema = z.object({
  requester_name: z.string().min(2, { message: 'O nome do solicitante deve ter pelo menos 2 caracteres.' }),
  requester_email: z.string().email({ message: 'Por favor, insira um e-mail válido.' }).optional().or(z.literal('')),
  requester_phone: z.string().optional().or(z.literal('')),
  description: z.string().min(10, { message: 'A descrição do problema deve ter pelo menos 10 caracteres.' }),
  status: z.enum(['Novo', 'Em Andamento', 'Standby', 'Concluído', 'Cancelado']).default('Novo'),
  technician_name: z.string().optional().nullable(),
  started_at: z.date().optional().nullable(),
  completed_at: z.date().optional().nullable(),
});

// Tipo para os valores do formulário, incluindo custom_data
export type RequestFormValues = z.infer<typeof baseRequestFormSchema> & {
  [key: string]: any; // Para campos customizados
};

interface RequestFormProps {
  initialData?: MaintenanceRequest | null;
  onSubmit: (data: RequestFormValues) => void;
  isSubmitting: boolean;
}

const RequestForm: React.FC<RequestFormProps> = ({ initialData, onSubmit, isSubmitting }) => {
  const { data: formFields, isLoading: isLoadingFields } = useQuery({
    queryKey: ['publicFormFields'],
    queryFn: getPublicFormFields,
  });

  const form = useForm<RequestFormValues>({
    resolver: zodResolver(baseRequestFormSchema.extend(
      formFields?.reduce((acc, field) => {
        // Adiciona validação para campos customizados se forem obrigatórios
        acc[field.field_label] = field.is_required
          ? z.string().min(1, { message: `${field.field_label} é obrigatório.` })
          : z.string().optional().or(z.literal(''));
        return acc;
      }, {} as Record<string, z.ZodTypeAny>) || {}
    )),
    defaultValues: {
      requester_name: initialData?.requester_name || '',
      requester_email: initialData?.requester_email || '',
      requester_phone: initialData?.requester_phone || '',
      description: initialData?.description || '',
      status: (initialData?.status as 'Novo' | 'Em Andamento' | 'Standby' | 'Concluído' | 'Cancelado') || 'Novo',
      technician_name: initialData?.technician_name || '',
      started_at: initialData?.started_at ? new Date(initialData.started_at) : undefined,
      completed_at: initialData?.completed_at ? new Date(initialData.completed_at) : undefined,
      ...initialData?.custom_data, // Preenche campos customizados
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        requester_name: initialData.requester_name,
        requester_email: initialData.requester_email || '',
        requester_phone: initialData.requester_phone || '',
        description: initialData.description,
        status: (initialData.status as 'Novo' | 'Em Andamento' | 'Standby' | 'Concluído' | 'Cancelado'),
        technician_name: initialData.technician_name || '',
        started_at: initialData.started_at ? new Date(initialData.started_at) : undefined,
        completed_at: initialData.completed_at ? new Date(initialData.completed_at) : undefined,
        ...initialData.custom_data,
      });
    } else {
      form.reset({
        requester_name: '',
        requester_email: '',
        requester_phone: '',
        description: '',
        status: 'Novo',
        technician_name: '',
        started_at: undefined,
        completed_at: undefined,
      });
    }
  }, [initialData, form, formFields]); // Adicionado formFields como dependência para resetar com novos campos

  const statusOptions = ['Novo', 'Em Andamento', 'Standby', 'Concluído', 'Cancelado'];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="requester_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Solicitante</FormLabel>
              <FormControl>
                <Input placeholder="Nome completo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="requester_email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail do Solicitante</FormLabel>
              <FormControl>
                <Input type="email" placeholder="email@exemplo.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="requester_phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefone do Solicitante</FormLabel>
              <FormControl>
                <Input placeholder="(XX) XXXXX-XXXX" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição do Problema</FormLabel>
              <FormControl>
                <Textarea placeholder="Descreva o problema detalhadamente" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Campos Customizados */}
        {isLoadingFields ? (
          <p>Carregando campos customizados...</p>
        ) : (
          formFields?.map(fieldConfig => (
            <FormField
              key={fieldConfig.id}
              control={form.control}
              name={fieldConfig.field_label} // Usar o label como nome do campo
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{fieldConfig.field_label}</FormLabel>
                  <FormControl>
                    {fieldConfig.field_type === 'textarea' ? (
                      <Textarea placeholder={`Insira ${fieldConfig.field_label.toLowerCase()}`} {...field} value={field.value || ''} />
                    ) : (
                      <Input placeholder={`Insira ${fieldConfig.field_label.toLowerCase()}`} {...field} value={field.value || ''} />
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))
        )}

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status do chamado" />
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
              <FormLabel>Técnico Responsável</FormLabel>
              <FormControl>
                <Input placeholder="Nome do técnico" {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="started_at"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data de Início</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
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
          name="completed_at"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data de Conclusão</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
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
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : 'Salvar Chamado'}
        </Button>
      </form>
    </Form>
  );
};

export default RequestForm;