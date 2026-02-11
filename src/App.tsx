import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Text, Rect, Transformer } from 'react-konva';
import useImage from 'use-image';
import { 
  Settings, Printer, Upload, Type, Image as ImageIcon, 
  Trash2, Save, CheckCircle2, ChevronRight, Download,
  Edit3, RotateCw, FolderOpen, X, ZoomIn, Palette
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Cropper from 'react-easy-crop';
import { API_CONFIG } from './config';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- TIPOS ---
type FieldType = 'texto' | 'foto';
type FaceType = 'frente' | 'verso';

interface Field {
  id: string;
  type: FieldType;
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
  createdAt: string;
}

interface SavedTemplate {
  id: string;
  name: string;
  data: TemplateData;
}

// --- COMPONENTE DE EDITOR DE FOTO ---
const PhotoEditor = ({ 
  imageUrl, 
  onSave, 
  onClose 
}: { 
  imageUrl: string; 
  onSave: (croppedImageUrl: string) => void;
  onClose: () => void;
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [rotation, setRotation] = useState(0);
  const [removeBackground, setRemoveBackground] = useState(false);
  const [isRemovingBackground, setIsRemovingBackground] = useState(false);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => {
        if (image.naturalWidth && image.naturalHeight) {
          resolve(image);
        } else {
          resolve(image);
        }
      });
      image.addEventListener('error', (error) => reject(error));
      image.src = url;
    });

  const removeBackgroundFromImage = async (imageUrl: string): Promise<string> => {
    setIsRemovingBackground(true);
    try {
      // Usar API remove.bg para remoção profissional de fundo
      const formData = new FormData();
      
      // Converter image URL para blob
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      formData.append('image_file', blob, 'photo.jpg');
      formData.append('size', 'auto');
      
      // Chamar API remove.bg (você precisará de uma API key)
      const apiKey = API_CONFIG.REMOVE_BG_API_KEY;
      
      if (apiKey === 'YOUR_REMOVE_BG_API_KEY') {
        // Fallback para simulação se não tiver API key
        const result = await simulateBackgroundRemoval(imageUrl);
        setIsRemovingBackground(false);
        return result;
      }
      
      const removeBgResponse = await fetch(API_CONFIG.REMOVE_BG_ENDPOINT, {
        method: 'POST',
        headers: {
          'X-Api-Key': apiKey,
        },
        body: formData,
      });
      
      if (!removeBgResponse.ok) {
        throw new Error('Erro na API de remoção de fundo');
      }
      
      const resultBlob = await removeBgResponse.blob();
      setIsRemovingBackground(false);
      return URL.createObjectURL(resultBlob);
      
    } catch (error) {
      console.error('Erro na remoção de fundo:', error);
      // Fallback para simulação
      const result = await simulateBackgroundRemoval(imageUrl);
      setIsRemovingBackground(false);
      return result;
    }
  };

  const simulateBackgroundRemoval = async (imageUrl: string): Promise<string> => {
    // Simulação melhorada de remoção de fundo
    const image = await createImage(imageUrl);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return imageUrl;

    canvas.width = image.width;
    canvas.height = image.height;

    // Desenhar imagem original
    ctx.drawImage(image, 0, 0);

    // Aplicar algoritmo mais avançado para remover fundo
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Algoritmo melhorado para detectar e remover fundo
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Calcular luminosidade
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      
      // Detecção de pele (manter pessoas)
      const isSkinColor = (
        r > 95 && g > 40 && b > 20 &&
        r > g && r > b &&
        Math.abs(r - g) > 15 && Math.abs(r - b) > 15
      );
      
      // Se não for pele e for claro, tornar transparente
      if (!isSkinColor && brightness > 180) {
        data[i + 3] = 0; // Alpha channel (transparente)
      }
      
      // Remover tons muito claros (branco, cinza claro)
      if (r > 220 && g > 220 && b > 220) {
        data[i + 3] = 0;
      }
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL('image/png');
  };

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: any,
    rotation = 0
  ): Promise<string> => {
    let processedImageSrc = imageSrc;
    
    // Aplicar remoção de fundo se ativado
    if (removeBackground) {
      processedImageSrc = await removeBackgroundFromImage(imageSrc);
    }

    const image = await createImage(processedImageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return '';
    }

    // Configurar o tamanho do canvas para o tamanho do crop
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // Limpar o canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Se houver rotação, aplicar transformação
    if (rotation !== 0) {
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);
    }

    // Desenhar a imagem cropada
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      canvas.width,
      canvas.height
    );

    if (rotation !== 0) {
      ctx.restore();
    }

    const result = canvas.toDataURL('image/jpeg', 0.9);
    return result;
  };

  const handleSave = async () => {
    try {
      const croppedImageUrl = await getCroppedImg(imageUrl, croppedAreaPixels, rotation);
      onSave(croppedImageUrl);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-5xl w-full max-h-[95vh] overflow-hidden">
        <div className="bg-green-700 text-white p-4 flex justify-between items-center">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Edit3 size={20} /> Editor de Foto Avançado
          </h3>
          <button onClick={onClose} className="hover:bg-green-600 p-1 rounded">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <div className="relative h-96 bg-gray-100 rounded-lg mb-4">
            <Cropper
              image={imageUrl}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={3/4}
              onCropChange={setCrop}
              onCropComplete={(_, croppedAreaPixels) => setCroppedAreaPixels(croppedAreaPixels)}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              objectFit="contain"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <ZoomIn size={16} className="inline mr-1" /> Zoom (arraste para ajustar posição)
                </label>
                <input
                  type="range"
                  value={zoom}
                  min={0.5}
                  max={3}
                  step={0.1}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0.5x</span>
                  <span>Atual: {zoom.toFixed(1)}x</span>
                  <span>3x</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <RotateCw size={16} className="inline mr-1" /> Rotação
                </label>
                <input
                  type="range"
                  value={rotation}
                  min={0}
                  max={360}
                  step={1}
                  onChange={(e) => setRotation(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0°</span>
                  <span>{rotation}°</span>
                  <span>360°</span>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={removeBackground}
                    onChange={(e) => setRemoveBackground(e.target.checked)}
                    className="rounded"
                    disabled={isRemovingBackground}
                  />
                  <Palette size={16} className="inline mr-1" />
                  {isRemovingBackground ? 'Removendo fundo...' : 'Remover Fundo'}
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  {isRemovingBackground 
                    ? 'Processando imagem, aguarde...' 
                    : 'Remove fundos automaticamente (API profissional)'
                  }
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">💡 Dicas de Uso:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Arraste a imagem para centralizar</li>
                  <li>• Use o scroll do mouse para zoom</li>
                  <li>• O zoom começa do centro da imagem</li>
                  <li>• Ative "Remover Fundo" para fundos claros</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleSave}
              className="flex-1 bg-green-700 hover:bg-green-800 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all"
            >
              <Save size={16} /> Salvar Foto
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-medium transition-all"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- TELA PRINCIPAL ---
export default function App() {
  const [mode, setMode] = useState<'admin' | 'gerador'>('admin');
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>([]);
  const [currentTemplate, setCurrentTemplate] = useState<TemplateData>({
    id: '',
    name: 'Novo Template',
    frenteImg: null,
    versoImg: null,
    frenteCampos: [],
    versoCampos: [],
    createdAt: new Date().toISOString()
  });

  // Carregar templates salvos do localStorage
  useEffect(() => {
    const stored = localStorage.getItem('oab-templates');
    if (stored) {
      setSavedTemplates(JSON.parse(stored));
    }
  }, []);

  const saveTemplate = () => {
    const templateToSave: SavedTemplate = {
      id: Date.now().toString(),
      name: currentTemplate.name,
      data: { ...currentTemplate }
    };
    
    const updated = [...savedTemplates, templateToSave];
    setSavedTemplates(updated);
    localStorage.setItem('oab-templates', JSON.stringify(updated));
    return templateToSave;
  };

  const loadTemplate = (template: SavedTemplate) => {
    setCurrentTemplate(template.data);
  };

  const deleteTemplate = (id: string) => {
    const updated = savedTemplates.filter(t => t.id !== id);
    setSavedTemplates(updated);
    localStorage.setItem('oab-templates', JSON.stringify(updated));
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50">
      {/* HEADER OAB-SP STYLE */}
      <header className="bg-gradient-to-r from-green-700 to-green-800 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="bg-white p-3 rounded-lg shadow-md">
                <div className="w-8 h-8 bg-green-700 rounded flex items-center justify-center">
                  <Printer size={20} className="text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold">Sistema OAB-SP</h1>
                <p className="text-green-100 text-sm">Emissão de Carteirinhas Digitais</p>
              </div>
            </div>
            
            <div className="flex bg-green-900/50 p-1 rounded-lg backdrop-blur">
              <button 
                onClick={() => setMode('admin')}
                className={cn(
                  "px-6 py-3 rounded-md flex items-center gap-2 text-sm font-medium transition-all",
                  mode === 'admin' 
                    ? "bg-white text-green-700 shadow-md" 
                    : "text-green-100 hover:text-white hover:bg-green-700/50"
                )}
              >
                <Settings size={16} /> Criar Template
              </button>
              <button 
                onClick={() => setMode('gerador')}
                className={cn(
                  "px-6 py-3 rounded-md flex items-center gap-2 text-sm font-medium transition-all",
                  mode === 'gerador' 
                    ? "bg-white text-green-700 shadow-md" 
                    : "text-green-100 hover:text-white hover:bg-green-700/50"
                )}
              >
                <Printer size={16} /> Emitir Carteirinha
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* CONTEÚDO */}
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          {mode === 'admin' ? (
            <AdminModule 
              template={currentTemplate}
              setTemplate={setCurrentTemplate}
              savedTemplates={savedTemplates}
              onSaveTemplate={saveTemplate}
              onLoadTemplate={loadTemplate}
              onDeleteTemplate={deleteTemplate}
              switchToGenerator={() => setMode('gerador')} 
            />
          ) : (
            <GeneratorModule 
              backToAdmin={() => setMode('admin')} 
            />
          )}
        </div>
      </main>
    </div>
  );
}

// --- MÓDULO ADMIN (CONFIGURAÇÃO) ---
function AdminModule({ 
  template, 
  setTemplate, 
  savedTemplates,
  onSaveTemplate,
  onLoadTemplate,
  onDeleteTemplate,
  switchToGenerator 
}: { 
  template: TemplateData;
  setTemplate: any;
  savedTemplates: SavedTemplate[];
  onSaveTemplate: () => SavedTemplate;
  onLoadTemplate: (template: SavedTemplate) => void;
  onDeleteTemplate: (id: string) => void;
  switchToGenerator: () => void;
}) {
  const [activeFace, setActiveFace] = useState<FaceType>('frente');
  const [selectedId, selectShape] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>, face: FaceType) => {
    if (e.target.files?.[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setTemplate((prev: TemplateData) => ({
        ...prev,
        [face === 'frente' ? 'frenteImg' : 'versoImg']: url
      }));
    }
  };

  const addField = (type: FieldType) => {
    const defaultName = type === 'texto' ? 'Novo Campo' : 'FOTO';
    let name: string = defaultName;
    
    if (type === 'texto') {
      const promptResult = prompt("Nome do campo (Ex: NOME, CPF, RG):", defaultName);
      if (!promptResult) return;
      name = promptResult;
    }

    const newField: Field = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      name: name.toUpperCase(),
      x: 50,
      y: 50,
      w: type === 'foto' ? 100 : 150,
      h: type === 'foto' ? 130 : 20,
      fontSize: 16,
      fontFamily: 'Arial',
      color: '#000000'
    };

    setTemplate((prev: TemplateData) => ({
      ...prev,
      [activeFace === 'frente' ? 'frenteCampos' : 'versoCampos']: [...prev[activeFace === 'frente' ? 'frenteCampos' : 'versoCampos'], newField]
    }));
  };

  const updateField = (id: string, newAttrs: Partial<Field>) => {
    const key = activeFace === 'frente' ? 'frenteCampos' : 'versoCampos';
    setTemplate((prev: any) => ({
      ...prev,
      [key]: prev[key].map((f: Field) => f.id === id ? { ...f, ...newAttrs } : f)
    }));
  };

  const removeField = (id: string) => {
    const key = activeFace === 'frente' ? 'frenteCampos' : 'versoCampos';
    setTemplate((prev: any) => ({
      ...prev,
      [key]: prev[key].filter((f: Field) => f.id !== id)
    }));
  };

  const currentCampos = activeFace === 'frente' ? template.frenteCampos : template.versoCampos;
  const currentBg = activeFace === 'frente' ? template.frenteImg : template.versoImg;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-10rem)]">
      {/* SIDEBAR DE CONFIGURAÇÃO */}
      <aside className="lg:col-span-3 bg-white rounded-xl shadow-md border border-gray-200 p-5 flex flex-col gap-6 overflow-y-auto">
        {/* Templates Salvos */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <FolderOpen className="text-green-700" size={20} /> Templates
            </h2>
            <button 
              onClick={() => setShowTemplates(!showTemplates)}
              className="text-green-700 hover:text-green-800"
            >
              <ChevronRight size={16} className={cn("transition-transform", showTemplates && "rotate-90")} />
            </button>
          </div>
          
          {showTemplates && (
            <div className="space-y-2 mb-4">
              {savedTemplates.length === 0 ? (
                <p className="text-sm text-gray-500 italic">Nenhum template salvo</p>
              ) : (
                savedTemplates.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <button 
                      onClick={() => onLoadTemplate(t)}
                      className="flex-1 text-left text-sm font-medium hover:text-green-700"
                    >
                      {t.name}
                    </button>
                    <button 
                      onClick={() => onDeleteTemplate(t.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
          
          <input
            type="text"
            value={template.name}
            onChange={(e) => setTemplate({...template, name: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Nome do template"
          />
        </div>

        <hr className="border-gray-200" />

        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Settings className="text-green-700" size={20} /> Configurar Bases
          </h2>
          
          <div className="space-y-4">
            <div className={cn("border-2 border-dashed rounded-lg p-4 transition-all", activeFace === 'frente' ? "border-green-500 bg-green-50" : "border-gray-300")}>
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-sm">Base Frente</span>
                {template.frenteImg && <CheckCircle2 size={16} className="text-green-600" />}
              </div>
              <input type="file" accept="image/*" onChange={(e) => handleUpload(e, 'frente')} className="text-xs w-full" />
            </div>

            <div className={cn("border-2 border-dashed rounded-lg p-4 transition-all", activeFace === 'verso' ? "border-green-500 bg-green-50" : "border-gray-300")}>
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-sm">Base Verso</span>
                {template.versoImg && <CheckCircle2 size={16} className="text-green-600" />}
              </div>
              <input type="file" accept="image/*" onChange={(e) => handleUpload(e, 'verso')} className="text-xs w-full" />
            </div>
          </div>
        </div>

        <hr className="border-gray-200" />

        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4">Adicionar Campos</h2>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => addField('texto')} className="flex flex-col items-center justify-center p-3 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all">
              <Type size={20} className="mb-1 text-gray-600" />
              <span className="text-xs font-medium">Texto</span>
            </button>
            <button onClick={() => addField('foto')} className="flex flex-col items-center justify-center p-3 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all">
              <ImageIcon size={20} className="mb-1 text-gray-600" />
              <span className="text-xs font-medium">Foto</span>
            </button>
          </div>
        </div>

        <div className="flex-1">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Lista de Campos ({activeFace})</h3>
          <div className="space-y-2">
            {currentCampos.length === 0 && <p className="text-sm text-gray-400 italic">Nenhum campo.</p>}
            {currentCampos.map(f => (
              <div key={f.id} onClick={() => selectShape(f.id)} className={cn("p-2 rounded-lg border flex justify-between items-center cursor-pointer transition-all", selectedId === f.id ? "border-green-500 bg-green-50 shadow-sm" : "border-gray-200 hover:border-gray-300")}>
                <div className="flex items-center gap-2 overflow-hidden">
                  {f.type === 'texto' ? <Type size={14} /> : <ImageIcon size={14} className="text-purple-600"/>}
                  <span className="text-sm truncate font-medium">{f.name}</span>
                </div>
                <button onClick={(e) => { e.stopPropagation(); removeField(f.id); }} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <button onClick={() => onSaveTemplate()} className="w-full bg-green-700 hover:bg-green-800 text-white py-3 rounded-lg font-bold flex justify-center items-center gap-2 shadow-md transition-all hover:shadow-lg">
            <Save size={18} /> Salvar Template
          </button>
          <button onClick={switchToGenerator} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold flex justify-center items-center gap-2 shadow-md transition-all hover:shadow-lg">
            <Printer size={18} /> Ir para Emissão
          </button>
        </div>
      </aside>

      {/* ÁREA DE CANVAS ADMIN */}
      <div className="lg:col-span-9 bg-gray-100 rounded-xl border border-gray-300 relative flex flex-col overflow-hidden">
        <div className="bg-white p-3 flex justify-center gap-4 shadow-sm z-10">
          <button onClick={() => setActiveFace('frente')} className={cn("px-6 py-2 rounded-full text-sm font-medium transition-all", activeFace === 'frente' ? "bg-green-700 text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>Frente</button>
          <button onClick={() => setActiveFace('verso')} className={cn("px-6 py-2 rounded-full text-sm font-medium transition-all", activeFace === 'verso' ? "bg-green-700 text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>Verso</button>
        </div>

        <div className="flex-1 overflow-auto flex items-center justify-center p-8 bg-gray-50" onClick={(e) => { if(e.target === e.currentTarget) selectShape(null); }}>
          {!currentBg ? (
            <div className="text-center text-gray-400">
              <Upload size={48} className="mx-auto mb-2 opacity-50" />
              <p className="text-lg">Faça upload da imagem da {activeFace} para começar</p>
            </div>
          ) : (
            <CanvasEditor 
              bgSrc={currentBg} 
              fields={currentCampos} 
              selectedId={selectedId} 
              onSelect={selectShape} 
              onChange={updateField} 
            />
          )}
        </div>
      </div>
    </div>
  );
}

// --- CANVAS INTERATIVO (ADMIN) ---
const CanvasEditor = ({ bgSrc, fields, selectedId, onSelect, onChange }: any) => {
  const [img] = useImage(bgSrc);
  const trRef = useRef<any>(null);
  const shapeRef = useRef<any>(null);

  useEffect(() => {
    if (selectedId && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [selectedId]);

  if (!img) return <div className="text-gray-500">Carregando...</div>;

  return (
    <div className="shadow-2xl border-4 border-white bg-white rounded-lg">
      <Stage width={img.width} height={img.height} onMouseDown={(e) => {
        if (e.target === e.target.getStage()) onSelect(null);
      }}>
        <Layer>
          <KonvaImage image={img} listening={false} />
          {fields.map((field: Field) => {
            const isSelected = field.id === selectedId;
            return (
              <React.Fragment key={field.id}>
                {field.type === 'texto' ? (
                  <Text
                    ref={isSelected ? shapeRef : null}
                    x={field.x} y={field.y}
                    text={field.name}
                    fontSize={field.fontSize}
                    fontFamily={field.fontFamily}
                    fill={field.color}
                    draggable
                    onClick={() => onSelect(field.id)}
                    onDragEnd={(e) => onChange(field.id, { x: e.target.x(), y: e.target.y() })}
                  />
                ) : (
                  <Rect
                    ref={isSelected ? shapeRef : null}
                    x={field.x} y={field.y} width={field.w} height={field.h}
                    fill="rgba(34, 197, 94, 0.2)"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dash={[5, 5]}
                    draggable
                    onClick={() => onSelect(field.id)}
                    onDragEnd={(e) => onChange(field.id, { x: e.target.x(), y: e.target.y() })}
                    onTransformEnd={() => {
                      const node = shapeRef.current;
                      const scaleX = node.scaleX();
                      const scaleY = node.scaleY();
                      node.scaleX(1); node.scaleY(1);
                      onChange(field.id, { x: node.x(), y: node.y(), w: node.width() * scaleX, h: node.height() * scaleY });
                    }}
                  />
                )}
              </React.Fragment>
            );
          })}
          {selectedId && <Transformer ref={trRef} />}
        </Layer>
      </Stage>
    </div>
  );
};

// --- MÓDULO GERADOR (OPERAÇÃO) ---
function GeneratorModule({ backToAdmin }: { backToAdmin: () => void }) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [userPhotos, setUserPhotos] = useState<Record<string, string>>({});
  const [editingPhoto, setEditingPhoto] = useState<{ fieldName: string; url: string } | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateData | null>(null);
  const [showTemplateSelection, setShowTemplateSelection] = useState(true);
  const stageFrontRef = useRef<any>(null);
  const stageBackRef = useRef<any>(null);

  // Carregar templates salvos
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>([]);
  
  useEffect(() => {
    const stored = localStorage.getItem('oab-templates');
    if (stored) {
      setSavedTemplates(JSON.parse(stored));
    }
  }, []);

  const selectTemplate = (templateData: TemplateData) => {
    setSelectedTemplate(templateData);
    setShowTemplateSelection(false);
  };

  const allFields = selectedTemplate ? [...selectedTemplate.frenteCampos, ...selectedTemplate.versoCampos] : [];
  const uniqueTextFields = Array.from(new Set(allFields.filter(f => f.type === 'texto').map(f => f.name)));
  const uniquePhotoFields = Array.from(new Set(allFields.filter(f => f.type === 'foto').map(f => f.name)));

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    if (e.target.files?.[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setEditingPhoto({ fieldName, url });
    }
  };

  const handlePhotoEdit = (fieldName: string, url: string) => {
    setUserPhotos(prev => ({ ...prev, [fieldName]: url }));
    setEditingPhoto(null);
  };

  const downloadPNGs = () => {
    const downloadURI = (uri: string, name: string) => {
      const link = document.createElement('a');
      link.download = name;
      link.href = uri;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    if (stageFrontRef.current) {
      const data = stageFrontRef.current.toDataURL({ pixelRatio: 3 });
      downloadURI(data, 'carteirinha_frente.png');
    }

    if (stageBackRef.current) {
      setTimeout(() => {
        const data = stageBackRef.current.toDataURL({ pixelRatio: 3 });
        downloadURI(data, 'carteirinha_verso.png');
      }, 500);
    }
  };

  // Se não há template selecionado, mostrar seleção
  if (showTemplateSelection) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-4xl w-full">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Selecione um Template</h2>
              <p className="text-gray-600">Escolha um template existente ou crie um novo para emitir carteirinhas</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {savedTemplates.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <FolderOpen size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 text-lg">Nenhum template encontrado</p>
                  <p className="text-gray-400 text-sm mt-2">Crie um template primeiro no modo admin</p>
                </div>
              ) : (
                savedTemplates.map(t => (
                  <div key={t.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:border-green-500 transition-all cursor-pointer" onClick={() => selectTemplate(t.data)}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-green-700 rounded-lg flex items-center justify-center">
                        <Printer size={20} className="text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800">{t.name}</h3>
                        <p className="text-sm text-gray-500">Template salvo</p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>• {t.data.frenteCampos.length} campos (frente)</p>
                      <p>• {t.data.versoCampos.length} campos (verso)</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-4">
              <button 
                onClick={backToAdmin}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-medium transition-all"
              >
                <Settings size={16} className="inline mr-2" />
                Criar Novo Template
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cabeçalho com Template Selecionado */}
        <div className="lg:col-span-12 bg-white rounded-xl shadow-md border border-gray-200 p-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Template: {selectedTemplate?.name}</h2>
              <p className="text-sm text-gray-600">Emitindo carteirinha com este template</p>
            </div>
            <button 
              onClick={() => setShowTemplateSelection(true)}
              className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg font-medium transition-all"
            >
              <FolderOpen size={16} className="inline mr-2" />
              Trocar Template
            </button>
          </div>
        </div>

        {/* FORMULÁRIO */}
        <div className="lg:col-span-4 bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Preencher Dados</h2>
            <button onClick={backToAdmin} className="text-sm text-green-700 hover:text-green-800 font-medium">← Voltar</button>
          </div>

          <div className="space-y-4">
            {uniqueTextFields.map(name => (
              <div key={name}>
                <label className="block text-sm font-bold text-gray-700 mb-1">{name}</label>
                <input 
                  type="text" 
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  placeholder={`Digite ${name.toLowerCase()}`}
                  value={formData[name] || ''}
                  onChange={(e) => setFormData({...formData, [name]: e.target.value})}
                />
              </div>
            ))}

            {uniquePhotoFields.map(name => (
              <div key={name} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <ImageIcon size={16} /> {name}
                </label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => handlePhotoUpload(e, name)}
                  className="text-sm w-full mb-3"
                />
                {userPhotos[name] && (
                  <div className="relative">
                    <img src={userPhotos[name]} className="w-full h-32 object-cover rounded-lg border" />
                    <button
                      onClick={() => setEditingPhoto({ fieldName: name, url: userPhotos[name] })}
                      className="absolute top-2 right-2 bg-green-700 text-white p-2 rounded-lg hover:bg-green-800 transition-colors"
                      title="Editar foto"
                    >
                      <Edit3 size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <button onClick={downloadPNGs} className="w-full mt-8 bg-green-700 hover:bg-green-800 text-white py-4 rounded-lg font-bold shadow-lg flex justify-center items-center gap-2 transition-all hover:shadow-xl">
            <Download size={20} /> Baixar Carteirinha
          </button>
        </div>

        {/* PREVIEW */}
        <div className="lg:col-span-8 space-y-8 overflow-y-auto max-h-[calc(100vh-10rem)]">
          <div className="text-center mb-6">
            <h3 className="font-bold text-gray-600 uppercase tracking-wider text-sm">Preview em Tempo Real</h3>
          </div>

          {selectedTemplate?.frenteImg && (
            <div className="flex justify-center">
              <div className="shadow-2xl border-4 border-white bg-white rounded-lg">
                <PreviewStage 
                  refStage={stageFrontRef}
                  bg={selectedTemplate.frenteImg} 
                  fields={selectedTemplate.frenteCampos} 
                  data={formData} 
                  photos={userPhotos} 
                />
              </div>
            </div>
          )}

          {selectedTemplate?.versoImg && (
            <div className="flex justify-center">
              <div className="shadow-2xl border-4 border-white bg-white rounded-lg">
                <PreviewStage 
                  refStage={stageBackRef}
                  bg={selectedTemplate.versoImg} 
                  fields={selectedTemplate.versoCampos} 
                  data={formData} 
                  photos={userPhotos} 
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Editor de Foto */}
      {editingPhoto && (
        <PhotoEditor
          imageUrl={editingPhoto.url}
          onSave={(url) => handlePhotoEdit(editingPhoto.fieldName, url)}
          onClose={() => setEditingPhoto(null)}
        />
      )}
    </>
  );
}

// --- RENDERIZADOR DO PREVIEW ---
const PreviewStage = ({ refStage, bg, fields, data, photos }: any) => {
  const [img] = useImage(bg);
  if (!img) return null;

  return (
    <Stage width={img.width} height={img.height} ref={refStage}>
      <Layer>
        <KonvaImage image={img} />
        {fields.map((f: Field) => {
          if (f.type === 'texto') {
            return (
              <Text 
                key={f.id} 
                x={f.x} 
                y={f.y} 
                text={data[f.name] || f.name} 
                fontSize={f.fontSize || 16}
                fontFamily={f.fontFamily || 'Arial'}
                fill={f.color || '#000000'} 
              />
            );
          } else if (f.type === 'foto') {
            return <PhotoRender key={f.id} src={photos[f.name]} x={f.x} y={f.y} w={f.w} h={f.h} />;
          }
          return null;
        })}
      </Layer>
    </Stage>
  );
};

// Componente de Foto
const PhotoRender = ({ src, x, y, w, h }: any) => {
  const [img] = useImage(src || '');
  if (!src || !img) return <Rect x={x} y={y} width={w} height={h} fill="#f3f4f6" stroke="#d1d5db" />;
  return <KonvaImage image={img} x={x} y={y} width={w} height={h} />;
};
