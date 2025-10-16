import { useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label'; // Importando o componente Label
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createDepartment, getDepartments, updateDepartment, deleteDepartment } from '@/integrations/supabase/departments';
import { getProfiles, updateProfileDepartment, updateUserRole, getProfile } from '@/integrations/supabase/profiles';
import { inviteUser } from '@/integrations/supabase/users';
import DepartmentForm from '@/components/DepartmentForm';
import UserInviteForm from '@/components/UserInviteForm';
import { toast } from 'sonner';
import { Pencil, Trash2, PlusCircle, UserPlus } from 'lucide-react';

interface Department {
  id: string;
  name: string;
  description?: string;
}

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  role: string; // Adicionando a role
  department_id: string | null;
  department_name: string | null;
}

const DepartmentsUsers = () => {
  const queryClient = useQueryClient();
  const [departmentModalOpen, setDepartmentModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  // Queries
  const { data: currentUserProfile } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  });
  const isAdmin = currentUserProfile?.role === 'admin';

  const { data: departments, isLoading: isLoadingDepts } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: getDepartments,
  });
  const { data: profiles, isLoading: isLoadingProfiles } = useQuery<Profile[]>({
    queryKey: ['profiles'],
    queryFn: getProfiles,
  });

  // Department Mutations
  const createDeptMutation = useMutation({
    mutationFn: createDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Departamento criado com sucesso!');
      setDepartmentModalOpen(false);
    },
    onError: (err) => toast.error(`Erro: ${err.message}`),
  });

  const updateDeptMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateDepartment>[1] }) => updateDepartment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Departamento atualizado com sucesso!');
      setDepartmentModalOpen(false);
      setEditingDepartment(null);
    },
    onError: (err) => toast.error(`Erro: ${err.message}`),
  });

  const deleteDeptMutation = useMutation({
    mutationFn: deleteDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Departamento excluído com sucesso!');
    },
    onError: (err) => toast.error(`Erro: ${err.message}`),
  });

  // Profile Mutations
  const updateProfileDeptMutation = useMutation({
    mutationFn: ({ profileId, departmentId }: { profileId: string; departmentId: string | null }) => updateProfileDepartment(profileId, departmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast.success('Departamento do usuário atualizado!');
      setEditingProfile(null);
    },
    onError: (err) => toast.error(`Erro: ${err.message}`),
  });

  const updateUserRoleMutation = useMutation({
    mutationFn: ({ userId, newRole }: { userId: string; newRole: string }) => updateUserRole(userId, newRole),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast.success('Role do usuário atualizada com sucesso!');
      setEditingProfile(null);
    },
    onError: (err) => toast.error(`Erro ao atualizar role: ${err.message}`),
  });

  // User Invite Mutation
  const inviteUserMutation = useMutation({
    mutationFn: inviteUser,
    onSuccess: () => {
      toast.success('Convite enviado com sucesso!');
      setInviteModalOpen(false);
    },
    onError: (err) => toast.error(`Erro ao enviar convite: ${err.message}`),
  });

  // Handlers
  const handleDepartmentSubmit = (data: any) => {
    if (editingDepartment) {
      updateDeptMutation.mutate({ id: editingDepartment.id, data });
    } else {
      createDeptMutation.mutate(data);
    }
  };

  const handleDeleteDepartment = (id: string) => {
    if (window.confirm('Tem certeza? A exclusão de um departamento desassociará todos os usuários vinculados a ele.')) {
      deleteDeptMutation.mutate(id);
    }
  };

  const handleProfileSave = () => {
    if (!editingProfile) return;

    const updates: Promise<any>[] = [];

    // Update department if changed
    if (selectedDepartment !== undefined && selectedDepartment !== editingProfile.department_id) {
      updates.push(updateProfileDeptMutation.mutateAsync({ profileId: editingProfile.id, departmentId: selectedDepartment }));
    }

    // Update role if changed and current user is admin
    if (isAdmin && selectedRole !== undefined && selectedRole !== editingProfile.role) {
      // Ensure selectedRole is a string before passing it
      if (selectedRole) {
        updates.push(updateUserRoleMutation.mutateAsync({ userId: editingProfile.id, newRole: selectedRole }));
      }
    }

    Promise.all(updates)
      .then(() => {
        toast.success('Perfil do usuário atualizado com sucesso!');
        setEditingProfile(null);
      })
      .catch((err) => {
        toast.error(`Erro ao salvar perfil: ${err.message}`);
      });
  };

  const handleInviteSubmit = (data: { email: string }) => {
    inviteUserMutation.mutate(data.email);
  };

  return (
    <Layout>
      <div className="container mx-auto py-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Departamentos & Usuários</h2>
        <Tabs defaultValue="departments">
          <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
            <TabsTrigger value="departments">Departamentos</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
          </TabsList>
          
          <TabsContent value="departments">
            <div className="flex justify-end mb-4">
              <Button onClick={() => { setEditingDepartment(null); setDepartmentModalOpen(true); }}>
                <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Departamento
              </Button>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              {isLoadingDepts ? <p>Carregando...</p> : (
                <div className="overflow-x-auto"> {/* Adicionado overflow-x-auto */}
                  <Table className="min-w-full"> {/* Adicionado min-w-full */}
                    <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Descrição</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {departments?.map((dept) => (
                        <TableRow key={dept.id}>
                          <TableCell className="font-medium">{dept.name}</TableCell>
                          <TableCell>{dept.description || 'N/A'}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => { setEditingDepartment(dept); setDepartmentModalOpen(true); }} className="mr-2"><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteDepartment(dept.id)} className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="users">
            <div className="flex justify-end mb-4">
              <Button onClick={() => setInviteModalOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" /> Convidar Usuário
              </Button>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mt-4">
              {isLoadingProfiles ? <p>Carregando...</p> : (
                <div className="overflow-x-auto"> {/* Adicionado overflow-x-auto */}
                  <Table className="min-w-full"> {/* Adicionado min-w-full */}
                    <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Departamento</TableHead><TableHead>Role</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {profiles?.map((profile) => (
                        <TableRow key={profile.id}>
                          <TableCell className="font-medium">{profile.first_name || 'Usuário'} {profile.last_name || ''}</TableCell>
                          <TableCell>{profile.department_name || 'Sem departamento'}</TableCell>
                          <TableCell>{profile.role}</TableCell> {/* Exibindo a role */}
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => { setEditingProfile(profile); setSelectedDepartment(profile.department_id); setSelectedRole(profile.role); }}><Pencil className="h-4 w-4" /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={departmentModalOpen} onOpenChange={setDepartmentModalOpen}>
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingDepartment ? 'Editar Departamento' : 'Novo Departamento'}</DialogTitle></DialogHeader>
          <DepartmentForm
            initialData={editingDepartment || undefined}
            onSubmit={handleDepartmentSubmit}
            isSubmitting={createDeptMutation.isPending || updateDeptMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Convidar Novo Usuário</DialogTitle></DialogHeader>
          <UserInviteForm onSubmit={handleInviteSubmit} isSubmitting={inviteUserMutation.isPending} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingProfile} onOpenChange={(isOpen) => !isOpen && setEditingProfile(null)}>
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar Perfil do Usuário</DialogTitle></DialogHeader>
          <div className="py-4 space-y-4">
            <p className="font-medium">{editingProfile?.first_name || 'Usuário'} {editingProfile?.last_name || ''}</p>
            
            <div>
              <Label htmlFor="department-select">Departamento</Label>
              <Select onValueChange={setSelectedDepartment} defaultValue={selectedDepartment || ''}>
                <SelectTrigger id="department-select"><SelectValue placeholder="Selecione um departamento" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">Sem Departamento</SelectItem>
                  {departments?.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {isAdmin && ( // Apenas administradores podem ver e alterar a role
              <div>
                <Label htmlFor="role-select">Role</Label>
                <Select onValueChange={setSelectedRole} defaultValue={selectedRole || ''}>
                  <SelectTrigger id="role-select"><SelectValue placeholder="Selecione uma role" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button 
              onClick={handleProfileSave} 
              disabled={updateProfileDeptMutation.isPending || updateUserRoleMutation.isPending}
            >
              {updateProfileDeptMutation.isPending || updateUserRoleMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default DepartmentsUsers;