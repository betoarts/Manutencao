import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSettings, updateSettings, uploadLogo } from '@/integrations/supabase/settings';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Skeleton } from './ui/skeleton';

const LogoUploader = () => {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
  });

  const mutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Logo atualizado com sucesso!');
      setFile(null);
      setIsUploading(false);
    },
    onError: (err) => {
      toast.error(`Erro ao atualizar logo: ${err.message}`);
      setIsUploading(false);
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    try {
      const logo_url = await uploadLogo(file);
      mutation.mutate({ logo_url });
    } catch (error: any) {
      toast.error(`Erro no upload: ${error.message}`);
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium mb-2">Logo Atual</h4>
        {isLoading ? (
          <Skeleton className="h-20 w-40 rounded-md" />
        ) : settings?.logo_url ? (
          <img src={settings.logo_url} alt="Logo da empresa" className="h-20 bg-gray-100 p-2 rounded-md" />
        ) : (
          <p className="text-sm text-gray-500">Nenhum logo definido.</p>
        )}
      </div>
      <div className="flex items-center gap-4">
        <Input type="file" accept="image/*" onChange={handleFileChange} className="max-w-xs" />
        <Button onClick={handleUpload} disabled={!file || isUploading}>
          {isUploading ? 'Enviando...' : 'Salvar Logo'}
        </Button>
      </div>
    </div>
  );
};

export default LogoUploader;