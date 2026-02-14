import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, ZoomIn, ZoomOut, Move, Type, Image as ImageIcon, Trash2, Save } from 'lucide-react';
import { saveTemplate } from '../services/templateService';

// Tipos
interface Field {
  id: string;
  type: 'text' | 'photo';
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

interface Template {
  id: string;
  name: string;
  frontImage: string;
  backImage: string | null;
  frontFields: Field[];
  backFields: Field[];
}

type Side = 'front' | 'back';

interface TemplateEditorProps {
  onSave?: () => void;
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({ onSave }) => {
  // Estados principais
  const [template, setTemplate] = useState<Template>({
    id: '',
    name: 'Novo Template',
    frontImage: '',
    backImage: null,
    frontFields: [],
    backFields: []
  });
  
  const [currentSide, setCurrentSide] = useState<Side>('front');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState({ x: 0, y: 0 });
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [fieldType, setFieldType] = useState<'text' | 'photo'>('text');
  
  const canvasRef = useRef<HTMLDivElement>(null);

  // Cleanup do elemento temporário ao desmontar
  useEffect(() => {
    return () => {
      document.getElementById('temp-field')?.remove();
    };
  }, []);

  // Campos atuais baseados no lado selecionado
  const currentFields = currentSide === 'front' ? template.frontFields : template.backFields;
  const currentImage = currentSide === 'front' ? template.frontImage : template.backImage;

  // Upload de imagem
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>, side: Side) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validação de tipo e tamanho
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Imagem muito grande. Máximo 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      setTemplate(prev => ({
        ...prev,
        [side === 'front' ? 'frontImage' : 'backImage']: imageUrl
      }));
    };
    reader.onerror = () => {
      alert('Erro ao ler o arquivo');
    };
    reader.readAsDataURL(file);
  }, []);

  // Controles de zoom
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5));
  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Pan (arrastar canvas)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) { // Botão do meio ou Alt+Click
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }

    if (isDrawing && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - pan.x) / zoom;
      const y = (e.clientY - rect.top - pan.y) / zoom;
      
      // Atualizar preview do campo sendo desenhado
      const tempField = document.getElementById('temp-field');
      if (tempField) {
        const width = Math.abs(x - drawStart.x);
        const height = Math.abs(y - drawStart.y);
        tempField.style.left = `${Math.min(x, drawStart.x) * zoom + pan.x}px`;
        tempField.style.top = `${Math.min(y, drawStart.y) * zoom + pan.y}px`;
        tempField.style.width = `${width * zoom}px`;
        tempField.style.height = `${height * zoom}px`;
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Desenhar campo
  const startDrawing = (e: React.MouseEvent) => {
    if (!currentImage || isDragging || e.button !== 0) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;

    setIsDrawing(true);
    setDrawStart({ x, y });

    // Criar elemento temporário para preview
    const tempField = document.createElement('div');
    tempField.id = 'temp-field';
    tempField.className = 'absolute border-2 border-blue-500 bg-blue-500/20 pointer-events-none';
    canvasRef.current?.appendChild(tempField);
  };

  const finishDrawing = (e: React.MouseEvent) => {
    if (!isDrawing) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;

    const width = Math.abs(x - drawStart.x);
    const height = Math.abs(y - drawStart.y);

    // Só criar campo se tiver tamanho mínimo
    if (width > 20 && height > 20) {
      const newField: Field = {
        id: `field-${Date.now()}`,
        type: fieldType,
        x: Math.min(x, drawStart.x),
        y: Math.min(y, drawStart.y),
        width,
        height,
        label: fieldType === 'photo' ? 'Foto' : 'Texto'
      };

      setTemplate(prev => ({
        ...prev,
        [currentSide === 'front' ? 'frontFields' : 'backFields']: [
          ...currentFields,
          newField
        ]
      }));
    }

    // Remover preview
    document.getElementById('temp-field')?.remove();
    setIsDrawing(false);
  };

  // Deletar campo
  const deleteField = (fieldId: string) => {
    setTemplate(prev => ({
      ...prev,
      [currentSide === 'front' ? 'frontFields' : 'backFields']: 
        currentFields.filter(f => f.id !== fieldId)
    }));
    setSelectedField(null);
  };

  // Editar label do campo
  const updateFieldLabel = (fieldId: string, newLabel: string) => {
    setTemplate(prev => ({
      ...prev,
      [currentSide === 'front' ? 'frontFields' : 'backFields']: 
        currentFields.map(f => f.id === fieldId ? { ...f, label: newLabel } : f)
    }));
  };

  // Salvar template
  const saveTemplateHandler = async () => {
    console.log('Salvando template:', template);
    
    // Validar dados do template
    if (!template.name.trim()) {
      alert('Por favor, digite um nome para o template');
      return;
    }
    
    if (!template.frontImage) {
      alert('Por favor, adicione uma imagem para a frente da carteirinha');
      return;
    }
    
    try {
      // Gerar ID único se não existir
      const templateToSave = {
        ...template,
        id: template.id || `template_${Date.now()}`,
        name: template.name.trim(),
        frontFields: template.frontFields || [],
        backFields: template.backFields || []
      };
      
      console.log('Enviando template para Supabase:', templateToSave);
      
      // Salvar no Supabase
      const savedTemplate = await saveTemplate(templateToSave);
      
      console.log('Template salvo com sucesso:', savedTemplate);
      alert('Template salvo com sucesso!');
      
      // Sempre chamar onSave() após sucesso
      if (onSave) {
        onSave();
      }
      
    } catch (error: any) {
      console.error('Erro ao salvar template:', error);
      alert('Erro ao salvar template: ' + error.message);
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <div className="w-80 bg-gray-800 p-6 overflow-y-auto border-r border-gray-700">
        <h1 className="text-2xl font-bold mb-6">Editor de Template</h1>

        {/* Nome do template */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Nome do Template</label>
          <input
            type="text"
            value={template.name}
            onChange={(e) => setTemplate(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Upload de imagens */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Upload da Frente</label>
          <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
            {template.frontImage ? (
              <img src={template.frontImage} alt="Frente" className="max-h-full object-contain" />
            ) : (
              <div className="text-center">
                <Upload className="mx-auto mb-2" />
                <span className="text-sm">Clique para fazer upload</span>
              </div>
            )}
            <input
              type="file"
              accept="image/png,image/jpeg"
              onChange={(e) => handleImageUpload(e, 'front')}
              className="hidden"
            />
          </label>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Upload do Verso (Opcional)</label>
          <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
            {template.backImage ? (
              <img src={template.backImage} alt="Verso" className="max-h-full object-contain" />
            ) : (
              <div className="text-center">
                <Upload className="mx-auto mb-2" />
                <span className="text-sm">Clique para fazer upload</span>
              </div>
            )}
            <input
              type="file"
              accept="image/png,image/jpeg"
              onChange={(e) => handleImageUpload(e, 'back')}
              className="hidden"
            />
          </label>
        </div>

        {/* Tipo de campo */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Tipo de Campo</label>
          <div className="flex gap-2">
            <button
              onClick={() => setFieldType('text')}
              className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                fieldType === 'text' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              <Type className="inline mr-2" size={18} />
              Texto
            </button>
            <button
              onClick={() => setFieldType('photo')}
              className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                fieldType === 'photo' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
              disabled={currentSide === 'back'}
            >
              <ImageIcon className="inline mr-2" size={18} />
              Foto
            </button>
          </div>
          {currentSide === 'back' && (
            <p className="text-xs text-gray-400 mt-2">
              * Foto disponível apenas na frente
            </p>
          )}
        </div>

        {/* Lista de campos */}
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-2">Campos Mapeados ({currentFields.length})</h3>
          <div className="space-y-2">
            {currentFields.map(field => (
              <div
                key={field.id}
                className={`p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors ${
                  selectedField === field.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedField(field.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">
                    {field.type === 'photo' ? '📷 Foto' : '📝 Texto'}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteField(field.id);
                    }}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <input
                  type="text"
                  value={field.label}
                  onChange={(e) => updateFieldLabel(field.id, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <div className="text-xs text-gray-400 mt-1">
                  {Math.round(field.width)}x{Math.round(field.height)}px
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Instruções */}
        <div className="p-4 bg-gray-700/50 rounded-lg text-xs text-gray-300">
          <p className="font-medium mb-2">💡 Como usar:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Escolha o tipo de campo (Texto ou Foto)</li>
            <li>Clique e arraste no canvas para criar</li>
            <li>Alt+Click ou botão do meio: arrastar canvas</li>
            <li>Use os botões de zoom</li>
          </ul>
        </div>
      </div>

      {/* Canvas Principal */}
      <div className="flex-1 flex flex-col">
        {/* Barra de ferramentas */}
        <div className="bg-gray-800 p-4 border-b border-gray-700 flex items-center justify-between">
          {/* Controles de visualização */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentSide('front')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                currentSide === 'front' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              Frente
            </button>
            <button
              onClick={() => setCurrentSide('back')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                currentSide === 'back' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
              disabled={!template.backImage}
            >
              Verso
            </button>
          </div>

          {/* Controles de zoom */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleZoomOut}
              className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut size={20} />
            </button>
            <span className="text-sm font-medium min-w-[60px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
              title="Zoom In"
            >
              <ZoomIn size={20} />
            </button>
            <button
              onClick={resetView}
              className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
              title="Resetar Visualização"
            >
              <Move size={20} />
            </button>
          </div>

          {/* Botão de salvar */}
          <button
            onClick={saveTemplateHandler}
            className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors font-medium"
          >
            <Save size={20} />
            Salvar Template
          </button>
        </div>

        {/* Área do canvas */}
        <div
          ref={canvasRef}
          className="flex-1 bg-gray-950 overflow-hidden relative cursor-crosshair"
          onMouseDown={(e) => {
            handleMouseDown(e);
            if (!isDragging && !e.altKey && e.button === 0) {
              startDrawing(e);
            }
          }}
          onMouseMove={handleMouseMove}
          onMouseUp={(e) => {
            handleMouseUp();
            finishDrawing(e);
          }}
          onMouseLeave={() => {
            setIsDragging(false);
            if (isDrawing) {
              document.getElementById('temp-field')?.remove();
              setIsDrawing(false);
            }
          }}
        >
          {currentImage ? (
            <div
              className="absolute"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: 'top left',
                transition: isDragging ? 'none' : 'transform 0.1s ease-out'
              }}
            >
              {/* Imagem base */}
              <img
                src={currentImage}
                alt={currentSide === 'front' ? 'Frente' : 'Verso'}
                className="block max-w-none pointer-events-none"
                draggable={false}
              />

              {/* Campos mapeados */}
              {currentFields.map(field => (
                <div
                  key={field.id}
                  className={`absolute border-2 ${
                    field.type === 'photo' 
                      ? 'border-purple-500 bg-purple-500/20' 
                      : 'border-green-500 bg-green-500/20'
                  } ${
                    selectedField === field.id ? 'ring-4 ring-blue-400' : ''
                  }`}
                  style={{
                    left: `${field.x}px`,
                    top: `${field.y}px`,
                    width: `${field.width}px`,
                    height: `${field.height}px`
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedField(field.id);
                  }}
                >
                  <div className="absolute -top-6 left-0 text-xs font-medium px-2 py-1 bg-gray-900 rounded whitespace-nowrap">
                    {field.label}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Upload size={48} className="mx-auto mb-4 opacity-50" />
                <p>Faça upload de uma imagem para começar</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateEditor;
