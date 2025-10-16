import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSettings, updateSettings, uploadFavicon } from '@/integrations/supabase/settings';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Skeleton } from './ui/skeleton';

const FaviconUploader = () => {
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
      toast.success('Favicon atualizado com sucesso!');
      setFile(null);
      setIsUploading(false);
    },
    onError: (err) => {
      toast.error(`Erro ao atualizar favicon: ${err.message}`);
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
      const favicon_url = await uploadFavicon(file);
      mutation.mutate({ favicon_url });
    } catch (error: any) {
      toast.error(`Erro no upload: ${error.message}`);
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium mb-2">Favicon Atual</h4>
        {isLoading ? (
          <Skeleton className="h-8 w-8 rounded-full" />
        ) : settings?.favicon_url ? (
          <img src={settings.favicon_url} alt="Favicon da empresa" className="h-8 w-8 rounded-full bg-gray-100 p-1" />
        ) : (
          <p className="text-sm text-gray-500">Nenhum favicon definido.</p>
        )}
      </div>
      <div className="flex items-center gap-4">
        <Input type="file" accept="image/*" onChange={handleFileChange} className="max-w-xs" />
        <Button onClick={handleUpload} disabled={!file || isUploading}>
          {isUploading ? 'Enviando...' : 'Salvar Favicon'}
        </Button>
      </div>
    </div>
  );
};

export default FaviconUploader;