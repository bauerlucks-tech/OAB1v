import { Template, GeneratedFieldValue } from '../types/template';

/**
 * Exporta o documento preenchido como PNG
 * Mantém fidelidade visual total com o preview
 */
export const exportDocumentToPng = (
  template: Template,
  formData: GeneratedFieldValue[],
  side: 'front' | 'back'
): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      // Criar canvas temporário para exportação
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Não foi possível criar contexto 2D'));
        return;
      }

      // Configurar canvas com tamanho original do template
      canvas.width = template.width;
      canvas.height = template.height;

      // Carregar imagem de fundo
      const img = new Image();
      img.crossOrigin = 'anonymous'; // Evitar problemas de CORS
      
      img.onload = () => {
        try {
          // Desenhar imagem base
          ctx.drawImage(img, 0, 0, template.width, template.height);

          // Desenhar campos do lado especificado
          const sideFields = template.fields.filter(field => field.side === side);
          
          sideFields.forEach(field => {
            const fieldValue = formData.find(f => f.fieldId === field.id)?.value;

            if (field.type === 'text' && typeof fieldValue === 'string') {
              // Configurar estilo do texto
              ctx.font = '16px Arial';
              ctx.fillStyle = '#000000';
              ctx.textAlign = 'left';
              ctx.textBaseline = 'top';
              
              // Desenhar texto
              const text = fieldValue || field.name;
              ctx.fillText(text, field.x, field.y + 20);
            } else if (field.type === 'photo') {
              if (fieldValue instanceof File) {
                // Desenhar imagem enviada
                const reader = new FileReader();
                reader.onload = (e) => {
                  const photoImg = new Image();
                  photoImg.onload = () => {
                    // Desenhar imagem mantendo proporção
                    ctx.drawImage(
                      photoImg,
                      field.x,
                      field.y,
                      field.width,
                      field.height
                    );
                  };
                  photoImg.src = e.target?.result as string;
                };
                reader.readAsDataURL(fieldValue);
              } else {
                // Desenhar placeholder para campo de foto vazio
                ctx.strokeStyle = '#666666';
                ctx.setLineDash([5, 5]);
                ctx.strokeRect(field.x, field.y, field.width, field.height);
                
                ctx.fillStyle = '#999999';
                ctx.font = '14px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('Foto', field.x + field.width / 2, field.y + field.height / 2);
              }
            }
          });

          // Converter para blob e download
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('Não foi possível gerar o blob da imagem'));
              return;
            }

            // Criar URL para download
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `documento-${template.name}-${side}-${Date.now()}.png`;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            
            // Limpar
            setTimeout(() => {
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
            }, 100);

            resolve();
          }, 'image/png', 1.0);
        } catch (error) {
          console.error('Erro ao desenhar campos:', error);
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Não foi possível carregar a imagem do template'));
      };

      // Iniciar carregamento da imagem
      if (side === 'back' && !template.backImageUrl) {
        reject(new Error('Template não possui imagem do verso'));
        return;
      }
      img.src = side === 'front' ? template.frontImageUrl : template.backImageUrl!;
      
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Exporta ambos os lados (frente e verso) como PNG
 */
export const exportDocumentBothSides = (
  template: Template,
  formData: GeneratedFieldValue[]
): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      // Exportar frente
      await exportDocumentToPng(template, formData, 'front');
      
      // Pequena pausa entre downloads
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Exportar verso
      await exportDocumentToPng(template, formData, 'back');
      
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};
