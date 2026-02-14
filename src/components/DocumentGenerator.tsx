import { useState, useRef, useEffect } from 'react';
import { Upload, Download, FileText, Camera, Type } from 'lucide-react';
import { Template, GeneratedFieldValue } from '../types/template';
import { exportDocumentToPng, exportDocumentBothSides } from '../utils/exportToPng';

interface Props {
  template: Template;
  onSave?: (data: GeneratedFieldValue[]) => void;
}

export default function DocumentGenerator({ template, onSave }: Props) {
  const [formData, setFormData] = useState<GeneratedFieldValue[]>([]);
  const [currentSide, setCurrentSide] = useState<'front' | 'back'>('front');
  const [imageScale, setImageScale] = useState({ x: 1, y: 1 });
  
  const frontCanvasRef = useRef<HTMLCanvasElement>(null);
  const backCanvasRef = useRef<HTMLCanvasElement>(null);

  // Inicializar formData com campos do template
  useEffect(() => {
    const initialData: GeneratedFieldValue[] = template.fields.map(field => ({
      fieldId: field.id,
      value: ''
    }));
    setFormData(initialData);
  }, [template.fields]);

  // Calcular escala da imagem quando carregada
  useEffect(() => {
    const canvas = currentSide === 'front' ? frontCanvasRef.current : backCanvasRef.current;
    if (!canvas) return;

    const img = new Image();
    img.onload = () => {
      const naturalWidth = img.naturalWidth;
      const naturalHeight = img.naturalHeight;
      
      if (naturalWidth && naturalHeight) {
        const scaleX = template.width / naturalWidth;
        const scaleY = template.height / naturalHeight;
        setImageScale({ x: scaleX, y: scaleY });
      }
    };
    img.src = currentSide === 'front' ? template.frontImageUrl : template.backImageUrl || '';
  }, [template, currentSide]);

  // Gerar preview em tempo real
  useEffect(() => {
    const canvas = currentSide === 'front' ? frontCanvasRef.current : backCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configurar canvas com tamanho do template
    canvas.width = template.width;
    canvas.height = template.height;

    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Carregar e desenhar imagem de fundo
    const img = new Image();
    img.onload = () => {
      // Desenhar imagem
      ctx.drawImage(img, 0, 0, template.width, template.height);

      // Desenhar campos do lado atual
      const sideFields = template.fields.filter(field => field.side === currentSide);
      
      sideFields.forEach(field => {
        const fieldValue = formData.find(f => f.fieldId === field.id)?.value;

        if (field.type === 'text' && typeof fieldValue === 'string') {
          // Desenhar texto
          ctx.font = '16px Arial';
          ctx.fillStyle = '#000000';
          ctx.fillText(fieldValue || field.name, field.x * imageScale.x, field.y * imageScale.y + 20);
        } else if (field.type === 'photo') {
          // Desenhar placeholder ou imagem
          if (fieldValue instanceof File) {
            // Se for arquivo, criar preview
            const reader = new FileReader();
            reader.onload = (e) => {
              const photoImg = new Image();
              photoImg.onload = () => {
                ctx.drawImage(
                  photoImg, 
                  field.x * imageScale.x, 
                  field.y * imageScale.y, 
                  field.width * imageScale.x, 
                  field.height * imageScale.y
                );
              };
              photoImg.src = e.target?.result as string;
            };
            reader.readAsDataURL(fieldValue);
          } else {
            // Placeholder para campo de foto vazio
            ctx.strokeStyle = '#666666';
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(
              field.x * imageScale.x, 
              field.y * imageScale.y, 
              field.width * imageScale.x, 
              field.height * imageScale.y
            );
            ctx.fillStyle = '#999999';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(
              'Foto', 
              field.x * imageScale.x + (field.width * imageScale.x) / 2, 
              field.y * imageScale.y + (field.height * imageScale.y) / 2
            );
          }
        }
      });
    };
    img.src = currentSide === 'front' ? template.frontImageUrl : template.backImageUrl || '';
  }, [template, formData, currentSide, imageScale]);

  const handleFieldChange = (fieldId: string, value: string | File) => {
    setFormData(prev => {
      const newData = [...prev];
      const index = newData.findIndex(f => f.fieldId === fieldId);
      if (index >= 0) {
        newData[index] = { fieldId, value };
      }
      return newData;
    });
  };

  const handleFileUpload = (fieldId: string, file: File) => {
    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem.');
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB.');
      return;
    }

    handleFieldChange(fieldId, file);
  };

  const handleSave = () => {
    if (onSave) {
      onSave(formData);
    }
  };

  const handleExportFront = async () => {
  try {
    await exportDocumentToPng(template, formData, 'front');
  } catch (error) {
    console.error('Erro ao exportar frente:', error);
    alert('Erro ao exportar frente. Tente novamente.');
  }
};

