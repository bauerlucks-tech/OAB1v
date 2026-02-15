import { Template, TemplateDB, DBField } from '../types/template';
import { supabase } from '../lib/supabase';

// Converter do app para o DB
const toDBFormat = (template: Template): TemplateDB => ({
  id: template.id,
  name: template.name,
  frontImageUrl: template.frontImageUrl,
  backImageUrl: template.backImageUrl,
  width: template.width,
  height: template.height,
  fields: template.fields.map(field => ({
    id: field.id,
    name: field.name,
    type: field.type,
    side: field.side,
    x: field.x,
    y: field.y,
    width: field.width,
    height: field.height,
    required: field.required,
    locked: field.locked
  })),
  created_at: template.createdAt || new Date().toISOString(),
  updated_at: template.updatedAt || new Date().toISOString()
});

// Converter do DB para o app
const fromDBFormat = (dbTemplate: TemplateDB): Template => ({
  id: dbTemplate.id,
  name: dbTemplate.name,
  frontImageUrl: dbTemplate.frontImageUrl,
  backImageUrl: dbTemplate.backImageUrl,
  width: dbTemplate.width,
  height: dbTemplate.height,
    fields: dbTemplate.fields.map((field: DBField) => ({
    id: field.id,
    name: field.name,
    type: field.type,
    side: field.side,
    x: field.x,
    y: field.y,
    width: field.width,
    height: field.height,
    required: field.required,
    locked: field.locked
  })),
  createdAt: dbTemplate.created_at,
  updatedAt: dbTemplate.updated_at
});

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

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      return [];
    }
    
    return data.map((dbTemplate: any) => fromDBFormat(dbTemplate));
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

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    
    if (!data) {
      throw new Error('Template não encontrado');
    }
    
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

// Excluir template
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
    console.error('Erro ao excluir template:', error);
    throw error;
  }
};
