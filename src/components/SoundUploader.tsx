import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSettings, updateSettings, uploadNotificationSound } from '@/integrations/supabase/settings';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Skeleton } from './ui/skeleton';
import { Volume2, FileAudio } from 'lucide-react';

const SoundUploader = () => {
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
      toast.success('Som de notificação atualizado com sucesso!');
      setFile(null);
      setIsUploading(false);
    },
    onError: (err) => {
      toast.error(`Erro ao atualizar som de notificação: ${err.message}`);
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
      const notification_sound_url = await uploadNotificationSound(file);
      mutation.mutate({ notification_sound_url });
    } catch (error: any) {
      toast.error(`Erro no upload: ${error.message}`);
      setIsUploading(false);
    }
  };

  const handlePlaySound = () => {
    if (settings?.notification_sound_url) {
      try {
        const audio = new Audio(settings.notification_sound_url);
        audio.play().catch(e => toast.error("Falha ao tocar o som: " + e.message));
      } catch (e: any) {
        toast.error("Erro ao criar objeto de áudio: " + e.message);
      }
    } else {
      toast.info("Nenhum som personalizado para tocar.");
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium mb-2">Som de Notificação Atual</h4>
        {isLoading ? (
          <Skeleton className="h-10 w-40 rounded-md" />
        ) : settings?.notification_sound_url ? (
          <div className="flex items-center gap-2">
            <FileAudio className="h-6 w-6 text-gray-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[200px]">
              {settings.notification_sound_url.split('/').pop()}
            </span>
            <Button variant="outline" size="sm" onClick={handlePlaySound}>
              <Volume2 className="h-4 w-4 mr-2" /> Testar
            </Button>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Nenhum som personalizado definido.</p>
        )}
      </div>
      <div className="flex items-center gap-4">
        <Input type="file" accept="audio/*" onChange={handleFileChange} className="max-w-xs" />
        <Button onClick={handleUpload} disabled={!file || isUploading}>
          {isUploading ? 'Enviando...' : 'Salvar Som'}
        </Button>
      </div>
    </div>
  );
};

export default SoundUploader;