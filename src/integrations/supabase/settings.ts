import { supabase } from './client';

export const getSettings = async () => {
  const { data, error } = await supabase
    .from('company_settings')
    .select('*')
    .single();
  
  if (error && error.code !== 'PGRST116') { // PGRST116: no rows found, which is ok on first load
    throw error;
  }
  return data;
};

export const updateSettings = async (settings: { logo_url?: string; company_name?: string; favicon_url?: string; notification_sound_url?: string }) => {
  const { data, error } = await supabase
    .from('company_settings')
    .update(settings)
    .eq('id', 1)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const uploadLogo = async (file: File) => {
  const filePath = `public/logo-${Date.now()}`;
  const { error: uploadError } = await supabase.storage
    .from('company_assets')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('company_assets')
    .getPublicUrl(filePath);
  
  return publicUrl;
};

export const uploadFavicon = async (file: File) => {
  const filePath = `public/favicon-${Date.now()}`;
  const { error: uploadError } = await supabase.storage
    .from('company_assets')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('company_assets')
    .getPublicUrl(filePath);
  
  return publicUrl;
};

export const uploadNotificationSound = async (file: File) => {
  const filePath = `public/notification-sound-${Date.now()}`;
  const { error: uploadError } = await supabase.storage
    .from('company_assets')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('company_assets')
    .getPublicUrl(filePath);
  
  return publicUrl;
};