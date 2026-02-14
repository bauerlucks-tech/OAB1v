import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase via variáveis de ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY devem estar configurados no arquivo .env')
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseKey || ''
)

// Tipos para o banco de dados (LEGADO - manter para compatibilidade)
export interface SupabaseTemplateDB {
  id: string
  name: string
  data: Record<string, unknown> // TemplateData completo
  frente_img: string // Base64 da imagem
  verso_img: string // Base64 da imagem
  campos: Record<string, unknown> // Campos com configurações completas
  created_at: string
  updated_at: string
}

export interface CarteirinhaDB {
  id: string
  nome: string
  template_id: string
  template_name: string
  dados: Record<string, unknown> // Dados preenchidos
  fotos: string[] // Fotos em base64
  frente_url: string // Imagem gerada
  verso_url: string // Imagem gerada
  created_at: string
  updated_at: string
  emitida_em: string
}

// Tipos para as funções
interface TemplateInput {
  name: string;
  [key: string]: unknown;
}

interface CarteirinhaInput {
  nome: string;
  templateId?: string;
  templateName?: string;
  dados?: Record<string, unknown>;
  fotos?: string[];
  frenteUrl?: string;
  versoUrl?: string;
  emitidaEm?: string;
  [key: string]: unknown;
}

// Funções de Templates
export const salvarTemplateSupabase = async (
  template: TemplateInput,
  frenteImg: string,
  versoImg: string,
  campos: Record<string, unknown>[]
) => {
  try {
    const { data, error } = await supabase
      .from('templates')
      .insert({
        name: template.name,
        data: template,
        frente_img: frenteImg,
        verso_img: versoImg,
        campos: campos,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao salvar template:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Erro na conexão com Supabase:', error)
    throw error
  }
}

export const carregarTemplatesSupabase = async () => {
  try {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao carregar templates:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Erro na conexão com Supabase:', error)
    return []
  }
}

export const atualizarTemplateSupabase = async (
  id: string,
  template: TemplateInput,
  frenteImg: string,
  versoImg: string,
  campos: Record<string, unknown>[]
) => {
  try {
    const { data, error } = await supabase
      .from('templates')
      .update({
        name: template.name,
        data: template,
        frente_img: frenteImg,
        verso_img: versoImg,
        campos: campos,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar template:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Erro na conexão com Supabase:', error)
    throw error
  }
}

export const deletarTemplateSupabase = async (id: string) => {
  try {
    const { error } = await supabase
      .from('templates')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erro ao deletar template:', error)
      throw error
    }

    return true
  } catch (error) {
    console.error('Erro na conexão com Supabase:', error)
    throw error
  }
}

// Funções de Carteirinhas
export const salvarCarteirinhaSupabase = async (carteirinha: CarteirinhaInput) => {
  try {
    const { data, error } = await supabase
      .from('carteirinhas')
      .insert({
        nome: carteirinha.nome,
        template_id: carteirinha.templateId,
        template_name: carteirinha.templateName,
        dados: carteirinha.dados,
        fotos: carteirinha.fotos,
        frente_url: carteirinha.frenteUrl,
        verso_url: carteirinha.versoUrl,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        emitida_em: carteirinha.emitidaEm
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao salvar carteirinha:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Erro na conexão com Supabase:', error)
    throw error
  }
}

export const carregarCarteirinhasSupabase = async () => {
  try {
    const { data, error } = await supabase
      .from('carteirinhas')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao carregar carteirinhas:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Erro na conexão com Supabase:', error)
    return []
  }
}

export const buscarCarteirinhasSupabase = async (termo: string) => {
  try {
    const { data, error } = await supabase
      .from('carteirinhas')
      .select('*')
      .or(`nome.ilike.%${termo}%,template_name.ilike.%${termo}%,emitida_em.ilike.%${termo}%`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar carteirinhas:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Erro na conexão com Supabase:', error)
    return []
  }
}

export const deletarCarteirinhaSupabase = async (id: string) => {
  try {
    const { error } = await supabase
      .from('carteirinhas')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erro ao deletar carteirinha:', error)
      throw error
    }

    return true
  } catch (error) {
    console.error('Erro na conexão com Supabase:', error)
    throw error
  }
}
