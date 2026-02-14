// services/templateService.ts
import { Template, TemplateDB } from '../types/template';
import { supabase } from '../lib/supabase';

// Converter do formato do app para o DB - ESTRUTURA REAL
const toDBFormat = (template: Template) => ({
  name: template.name,
  frente_img: template.frontImage,
  verso_img: template.backImage,
  campos: template.frontFields.map(field => ({
    id: field.id,
    name: field.label,
    type: field.type === 'photo' ? 'foto' : 'texto',
    x: field.x,
    y: field.y,
    w: field.width,
    h: field.height
  })),
  data: {
    id: template.id,
    name: template.name,
    frenteImg: template.frontImage,
    versoImg: template.backImage,
    campos: template.frontFields.map(field => ({
      id: field.id,
      name: field.label,
      type: field.type === 'photo' ? 'foto' : 'texto',
      x: field.x,
      y: field.y,
      w: field.width,
      h: field.height
    })),
    versoCampos: template.backFields.map(field => ({
      id: field.id,
      name: field.label,
      type: field.type === 'photo' ? 'foto' : 'texto',
      x: field.x,
      y: field.y,
      w: field.width,
      h: field.height
    }))
  }
});

// Tipo parcial para listagem otimizada (sem campo data)
interface TemplateDBList {
  id: string;
  name: string;
  frente_img: string | null;
  verso_img: string | null;
  campos: Array<{
    id: string;
    name: string;
    type: 'texto' | 'foto';
    x: number;
    y: number;
    w: number;
    h: number;
  }>;
  created_at: string;
  updated_at: string;
}

// Converter do DB para o formato do app - ESTRUTURA REAL
const fromDBFormat = (dbTemplate: TemplateDB): Template => ({
  id: dbTemplate.id,
  name: dbTemplate.name,
  frontImage: dbTemplate.frente_img || dbTemplate.data?.frenteImg || '',
  backImage: dbTemplate.verso_img || dbTemplate.data?.versoImg || null,
  frontFields: (dbTemplate.campos || dbTemplate.data?.campos || []).map(field => ({
    id: field.id,
    type: field.type === 'foto' ? 'photo' : 'text',
    x: field.x,
    y: field.y,
    width: field.w,
    height: field.h,
    label: field.name
  })),
  backFields: (dbTemplate.data?.versoCampos || []).map(field => ({
    id: field.id,
    type: field.type === 'foto' ? 'photo' : 'text',
    x: field.x,
    y: field.y,
    width: field.w,
    height: field.h,
    label: field.name
  })),
  createdAt: new Date(dbTemplate.created_at),
  updatedAt: new Date(dbTemplate.updated_at)
});

// Converter da listagem para o formato do app (sem versoCampos)
const fromDBListFormat = (dbTemplate: TemplateDBList): Template => ({
  id: dbTemplate.id,
  name: dbTemplate.name,
  frontImage: dbTemplate.frente_img || '',
  backImage: dbTemplate.verso_img || null,
  frontFields: (dbTemplate.campos || []).map(field => ({
    id: field.id,
    type: field.type === 'foto' ? 'photo' : 'text',
    x: field.x,
    y: field.y,
    width: field.w,
    height: field.h,
    label: field.name
  })),
  backFields: [], // Sem versoCampos na listagem
  createdAt: new Date(dbTemplate.created_at),
  updatedAt: new Date(dbTemplate.updated_at)
});

// Buscar todos os templates (listagem otimizada)
export const getAllTemplates = async (): Promise<Template[]> => {
  if (!supabase) {
    throw new Error('supabase - Supabase client is not configured');
  }
  
  try {
    const { data, error } = await supabase
      .from('templates')
      .select('id, name, frente_img, verso_img, campos, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map((dbTemplate: TemplateDBList) => fromDBListFormat(dbTemplate));
  } catch (error) {
    console.error('Erro ao buscar templates:', error);
    throw error;
  }
};

// Buscar template completo com dados do verso (para edição)
export const getTemplateById = async (id: string): Promise<Template> => {
  if (!supabase) {
    throw new Error('supabase - Supabase client is not configured');
  }
  
  try {
    const { data, error } = await supabase
      .from('templates')
      .select('id, name, frente_img, verso_img, campos, data, created_at, updated_at')
      .eq('id', id)
      .single();

    if (error) throw error;
    return fromDBFormat(data);
  } catch (error) {
    console.error('Erro ao buscar template:', error);
    throw error;
  }
};

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

// Salvar carteirinha gerada
export const saveCard = async (
  templateId: string,
  templateName: string,
  frenteUrl: string,
  versoUrl: string | null,
  dados: any,
  fotos: any
): Promise<string> => {
  if (!supabase) {
    throw new Error('supabase - Supabase client is not configured');
  }

  try {
    // Gerar um nome para a carteirinha baseado no template e data
    const cardName = `${templateName} - ${new Date().toLocaleDateString('pt-BR')}`;
    
    const { data, error } = await supabase
      .from('carteirinhas')
      .insert({
        nome: cardName, // Campo obrigatório
        template_id: templateId,
        template_name: templateName,
        dados: dados,
        fotos: fotos,
        frente_url: frenteUrl,
        verso_url: versoUrl
      })
      .select()
      .single();

    if (error) throw error;
    return data.id;
  } catch (error) {
    console.error('Erro ao salvar carteirinha:', error);
    throw error;
  }
};

// Buscar carteirinhas por template
export const getCardsByTemplate = async (templateId: string): Promise<any[]> => {
  if (!supabase) {
    throw new Error('supabase - Supabase client is not configured');
  }

  try {
    const { data, error } = await supabase
      .from('carteirinhas')
      .select('*')
      .eq('template_id', templateId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro ao buscar carteirinhas:', error);
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
