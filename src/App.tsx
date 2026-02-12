import React, { useState, useEffect } from 'react';
import { Settings, Printer, Save, Trash2, Plus } from 'lucide-react';
import { supabase, salvarTemplateSupabase, carregarTemplatesSupabase } from './lib/supabase';

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
  createdAt: string;
}

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
          {mode === 'admin' ? (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-center mb-8 text-gray-800">
                🚀 Módulo Admin - Criar Templates
              </h2>
              <p className="text-center text-gray-600 mb-8">
                Configure templates para emissão de carteirinhas com integração Supabase
              </p>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-bold text-lg mb-4">Templates Salvos no Supabase</h3>
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
                  <h3 className="font-bold text-lg mb-4">Configurar Template Atual</h3>
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
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                setCurrentTemplate({
                                  ...currentTemplate,
                                  frenteImg: event.target?.result as string
                                });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="text-xs w-full" 
                        />
                        {currentTemplate.frenteImg && (
                          <img 
                            src={currentTemplate.frenteImg} 
                            alt="Preview Frente" 
                            className="mt-2 w-full h-32 object-cover rounded border"
                          />
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Base Verso</label>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                setCurrentTemplate({
                                  ...currentTemplate,
                                  versoImg: event.target?.result as string
                                });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="text-xs w-full" 
                        />
                        {currentTemplate.versoImg && (
                          <img 
                            src={currentTemplate.versoImg} 
                            alt="Preview Verso" 
                            className="mt-2 w-full h-32 object-cover rounded border"
                          />
                        )}
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
                Selecione um template e preencha os dados para emissão
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
