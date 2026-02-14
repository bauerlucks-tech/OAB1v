import React, { useState, useEffect } from 'react';
import { Settings, Printer, Save, Trash2, Plus, Type, Image as ImageIcon, Gavel } from 'lucide-react';
import { supabase, salvarTemplateSupabase, carregarTemplatesSupabase, salvarCarteirinhaSupabase } from './lib/supabase';

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

interface DadosCarteirinha {
  nome: string;
  cpf: string;
  oab: string;
  foto?: string;
}

// --- COMPONENTE TEMPLATE EDITOR ---
function TemplateEditor({ 
  template, 
  onTemplateChange, 
  onSave 
}: {
  template: TemplateData | null;
  onTemplateChange: (template: TemplateData) => void;
  onSave: () => void;
}) {
  const [activeSide, setActiveSide] = useState<'frente' | 'verso'>('frente');
  const [isAddingField, setIsAddingField] = useState(false);
  const [fieldType, setFieldType] = useState<'texto' | 'foto'>('texto');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, side: 'frente' | 'verso') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        
        // Limpar o outro lado quando upload
        const newTemplate = { 
          ...template, 
          id: template?.id || Date.now().toString(),
          name: template?.name || 'Novo Template'
        };
        
        if (side === 'frente') {
          newTemplate.frenteImg = imageUrl;
          newTemplate.versoImg = null;
          newTemplate.frenteCampos = template?.frenteCampos || [];
          newTemplate.versoCampos = [];
        } else {
          newTemplate.versoImg = imageUrl;
          newTemplate.frenteImg = null;
          newTemplate.frenteCampos = [];
          newTemplate.versoCampos = template?.versoCampos || [];
        }
        
        onTemplateChange(newTemplate);
      };
      reader.readAsDataURL(file);
    }
  };

  const addField = (x: number, y: number) => {
    if (!template) return;
    
    const newField: Field = {
      id: `field-${Date.now()}`,
      type: fieldType,
      name: fieldType === 'texto' ? 'Campo Texto' : 'Campo Foto',
      x,
      y,
      w: 120,
      h: fieldType === 'foto' ? 80 : 30
    };

    const campos = activeSide === 'frente' ? template.frenteCampos : template.versoCampos;
    const novosCampos = [...campos, newField];
    
    const newTemplate = {
      ...template,
      [activeSide === 'frente' ? 'frenteCampos' : 'versoCampos']: novosCampos
    };
    
    onTemplateChange(newTemplate);
    setIsAddingField(false);
  };

  
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAddingField || !template) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    addField(x, y);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-center mb-4">
        <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
          <button
            type="button"
            onClick={() => setActiveSide('frente')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeSide === 'frente' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Frente
          </button>
          <button
            type="button"
            onClick={() => setActiveSide('verso')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeSide === 'verso' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Verso
          </button>
        </div>
      </div>

      <div className="max-w-sm mx-auto">
        <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
          📷 Imagem da {activeSide === 'frente' ? 'Frente' : 'Verso'}
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleImageUpload(e, activeSide)}
          className="text-xs w-full"
        />
      </div>

      {template && (template.frenteImg || template.versoImg) && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Editor de Campos</h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsAddingField(false)}
                className={`px-3 py-2 rounded text-sm font-medium ${
                  !isAddingField ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                <Type size={14} className="inline mr-1" />
                Mover
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAddingField(true);
                  setFieldType('texto');
                }}
                className={`px-3 py-2 rounded text-sm font-medium ${
                  isAddingField && fieldType === 'texto' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                <Plus size={14} className="inline mr-1" />
                Adicionar Texto
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAddingField(true);
                  setFieldType('foto');
                }}
                className={`px-3 py-2 rounded text-sm font-medium ${
                  isAddingField && fieldType === 'foto' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                <ImageIcon size={14} className="inline mr-1" />
                Adicionar Foto
              </button>
            </div>
          </div>

          <div 
            className="relative border-2 border-gray-300 rounded-lg bg-gray-100 mx-auto"
            style={{ width: '600px', height: '400px' }}
            onClick={handleCanvasClick}
          >
            <img
              src={activeSide === 'frente' ? template.frenteImg || '' : template.versoImg || ''}
              alt={`Template ${activeSide}`}
              className="absolute inset-0 w-full h-full object-contain"
            />
            
            {(activeSide === 'frente' ? template.frenteCampos : template.versoCampos).map((field) => (
              <div
                key={field.id}
                className={`absolute border-2 cursor-move ${
                  field.type === 'texto' ? 'border-blue-500 bg-blue-100' : 'border-purple-500 bg-purple-100'
                }`}
                style={{
                  left: `${field.x}px`,
                  top: `${field.y}px`,
                  width: `${field.w}px`,
                  height: `${field.h}px`
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-center h-full text-xs p-1">
                  {field.type === 'texto' ? (
                    <Type size={12} />
                  ) : (
                    <ImageIcon size={12} />
                  )}
                  <span className="ml-1 truncate">{field.name}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={onSave}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              <Save size={16} className="inline mr-2" />
              Salvar Template
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- COMPONENTE GERADOR DE CARTEIRINHA ---
function CarteirinhaGenerator({ 
  templates, 
  selectedTemplate: propSelectedTemplate = null, 
  onTemplateSelect, 
  onGenerate 
}: {
  templates: SavedTemplate[];
  selectedTemplate?: TemplateData | null;
  onTemplateSelect?: (template: TemplateData) => void;
  onGenerate?: (template: TemplateData, dados: DadosCarteirinha) => Promise<void>;
}) {
    const [dados, setDados] = useState<DadosCarteirinha>({
    nome: '',
    cpf: '',
    oab: ''
  });
  const [foto, setFoto] = useState<string | null>(null);

  const handleGenerateCard = async () => {
    if (!propSelectedTemplate || !onGenerate) return;
    
    try {
      await onGenerate(propSelectedTemplate, dados);
      alert('Carteirinha gerada com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar carteirinha:', error);
      alert('Erro ao gerar carteirinha. Tente novamente.');
    }
  };

  const handleFotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFoto(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button type="button" className="py-2 px-1 border-b-2 font-medium text-sm border-green-500 text-green-600">
            <Plus size={16} className="inline mr-2" />
            Criação
          </button>
          <button type="button" className="py-2 px-1 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300">
            <Save size={16} className="inline mr-2" />
            Salvamento
          </button>
          <button type="button" className="py-2 px-1 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300">
            <Printer size={16} className="inline mr-2" />
            Geração
          </button>
        </nav>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Template Selecionado</label>
          {propSelectedTemplate ? (
            <div className="border rounded-lg p-4 bg-green-50">
              <p className="font-medium">{propSelectedTemplate.name}</p>
              <button
                type="button"
                onClick={() => onTemplateSelect && onTemplateSelect(null)}
                className="text-red-600 hover:text-red-700 text-sm mt-2"
              >
                Alterar Template
              </button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <p className="text-gray-500">Nenhum template selecionado</p>
              <button
                type="button"
                onClick={() => {
                  if (templates.length > 0) {
                    setSelectedTemplate(templates[0].data);
                    if (onTemplateSelect) {
                      onTemplateSelect(templates[0].data);
                    }
                  }
                }}
                className="mt-2 text-green-600 hover:text-green-700"
              >
                Selecionar Primeiro Template
              </button>
            </div>
          )}
        </div>

        {propSelectedTemplate && (
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Preencha os dados</h3>
            
            {[...propSelectedTemplate.frenteCampos, ...propSelectedTemplate.versoCampos].map((campo) => (
              <div key={campo.id}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {campo.type === 'foto' ? 'Foto 3x4' : campo.name}
                </label>
                
                {campo.type === 'foto' ? (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFotoUpload}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    {foto && (
                      <img 
                        src={foto} 
                        alt="Preview" 
                        className="mt-2 h-20 w-20 object-cover rounded"
                      />
                    )}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={dados[campo.name as keyof DadosCarteirinha] || ''}
                    onChange={(e) => setDados({ 
                      ...dados, 
                      [campo.name]: e.target.value 
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder={`Digite ${campo.name.toLowerCase()}`}
                  />
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={handleGenerateCard}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 font-medium"
            >
              Gerar Carteirinha
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// --- COMPONENTE PRINCIPAL ---
export default function App() {
  const [mode, setMode] = useState<'admin' | 'user'>('user');
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

  useEffect(() => {
    const carregarTemplates = async () => {
      try {
        const templates = await carregarTemplatesSupabase();
        setSavedTemplates(templates);
      } catch (error) {
        console.error('Erro ao carregar templates:', error);
      }
    };
    carregarTemplates();
  }, []);

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
      
      alert('Template salvo com sucesso!');
      
      const templates = await carregarTemplatesSupabase();
      setSavedTemplates(templates);
      
    } catch (error) {
      console.error('Erro ao salvar template:', error);
      alert('Erro ao salvar template. Tente novamente.');
    }
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

  const handleGenerateCard = async (template: TemplateData, dados: DadosCarteirinha) => {
    try {
      await salvarCarteirinhaSupabase({
        nome: template.name,
        templateId: template.id,
        dados,
        templateName: template.name,
        fotos: dados.foto ? [dados.foto] : [],
        frenteUrl: template.frenteImg || '',
        versoUrl: template.versoImg || '',
        emitidaEm: new Date().toISOString()
      });
      alert('Carteirinha gerada com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar carteirinha:', error);
      alert('Erro ao gerar carteirinha. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Gavel className="w-8 h-8 text-green-500" />
              <h1 className="text-2xl font-bold">Sistema OAB v3</h1>
            </div>
            <nav className="flex space-x-4">
              <button 
                type="button"
                onClick={() => setMode('admin')}
                className={`px-6 py-3 rounded-md flex items-center gap-2 text-sm font-medium transition-all ${
                  mode === 'admin' ? 'bg-amber-500 text-slate-900' : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Settings size={16} />
                Gerar Templates
              </button>
              <button 
                type="button"
                onClick={() => setMode('user')}
                className={`px-6 py-3 rounded-md flex items-center gap-2 text-sm font-medium transition-all ${
                  mode === 'user' ? 'bg-amber-500 text-slate-900' : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Printer size={16} />
                Emitir Documentos
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {mode === 'admin' ? (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center mb-8">Módulo Administrativo</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="font-bold text-lg mb-4">Criar Novo Template</h3>
                <TemplateEditor
                  template={currentTemplate}
                  onTemplateChange={setCurrentTemplate}
                  onSave={salvarTemplateAdmin}
                />
              </div>
              
              <div>
                <h3 className="font-bold text-lg mb-4">Templates Salvos</h3>
                <div className="space-y-2">
                  {savedTemplates.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Nenhum template salvo</p>
                  ) : (
                    savedTemplates.map((t) => (
                      <div key={t.id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                        <div>
                          <p className="font-medium">{t.name}</p>
                          <p className="text-sm text-gray-600">
                            {t.data.frenteCampos.length} campos configurados
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button 
                            type="button"
                            onClick={() => {
                              setCurrentTemplate(t.data);
                            }}
                            className="text-green-600 hover:text-green-800 text-sm font-medium"
                          >
                            Usar
                          </button>
                          <button 
                            type="button"
                            onClick={() => deleteTemplate(t.id)}
                            className="text-red-500 hover:text-red-700"
                            title="Excluir template"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4">Templates Disponíveis</h3>
              <div className="space-y-2">
                {savedTemplates.length === 0 ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <p className="text-gray-500">Nenhum template encontrado</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Vá para "Gerar Templates" para criar novos templates
                    </p>
                  </div>
                ) : (
                  savedTemplates.map((t) => (
                    <div key={t.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-lg">{t.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {t.data.frenteCampos.length} campos configurados
                          </p>
                          <div className="text-xs text-gray-500 mt-2">
                            {t.data.frenteCampos.map(c => 
                              `${c.name} (${c.type})`
                            ).join(', ')}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTemplate(t.data);
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                        >
                          Selecionar
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <CarteirinhaGenerator
              templates={savedTemplates}
              selectedTemplate={selectedTemplate}
              onTemplateSelect={(template) => {
                setSelectedTemplate(template);
              }}
              onGenerate={handleGenerateCard}
            />
          </div>
        )}
      </main>
    </div>
  );
}
