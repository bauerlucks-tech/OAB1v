import { Template, TemplateField, DBField } from '../types/template';
import { supabase } from '../lib/supabase';

// Converter do app para o DB
export const toDBFormat = (template: Template) => ({
  id: template.id,
  name: template.name,
  frontImageUrl: template.frontImageUrl,
  backImageUrl: template.backImageUrl,
  width: template.width,
  height: template.height,
  fields: template.fields.map((field: TemplateField): DBField => ({
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
const fromDBFormat = (dbTemplate: any): Template => {
  // Mapear campos reais do Supabase para a interface Template
  const fields = dbTemplate.fields || dbTemplate.campos || [];
  
  return {
    id: dbTemplate.id,
    name: dbTemplate.name,
    frontImageUrl: dbTemplate.frontImageUrl || dbTemplate.frente_img,
    backImageUrl: dbTemplate.backImageUrl || dbTemplate.verso_img,
    width: dbTemplate.width,
    height: dbTemplate.height,
    fields: Array.isArray(fields) ? fields.map((field: any): TemplateField => ({
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
    })) : [],
    createdAt: dbTemplate.created_at,
    updatedAt: dbTemplate.updated_at
  };
};

// Buscar todos os templates
export const getAllTemplates = async (): Promise<Template[]> => {
  if (!supabase) {
    throw new Error('Supabase client is not configured');
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
    throw new Error('Supabase client is not configured');
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
    throw new Error('Supabase client is not configured');
  }
  
  try {
    const dbTemplate = toDBFormat(template);
    const { data, error } = await supabase
      .from('templates')
      .insert(dbTemplate)
      .select()
      .single();

    if (error) {
      console.error('Erro ao salvar template:', error);
      throw error;
    }
    
    return fromDBFormat(data);
  } catch (error) {
    console.error('Erro ao salvar template:', error);
    throw error;
  }
};

// Atualizar template
export const updateTemplate = async (id: string, template: Partial<Template>): Promise<Template> => {
  if (!supabase) {
    throw new Error('Supabase client is not configured');
  }
  
  try {
    const { data, error } = await supabase
      .from('templates')
      .update({
        ...toDBFormat(template as Template),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar template:', error);
      throw error;
    }
    
    return fromDBFormat(data);
  } catch (error) {
    console.error('Erro ao atualizar template:', error);
    throw error;
  }
};

// Deletar template
export const deleteTemplate = async (id: string): Promise<void> => {
  if (!supabase) {
    throw new Error('Supabase client is not configured');
  }
  
  try {
    const { error } = await supabase
      .from('templates')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar template:', error);
      throw error;
    }
  } catch (error) {
    console.error('Erro ao deletar template:', error);
    throw error;
  }
};
