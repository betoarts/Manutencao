import { getSettings } from '@/integrations/supabase/settings'; // Importar a função para obter configurações

export const playNotificationSound = async () => {
  try {
    const settings = await getSettings();
    let audioUrl = '/sounds/shopee_sound.mp3'; // Som padrão

    if (settings?.notification_sound_url) {
      audioUrl = settings.notification_sound_url;
    }

    const audio = new Audio(audioUrl);
    audio.play().catch(e => console.warn("Falha ao tocar som de notificação:", e));
  } catch (e) {
    console.error("Erro ao criar objeto de áudio ou buscar configurações:", e);
    // Em caso de erro ao buscar configurações ou criar áudio, tenta tocar o som padrão
    try {
      const audio = new Audio('/sounds/shopee_sound.mp3');
      audio.play().catch(e => console.warn("Falha ao tocar som de notificação padrão:", e));
    } catch (e) {
      console.error("Erro ao criar objeto de áudio padrão:", e);
    }
  }
};