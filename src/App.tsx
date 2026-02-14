import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Settings, Printer, Save, Trash2, Plus, Type, Image as ImageIcon, Crop, Scissors, Sparkles, Scale, Gavel } from 'lucide-react';
import { supabase, salvarTemplateSupabase, carregarTemplatesSupabase, salvarCarteirinhaSupabase } from './lib/supabase';
import Cropper from 'react-easy-crop';

// --- TIPOS ---
interface Field {
  id: string;
  type: 'texto' | 'foto';
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
}

interface TemplateData {
  id: string;
  name: string;
  frenteImg: string | null;
  versoImg: string | null;
  frenteCampos: Field[];
  versoCampos: Field[];
}

interface SavedTemplate {
  id: string;
  name: string;
  data: TemplateData;
  created_at: string;
}

interface CarteirinhaData {
  nome: string;
  cpf: string;
  oab: string;
  foto?: string;
}

// --- COMPONENTE EDITOR DE CAMPOS ---
function FieldEditor({ field, onUpdate, onDelete }: {
  field: Field;
  onUpdate: (field: Field) => void;
  onDelete: () => void;
}) {
  return (
    <div className="bg-white border-2 border-blue-500 rounded-lg p-4 shadow-lg">
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-bold text-blue-600">{field.name}</span>
        <button 
          onClick={onDelete}
          className="text-red-500 hover:text-red-700"
        >
          <Trash2 size={14} />
        </button>
      </div>
      
      <div className="space-y-3 text-sm">
        <div className="flex items-center gap-2">
          <label className="font-medium min-w-[40px]">Tipo:</label>
          <select
            value={field.type}
            onChange={(e) => onUpdate({ ...field, type: e.target.value as 'texto' | 'foto' })}
            className="border rounded px-2 py-1 flex-1"
          >
            <option value="texto">Texto</option>
            <option value="foto">Foto</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="font-medium min-w-[40px]">Nome:</label>
          <input
            type="text"
            value={field.name}
            onChange={(e) => onUpdate({ ...field, name: e.target.value })}
            className="border rounded px-2 py-1 flex-1"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-1">
            <label className="font-medium">X:</label>
            <input
              type="number"
              value={field.x}
              onChange={(e) => onUpdate({ ...field, x: parseInt(e.target.value) })}
              className="border rounded px-2 py-1 w-20"
            />
          </div>
          <div className="flex items-center gap-1">
            <label className="font-medium">Y:</label>
            <input
              type="number"
              value={field.y}
              onChange={(e) => onUpdate({ ...field, y: parseInt(e.target.value) })}
              className="border rounded px-2 py-1 w-20"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-1">
            <label className="font-medium">L:</label>
            <input
              type="number"
              value={field.w}
              onChange={(e) => onUpdate({ ...field, w: parseInt(e.target.value) })}
              className="border rounded px-2 py-1 w-20"
            />
          </div>
          <div className="flex items-center gap-1">
            <label className="font-medium">A:</label>
            <input
              type="number"
              value={field.h}
              onChange={(e) => onUpdate({ ...field, h: parseInt(e.target.value) })}
              className="border rounded px-2 py-1 w-20"
            />
          </div>
        </div>
        
        {field.type === 'texto' && (
          <>
            <div className="flex items-center gap-2">
              <label className="font-medium min-w-[40px]">Fonte:</label>
              <input
                type="number"
                value={field.fontSize || 14}
                onChange={(e) => onUpdate({ ...field, fontSize: parseInt(e.target.value) })}
                className="border rounded px-2 py-1 w-20"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="font-medium min-w-[40px]">Cor:</label>
              <input
                type="color"
                value={field.color || '#000000'}
                onChange={(e) => onUpdate({ ...field, color: e.target.value })}
                className="w-12 h-8 border rounded"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// --- COMPONENTE EDITOR DE TEMPLATE ---
function TemplateEditor({ template, onTemplateChange, onSave }: {
  template: TemplateData;
  onTemplateChange: (template: TemplateData) => void;
  onSave: () => void;
}) {
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [isAddingField, setIsAddingField] = useState(false);
  const [fieldType, setFieldType] = useState<'texto' | 'foto'>('texto');
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [activeSide, setActiveSide] = useState<'frente' | 'verso'>('frente');
  const canvasRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [activeTab, setActiveTab] = useState<'criar' | 'templates'>('criar');
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>([]);

  // Carregar templates salvos
  useEffect(() => {
    const carregarTemplates = async () => {
      try {
        const templates = await carregarTemplatesSupabase();
        setSavedTemplates(templates);
      } catch (error) {
        console.error('Erro ao carregar templates:', error);
      }
    };
    
    if (activeTab === 'templates') {
      carregarTemplates();
    }
  }, [activeTab]);

  const deleteTemplate = async (id: string) => {
    try {
      await supabase
        .from('templates')
        .delete()
        .eq('id', id);
      
      const templates = await carregarTemplatesSupabase();
      setSavedTemplates(templates);
    } catch (error) {
      console.error('Erro ao deletar template:', error);
    }
  };

  const handleImageUpload = (side: 'frente' | 'verso', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        onTemplateChange({
          ...template,
          [side === 'frente' ? 'frenteImg' : 'versoImg']: base64
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const addField = (x: number, y: number) => {
    console.log('addField chamado com:', { x, y });
    
    const newField: Field = {
      id: Date.now().toString(),
      type: fieldType,
      name: `Campo ${template.frenteCampos.length + template.versoCampos.length + 1}`,
      x,
      y,
      w: fieldType === 'foto' ? 80 : 120,
      h: fieldType === 'foto' ? 80 : 20,
      fontSize: fieldType === 'texto' ? 14 : undefined,
      fontFamily: 'Arial',
      color: '#000000'
    };
    
    console.log('Novo campo criado:', newField);

    const camposAtuais = activeSide === 'frente' ? template.frenteCampos : template.versoCampos;
    const novosCampos = [...camposAtuais, newField];
    
    console.log('Campos atuais:', camposAtuais.length);
    console.log('Novos campos:', novosCampos.length);
    
    onTemplateChange({
      ...template,
      [activeSide === 'frente' ? 'frenteCampos' : 'versoCampos']: novosCampos
    });
    
    console.log('Template atualizado');
    setIsAddingField(false);
    setSelectedField(newField);
    
    console.log('Campo adicionado com sucesso');
  };

  const updateField = (fieldId: string, updates: Partial<Field>) => {
    const camposAtuais = activeSide === 'frente' ? template.frenteCampos : template.versoCampos;
    const camposAtualizados = camposAtuais.map(field =>
      field.id === fieldId ? { ...field, ...updates } : field
    );
    
    onTemplateChange({
      ...template,
      [activeSide === 'frente' ? 'frenteCampos' : 'versoCampos']: camposAtualizados
    });
  };

  const deleteField = (fieldId: string) => {
    const camposAtuais = activeSide === 'frente' ? template.frenteCampos : template.versoCampos;
    const camposFiltrados = camposAtuais.filter(field => field.id !== fieldId);
    
    onTemplateChange({
      ...template,
      [activeSide === 'frente' ? 'frenteCampos' : 'versoCampos']: camposFiltrados
    });
    
    if (selectedField?.id === fieldId) {
      setSelectedField(null);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPanning) return;
    
    const imagemAtual = activeSide === 'frente' ? template.frenteImg : template.versoImg;
    
    console.log('Canvas click:', {
      isAddingField,
      imagemAtual: !!imagemAtual,
      activeSide,
      templateFrenteImg: !!template.frenteImg,
      templateVersoImg: !!template.versoImg
    });
    
    if (!isAddingField || !imagemAtual) {
      console.log('Não pode adicionar campo:', {
        isAddingField,
        imagemAtual: !!imagemAtual
      });
      return;
    }
    
    const rect = canvasRef.current?.getBoundingClientRect();
    console.log('Canvas rect:', rect);
    if (rect) {
      // Ajustar coordenadas considerando zoom e pan
      const x = (e.clientX - rect.left - pan.x) / zoom;
      const y = (e.clientY - rect.top - pan.y) / zoom;
      console.log('Adicionando campo em:', { x, y });
      addField(x, y);
    } else {
      console.log('Canvas rect é nulo');
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(Math.max(0.5, zoom * delta), 3);
    setZoom(newZoom);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      // Botão direito ou Shift+esquerdo para pan
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    }
  };

  const handleCanvasMouseUp = () => {
    setIsPanning(false);
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (fieldId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const target = e.target as HTMLElement;
    const handle = target.getAttribute('data-resize-handle');
    
    if (handle) {
      // Redimensionamento
      setIsResizing(fieldId);
      setResizeHandle(handle);
    } else {
      // Arrastar
      setIsDragging(fieldId);
    }
    
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    const camposAtuais = activeSide === 'frente' ? template.frenteCampos : template.versoCampos;
    
    if (isDragging) {
      // Arrastar campo
      const field = camposAtuais.find(f => f.id === isDragging);
      if (field) {
        const newX = Math.max(0, Math.min(field.x + deltaX, rect.width - field.w));
        const newY = Math.max(0, Math.min(field.y + deltaY, rect.height - field.h));
        
        updateField(isDragging, { x: newX, y: newY });
        setDragStart({ x: e.clientX, y: e.clientY });
      }
    } else if (isResizing) {
      // Redimensionar campo
      const field = camposAtuais.find(f => f.id === isResizing);
      if (field) {
        let newW = field.w;
        let newH = field.h;
        let newX = field.x;
        let newY = field.y;
        
        if (resizeHandle?.includes('right')) {
          newW = Math.max(30, field.w + deltaX);
        }
        if (resizeHandle?.includes('bottom')) {
          newH = Math.max(30, field.h + deltaY);
        }
        if (resizeHandle?.includes('left')) {
          const deltaW = Math.min(deltaX, field.w - 30);
          newW = field.w - deltaW;
          newX = field.x + deltaW;
        }
        if (resizeHandle?.includes('top')) {
          const deltaH = Math.min(deltaY, field.h - 30);
          newH = field.h - deltaH;
          newY = field.y + deltaH;
        }
        
        updateField(isResizing, { x: newX, y: newY, w: newW, h: newH });
        setDragStart({ x: e.clientX, y: e.clientY });
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(null);
    setIsResizing(null);
    setResizeHandle(null);
  };

  return (
    <div className="space-y-6">
      {/* Abas de Navegação */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('criar')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'criar'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          📝 Criar Novo Template
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'templates'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          📁 Templates Salvos
        </button>
      </div>

      {/* Conteúdo das Abas */}
      {activeTab === 'criar' ? (
        <div className="space-y-6">
          {/* Nome do Template */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Template</label>
            <input
              type="text"
              value={template.name}
              onChange={(e) => onTemplateChange({...template, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nome do template"
            />
          </div>

          {/* Upload de Imagens */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Base Frente</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload('frente', e)}
                className="text-xs w-full"
              />
              {template.frenteImg && (
                <img
                  src={template.frenteImg}
                  alt="Frente"
                  className="mt-2 w-full h-32 object-cover rounded border"
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Base Verso</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload('verso', e)}
                className="text-xs w-full"
              />
              {template.versoImg && (
                <img
                  src={template.versoImg}
                  alt="Verso"
                  className="mt-2 w-full h-32 object-cover rounded border"
                />
              )}
            </div>
          </div>

          {/* Seletor de Lado */}
          <div className="flex justify-center">
            <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
              <button
                onClick={() => setActiveSide('frente')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeSide === 'frente'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Frente
              </button>
              <button
                onClick={() => setActiveSide('verso')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeSide === 'verso'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Verso
              </button>
            </div>
          </div>

          {/* Editor Visual */}
          {((activeSide === 'frente' && template.frenteImg) || (activeSide === 'verso' && template.versoImg)) && (
            <div className="flex gap-6">
              {/* Canvas Principal */}
              <div className="flex-1">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg">Editor de Campos - {activeSide === 'frente' ? 'Frente' : 'Verso'}</h3>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-2 bg-gray-100 rounded px-2 py-1">
                      <span className="text-xs font-medium">Zoom:</span>
                      <span className="text-xs">{Math.round(zoom * 100)}%</span>
                      <button
                        onClick={resetView}
                        className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                      >
                        Reset
                      </button>
                    </div>
                    <select
                      value={fieldType}
                      onChange={(e) => setFieldType(e.target.value as 'texto' | 'foto')}
                      className="px-2 py-1 border rounded text-sm"
                    >
                      <option value="texto">Texto</option>
                      <option value="foto">Foto</option>
                    </select>
                    <button
                      onClick={() => setIsAddingField(!isAddingField)}
                      className={`px-3 py-1 rounded text-sm flex items-center gap-1 ${
                        isAddingField
                          ? 'bg-red-500 text-white'
                          : 'bg-amber-500 text-white'
                      }`}
                    >
                      <Plus size={14} />
                      {isAddingField ? 'Cancelar' : 'Adicionar Campo'}
                    </button>
                  </div>
                </div>
                <div
                  ref={canvasRef}
                  className={`relative border-2 border-gray-300 rounded-lg overflow-hidden ${
                    isAddingField ? 'cursor-crosshair' : isPanning ? 'cursor-move' : 'cursor-default'
                  }`}
                  onClick={handleCanvasClick}
                  onWheel={handleWheel}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={handleCanvasMouseUp}
                  style={{
                    backgroundImage: `url(${activeSide === 'frente' ? template.frenteImg : template.versoImg})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    width: '100%',
                    height: '500px',
                    transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
                    transformOrigin: 'top left'
                  }}
                >
                  {/* Campos aqui... */}
                </div>
              </div>

              {/* Editor de Propriedades Lateral */}
              <div className="w-80">
                <h4 className="font-bold text-lg mb-4">Propriedades do Campo</h4>
                {selectedField ? (
                  <FieldEditor
                    field={selectedField}
                    onUpdate={(field) => updateField(field.id, field)}
                    onDelete={() => deleteField(selectedField.id)}
                  />
                ) : (
                  <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <p className="text-gray-500 text-sm">Selecione um campo para editar</p>
                    <p className="text-gray-400 text-xs mt-2">Clique em qualquer campo no canvas</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Botão Salvar */}
          <button
            onClick={onSave}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-lg font-bold flex justify-center items-center gap-2 shadow-md transition-all hover:shadow-lg"
          >
            <Save size={16} /> Salvar Template no Supabase
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="font-bold text-lg">Templates Salvos</h3>
          {savedTemplates.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Nenhum template salvo ainda</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedTemplates.map((t) => (
                <div key={t.id} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{t.name}</h4>
                    <button 
                      onClick={() => deleteTemplate(t.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>{t.data.frenteCampos.length} campos na frente</p>
                    <p>{t.data.versoCampos.length} campos no verso</p>
                    <p className="text-xs mt-1">Criado em: {new Date(t.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- COMPONENTE EDITOR DE DADOS DE CAMPO ---
function FieldDataEditor({ field, value, onChange, onClose }: {
  field: Field;
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 shadow-xl max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Editar Campo: {field.name}</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.type === 'texto' ? 'Texto do Campo' : 'URL da Foto'}
            </label>
            {field.type === 'texto' ? (
              <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder={`Digite o texto para ${field.name}`}
                autoFocus
              />
            ) : (
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        onChange(event.target?.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full text-sm"
                />
                {value && (
                  <img
                    src={value}
                    alt="Preview"
                    className="mt-2 w-32 h-24 object-cover rounded border"
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- COMPONENTE PREVIEW INTERATIVO ---
function InteractivePreview({ template, dados, foto, onFieldClick, onFieldDataChange }: {
  template: TemplateData;
  dados: CarteirinhaData;
  foto: string | null;
  onFieldClick: (field: Field) => void;
  onFieldDataChange: (fieldId: string, value: string) => void;
}) {
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const values: Record<string, string> = {};
    template.frenteCampos.forEach(campo => {
      if (campo.type === 'texto') {
        switch (campo.name.toLowerCase()) {
          case 'nome':
            values[campo.id] = dados.nome;
            break;
          case 'cpf':
            values[campo.id] = dados.cpf;
            break;
          case 'oab':
            values[campo.id] = dados.oab;
            break;
          default:
            values[campo.id] = '';
        }
      } else if (campo.type === 'foto') {
        values[campo.id] = foto || '';
      }
    });
    setFieldValues(values);
  }, [template, dados, foto]);

  const handlePreviewClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = previewRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Verificar se clicou em algum campo
    const clickedField = template.frenteCampos.find(campo => {
      // Obter dimensões reais da imagem
      const img = previewRef.current?.querySelector('img');
      if (!img) return false;
      
      const imgRect = img.getBoundingClientRect();
      
      // Calcular escala
      const scaleX = imgRect.width / 600; // 600 é a largura original do canvas
      const scaleY = imgRect.height / 400; // 400 é a altura original do canvas
      
      // Posição e tamanho escalados
      const campoX = campo.x * scaleX;
      const campoY = campo.y * scaleY;
      const campoW = campo.w * scaleX;
      const campoH = campo.h * scaleY;
      
      return x >= campoX && x <= campoX + campoW && y >= campoY && y <= campoY + campoH;
    });
    
    if (clickedField) {
      setSelectedField(clickedField);
      onFieldClick(clickedField);
    }
  };

  return (
    <div className="space-y-4">
      <h4 className="font-medium mb-2">Preview Interativo - Clique nos campos para editar</h4>
      <div className="border rounded-lg p-4 bg-gray-50">
        {template.frenteImg ? (
          <div 
            ref={previewRef}
            className="relative cursor-pointer" 
            style={{ width: 'fit-content' }}
            onClick={handlePreviewClick}
          >
            <img
              src={template.frenteImg}
              alt="Template"
              style={{ maxWidth: '400px' }}
            />
            {template.frenteCampos.map((campo) => (
              <div
                key={campo.id}
                className={`absolute border-2 transition-all ${
                  selectedField?.id === campo.id
                    ? 'border-blue-500 bg-blue-100/50'
                    : campo.type === 'texto'
                    ? 'border-green-500 bg-green-100/50'
                    : 'border-purple-500 bg-purple-100/50'
                }`}
                style={{
                  left: `${(campo.x / 600) * 100}%`,
                  top: `${(campo.y / 400) * 100}%`,
                  width: `${(campo.w / 600) * 100}%`,
                  height: `${(campo.h / 400) * 100}%`,
                  fontSize: campo.fontSize ? `${(campo.fontSize / 14) * 10}px` : '10px',
                  color: campo.color,
                  fontFamily: campo.fontFamily,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  cursor: 'pointer'
                }}
              >
                {campo.type === 'texto' ? (
                  <span className="truncate px-1">{(fieldValues && fieldValues[campo.id]) || campo.name}</span>
                ) : (
                  fieldValues && fieldValues[campo.id] && (
                    <img 
                      src={fieldValues[campo.id]} 
                      alt="Campo Foto" 
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover' 
                      }} 
                    />
                  )
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Nenhuma imagem de template</p>
        )}
      </div>
      
      {/* Modal de Edição de Campo */}
      {selectedField && (
        <FieldDataEditor
          field={selectedField}
          value={fieldValues[selectedField.id] || ''}
          onChange={(value) => {
            setFieldValues(prev => ({ ...prev, [selectedField.id]: value }));
            onFieldDataChange(selectedField.id, value);
          }}
          onClose={() => setSelectedField(null)}
        />
      )}
    </div>
  );
}

// --- COMPONENTE GERADOR DE CARTEIRINHA ---
function CarteirinhaGenerator({ templates, selectedTemplate, onTemplateSelect }: {
  templates: SavedTemplate[];
  selectedTemplate: TemplateData | null;
  onTemplateSelect: (template: TemplateData) => void;
}) {
  const [dados, setDados] = useState<CarteirinhaData>({
    nome: '',
    cpf: '',
    oab: ''
  });
  const [foto, setFoto] = useState<string | null>(null);
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [showCropper, setShowCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [previewData, setPreviewData] = useState<Record<string, string>>({});
  const [isProcessingAI, setIsProcessingAI] = useState(false);

  const handleFotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageToCrop(event.target?.result as string);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const createImage = (url: string) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async (imageSrc: string, pixelCrop: any) => {
    const image = await createImage(imageSrc) as any;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return null;
    }

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(URL.createObjectURL(blob));
        } else {
          resolve(null);
        }
      }, 'image/jpeg');
    });
  };

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropConfirm = async () => {
    if (imageToCrop && croppedAreaPixels) {
      try {
        const croppedImage = await getCroppedImg(imageToCrop, croppedAreaPixels);
        if (croppedImage) {
          setFoto(croppedImage as string);
          setShowCropper(false);
          setImageToCrop(null);
        }
      } catch (error) {
        console.error('Erro ao cortar imagem:', error);
        alert('Erro ao cortar imagem. Tente novamente.');
      }
    }
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setImageToCrop(null);
  };

  const removeBackground = async (imageSrc: string): Promise<string> => {
    try {
      // Usar uma API de remoção de background (ex: remove.bg)
      // Para este exemplo, vamos simular com canvas
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      return new Promise((resolve, reject) => {
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Canvas context not available'));
            return;
          }
          
          canvas.width = img.width;
          canvas.height = img.height;
          
          // Desenhar imagem
          ctx.drawImage(img, 0, 0);
          
          // Obter dados da imagem
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          // Simular remoção de background (simplificado)
          // Na prática, você usaria uma API real como remove.bg
          for (let i = 0; i < data.length; i += 4) {
            // Detectar pixels claros (background típico)
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Se o pixel for muito claro, tornar transparente
            if (r > 200 && g > 200 && b > 200) {
              data[i + 3] = 0; // Alpha = 0 (transparente)
            }
          }
          
          ctx.putImageData(imageData, 0, 0);
          
          // Converter para blob
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(URL.createObjectURL(blob));
            } else {
              reject(new Error('Failed to create blob'));
            }
          }, 'image/png');
        };
        
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = imageSrc;
      });
    } catch (error) {
      console.error('Error removing background:', error);
      throw error;
    }
  };

  const enhancePhotoWithAI = async () => {
    if (!foto) return;
    
    setIsProcessingAI(true);
    
    try {
      // Passo 1: Remover background
      const imageWithoutBg = await removeBackground(foto);
      
      // Passo 2: Aplicar melhorias (brilho, contraste, saturação)
      const enhancedImage = await enhanceImageQuality(imageWithoutBg);
      
      setFoto(enhancedImage);
      alert('Foto aprimorada com IA! Background removido e qualidade melhorada.');
    } catch (error) {
      console.error('Erro ao processar foto com IA:', error);
      alert('Erro ao processar foto. Tente novamente.');
    } finally {
      setIsProcessingAI(false);
    }
  };

  const enhanceImageQuality = async (imageSrc: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Aplicar filtros de melhoria
        ctx.filter = 'contrast(1.1) brightness(1.05) saturate(1.1)';
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(URL.createObjectURL(blob));
          } else {
            reject(new Error('Failed to create blob'));
          }
        }, 'image/jpeg', 0.95);
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageSrc;
    });
  };

  const handleFieldClick = (field: Field) => {
    setSelectedField(field);
  };

  const handleFieldDataChange = (fieldId: string, value: string) => {
    setFieldValues(prev => ({ ...prev, [fieldId]: value }));
    
    // Atualizar dados principais se for um campo correspondente
    const campo = selectedTemplate?.frenteCampos.find(c => c.id === fieldId);
    if (campo) {
      switch (campo.name.toLowerCase()) {
        case 'nome':
          setDados(prev => ({ ...prev, nome: value }));
          break;
        case 'cpf':
          setDados(prev => ({ ...prev, cpf: value }));
          break;
        case 'oab':
          setDados(prev => ({ ...prev, oab: value }));
          break;
      }
    }
  };

  const handleFieldEditorClose = () => {
    setSelectedField(null);
  };

  const gerarCarteirinha = async () => {
    if (!selectedTemplate) {
      alert('Selecione um template primeiro!');
      return;
    }

    if (!dados.nome || !dados.cpf || !dados.oab) {
      alert('Preencha todos os dados!');
      return;
    }

    // Mapear dados para os campos
    const campoDados: Record<string, string> = {
      nome: dados.nome,
      cpf: dados.cpf,
      oab: dados.oab,
      ...fieldValues // Adicionar valores dos campos editados
    };

    // Adicionar foto se existir
    if (foto) {
      campoDados.foto = foto;
    }

    try {
      // Salvar carteirinha no Supabase
      await salvarCarteirinhaSupabase({
        nome: dados.nome,
        templateId: selectedTemplate.id,
        templateName: selectedTemplate.name,
        dados: campoDados,
        fotos: foto ? [foto] : [],
        frenteUrl: selectedTemplate.frenteImg,
        versoUrl: selectedTemplate.versoImg,
        emitidaEm: new Date().toISOString()
      });

      alert('Carteirinha salva com sucesso no Supabase!');
    } catch (error) {
      console.error('Erro ao salvar carteirinha:', error);
      alert('Erro ao salvar carteirinha. Tente novamente.');
    }
  };

  useEffect(() => {
    if (selectedTemplate) {
      const novoPreview: Record<string, string> = {};
      selectedTemplate.frenteCampos.forEach(campo => {
        if (campo.type === 'texto') {
          switch (campo.name.toLowerCase()) {
            case 'nome':
              novoPreview[campo.id] = dados.nome;
              break;
            case 'cpf':
              novoPreview[campo.id] = dados.cpf;
              break;
            case 'oab':
              novoPreview[campo.id] = dados.oab;
              break;
            default:
              novoPreview[campo.id] = campo.name;
          }
        } else if (campo.type === 'foto') {
          novoPreview[campo.id] = foto || '';
        }
      });
      setPreviewData(novoPreview);
    }
  }, [selectedTemplate, dados, foto]);

  return (
    <div className="space-y-6">
      {/* Seleção de Template */}
      <div>
        <h3 className="font-bold text-lg mb-4">Selecionar Template</h3>
        <div className="space-y-2">
          {templates.length === 0 ? (
            <p className="text-sm text-gray-500 italic">Nenhum template disponível</p>
          ) : (
            templates.map((t) => (
              <button
                key={t.id}
                onClick={() => onTemplateSelect(t.data)}
                className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                  selectedTemplate?.id === t.data.id
                    ? 'bg-green-50 border-green-500'
                    : 'bg-gray-50 border-transparent hover:bg-green-50 hover:border-green-500'
                }`}
              >
                <div className="font-medium">{t.name}</div>
                <div className="text-xs text-gray-500">
                  {t.data.frenteCampos.length} campos configurados
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Dados da Carteirinha */}
      {selectedTemplate && (
        <div>
          <h3 className="font-bold text-lg mb-4">Dados da Carteirinha</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo</label>
              <input
                type="text"
                value={dados.nome}
                onChange={(e) => setDados({ ...dados, nome: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Digite o nome completo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">CPF</label>
              <input
                type="text"
                value={dados.cpf}
                onChange={(e) => setDados({ ...dados, cpf: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="000.000.000-00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">OAB/UF</label>
              <input
                type="text"
                value={dados.oab}
                onChange={(e) => setDados({ ...dados, oab: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="123456/SP"
              />
            </div>

            {/* Verificar se existe campo de foto no template */}
            {selectedTemplate.frenteCampos.some(c => c.type === 'foto') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Foto</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFotoUpload}
                  className="text-xs w-full"
                />
                {foto && (
                  <div className="mt-2 space-y-2">
                    <img
                      src={foto}
                      alt="Foto"
                      className="w-24 h-24 object-cover rounded border"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setImageToCrop(foto);
                          setShowCropper(true);
                        }}
                        className="flex items-center gap-2 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                      >
                        <Scissors size={14} />
                        Cortar
                      </button>
                      <button
                        onClick={enhancePhotoWithAI}
                        disabled={isProcessingAI}
                        className="flex items-center gap-2 px-3 py-1 bg-amber-500 text-white rounded text-sm hover:bg-amber-600 disabled:bg-gray-400"
                      >
                        <Sparkles size={14} />
                        {isProcessingAI ? 'Processando...' : 'IA'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Preview Interativo */}
            <InteractivePreview
              template={selectedTemplate}
              dados={dados}
              foto={foto}
              onFieldClick={handleFieldClick}
              onFieldDataChange={handleFieldDataChange}
            />

            {/* Modal de Corte de Foto */}
      {showCropper && imageToCrop && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Cortar Foto</h3>
              <button 
                onClick={handleCropCancel}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="relative h-96 mb-4">
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Zoom</label>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full"
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleCropConfirm}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2 px-4 rounded font-medium"
              >
                Confirmar Corte
              </button>
              <button
                onClick={handleCropCancel}
                className="flex-1 bg-slate-500 hover:bg-slate-600 text-white py-2 px-4 rounded font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gerar Documento Button */}
      <button
        onClick={gerarCarteirinha}
        className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-lg font-bold flex justify-center items-center gap-2 shadow-md transition-all hover:shadow-lg"
      >
        <Printer size={16} /> Gerar Documento
      </button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- TELA PRINCIPAL ---
export default function App() {
  const [mode, setMode] = useState<'admin' | 'gerador'>('admin');
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>([]);
  const [currentTemplate, setCurrentTemplate] = useState<TemplateData>({
    id: Date.now().toString(),
    name: 'Novo Template',
    frenteImg: null,
    versoImg: null,
    frenteCampos: [],
    versoCampos: []
  });
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateData | null>(null);

  // Carregar dados do Supabase
  useEffect(() => {
    const carregarDados = async () => {
      try {
        const templates = await carregarTemplatesSupabase();
        setSavedTemplates(templates);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      }
    };
    
    carregarDados();
  }, []);

  const deleteTemplate = async (id: string) => {
    try {
      await supabase
        .from('templates')
        .delete()
        .eq('id', id);
      
      const templates = await carregarTemplatesSupabase();
      setSavedTemplates(templates);
    } catch (error) {
      console.error('Erro ao deletar template:', error);
    }
  };

  const salvarTemplateAdmin = async () => {
    if (!currentTemplate.name.trim()) {
      alert('Digite um nome para o template!');
      return;
    }

    if (!currentTemplate.frenteImg) {
      alert('Carregue uma imagem para a frente!');
      return;
    }

    try {
      await salvarTemplateSupabase(
        currentTemplate,
        currentTemplate.frenteImg || '',
        currentTemplate.versoImg || '',
        currentTemplate.frenteCampos
      );
      
      alert('Template salvo com sucesso no Supabase!');
      
      const templates = await carregarTemplatesSupabase();
      setSavedTemplates(templates);
      
    } catch (error) {
      console.error('Erro ao salvar template:', error);
      alert('Erro ao salvar template. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50">
      {/* HEADER JUSTIÇA STYLE */}
      <header className="bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-lg sticky top-0 z-50 border-b-4 border-amber-500">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="bg-amber-500 p-3 rounded-lg shadow-md">
                <div className="w-8 h-8 bg-slate-900 rounded flex items-center justify-center">
                  <Gavel size={20} className="text-amber-500" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold">Sistema de Justiça</h1>
                <p className="text-slate-300 text-sm">Emissão de Documentos Oficiais</p>
              </div>
            </div>
            
            <div className="flex bg-slate-700/50 p-1 rounded-lg backdrop-blur">
              <button 
                onClick={() => setMode('admin')}
                className={`px-6 py-3 rounded-md flex items-center gap-2 text-sm font-medium transition-all ${
                  mode === 'admin'
                    ? 'bg-amber-500 text-slate-900 shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Settings size={16} /> Criar Template
              </button>
              <button 
                onClick={() => setMode('gerador')}
                className={`px-6 py-3 rounded-md flex items-center gap-2 text-sm font-medium transition-all ${
                  mode === 'gerador'
                    ? 'bg-amber-500 text-slate-900 shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Printer size={16} /> Emitir Documento
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* CONTEÚDO */}
      <main className="flex-1 p-6 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-7xl mx-auto">
          {mode === 'admin' ? (
            <div className="bg-white rounded-xl shadow-lg p-8 border-l-4 border-amber-500">
              <h2 className="text-2xl font-bold text-center mb-8 text-slate-800">
                ⚖️ Módulo Administrativo - Criar Templates
              </h2>
              <p className="text-center text-slate-600 mb-8">
                Configure templates para emissão de documentos oficiais com editor visual completo
              </p>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Templates Salvos */}
                <div className="lg:col-span-1">
                  <h3 className="font-bold text-lg mb-4">Templates Salvos</h3>
                  <div className="space-y-2">
                    {savedTemplates.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">Nenhum template salvo</p>
                    ) : (
                      savedTemplates.map((t) => (
                        <div key={t.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <button 
                            onClick={() => setCurrentTemplate(t.data)}
                            className="flex-1 text-left text-sm font-medium hover:text-green-700"
                          >
                            {t.name}
                          </button>
                          <button 
                            onClick={() => deleteTemplate(t.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                
                {/* Editor */}
                <div className="lg:col-span-2">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Template</label>
                    <input
                      type="text"
                      value={currentTemplate.name}
                      onChange={(e) => setCurrentTemplate({...currentTemplate, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Nome do template"
                    />
                  </div>
                  
                  <TemplateEditor
                    template={currentTemplate}
                    onTemplateChange={setCurrentTemplate}
                    onSave={salvarTemplateAdmin}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg p-8 border-l-4 border-amber-500">
              <h2 className="text-2xl font-bold text-center mb-8 text-slate-800">
                ⚖️ Módulo Gerador - Emitir Documentos
              </h2>
              <p className="text-center text-slate-600 mb-8">
                Selecione um template e preencha os dados para emissão oficial
              </p>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CarteirinhaGenerator
                  templates={savedTemplates}
                  selectedTemplate={selectedTemplate}
                  onTemplateSelect={setSelectedTemplate}
                />
                
                <div>
                  <h3 className="font-bold text-lg mb-4">Template Selecionado</h3>
                  {selectedTemplate ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium">{selectedTemplate.name}</h4>
                        <p className="text-sm text-gray-600">
                          {selectedTemplate.frenteCampos.length} campos configurados
                        </p>
                        <div className="text-xs text-gray-500 mt-2">
                          Campos: {selectedTemplate.frenteCampos.map(c => 
                            `${c.name} (${c.type})`
                          ).join(', ')}
                        </div>
                      </div>
                      
                      {selectedTemplate.frenteImg && (
                        <div>
                          <h4 className="font-medium mb-2">Preview do Template</h4>
                          <img
                            src={selectedTemplate.frenteImg}
                            alt="Template Preview"
                            className="w-full rounded border"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">Selecione um template para visualizar</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
