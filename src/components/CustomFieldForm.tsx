import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

const fieldFormSchema = z.object({
  field_label: z.string().min(3, { message: 'O nome do campo deve ter pelo menos 3 caracteres.' }),
  field_type: z.enum(['text', 'textarea']),
  is_required: z.boolean().default(false),
});

type FieldFormValues = z.infer<typeof fieldFormSchema>;

interface CustomFieldFormProps {
  onSubmit: (data: FieldFormValues) => void;
  isSubmitting: boolean;
}

const CustomFieldForm: React.FC<CustomFieldFormProps> = ({ onSubmit, isSubmitting }) => {
  const form = useForm<FieldFormValues>({
    resolver: zodResolver(fieldFormSchema),
    defaultValues: {
      field_label: '',
      field_type: 'text',
      is_required: false,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="field_label"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Campo</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Localização, Número do Patrimônio" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="field_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo do Campo</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="text">Texto Curto</SelectItem>
                  <SelectItem value="textarea">Texto Longo</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="is_required"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Obrigatório?</FormLabel>
              </div>
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : 'Salvar Campo'}
        </Button>
      </form>
    </Form>
  );
};

export default CustomFieldForm;