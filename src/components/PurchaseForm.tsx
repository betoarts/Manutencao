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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllAssets, Asset } from '@/integrations/supabase/assets';
import { createPurchase, updatePurchase, NewPurchase } from '@/integrations/supabase/purchases';
import { toast } from 'sonner';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label'; // Importar Label do shadcn/ui

const purchaseFormSchema = z.object({
  product_name: z.string().min(1, { message: 'Nome do produto é obrigatório.' }).optional().nullable(), // Tornar opcional para ativos
  quantity: z.preprocess(
    (val) => (val === '' ? null : Number(val)),
    z.number().int('Quantidade deve ser um número inteiro.').positive('Quantidade deve ser positiva.').optional().nullable()
  ),
  asset_id: z.string().optional().nullable(),
  vendor: z.string().optional().nullable(),
  purchase_date: z.date().optional().nullable(),
  cost: z.preprocess(
    (val) => (val === '' ? null : Number(val)),
    z.number().positive('Custo deve ser um número positivo.').optional().nullable()
  ),
  invoice_number: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  purchase_type: z.enum(["product", "asset"], {
    required_error: "Tipo de compra é obrigatório.",
  }),
}).superRefine((data, ctx) => {
  if (data.purchase_type === "product") {
    if (!data.product_name) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Nome do produto é obrigatório para compras de produto.",
        path: ["product_name"],
      });
    }
    if (data.quantity === null || data.quantity === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Quantidade é obrigatória para compras de produto.",
        path: ["quantity"],
      });
    }
  } else if (data.purchase_type === "asset") {
    if (!data.asset_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Ativo associado é obrigatório para compras de ativo.",
        path: ["asset_id"],
      });
    }
  }
});

export type PurchaseFormValues = z.infer<typeof purchaseFormSchema>;

type PurchaseFormProps = {
  initialData?: (NewPurchase & { id: string }) | null; // Permitir null para initialData
  onSuccess?: () => void;
  isSubmitting: boolean; // Adicionado de volta para o componente pai controlar
};

const PurchaseForm = ({ initialData, onSuccess, isSubmitting }: PurchaseFormProps) => {
  const queryClient = useQueryClient();
  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseFormSchema),
    defaultValues: {
      product_name: initialData?.product_name || '',
      quantity: initialData?.quantity || undefined,
      asset_id: initialData?.asset_id || '',
      vendor: initialData?.vendor || '',
      purchase_date: initialData?.purchase_date ? new Date(initialData.purchase_date) : undefined,
      cost: initialData?.cost || undefined,
      invoice_number: initialData?.invoice_number || '',
      notes: initialData?.notes || '',
      purchase_type: initialData?.purchase_type || (initialData?.asset_id ? "asset" : "product"), // Define o tipo com base na existência de asset_id ou initialData
    },
  });

  const { data: assets, isLoading: isLoadingAssets } = useQuery<Asset[]>({
    queryKey: ['allAssets'],
    queryFn: getAllAssets,
  });

  const createMutation = useMutation({
    mutationFn: createPurchase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      toast.success('Compra registrada com sucesso!');
      form.reset();
      onSuccess?.();
    },
    onError: (err) => {
      toast.error(`Erro ao registrar compra: ${err.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<NewPurchase> }) => updatePurchase(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      toast.success('Compra atualizada com sucesso!');
      onSuccess?.();
    },
    onError: (err) => {
      toast.error(`Erro ao atualizar compra: ${err.message}`);
    },
  });

  const onSubmit = (data: PurchaseFormValues) => {
    const purchaseData: NewPurchase = {
      ...data,
      purchase_date: data.purchase_date ? format(data.purchase_date, 'yyyy-MM-dd') : null,
      asset_id: data.purchase_type === "asset" ? data.asset_id : null, // Limpa asset_id se for produto
      product_name: data.purchase_type === "product" ? data.product_name : null, // Limpa product_name se for ativo
      quantity: data.purchase_type === "product" ? data.quantity : null, // Limpa quantity se for ativo
      purchase_type: data.purchase_type, // Garante que purchase_type seja incluído
    };

    if (initialData) {
      updateMutation.mutate({ id: initialData.id, data: purchaseData });
    } else {
      createMutation.mutate(purchaseData);
    }
  };

  const purchaseType = form.watch("purchase_type");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="purchase_type"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Tipo de Compra</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-3 space-y-0">
                    <RadioGroupItem value="product" id="product-type" />
                    <Label htmlFor="product-type" className="font-normal">
                      Produto (consumível, estoque)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 space-y-0">
                    <RadioGroupItem value="asset" id="asset-type" />
                    <Label htmlFor="asset-type" className="font-normal">
                      Ativo (equipamento, ferramenta)
                    </Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {purchaseType === "product" && (
          <>
            <FormField
              control={form.control}
              name="product_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Produto</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantidade</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} value={field.value === undefined || field.value === null ? '' : field.value} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {purchaseType === "asset" && (
          <FormField
            control={form.control}
            name="asset_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ativo Associado</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || ''}>
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
        )}

        <FormField
          control={form.control}
          name="vendor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fornecedor</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="purchase_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data da Compra</FormLabel>
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
                    disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
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
          name="invoice_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número da Nota Fiscal</FormLabel>
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
          {initialData ? (isSubmitting ? 'Salvando...' : 'Salvar Alterações') : (isSubmitting ? 'Registrando...' : 'Registrar Compra')}
        </Button>
      </form>
    </Form>
  );
};

export default PurchaseForm;