const handleExportBack = async () => {
  try {
    await exportDocumentToPng(template, formData, 'back');
  } catch (error) {
    console.error('Erro ao exportar verso:', error);
    alert('Erro ao exportar verso. Tente novamente.');
  }
};

const handleExportBoth = async () => {
  try {
    await exportDocumentBothSides(template, formData);
  } catch (error) {
    console.error('Erro ao exportar ambos os lados:', error);
    alert('Erro ao exportar ambos os lados. Tente novamente.');
  }
};

  const getFieldValue = (fieldId: string): string | File => {
    const field = formData.find(f => f.fieldId === fieldId);
    return field?.value || '';
  };

  const currentFields = template.fields.filter(field => field.side === currentSide);

  return (
    <div className="w-full h-full bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">
                Gerar Documento: {template.name}
              </h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
              >
                <Upload size={16} />
                Salvar Dados
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulário */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Preencher Campos</h2>
              
              {/* Alternador Frente/Verso */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentSide('front')}
                  className={`px-3 py-1 text-sm rounded flex items-center gap-1 ${
                    currentSide === 'front' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <Type size={14} />
                  Frente
                </button>
                {template.backImageUrl && (
                  <button
                    onClick={() => setCurrentSide('back')}
                    className={`px-3 py-1 text-sm rounded flex items-center gap-1 ${
                      currentSide === 'back' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <Camera size={14} />
                    Verso
                  </button>
                )}
              </div>
            </div>
            
            <div className="space-y-4">
              {currentFields.map(field => {
                const value = getFieldValue(field.id);
                const isPhoto = field.type === 'photo';
                
                return (
                  <div key={field.id} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {field.name}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                      {isPhoto && (
                        <span className="text-xs text-gray-500 ml-2">
                          (Apenas 1 foto no verso)
                        </span>
                      )}
                    </label>
                    
                    {isPhoto ? (
                      <div className="flex items-center gap-3">
                        {value instanceof File ? (
                          <div className="flex items-center gap-2">
                            <img
                              src={URL.createObjectURL(value)}
                              alt="Preview"
                              className="w-16 h-16 object-cover rounded border"
                            />
                            <span className="text-sm text-gray-600">{value.name}</span>
                            <button
                              onClick={() => handleFieldChange(field.id, '')}
                              className="text-red-500 hover:text-red-700 text-sm"
                            >
                              Remover
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(field.id, file);
                              }}
                              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:rounded file:border-0"
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={typeof value === 'string' ? value : ''}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        placeholder={field.name}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Preview - {currentSide === 'front' ? 'Frente' : 'Verso'}
              </h2>
              
              <div className="flex gap-2">
              <button
                onClick={handleExportFront}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded flex items-center gap-1 text-sm"
              >
                <Download size={14} />
                Exportar Frente
              </button>
              <button
                onClick={handleExportBack}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded flex items-center gap-1 text-sm"
              >
                <Download size={14} />
                Exportar Verso
              </button>
              <button
                onClick={handleExportBoth}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center gap-1 text-sm"
              >
                <Download size={14} />
                Exportar Ambos
              </button>
            </div>
            </div>
            
            <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
              <canvas
                ref={currentSide === 'front' ? frontCanvasRef : backCanvasRef}
                className="w-full h-auto"
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </div>
            
            {/* Indicador de escala */}
            <div className="mt-2 text-xs text-gray-500 text-center">
              Escala: {imageScale.x.toFixed(2)}x, {imageScale.y.toFixed(2)}y | 
              Dimensões: {template.width}x{template.height}px
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
