// types/template.ts

export interface Field {
  id: string;
  type: 'text' | 'photo';
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  fontSize?: number; // Para campos de texto
  fontFamily?: string;
  color?: string;
  align?: 'left' | 'center' | 'right';
}

export interface Template {
  id: string;
  name: string;
  frontImage: string;
  backImage: string | null;
  frontFields: Field[];
  backFields: Field[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TemplateCardData {
  templateId: string;
  fields: {
    [fieldId: string]: string; // fieldId => valor
  };
  photoUrl?: string;
}

export type Side = 'front' | 'back';

// Para o Supabase - ESTRUTURA REAL DO BANCO
export interface TemplateDB {
  id: string;
  name: string;
  data: {
    id: string;
    name: string;
    frenteImg: string;
    versoImg: string | null;
    campos: Array<{
      id: string;
      name: string;
      type: 'texto' | 'foto';
      x: number;
      y: number;
      w: number;
      h: number;
    }>;
    versoCampos: Array<{
      id: string;
      name: string;
      type: 'texto' | 'foto';
      x: number;
      y: number;
      w: number;
      h: number;
    }>;
  };
  frente_img: string;
  verso_img: string | null;
  frente_campos: Array<{
    id: string;
    name: string;
    type: 'texto' | 'foto';
    x: number;
    y: number;
    w: number;
    h: number;
  }>;
  verso_campos: Array<{
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
