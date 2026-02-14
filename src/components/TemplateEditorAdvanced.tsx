import React, { useRef, useState, useCallback } from "react";
import { ZoomIn, ZoomOut, Move, Pencil, Maximize, Type, Image as ImageIcon, Trash2 } from "lucide-react";
import { Template, TemplateField, TemplateFieldType, TemplateSide } from "../types/template";

interface Props {
  template?: Template | null;
  onChange: (template: Template) => void;
  onSave?: () => void;
}

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;

export default function TemplateEditorAdvanced({ template, onChange, onSave }: Props) {
  const canvasRef = useRef<HTMLDivElement>(null);

  const [zoom, setZoom] = useState(1);
  const [mode, setMode] = useState<"move" | "draw">("draw");
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [currentSide, setCurrentSide] = useState<TemplateSide>('front');
  const [fieldType, setFieldType] = useState<TemplateFieldType>('text');
  const [selectedField, setSelectedField] = useState<string | null>(null);

  const [drawing, setDrawing] = useState<TemplateField | null>(null);

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

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(z => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z + delta)));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.altKey) {
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    if (mode === "draw" && currentImage) {
      const rect = canvasRef.current!.getBoundingClientRect();
      const x = (e.clientX - rect.left - pan.x) / zoom;
      const y = (e.clientY - rect.top - pan.y) / zoom;

      // Verificar regra: só pode existir 1 campo photo no back
      if (fieldType === 'photo' && currentSide === 'back') {
        const existingPhotoField = currentTemplate.fields.find(
          f => f.type === 'photo' && f.side === 'back'
        );
        if (existingPhotoField) {
          alert('Já existe um campo de foto no verso. Apenas um é permitido.');
          return;
        }
      }

      setDrawing({
        id: crypto.randomUUID(),
        name: fieldType === 'text' ? 'Texto' : 'Foto',
        type: fieldType,
        side: currentSide,
        x,
        y,
        width: 0,
        height: 0,
        required: false,
        locked: fieldType === 'photo' // Campo photo sempre locked
      });
    }
  }, [mode, currentImage, pan, zoom, fieldType, currentSide, currentTemplate.fields]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y,
      });
    }

    if (drawing) {
      const rect = canvasRef.current!.getBoundingClientRect();
      const width = (e.clientX - rect.left - pan.x) / zoom - drawing.x;
      const height = (e.clientY - rect.top - pan.y) / zoom - drawing.y;
      setDrawing({ ...drawing, width, height });
    }
  }, [isPanning, startPan, drawing, pan, zoom]);

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
    }
    setDrawing(null);
    setIsPanning(false);
  }, [drawing, currentTemplate, onChange]);

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

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

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

        <div className="w-px h-6 bg-gray-600" />

        {/* Lado do Template */}
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

        {/* Ações */}
        {selectedField && !currentTemplate.fields.find(f => f.id === selectedField)?.locked && (
          <button 
            onClick={() => deleteField(selectedField)} 
            className="p-1 hover:bg-red-600 text-red-400"
            title="Excluir Campo"
          >
            <Trash2 size={18} />
          </button>
        )}

        <div className="ml-auto flex items-center gap-2">
          {onSave && (
            <button 
              onClick={onSave} 
              className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm"
            >
              Salvar
            </button>
          )}
          <button onClick={toggleFullscreen} className="p-1 hover:bg-gray-700" title="Fullscreen">
            <Maximize size={18} />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
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
              src={currentImage}
              alt="Template"
              className="absolute top-0 left-0 w-full h-full object-contain"
              style={{
                width: `${currentTemplate.width}px`,
                height: `${currentTemplate.height}px`,
              }}
            />
          )}

          {/* Campos Existentes */}
          {currentFields.map(field => (
            <div
              key={field.id}
              onClick={() => setSelectedField(field.id)}
              style={{
                left: field.x,
                top: field.y,
                width: field.width,
                height: field.height,
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
              {field.locked && (
                <div className="absolute top-0 right-0 text-xs bg-red-500 text-white px-1 rounded-bl">
                  🔒
                </div>
              )}
            </div>
          ))}

          {/* Campo Sendo Desenhado */}
          {drawing && (
            <div
              style={{
                left: drawing.x,
                top: drawing.y,
                width: drawing.width,
                height: drawing.height,
              }}
              className={`absolute border-2 border-blue-400 bg-blue-400/20 pointer-events-none ${
                drawing.type === 'photo' ? 'border-purple-400 bg-purple-400/20' : ''
              }`}
            />
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between p-2 bg-gray-800 border-t border-gray-700 text-xs">
        <div className="flex items-center gap-4">
          <span>Lado: {currentSide === 'front' ? 'Frente' : 'Verso'}</span>
          <span>Campos: {currentFields.length}</span>
          <span>Modo: {mode === 'draw' ? 'Desenhar' : 'Mover'}</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Zoom: {Math.round(zoom * 100)}%</span>
          <span>Alt + Arrastar: Pan</span>
        </div>
      </div>
    </div>
  );
}
