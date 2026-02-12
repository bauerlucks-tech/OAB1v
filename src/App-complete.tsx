import React, { useState, useEffect } from 'react';
import { Stage, Layer, Text, Rect, Transformer, Image as KonvaImage } from 'react-konva';
import { useImage } from 'use-image';
import { Settings, Printer, Edit3, X, Save, Trash2 } from 'lucide-react';
import Cropper from 'react-easy-crop';
import 'react-easy-crop/dist/style.css';
import { supabase, salvarTemplateSupabase, carregarTemplatesSupabase } from './lib/supabase';

// Função utilitária simples
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
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
      const image = await createImage(imageUrl);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) return imageUrl;

      canvas.width = image.width;
      canvas.height = image.height;

      ctx.drawImage(image, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        const isSkinColor = (
          r > 95 && g > 40 && b > 20 &&
          r > g && r > b &&
          r - g > 15 && g - b > 15 &&
          r < 220 && g < 200 && b < 180
        );
        
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        
        if (!isSkinColor && brightness > 160) {
          data[i + 3] = 0;
        }
        
        if (r > 200 && g > 200 && b > 200) {
          data[i + 3] = 0;
        }
      }

      ctx.putImageData(imageData, 0, 0);
      return canvas.toDataURL('image/png');
      
    } catch (error) {
      console.error('Erro na remoção de fundo:', error);
      setIsRemovingBackground(false);
      return imageUrl;
    }
  };

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: any,
    rotation = 0
  ): Promise<string> => {
    let processedImageSrc = imageSrc;
    
    if (removeBackground) {
      processedImageSrc = await removeBackgroundFromImage(imageSrc);
    }

    const image = await createImage(processedImageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return '';
    }

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (rotation !== 0) {
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);
    }

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
                  <ZoomIn size={16} className="inline mr-1" /> Zoom
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
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">💡 Dicas de Uso:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Arraste a imagem para centralizar</li>
                  <li>• Use o scroll do mouse para zoom</li>
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
  const [carteirinhasSalvas, setCarteirinhasSalvas] = useState<CarteirinhaRecord[]>([]);
  const [currentTemplate, setCurrentTemplate] = useState<TemplateData>({
    id: '',
    name: 'Novo Template',
    frenteImg: null,
    versoImg: null,
    frenteCampos: [],
    versoCampos: []
  });

  // Carregar dados do Supabase
  useEffect(() => {
    const carregarDados = async () => {
      try {
        const templates = await carregarTemplatesSupabase();
        setSavedTemplates(templates);
        
        const carteirinhas = await carregarCarteirinhasSupabase();
        setCarteirinhasSalvas(carteirinhas);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      }
    };
    
    carregarDados();
  }, []);

  const loadTemplate = (template: SavedTemplate) => {
    setCurrentTemplate(template.data);
  };

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
    const promptResult = prompt("Nome do template:");
    if (!promptResult?.trim()) {
      alert('Digite um nome para o template!');
      return;
    }

    try {
      let frenteImgBase64 = '';
      let versoImgBase64 = '';
      
      if (currentTemplate.frenteImg) {
        frenteImgBase64 = await converterImagemParaBase64(currentTemplate.frenteImg);
      }
      
      if (currentTemplate.versoImg) {
        versoImgBase64 = await converterImagemParaBase64(currentTemplate.versoImg);
      }

      await salvarTemplateSupabase(
        currentTemplate,
        frenteImgBase64,
        versoImgBase64,
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

  const converterImagemParaBase64 = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        }
      };
      img.onerror = reject;
      img.src = url;
    });
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
                className="px-6 py-3 rounded-md flex items-center gap-2 text-sm font-medium transition-all bg-white text-green-700 shadow-md"
              >
                <Settings size={16} Criar Template
              </button>
              <button 
                onClick={() => setMode('gerador')}
                className="px-6 py-3 rounded-md flex items-center gap-2 text-sm font-medium text-green-100 hover:text-white hover:bg-green-700/50"
              >
                <Printer size={16} Emitir Carteirinha
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* CONTEÚDO */}
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          {mode === 'admin' ? (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-center mb-8 text-gray-800">
                🚀 Módulo Admin - Criar Templates
              </h2>
              <p className="text-center text-gray-600 mb-8">
                Configure templates para emissão de carteirinhas
              </p>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-bold text-lg mb-4">Templates Salvos</h3>
                  <div className="space-y-2">
                    {savedTemplates.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">Nenhum template salvo</p>
                    ) : (
                      savedTemplates.map(t => (
                        <div key={t.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <button 
                            onClick={() => loadTemplate(t)}
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
                
                <div>
                  <h3 className="font-bold text-lg mb-4">Configurar Template</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Template</label>
                      <input
                        type="text"
                        value={currentTemplate.name}
                        onChange={(e) => setCurrentTemplate({...currentTemplate, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Nome do template"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Base Frente</label>
                        <input type="file" accept="image/*" className="text-xs w-full" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Base Verso</label>
                        <input type="file" accept="image/*" className="text-xs w-full" />
                      </div>
                    </div>
                    
                    <button 
                      onClick={salvarTemplateAdmin}
                      className="w-full bg-green-700 hover:bg-green-800 text-white py-3 rounded-lg font-bold flex justify-center items-center gap-2 shadow-md transition-all hover:shadow-lg"
                    >
                      <Save size={16} /> Salvar Template no Supabase
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-center mb-8 text-gray-800">
                🚀 Módulo Gerador - Emitir Carteirinhas
              </h2>
              <p className="text-center text-gray-600 mb-8">
                Selecione um template e preencha os dados
              </p>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-bold text-lg mb-4">Selecionar Template</h3>
                  <div className="space-y-2">
                    {savedTemplates.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">Nenhum template disponível</p>
                    ) : (
                      savedTemplates.map(t => (
                        <button
                          key={t.id}
                          onClick={() => loadTemplate(t)}
                          className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-green-50 hover:border-green-500 border-2 border-transparent transition-all"
                        >
                          {t.name}
                        </button>
                      ))
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-bold text-lg mb-4">Dados da Carteirinha</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Digite o nome completo"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">CPF</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="000.000.000-00"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">OAB/UF</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="123456/SP"
                      />
                    </div>
                    
                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold flex justify-center items-center gap-2 shadow-md transition-all hover:shadow-lg">
                      <Printer size={16} /> Gerar Carteirinha
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
