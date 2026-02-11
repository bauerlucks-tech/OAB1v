import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Text, Rect, Transformer } from 'react-konva';
import useImage from 'use-image';
import { 
  Settings, Printer, Upload, Plus, Type, Image as ImageIcon, 
  Trash2, Move, Save, CheckCircle2, ChevronRight, Download
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

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
}

interface TemplateData {
  frenteImg: string | null;
  versoImg: string | null;
  frenteCampos: Field[];
  versoCampos: Field[];
}

// --- TELA PRINCIPAL ---
export default function App() {
  const [mode, setMode] = useState<'admin' | 'gerador'>('admin');
  
  // Estado do Template
  const [template, setTemplate] = useState<TemplateData>({
    frenteImg: null,
    versoImg: null,
    frenteCampos: [],
    versoCampos: []
  });

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-800">
      {/* HEADER */}
      <header className="bg-slate-900 text-white p-4 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Printer size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold leading-none">Sistema de Carteirinhas</h1>
              <p className="text-xs text-slate-400">Versão PNG Pro</p>
            </div>
          </div>
          
          <div className="flex bg-slate-800 p-1 rounded-lg">
            <button 
              onClick={() => setMode('admin')}
              className={cn(
                "px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-all",
                mode === 'admin' ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"
              )}
            >
              <Settings size={16} /> Criar Template
            </button>
            <button 
              onClick={() => setMode('gerador')}
              className={cn(
                "px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-all",
                mode === 'gerador' ? "bg-green-600 text-white shadow-md" : "text-slate-400 hover:text-white"
              )}
            >
              <Printer size={16} /> Emitir Carteirinha
            </button>
          </div>
        </div>
      </header>

      {/* CONTEÚDO */}
      <main className="flex-1 bg-slate-100 p-6">
        <div className="max-w-7xl mx-auto">
          {mode === 'admin' ? (
            <AdminModule template={template} setTemplate={setTemplate} switchToGenerator={() => setMode('gerador')} />
          ) : (
            <GeneratorModule template={template} backToAdmin={() => setMode('admin')} />
          )}
        </div>
      </main>
    </div>
  );
}

