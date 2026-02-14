export interface Template {
  id: string;
  name: string;

  frontImageUrl: string;
  backImageUrl: string;

  width: number;
  height: number;

  fields: TemplateField[];

  createdAt?: string;
  updatedAt?: string;
}

export type TemplateFieldType = "text" | "photo";
export type TemplateSide = "front" | "back";

export interface TemplateField {
  id: string;
  name: string;
  type: TemplateFieldType;
  side: TemplateSide;

  x: number;
  y: number;
  width: number;
  height: number;

  required: boolean;
  locked?: boolean;
}

export interface GeneratedFieldValue {
  fieldId: string;
  value: string | File;
}

// Para compatibilidade com Supabase - ESTRUTURA REAL DO BANCO
export interface TemplateDB {
  id: string;
  name: string;
  frontImageUrl: string;
  backImageUrl: string;
  width: number;
  height: number;
  fields: Array<{
    id: string;
    name: string;
    type: 'text' | 'photo';
    side: 'front' | 'back';
    x: number;
    y: number;
    width: number;
    height: number;
    required: boolean;
    locked?: boolean;
  }>;
  created_at: string;
  updated_at: string;
}
