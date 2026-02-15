import React, { useRef, useState, useCallback, useEffect } from "react";
import { ZoomIn, ZoomOut, Move, Pencil, Type, Image as ImageIcon, Trash2, Upload } from "lucide-react";
import { Template, TemplateField, TemplateFieldType, TemplateSide } from "../types/template";

interface Props {
  template?: Template | null;
  onChange: (template: Template) => void;
}

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;

export default function TemplateEditorAdvanced({ template, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  const [zoom, setZoom] = useState(1);
  const [mode, setMode] = useState<"move" | "draw">("draw");
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [currentSide, setCurrentSide] = useState<TemplateSide>('front');
  const [fieldType, setFieldType] = useState<TemplateFieldType>('text');
  const [selectedField, setSelectedField] = useState<string | null>(null);
  type ResizeHandle = 'left' | 'right' | 'top' | 'bottom';

  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle | null>(null);
  const [resizeStart, setResizeStart] = useState<{ x: number; y: number; width: number; height: number }>({ x: 0, y: 0, width: 0, height: 0 });
  const [drawing, setDrawing] = useState<TemplateField | null>(null);
  const [imageScale, setImageScale] = useState({ x: 1, y: 1 });

  // Template inicial se não for fornecido
  const currentTemplate = template || {
    id: '',
    name: 'Novo Template',
    frontImageUrl: '',
    backImageUrl: '',
    width: 800,
    height: 500,
    fields: []
  };

  const currentFields = currentTemplate.fields.filter(field => field.side === currentSide);
  const currentImage = currentSide === 'front' ? currentTemplate.frontImageUrl : currentTemplate.backImageUrl;

  // Calcular escala da imagem quando carregada
  useEffect(() => {
    if (imageRef.current && currentImage) {
      const naturalWidth = imageRef.current.naturalWidth;
      const naturalHeight = imageRef.current.naturalHeight;
      
      if (naturalWidth && naturalHeight) {
        const scaleX = currentTemplate.width / naturalWidth;
        const scaleY = currentTemplate.height / naturalHeight;
        
        setImageScale({ x: scaleX, y: scaleY });
      }
    }
  }, [currentImage, currentTemplate.width, currentTemplate.height]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(z => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z + delta)));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (mode === "move" && currentImage) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      // Verificar se clicou em algum campo
      const mouseX = (e.clientX - rect.left - pan.x) / zoom / imageScale.x;
      const mouseY = (e.clientY - rect.top - pan.y) / zoom / imageScale.y;

      const clickedField = currentFields.find(currentField => 
        mouseX >= currentField.x * imageScale.x &&
        mouseX <= (currentField.x + currentField.width) * imageScale.x &&
        mouseY >= currentField.y * imageScale.y &&
        mouseY <= (currentField.y + currentField.height) * imageScale.y &&
        !currentField.locked
      );

      if (clickedField) {
        setSelectedField(clickedField.id);
        setIsPanning(false);
      } else {
        setSelectedField(null);
        setIsPanning(true);
        setStartPan({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }
    } else if (mode === "draw" && currentImage) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      // Converter coordenadas do mouse para coordenadas da imagem original
      const mouseX = (e.clientX - rect.left - pan.x) / zoom / imageScale.x;
      const mouseY = (e.clientY - rect.top - pan.y) / zoom / imageScale.y;

      // Verificar regra: só pode existir 1 campo photo no back
      if (fieldType === 'photo' && currentSide === 'back') {
        const existingPhotoField = currentFields.find(f => 
          f.type === 'photo' && f.side === 'back'
        );
        if (existingPhotoField) {
          alert('Já existe um campo de foto no verso. Apenas um é permitido.');
          return;
        }
      }

      const fieldName = prompt(`Nome do campo ${fieldType === 'text' ? 'de texto' : 'de foto'}:`);
      if (!fieldName) return;

      setDrawing({
        id: crypto.randomUUID(),
        name: fieldName,
        type: fieldType,
        side: currentSide,
        x: mouseX,
        y: mouseY,
        width: 0,
        height: 0,
        required: false,
        locked: fieldType === 'photo' // Campo photo sempre locked
      });
    }
  }, [mode, currentImage, pan, zoom, imageScale, fieldType, currentSide, currentTemplate.fields]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y
      });
    } else if (isResizing && resizeHandle && selectedField) {
      const field = currentTemplate.fields.find(f => f.id === selectedField);
      if (!field || field.locked) return;

      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;

      let newWidth = field.width;
      let newHeight = field.height;
      let newX = field.x;
      let newY = field.y;

      // Calcular novo tamanho e posição baseado no handle
      if (resizeHandle.includes('right')) {
        newWidth = Math.max(50, field.width + deltaX);
      }
      if (resizeHandle.includes('left')) {
        newWidth = Math.max(50, field.width - deltaX);
        newX = field.x + (field.width - newWidth);
      }
      if (resizeHandle.includes('bottom')) {
        newHeight = Math.max(30, field.height + deltaY);
      }
      if (resizeHandle.includes('top')) {
        newHeight = Math.max(30, field.height - deltaY);
        newY = field.y + (field.height - newHeight);
      }

      updateField(selectedField, {
        width: newWidth,
        height: newHeight,
        x: newX,
        y: newY
      });
    } else if (drawing && currentImage) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      // Converter coordenadas do mouse para coordenadas da imagem original
      const currentMouseX = (e.clientX - rect.left - pan.x) / zoom / imageScale.x;
      const currentMouseY = (e.clientY - rect.top - pan.y) / zoom / imageScale.y;

      const width = currentMouseX - drawing.x;
      const height = currentMouseY - drawing.y;

      setDrawing({ ...drawing, width, height });
    }
  }, [isPanning, startPan, isResizing, resizeStart, resizeHandle, selectedField, currentTemplate, updateField, drawing, pan, zoom, imageScale]);

  const handleMouseUp = useCallback(() => {
    if (drawing && Math.abs(drawing.width) > 20 && Math.abs(drawing.height) > 20) {
      const newField = {
        ...drawing,
        width: Math.abs(drawing.width),
        height: Math.abs(drawing.height),
        x: drawing.width < 0 ? drawing.x + drawing.width : drawing.x,
        y: drawing.height < 0 ? drawing.y + drawing.height : drawing.y
      };

      const updatedTemplate = {
        ...currentTemplate,
        fields: [...currentTemplate.fields, newField]
      };

      onChange(updatedTemplate);
      setDrawing(null);
    }
    setIsResizing(false);
    setResizeHandle(null);
    setIsPanning(false);
  }, [drawing, currentTemplate, onChange]);

  const updateField = useCallback((fieldId: string, updates: Partial<TemplateField>) => {
    const updatedTemplate = {
      ...currentTemplate,
      fields: currentTemplate.fields.map(field => 
        field.id === fieldId ? { ...field, ...updates } : field
      )
    };
    onChange(updatedTemplate);
  }, [currentTemplate, onChange]);

  const deleteField = useCallback((fieldId: string) => {
    // Não permitir deletar campo photo locked
    const field = currentTemplate.fields.find(f => f.id === fieldId);
    if (field?.locked) {
      alert('Campo de foto não pode ser removido.');
      return;
    }

    const updatedTemplate = {
      ...currentTemplate,
      fields: currentTemplate.fields.filter(f => f.id !== fieldId)
    };
    onChange(updatedTemplate);
    setSelectedField(null);
  }, [currentTemplate, onChange]);

  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const handleImageUpload = (side: 'front' | 'back', file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      const updatedTemplate = {
        ...currentTemplate,
        [side === 'front' ? 'frontImageUrl' : 'backImageUrl']: imageUrl
      };
      onChange(updatedTemplate);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="w-full h-full flex flex-col bg-gray-900 text-white">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 bg-gray-800 border-b border-gray-700">
        {/* Modo */}
        <button 
          onClick={() => setMode("draw")} 
          className={`p-1 rounded ${mode === "draw" ? "text-blue-400 bg-blue-900/30" : "hover:bg-gray-700"}`}
          title="Modo Desenhar"
        >
          <Pencil size={18} />
        </button>
        <button 
          onClick={() => setMode("move")} 
          className={`p-1 rounded ${mode === "move" ? "text-blue-400 bg-blue-900/30" : "hover:bg-gray-700"}`}
          title="Modo Mover"
        >
          <Move size={18} />
        </button>

        <div className="w-px h-6 bg-gray-600" />

        {/* Tipo de Campo */}
        <button 
          onClick={() => setFieldType("text")} 
          className={`p-1 rounded ${fieldType === "text" ? "text-blue-400 bg-blue-900/30" : "hover:bg-gray-700"}`}
          title="Campo de Texto"
        >
          <Type size={18} />
        </button>
        <button 
          onClick={() => setFieldType("photo")} 
          className={`p-1 rounded ${fieldType === "photo" ? "text-blue-400 bg-blue-900/30" : "hover:bg-gray-700"} ${currentSide === 'back' ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={currentSide === 'back' ? "Fotos não permitidas no verso" : "Campo de Foto"}
          disabled={currentSide === 'back'}
        >
          <ImageIcon size={18} />
        </button>

        <div className="w-px h-6 bg-gray-600" />

        {/* Upload de Imagem */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Upload de Imagem - {currentSide === 'front' ? 'Frente' : 'Verso'}
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleImageUpload(currentSide, file);
              }
            }}
            className="block w-full text-sm text-gray-300 bg-gray-700 border border-gray-600 rounded-md p-2"
          />
        </div>

        {/* Zoom */}
        <button onClick={() => setZoom(z => Math.max(MIN_ZOOM, z - 0.1))} className="p-1 hover:bg-gray-700">
          <ZoomOut size={18} />
        </button>
        <span className="text-sm min-w-[45px] text-center">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom(z => Math.min(MAX_ZOOM, z + 0.1))} className="p-1 hover:bg-gray-700">
          <ZoomIn size={18} />
        </button>
        <button onClick={resetView} className="p-1 hover:bg-gray-700" title="Resetar Visualização">
          <Move size={18} />
        </button>
      </div>

      {/* Ações */}
      <div className="flex items-center gap-2 p-2 bg-gray-800 border-b border-gray-700">
        {selectedField && !currentTemplate.fields.find(f => f.id === selectedField)?.locked && (
          <button 
            onClick={() => deleteField(selectedField)} 
            className="p-1 hover:bg-red-600 text-red-400"
            title="Excluir Campo"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>

      {/* Botões de Lado */}
      <div className="flex items-center gap-1">
        <button 
          onClick={() => setCurrentSide('front')}
          className={`px-2 py-1 text-xs rounded ${currentSide === 'front' ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-500'}`}
        >
          Frente
        </button>
        {currentTemplate.backImageUrl && (
          <button
            onClick={() => setCurrentSide('back')}
            className={`px-2 py-1 text-xs rounded ${currentSide === 'back' ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-500'}`}
          >
            Verso
          </button>
        )}
      </div>

      <div className="w-px h-6 bg-gray-600" />

      {/* Canvas */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden relative"
        style={{ cursor: isPanning ? 'grabbing' : mode === 'move' ? 'grab' : 'crosshair' }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "top left",
            width: `${currentTemplate.width}px`,
            height: `${currentTemplate.height}px`,
          }}
          className="absolute top-0 left-0 bg-gray-800"
        >
          {/* Imagem de Fundo */}
          {currentImage && (
            <img
              ref={imageRef}
              src={currentImage}
              alt="Template"
              className="absolute top-0 left-0"
              style={{
                height: `${currentTemplate.height}px`,
              }}
              onLoad={() => {
                // Recalcular escala quando a imagem carregar
                const naturalWidth = imageRef.current?.naturalWidth;
                const naturalHeight = imageRef.current?.naturalHeight;
                
                if (naturalWidth && naturalHeight) {
                  const scaleX = currentTemplate.width / naturalWidth;
                  const scaleY = currentTemplate.height / naturalHeight;
                  setImageScale({ x: scaleX, y: scaleY });
                }
              }}
            />
          )}

          {/* Campos Existentes */}
          {currentFields.map(field => (
            <div
              key={field.id}
              onClick={() => setSelectedField(field.id)}
              style={{
                left: field.x * imageScale.x,
                top: field.y * imageScale.y,
                width: field.width * imageScale.x,
                height: field.height * imageScale.y,
              }}
              className={`absolute border-2 cursor-pointer transition-colors ${
                selectedField === field.id
                  ? 'border-yellow-400 bg-yellow-400/20'
                  : field.type === 'photo'
                  ? 'border-purple-500 bg-purple-500/20 hover:border-purple-400'
                  : 'border-blue-500 bg-blue-500/20 hover:border-blue-400'
              } ${field.locked ? 'pointer-events-none opacity-75' : ''}`}
            >
              <div className="absolute top-0 left-0 text-xs bg-black/50 text-white px-1 rounded-br">
                {field.name}
              </div>
              
              {/* Handles de redimensionamento */}
              {!field.locked && selectedField === field.id && (
                <>
                  <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-500 rounded-full cursor-nw-resize" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full cursor-ne-resize" />
                  <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-500 rounded-full cursor-sw-resize" />
                  <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 rounded-full cursor-se-resize" />
                </>
              )}
            </div>
          ))}

          {/* Campo sendo desenhado */}
          {drawing && (
            <div
              style={{
                left: drawing.x * imageScale.x,
                top: drawing.y * imageScale.y,
                width: Math.abs(drawing.width) * imageScale.x,
                height: Math.abs(drawing.height) * imageScale.y,
                border: '2px dashed #3b82f6',
              }}
              className="absolute border-2 border-dashed border-blue-400"
            />
          )}
        </div>
      </div>
    </div>
  );
}
