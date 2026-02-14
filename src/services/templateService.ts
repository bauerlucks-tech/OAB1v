// services/templateService.ts
import { createClient } from '@supabase/supabase-js';
import type { Template, TemplateDB } from '../types/template';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validar se as credenciais estão configuradas
if (!supabaseUrl || !supabaseKey) {
  console.warn('Credenciais do Supabase não configuradas. Usando modo demo.');
}

export const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Converter do formato do app para o DB
const toDBFormat = (template: Template): Omit<TemplateDB, 'id' | 'created_at' | 'updated_at'> => ({
  name: template.name,
  front_image: template.frontImage,
  back_image: template.backImage,
  front_fields: template.frontFields,
  back_fields: template.backFields
});

// Converter do DB para o formato do app
const fromDBFormat = (dbTemplate: TemplateDB): Template => ({
  id: dbTemplate.id,
  name: dbTemplate.name,
  frontImage: dbTemplate.front_image,
  backImage: dbTemplate.back_image,
  frontFields: dbTemplate.front_fields,
  backFields: dbTemplate.back_fields,
  createdAt: new Date(dbTemplate.created_at),
  updatedAt: new Date(dbTemplate.updated_at)
});

// Salvar template
export const saveTemplate = async (template: Template): Promise<Template> => {
  if (!supabase) {
    throw new Error('supabase - Supabase client is not configured');
  }
  
  try {
    const { data, error } = await supabase
      .from('templates')
      .upsert(toDBFormat(template))
      .select()
      .single();

    if (error) throw error;
    return fromDBFormat(data);
  } catch (error) {
    console.error('Erro ao salvar template:', error);
    throw error;
  }
};

// Buscar todos os templates
export const getAllTemplates = async (): Promise<Template[]> => {
  if (!supabase) {
    throw new Error('supabase - Supabase client is not configured');
  }
  
  try {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(fromDBFormat);
  } catch (error) {
    console.error('Erro ao buscar templates:', error);
    throw error;
  }
};

// Buscar template por ID
export const getTemplateById = async (id: string): Promise<Template> => {
  if (!supabase) {
    throw new Error('supabase - Supabase client is not configured');
  }
  
  try {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return fromDBFormat(data);
  } catch (error) {
    console.error('Erro ao buscar template:', error);
    throw error;
  }
};

// Deletar template
export const deleteTemplate = async (id: string): Promise<void> => {
  if (!supabase) {
    throw new Error('supabase - Supabase client is not configured');
  }
  
  try {
    const { error } = await supabase
      .from('templates')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Erro ao deletar template:', error);
    throw error;
  }
};

// Upload de imagem para o Supabase Storage
export const uploadTemplateImage = async (
  file: File,
  templateId: string,
  side: 'front' | 'back'
): Promise<string> => {
  if (!supabase) {
    throw new Error('supabase - Supabase client is not configured');
  }
  
  try {
    const fileName = `${templateId}-${side}-${Date.now()}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage
      .from('template-images')
      .upload(fileName, file);

    if (error) throw error;

    // Obter URL pública
    const { data: publicUrlData } = supabase.storage
      .from('template-images')
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Erro ao fazer upload da imagem:', error);
    throw error;
  }
};

// SQL para criar a tabela no Supabase (executar no SQL Editor):
/*
CREATE TABLE templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  front_image TEXT NOT NULL,
  back_image TEXT,
  front_fields JSONB NOT NULL DEFAULT '[]',
  back_fields JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Índices para melhor performance
CREATE INDEX idx_templates_created_at ON templates(created_at DESC);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_templates_updated_at 
  BEFORE UPDATE ON templates 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Criar bucket para imagens (executar via Dashboard ou API)
-- Ir em Storage > Create bucket > nome: "template-images" > public: true
*/
