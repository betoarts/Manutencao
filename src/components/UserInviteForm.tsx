import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const inviteFormSchema = z.object({
  email: z.string().email({ message: 'Por favor, insira um e-mail válido.' }),
});

type InviteFormValues = z.infer<typeof inviteFormSchema>;

interface UserInviteFormProps {
  onSubmit: (data: InviteFormValues) => void;
  isSubmitting: boolean;
}

const UserInviteForm: React.FC<UserInviteFormProps> = ({ onSubmit, isSubmitting }) => {
  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: { email: '' },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail do Usuário</FormLabel>
              <FormControl>
                <Input type="email" placeholder="nome@empresa.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Enviando convite...' : 'Convidar Usuário'}
        </Button>
      </form>
    </Form>
  );
};

export default UserInviteForm;