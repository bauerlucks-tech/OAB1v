import { describe, it, expect, beforeEach } from 'vitest';
import { validateTemplate } from '../utils/templateValidation';
import { Template, TemplateField, TemplateFieldType, TemplateSide } from '../types/template';

describe('Validação de Template', () => {
  let templateValido: Template;

  beforeEach(() => {
    templateValido = {
      id: 'test-id',
      name: 'Template Teste',
      frontImageUrl: 'https://example.com/front.jpg',
      backImageUrl: 'https://example.com/back.jpg',
      width: 800,
      height: 600,
      fields: [
        {
          id: 'field-1',
          name: 'Nome Completo',
          type: 'text' as TemplateFieldType,
          side: 'front' as TemplateSide,
          x: 100,
          y: 100,
          width: 200,
          height: 30,
          required: true
        },
        {
          id: 'field-2',
          name: 'Foto',
          type: 'photo' as TemplateFieldType,
          side: 'back' as TemplateSide,
          x: 200,
          y: 200,
          width: 150,
          height: 150,
          required: false,
          locked: true
        }
      ],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    };
  });

  it('deve aceitar template válido', () => {
    const resultado = validateTemplate(templateValido);
    expect(resultado.isValid).toBe(true);
    expect(resultado.errors).toHaveLength(0);
  });

  it('deve rejeitar template sem imagem da frente', () => {
    const templateInvalido = { ...templateValido, frontImageUrl: '' };
    const resultado = validateTemplate(templateInvalido);
    expect(resultado.isValid).toBe(false);
    expect(resultado.errors).toContain('O template deve ter uma imagem de frente');
  });

  it('deve rejeitar template com dimensões inválidas', () => {
    const templateInvalido = { ...templateValido, width: 0, height: -1 };
    const resultado = validateTemplate(templateInvalido);
    expect(resultado.isValid).toBe(false);
    expect(resultado.errors).toContain('O template deve ter dimensões maiores que 0');
  });

  it('deve rejeitar template sem campos', () => {
    const templateInvalido = { ...templateValido, fields: [] };
    const resultado = validateTemplate(templateInvalido);
    expect(resultado.isValid).toBe(false);
    expect(resultado.errors).toContain('O template deve ter pelo menos um campo');
  });

  it('deve rejeitar template sem campos de texto', () => {
    const templateInvalido = {
      ...templateValido,
      fields: [{
        id: 'field-1',
        name: 'Foto',
        type: 'photo',
        side: 'back',
        x: 200,
        y: 200,
        width: 150,
        height: 150,
        required: false,
        locked: true
      }]
    };
    const resultado = validateTemplate(templateInvalido);
    expect(resultado.isValid).toBe(false);
    expect(resultado.errors).toContain('O template deve ter pelo menos um campo de texto');
  });

  it('deve rejeitar template com mais de um campo de foto', () => {
    const templateInvalido = {
      ...templateValido,
      fields: [
        ...templateValido.fields,
        {
          id: 'field-3',
          name: 'Foto 2',
          type: 'photo',
          side: 'front',
          x: 300,
          y: 300,
          width: 150,
          height: 150,
          required: false
        }
      ]
    };
    const resultado = validateTemplate(templateInvalido);
    expect(resultado.isValid).toBe(false);
    expect(resultado.errors).toContain('O template deve ter no máximo um campo de foto');
  });

  it('deve rejeitar template com foto não bloqueada no verso', () => {
    const templateInvalido = {
      ...templateValido,
      fields: [
        {
          id: 'field-2',
          name: 'Foto',
          type: 'photo',
          side: 'back',
          x: 200,
          y: 200,
          width: 150,
          height: 150,
          required: false,
          locked: false // Não bloqueado
        }
      ]
    };
    const resultado = validateTemplate(templateInvalido);
    expect(resultado.isValid).toBe(false);
    expect(resultado.errors).toContain('O campo de foto no verso deve estar bloqueado (locked: true)');
  });

  it('deve rejeitar template com IDs duplicados', () => {
    const templateInvalido = {
      ...templateValido,
      fields: [
        {
          id: 'field-duplicado',
          name: 'Campo 1',
          type: 'text',
          side: 'front',
          x: 100,
          y: 100,
          width: 200,
          height: 30,
          required: true
        },
        {
          id: 'field-duplicado', // Mesmo ID
          name: 'Campo 2',
          type: 'text',
          side: 'front',
          x: 100,
          y: 200,
          width: 200,
          height: 30,
          required: false
        }
      ]
    };
    const resultado = validateTemplate(templateInvalido);
    expect(resultado.isValid).toBe(false);
    expect(resultado.errors).toContain('Os IDs dos campos devem ser únicos');
  });

  it('deve rejeitar template com coordenadas inválidas', () => {
    const templateInvalido = {
      ...templateValido,
      fields: [
        {
          id: 'field-1',
          name: 'Campo Inválido',
          type: 'text',
          side: 'front',
          x: -10, // Coordenada negativa
          y: 100,
          width: 200,
          height: 30,
          required: true
        }
      ]
    };
    const resultado = validateTemplate(templateInvalido);
    expect(resultado.isValid).toBe(false);
    expect(resultado.errors).toContain('Campo "Campo Inválido" tem coordenadas inválidas');
  });

  it('deve rejeitar template com campos fora dos limites', () => {
    const templateInvalido = {
      ...templateValido,
      fields: [
        {
          id: 'field-1',
          name: 'Campo Fora',
          type: 'text',
          side: 'front',
          x: 700, // Fora do limite (800 - 200 < 700)
          y: 100,
          width: 200,
          height: 30,
          required: true
        }
      ]
    };
    const resultado = validateTemplate(templateInvalido);
    expect(resultado.isValid).toBe(false);
    expect(resultado.errors).toContain('Campo "Campo Fora" está fora dos limites da imagem');
  });

  it('deve rejeitar template com campos sem nome', () => {
    const templateInvalido = {
      ...templateValido,
      fields: [
        {
          id: 'field-1',
          name: '', // Nome vazio
          type: 'text',
          side: 'front',
          x: 100,
          y: 100,
          width: 200,
          height: 30,
          required: true
        }
      ]
    };
    const resultado = validateTemplate(templateInvalido);
    expect(resultado.isValid).toBe(false);
    expect(resultado.errors).toContain('Campo sem nome encontrado');
  });
});
