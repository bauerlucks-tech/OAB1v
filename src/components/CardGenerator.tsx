import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { Template, TemplateCardData } from '../types/template';
import { Download, Eye } from 'lucide-react';

interface CardGeneratorProps {
  template: Template;
  data: TemplateCardData;
  onGenerate?: (imageUrl: string) => void;
}

const CardGenerator: React.FC<CardGeneratorProps> = ({ template, data, onGenerate }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Gerar carteirinha
  const generateCard = useCallback(async (side: 'front' | 'back') => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const imageUrl = side === 'front' ? template.frontImage : template.backImage;
    if (!imageUrl) return null;

    setLoading(true);

    try {
      // Carregar imagem base
      const baseImage = await loadImage(imageUrl);
      canvas.width = baseImage.width;
      canvas.height = baseImage.height;

      // Desenhar imagem base
      ctx.drawImage(baseImage, 0, 0);

      // Desenhar campos
      const fields = side === 'front' ? template.frontFields : template.backFields;
      
      for (const field of fields) {
        if (field.type === 'text') {
          // Desenhar texto
          const value = data.fields[field.id] || field.label;
          ctx.font = `${field.fontSize || 16}px ${field.fontFamily || 'Arial'}`;
          ctx.fillStyle = field.color || '#000000';
          ctx.textAlign = field.align || 'left';
          
          // Posicionar texto no centro do campo
          const textX = field.align === 'center' 
            ? field.x + field.width / 2 
            : field.align === 'right'
            ? field.x + field.width
            : field.x;
          
          const textY = field.y + field.height / 2 + (field.fontSize || 16) / 3;
          
          ctx.fillText(value, textX, textY);
        } else if (field.type === 'photo' && data.photoUrl) {
          // Desenhar foto
          const photoImage = await loadImage(data.photoUrl);
          ctx.drawImage(
            photoImage,
            field.x,
            field.y,
            field.width,
            field.height
          );
        }
      }

      // Converter para URL
      const generatedImageUrl = canvas.toDataURL('image/png');
      setPreview(generatedImageUrl);
      
      if (onGenerate) {
        onGenerate(generatedImageUrl);
      }

      return generatedImageUrl;
    } catch (error) {
      console.error('Erro ao gerar carteirinha:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [template, data, onGenerate]);

  // Carregar imagem como Promise
  const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  };

  // Download da carteirinha
  const downloadCard = () => {
    if (!preview) return;

    const link = document.createElement('a');
    link.download = `carteirinha-${template.name}-${Date.now()}.png`;
    link.href = preview;
    link.click();
  };

  useEffect(() => {
    generateCard('front').catch(console.error);
  }, [generateCard]);

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Preview da Carteirinha</h3>
        <div className="flex gap-2">
          <button
            onClick={() => generateCard('front')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            disabled={loading}
          >
            <Eye size={18} />
            Gerar Frente
          </button>
          {template.backImage && (
            <button
              onClick={() => generateCard('back')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              disabled={loading}
            >
              <Eye size={18} />
              Gerar Verso
            </button>
          )}
          {preview && (
            <button
              onClick={downloadCard}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
            >
              <Download size={18} />
              Download
            </button>
          )}
        </div>
      </div>

      {/* Canvas (oculto) */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Preview */}
      <div className="bg-gray-900 rounded-lg p-8 flex items-center justify-center min-h-[400px]">
        {loading ? (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Gerando carteirinha...</p>
          </div>
        ) : preview ? (
          <img 
            src={preview} 
            alt="Preview" 
            className="max-w-full max-h-[600px] object-contain shadow-2xl"
          />
        ) : (
          <p className="text-gray-400">Nenhum preview disponível</p>
        )}
      </div>
    </div>
  );
};

export default CardGenerator;

// Exemplo de uso:
/*
import CardGenerator from './components/CardGenerator';

function App() {
  const template = {
    id: '123',
    name: 'OAB-SP',
    frontImage: '/template-front.png',
    backImage: '/template-back.png',
    frontFields: [
      {
        id: 'field-1',
        type: 'text',
        x: 100,
        y: 50,
        width: 300,
        height: 40,
        label: 'Nome',
        fontSize: 24,
        fontFamily: 'Arial',
        color: '#000000',
        align: 'center'
      },
      {
        id: 'field-2',
        type: 'photo',
        x: 50,
        y: 100,
        width: 200,
        height: 250,
        label: 'Foto'
      }
    ],
    backFields: []
  };

  const cardData = {
    templateId: '123',
    fields: {
      'field-1': 'João Silva'
    },
    photoUrl: '/photo.jpg'
  };

  return (
    <CardGenerator 
      template={template}
      data={cardData}
      onGenerate={(url) => console.log('Gerado:', url)}
    />
  );
}
*/
