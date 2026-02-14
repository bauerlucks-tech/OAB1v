import { supabase } from '../lib/supabase';

export const uploadTemplateImage = async (templateId: string, file: File, side: 'front' | 'back'): Promise<string> => {
  if (!supabase) {
    throw new Error('Supabase client is not configured');
  }

  const fileName = `${side}.png`;
  const filePath = `templates/${templateId}/${fileName}`;

  try {
    const { error } = await supabase.storage
      .from('templates')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('templates')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Erro ao fazer upload da imagem:', error);
    throw error;
  }
};

export const deleteTemplateImage = async (templateId: string, side: 'front' | 'back'): Promise<void> => {
  if (!supabase) {
    throw new Error('Supabase client is not configured');
  }

  const fileName = `${side}.png`;
  const filePath = `templates/${templateId}/${fileName}`;

  try {
    const { error } = await supabase.storage
      .from('templates')
      .remove([filePath]);

    if (error) throw error;
  } catch (error) {
    console.error('Erro ao excluir imagem:', error);
    throw error;
  }
};
