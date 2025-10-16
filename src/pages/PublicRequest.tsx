import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getPublicFormFields, createMaintenanceRequest, getMaintenanceRequestsByEmail } from '@/integrations/supabase/publicForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { MadeWithDyad } from '@/components/made-with-dyad';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'; // Importado para exibir resultados
import { Badge } from '@/components/ui/badge'; // Importado para exibir status
import { format } from 'date-fns'; // Importado para formatar datas
import { MaintenanceRequest } from '@/integrations/supabase/maintenance_requests'; // Importado o tipo

const PublicRequest = () => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm();
  
  const { data: formFields, isLoading: isLoadingFields } = useQuery({
    queryKey: ['publicFormFields'],
    queryFn: getPublicFormFields,
  });

  const createRequestMutation = useMutation({
    mutationFn: createMaintenanceRequest,
    onSuccess: () => {
      toast.success('Chamado aberto com sucesso! Entraremos em contato em breve.');
      reset();
    },
    onError: (err) => {
      toast.error(`Erro ao abrir chamado: ${err.message}`);
    },
  });

  const onSubmit = (data: any) => {
    const custom_data: Record<string, any> = {};
    const standard_data: any = {};

    Object.keys(data).forEach(key => {
      if (['requester_name', 'requester_email', 'requester_phone', 'description'].includes(key)) {
        standard_data[key] = data[key];
      } else {
        custom_data[key] = data[key];
      }
    });

    createRequestMutation.mutate({ ...standard_data, custom_data });
  };

  // Estados para a consulta de chamados
  const [searchEmail, setSearchEmail] = useState('');
  const [foundRequests, setFoundRequests] = useState<MaintenanceRequest[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSearchRequests = async () => {
    setIsSearching(true);
    setSearchError(null);
    setFoundRequests(null);
    try {
      if (!searchEmail) {
        setSearchError('Por favor, digite um e-mail para consultar.');
        return;
      }
      const data = await getMaintenanceRequestsByEmail(searchEmail);
      setFoundRequests(data);
      if (data.length === 0) {
        toast.info('Nenhum chamado encontrado para este e-mail.');
      }
    } catch (err: any) {
      setSearchError(err.message);
      toast.error(`Erro ao buscar chamados: ${err.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-2xl mb-8">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Abrir Chamado de Manutenção</CardTitle>
          <CardDescription className="text-center">
            Preencha o formulário abaixo para solicitar um serviço de manutenção.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingFields ? <p>Carregando formulário...</p> : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="requester_name">Seu Nome Completo</Label>
                <Input id="requester_name" {...register('requester_name', { required: 'O nome é obrigatório.' })} />
                {errors.requester_name && <p className="text-red-500 text-sm mt-1">{errors.requester_name.message as string}</p>}
              </div>
              <div>
                <Label htmlFor="requester_email">Seu E-mail</Label>
                <Input id="requester_email" type="email" {...register('requester_email')} />
              </div>
              <div>
                <Label htmlFor="requester_phone">Seu Telefone</Label>
                <Input id="requester_phone" {...register('requester_phone')} />
              </div>
              <div>
                <Label htmlFor="description">Descrição do Problema</Label>
                <Textarea id="description" {...register('description', { required: 'A descrição é obrigatória.' })} />
                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message as string}</p>}
              </div>

              {formFields?.map(field => (
                <div key={field.id}>
                  <Label htmlFor={field.field_label}>{field.field_label}</Label>
                  {field.field_type === 'textarea' ? (
                    <Textarea id={field.field_label} {...register(field.field_label, { required: field.is_required ? 'Este campo é obrigatório.' : false })} />
                  ) : (
                    <Input id={field.field_label} {...register(field.field_label, { required: field.is_required ? 'Este campo é obrigatório.' : false })} />
                  )}
                  {errors[field.field_label] && <p className="text-red-500 text-sm mt-1">{errors[field.field_label]!.message as string}</p>}
                </div>
              ))}

              <Button type="submit" className="w-full" disabled={createRequestMutation.isPending}>
                {createRequestMutation.isPending ? 'Enviando...' : 'Enviar Solicitação'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Nova seção para consultar chamados */}
      <Card className="w-full max-w-2xl mt-8">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Consultar Status do Chamado</CardTitle>
          <CardDescription className="text-center">
            Digite seu e-mail para ver o status dos seus chamados de manutenção.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="search_email">Seu E-mail</Label>
              <Input
                id="search_email"
                type="email"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
              />
            </div>
            <Button onClick={handleSearchRequests} className="w-full" disabled={isSearching || !searchEmail}>
              {isSearching ? 'Buscando...' : 'Consultar Chamados'}
            </Button>

            {searchError && (
              <p className="text-red-500 text-sm mt-2">{searchError}</p>
            )}

            {foundRequests && foundRequests.length > 0 && (
              <div className="mt-4 space-y-4">
                <h3 className="text-lg font-semibold">Seus Chamados:</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Técnico</TableHead>
                      <TableHead>Aberto em</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {foundRequests.map((req) => (
                      <TableRow key={req.id}>
                        <TableCell className="max-w-[200px] truncate">{req.description}</TableCell>
                        <TableCell><Badge>{req.status}</Badge></TableCell>
                        <TableCell>{req.technician_name || 'Não atribuído'}</TableCell>
                        <TableCell>{format(new Date(req.created_at), 'dd/MM/yyyy')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            {foundRequests && foundRequests.length === 0 && !isSearching && (
              <p className="text-center text-gray-500 mt-4">Nenhum chamado encontrado para este e-mail.</p>
            )}
          </div>
        </CardContent>
      </Card>
      <MadeWithDyad />
    </div>
  );
};

export default PublicRequest;