// --- MÓDULO ADMIN (CONFIGURAÇÃO) ---
function AdminModule({ template, setTemplate, switchToGenerator }: { template: TemplateData, setTemplate: any, switchToGenerator: () => void }) {
  const [activeFace, setActiveFace] = useState<FaceType>('frente');
  const [selectedId, selectShape] = useState<string | null>(null);
  
  // Handles
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
    const defaultName = type === 'texto' ? 'Novo Campo' : 'Foto 3x4';
    const name = prompt("Nome do campo (Ex: NOME, CPF, FOTO):", defaultName);
    if (!name) return;

    const newField: Field = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      name: name.toUpperCase(),
      x: 50,
      y: 50,
      w: type === 'foto' ? 100 : 150,
      h: type === 'foto' ? 130 : 20,
      fontSize: 16
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-8rem)]">
      {/* SIDEBAR DE CONFIGURAÇÃO */}
      <aside className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col gap-6 overflow-y-auto">
        <div>
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Settings className="text-blue-600" size={20} /> Configurar Bases
          </h2>
          
          <div className="space-y-4">
            {/* Upload Frente */}
            <div className={cn("border-2 border-dashed rounded-lg p-4 transition-colors", activeFace === 'frente' ? "border-blue-500 bg-blue-50" : "border-slate-300")}>
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-sm">Base Frente</span>
                {template.frenteImg && <CheckCircle2 size={16} className="text-green-500" />}
              </div>
              <input type="file" accept="image/*" onChange={(e) => handleUpload(e, 'frente')} className="text-xs w-full" />
            </div>

            {/* Upload Verso */}
            <div className={cn("border-2 border-dashed rounded-lg p-4 transition-colors", activeFace === 'verso' ? "border-blue-500 bg-blue-50" : "border-slate-300")}>
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-sm">Base Verso</span>
                {template.versoImg && <CheckCircle2 size={16} className="text-green-500" />}
              </div>
              <input type="file" accept="image/*" onChange={(e) => handleUpload(e, 'verso')} className="text-xs w-full" />
            </div>
          </div>
        </div>

        <hr />

        <div>
          <h2 className="text-lg font-bold text-slate-800 mb-4">Adicionar Campos</h2>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => addField('texto')} className="flex flex-col items-center justify-center p-3 border rounded-lg hover:bg-slate-50 transition-colors">
              <Type size={20} className="mb-1 text-slate-600" />
              <span className="text-xs font-medium">Texto</span>
            </button>
            <button onClick={() => addField('foto')} className="flex flex-col items-center justify-center p-3 border rounded-lg hover:bg-slate-50 transition-colors">
              <ImageIcon size={20} className="mb-1 text-slate-600" />
              <span className="text-xs font-medium">Foto</span>
            </button>
          </div>
        </div>

        <div className="flex-1">
           <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Lista de Campos ({activeFace})</h3>
           <div className="space-y-2">
             {currentCampos.length === 0 && <p className="text-sm text-slate-400 italic">Nenhum campo.</p>}
             {currentCampos.map(f => (
               <div key={f.id} onClick={() => selectShape(f.id)} className={cn("p-2 rounded border flex justify-between items-center cursor-pointer", selectedId === f.id ? "border-blue-500 bg-blue-50" : "border-slate-200")}>
                 <div className="flex items-center gap-2 overflow-hidden">
                   {f.type === 'texto' ? <Type size={14} /> : <ImageIcon size={14} className="text-purple-600"/>}
                   <span className="text-sm truncate font-medium">{f.name}</span>
                 </div>
                 <button onClick={(e) => { e.stopPropagation(); removeField(f.id); }} className="text-slate-400 hover:text-red-500"><Trash2 size={14}/></button>
               </div>
             ))}
           </div>
        </div>

        <button onClick={switchToGenerator} className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold flex justify-center items-center gap-2 shadow-lg transition-transform hover:scale-[1.02]">
          <Save size={18} /> Salvar e Ir para Gerador
        </button>
      </aside>

      {/* ÁREA DE CANVAS ADMIN */}
      <div className="lg:col-span-9 bg-slate-200 rounded-xl border border-slate-300 relative flex flex-col overflow-hidden">
        <div className="bg-white p-2 flex justify-center gap-4 shadow-sm z-10">
          <button onClick={() => setActiveFace('frente')} className={cn("px-4 py-1 rounded-full text-sm font-medium", activeFace === 'frente' ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600")}>Frente</button>
          <button onClick={() => setActiveFace('verso')} className={cn("px-4 py-1 rounded-full text-sm font-medium", activeFace === 'verso' ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600")}>Verso</button>
        </div>

        <div className="flex-1 overflow-auto flex items-center justify-center p-8 bg-slate-200/50" onClick={(e) => { if(e.target === e.currentTarget) selectShape(null); }}>
          {!currentBg ? (
            <div className="text-center text-slate-400">
              <Upload size={48} className="mx-auto mb-2 opacity-50" />
              <p>Faça upload da imagem da {activeFace} para começar</p>
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

  if (!img) return <div>Carregando...</div>;

  return (
    <div className="shadow-2xl border-4 border-white bg-white">
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
                    fill="red"
                    draggable
                    onClick={() => onSelect(field.id)}
                    onDragEnd={(e) => onChange(field.id, { x: e.target.x(), y: e.target.y() })}
                  />
                ) : (
                  <Rect
                    ref={isSelected ? shapeRef : null}
                    x={field.x} y={field.y} width={field.w} height={field.h}
                    fill="rgba(0, 160, 255, 0.3)"
                    stroke="blue"
                    strokeWidth={1}
                    draggable
                    onClick={() => onSelect(field.id)}
                    onDragEnd={(e) => onChange(field.id, { x: e.target.x(), y: e.target.y() })}
                    onTransformEnd={(e) => {
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
function GeneratorModule({ template, backToAdmin }: { template: TemplateData, backToAdmin: () => void }) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [userPhotos, setUserPhotos] = useState<Record<string, string>>({});
  const stageFrontRef = useRef<any>(null);
  const stageBackRef = useRef<any>(null);

  // Campos únicos
  const allFields = [...template.frenteCampos, ...template.versoCampos];
  const uniqueTextFields = Array.from(new Set(allFields.filter(f => f.type === 'texto').map(f => f.name)));
  const uniquePhotoFields = Array.from(new Set(allFields.filter(f => f.type === 'foto').map(f => f.name)));

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    if (e.target.files?.[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setUserPhotos(prev => ({ ...prev, [fieldName]: url }));
    }
  };

  // --- NOVA FUNÇÃO DE DOWNLOAD PNG ---
  const downloadPNGs = () => {
    // Função auxiliar para baixar uma URI
    const downloadURI = (uri: string, name: string) => {
      const link = document.createElement('a');
      link.download = name;
      link.href = uri;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    if (stageFrontRef.current) {
        // pixelRatio: 3 garante alta resolução (300 DPI aprox.)
        const data = stageFrontRef.current.toDataURL({ pixelRatio: 3 });
        downloadURI(data, 'carteirinha_frente.png');
    }

    if (stageBackRef.current) {
        // Pequeno delay para garantir que o navegador aceite o segundo download
        setTimeout(() => {
            const data = stageBackRef.current.toDataURL({ pixelRatio: 3 });
            downloadURI(data, 'carteirinha_verso.png');
        }, 500);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* FORMULÁRIO */}
      <div className="lg:col-span-4 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-800">Preencher Dados</h2>
            <button onClick={backToAdmin} className="text-xs text-blue-600 underline">Voltar para Admin</button>
        </div>

        <div className="space-y-4">
            {uniqueTextFields.map(name => (
                <div key={name}>
                    <label className="block text-xs font-bold text-slate-500 mb-1">{name}</label>
                    <input 
                        type="text" 
                        className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={formData[name] || ''}
                        onChange={(e) => setFormData({...formData, [name]: e.target.value})}
                    />
                </div>
            ))}

            {uniquePhotoFields.map(name => (
                <div key={name} className="p-3 bg-slate-50 rounded border border-slate-200">
                    <label className="block text-xs font-bold text-slate-500 mb-2 flex items-center gap-2">
                        <ImageIcon size={14} /> {name}
                    </label>
                    <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => handlePhotoUpload(e, name)}
                        className="text-xs w-full"
                    />
                    {userPhotos[name] && <img src={userPhotos[name]} className="mt-2 h-20 w-auto rounded border" />}
                </div>
            ))}
        </div>

        <button onClick={downloadPNGs} className="w-full mt-8 bg-blue-900 hover:bg-blue-800 text-white py-4 rounded-lg font-bold shadow-lg flex justify-center items-center gap-2 transition-all hover:scale-[1.02]">
            <Download size={20} /> Baixar Imagens (PNG)
        </button>
      </div>

      {/* PREVIEW */}
      <div className="lg:col-span-8 space-y-8 overflow-y-auto max-h-[calc(100vh-8rem)]">
         <div className="text-center mb-4">
             <h3 className="font-bold text-slate-500 uppercase tracking-widest text-sm">Preview em Tempo Real</h3>
         </div>

         {/* Preview Frente */}
         {template.frenteImg && (
             <div className="flex justify-center">
                 <div className="shadow-2xl border-4 border-white bg-white">
                     <PreviewStage 
                        refStage={stageFrontRef}
                        bg={template.frenteImg} 
                        fields={template.frenteCampos} 
                        data={formData} 
                        photos={userPhotos} 
                    />
                 </div>
             </div>
         )}

         {/* Preview Verso */}
         {template.versoImg && (
             <div className="flex justify-center">
                 <div className="shadow-2xl border-4 border-white bg-white">
                     <PreviewStage 
                        refStage={stageBackRef}
                        bg={template.versoImg} 
                        fields={template.versoCampos} 
                        data={formData} 
                        photos={userPhotos} 
                    />
                 </div>
             </div>
         )}
      </div>
    </div>
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
                        return <Text key={f.id} x={f.x} y={f.y} text={data[f.name] || f.name} fontSize={f.fontSize} fontFamily="Arial" fill="black" />;
                    } else if (f.type === 'foto') {
                        return <PhotoRender key={f.id} src={photos[f.name]} x={f.x} y={f.y} w={f.w} h={f.h} />;
                    }
                    return null;
                })}
            </Layer>
        </Stage>
    );
};

// Auxiliar Foto
const PhotoRender = ({ src, x, y, w, h }: any) => {
    const [img] = useImage(src || '');
    if (!src || !img) return <Rect x={x} y={y} width={w} height={h} fill="#eee" stroke="#ccc" />;
    return <KonvaImage image={img} x={x} y={y} width={w} height={h} />;
};
