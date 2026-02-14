import { Template } from '../types/template';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateTemplate(template: Template): ValidationResult {
  const errors: string[] = [];

  // Verificar dimensões
  if (template.width <= 0 || template.height <= 0) {
    errors.push('O template deve ter dimensões maiores que 0');
  }

  // Verificar imagens
  if (!template.frontImageUrl) {
    errors.push('O template deve ter uma imagem de frente');
  }

  // Verificar campos
  if (!template.fields || template.fields.length === 0) {
    errors.push('O template deve ter pelo menos um campo');
  }

  // Verificar campos de texto
  const textFields = template.fields.filter(field => field.type === 'text');
  if (textFields.length === 0) {
    errors.push('O template deve ter pelo menos um campo de texto');
  }

  // Verificar campos de foto
  const photoFields = template.fields.filter(field => field.type === 'photo');
  if (photoFields.length > 1) {
    errors.push('O template deve ter no máximo um campo de foto');
  }

  // Verificar se a foto está no verso e está bloqueada
  const photoInBack = photoFields.find(field => field.side === 'back');
  if (photoInBack && !photoInBack.locked) {
    errors.push('O campo de foto no verso deve estar bloqueado (locked: true)');
  }

  // Verificar IDs únicos
  const fieldIds = template.fields.map(field => field.id);
  const uniqueFieldIds = new Set(fieldIds);
  if (fieldIds.length !== uniqueFieldIds.size) {
    errors.push('Os IDs dos campos devem ser únicos');
  }

  // Verificar coordenadas
  template.fields.forEach(field => {
    if (field.x < 0 || field.y < 0 || field.width <= 0 || field.height <= 0) {
      errors.push(`Campo "${field.name}" tem coordenadas inválidas`);
    }

    if (field.x + field.width > template.width || field.y + field.height > template.height) {
      errors.push(`Campo "${field.name}" está fora dos limites da imagem`);
    }
  });

  // Verificar nomes dos campos
  template.fields.forEach(field => {
    if (!field.name || field.name.trim() === '') {
      errors.push(`Campo sem nome encontrado`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}
