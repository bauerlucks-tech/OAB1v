import React, { useState, useEffect } from 'react';
import { Stage, Layer, Text, Rect, Transformer, Image as KonvaImage } from 'react-konva';
import { Download, Upload, Settings, Printer, Edit3, X, Save, Type, Trash2, ImageIcon, Palette, ZoomIn, RotateCw, ChevronRight, FolderOpen, CheckCircle2 } from 'lucide-react';
import Cropper from 'react-easy-crop';
import 'react-easy-crop/dist/style.css';

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
}

interface SavedTemplate {
  id: string;
  name: string;
  data: TemplateData;
  createdAt: string;
}

interface CarteirinhaRecord {
  id: string;
  nome: string;
  templateId: string;
  templateName: string;
  dados: Record<string, string>;
  fotos: Record<string, string>;
  frenteUrl: string;
  versoUrl: string;
  createdAt: string;
  emitidaEm: string;
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

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: any,
    rotation = 0
  ): Promise<string> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return '';
    }

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, canvas.width, canvas.height);

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
    versoCampos: []
  });

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
                className="px-6 py-3 rounded-md flex items-center gap-2 text-sm font-medium transition-all bg-white text-green-700 shadow-md"
              >
                <Settings size={16} /> Criar Template
              </button>
              <button 
                onClick={() => setMode('gerador')}
                className="px-6 py-3 rounded-md flex items-center gap-2 text-sm font-medium text-green-100 hover:text-white hover:bg-green-700/50"
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
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-center mb-8 text-gray-800">
              🚀 Sistema OAB-SP - Versão Simplificada
            </h2>
            <p className="text-center text-gray-600 mb-8">
              Sistema funcional com template básico para teste
            </p>
            <div className="text-center text-sm text-gray-500">
              <p>• Modo Admin: Configurar templates</p>
              <p>• Modo Gerador: Emitir carteirinhas</p>
              <p>• Banco de Dados: Integrado com Supabase</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
