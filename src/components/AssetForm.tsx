import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { getDepartments } from '@/integrations/supabase/departments';
import { getProfiles } from '@/integrations/supabase/profiles';
import { getSuppliers, Supplier } from '@/integrations/supabase/suppliers'; // Importar getSuppliers e Supplier

const assetFormSchema = z.object({
  name: z.string().min(2, { message: 'O nome deve ter pelo menos 2 caracteres.' }),
  description: z.string().optional(),
  tag_code: z.string().min(1, { message: 'O código de identificação é obrigatório.' }),
  acquisition_date: z.date().optional(),
  supplier: z.string().optional().nullable(), // Permitir null para fornecedor
  value: z.preprocess(
    (val) => (val === '' ? undefined : Number(val)),
    z.number().positive({ message: 'O valor deve ser um número positivo.' }).optional(),
  ),
  useful_life_years: z.preprocess(
    (val) => (val === '' ? undefined : Number(val)),
    z.number().int().positive({ message: 'A vida útil deve ser um número inteiro positivo.' }).optional(),
  ),
  status: z.enum(['active', 'in_maintenance', 'depreciated']).default('active'),
  department_id: z.string().uuid().optional().nullable(),
  custodian_id: z.string().uuid().optional().nullable(),
});

type AssetFormValues = z.infer<typeof assetFormSchema>;

interface AssetFormProps {
  initialData?: AssetFormValues;
  onSubmit: (data: AssetFormValues) => void;
  isSubmitting: boolean;
}

const AssetForm: React.FC<AssetFormProps> = ({ initialData, onSubmit, isSubmitting }) => {
  const { data: departments, isLoading: isLoadingDepts } = useQuery({ queryKey: ['departments'], queryFn: getDepartments });
  const { data: profiles, isLoading: isLoadingProfiles } = useQuery({ queryKey: ['profiles'], queryFn: getProfiles });
  const { data: suppliers, isLoading: isLoadingSuppliers } = useQuery<Supplier[]>({ queryKey: ['suppliers'], queryFn: getSuppliers }); // Buscar fornecedores

  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: initialData || {
      name: '',
      description: '',
      tag_code: '',
      acquisition_date: undefined,
      supplier: null, // Definir como null por padrão
      value: undefined,
      useful_life_years: undefined,
      status: 'active',
      department_id: null,
      custodian_id: null,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Ativo</FormLabel>
              <FormControl>
                <Input placeholder="Nome do ativo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="tag_code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Código de Identificação (Tag/QR Code/RFID)</FormLabel>
              <FormControl>
                <Input placeholder="Ex: ATIVO-001" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="department_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Departamento</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value || ''} disabled={isLoadingDepts}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder={isLoadingDepts ? "Carregando..." : "Selecione um departamento"} /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="null">Nenhum</SelectItem>
                  {departments?.map((dept: any) => <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="custodian_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Responsável (Custodiante)</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value || ''} disabled={isLoadingProfiles}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder={isLoadingProfiles ? "Carregando..." : "Selecione um usuário"} /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="null">Nenhum</SelectItem>
                  {profiles?.map((prof: any) => <SelectItem key={prof.id} value={prof.id}>{prof.first_name} {prof.last_name}</SelectItem>)}
                </SelectContent>
              </Select>
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
                <Textarea placeholder="Detalhes do ativo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="acquisition_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data de Aquisição</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[240px] pl-3 text-left font-normal",
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
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
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
          name="supplier"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fornecedor</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value || ''} disabled={isLoadingSuppliers}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingSuppliers ? "Carregando..." : "Selecione um fornecedor"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem> {/* Opção para limpar a seleção */}
                  {suppliers?.map((s) => (
                    <SelectItem key={s.id} value={s.name}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor de Aquisição</FormLabel>
              <FormControl>
                <Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : Number(e.target.value))} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="useful_life_years"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vida Útil (anos)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="Ex: 5" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : Number(e.target.value))} />
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
                    <SelectValue placeholder="Selecione o status do ativo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="in_maintenance">Em Manutenção</SelectItem>
                  <SelectItem value="depreciated">Depreciado</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : 'Salvar Ativo'}
        </Button>
      </form>
    </Form>
  );
};

export default AssetForm;