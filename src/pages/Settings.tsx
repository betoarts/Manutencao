import { useState } from 'react';
import Layout from '@/components/Layout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProfile, updateProfile } from '@/integrations/supabase/profiles';
import { getPublicFormFields, createPublicFormField, getMaintenanceRequests, type FormFieldData } from '@/integrations/supabase/publicForm';
import ProfileForm from '@/components/ProfileForm';
import CustomFieldForm from '@/components/CustomFieldForm';
import LogoUploader from '@/components/LogoUploader';
import FaviconUploader from '@/components/FaviconUploader';
import SoundUploader from '@/components/SoundUploader'; // Importação adicionada
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlusCircle } from 'lucide-react';
import { format } from 'date-fns';

const Settings = () => {
  const queryClient = useQueryClient();
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);

  // Profile
  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  });
  const updateProfileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Perfil atualizado com sucesso!');
    },
    onError: (err) => toast.error(`Erro ao atualizar perfil: ${err.message}`),
  });

  // Public Form Fields
  const { data: formFields, isLoading: isLoadingFields } = useQuery({
    queryKey: ['publicFormFields'],
    queryFn: getPublicFormFields,
  });
  const createFieldMutation = useMutation<any, Error, FormFieldData>({
    mutationFn: createPublicFormField,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publicFormFields'] });
      toast.success('Campo customizado criado com sucesso!');
      setIsFieldModalOpen(false);
    },
    onError: (err) => toast.error(`Erro ao criar campo: ${err.message}`),
  });

  // Maintenance Requests
  const { data: requests, isLoading: isLoadingRequests } = useQuery({
    queryKey: ['maintenanceRequests'],
    queryFn: getMaintenanceRequests,
  });

  return (
    <Layout>
      <div className="container mx-auto py-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Configurações</h2>
        
        <Tabs defaultValue="profile">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Perfil</TabsTrigger>
            <TabsTrigger value="branding">Identidade Visual</TabsTrigger>
            <TabsTrigger value="public-form">Formulário Público & Chamados</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Perfil do Usuário</CardTitle>
                <CardDescription>Atualize suas informações pessoais aqui.</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingProfile ? <p>Carregando...</p> : profile && (
                  <ProfileForm
                    initialData={{ first_name: profile.first_name || '', last_name: profile.last_name || '' }}
                    onSubmit={(data) => updateProfileMutation.mutate(data)}
                    isSubmitting={updateProfileMutation.isPending}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="branding">
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Identidade Visual</CardTitle>
                <CardDescription>Personalize a aparência do sistema com o logo, favicon e som de notificação da sua empresa.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <LogoUploader />
                <FaviconUploader />
                <SoundUploader /> {/* Novo componente de upload de som */}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="public-form">
            <Card className="mt-4">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Campos Customizados</CardTitle>
                    <CardDescription>Adicione campos ao formulário público de abertura de chamados.</CardDescription>
                  </div>
                  <Dialog open={isFieldModalOpen} onOpenChange={setIsFieldModalOpen}>
                    <DialogTrigger asChild>
                      <Button><PlusCircle className="mr-2 h-4 w-4" /> Adicionar Campo</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Novo Campo Customizado</DialogTitle></DialogHeader>
                      <CustomFieldForm onSubmit={(data: FormFieldData) => createFieldMutation.mutate(data)} isSubmitting={createFieldMutation.isPending} />
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingFields ? <p>Carregando...</p> : (
                  <Table>
                    <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Tipo</TableHead><TableHead>Obrigatório</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {formFields?.map(field => (
                        <TableRow key={field.id}>
                          <TableCell>{field.field_label}</TableCell>
                          <TableCell>{field.field_type === 'text' ? 'Texto Curto' : 'Texto Longo'}</TableCell>
                          <TableCell>{field.is_required ? 'Sim' : 'Não'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Chamados Recebidos</CardTitle>
                <CardDescription>Lista de chamados de manutenção abertos pelo formulário público.</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingRequests ? <p>Carregando...</p> : (
                  <Table>
                    <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Solicitante</TableHead><TableHead>Descrição</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {requests?.map(req => (
                        <TableRow key={req.id}>
                          <TableCell>{format(new Date(req.created_at), 'dd/MM/yyyy HH:mm')}</TableCell>
                          <TableCell>{req.requester_name}</TableCell>
                          <TableCell className="max-w-xs truncate">{req.description}</TableCell>
                          <TableCell><Badge>{req.status}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Settings;