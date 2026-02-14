import React, { useState, useEffect } from 'react';
import TemplateEditor from './components/TemplateEditor';
import CardGenerator from './components/CardGenerator';
import { getAllTemplates, saveCard } from './services/templateService';
import { Plus, Edit2, Trash2, FileText, Printer } from 'lucide-react';

// Importar tipos
interface Template {
  id: string;
  name: string;
  frontImage: string;
  backImage: string | null;
  frontFields: any[];
  backFields: any[];
}

type View = 'list' | 'editor' | 'generator';

const AppSimple: React.FC = () => {
  console.log('AppSimple: renderizando...');
  const [view, setView] = useState<View>('list');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [cardData, setCardData] = useState<any>({
    templateId: '',
    fields: {},
    photoUrl: ''
  });
  const [loading, setLoading] = useState(false);

  // Carregar templates do Supabase
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    console.log('loadTemplates: carregando do Supabase...');
    setLoading(true);
    try {
      const data = await getAllTemplates();
      console.log('loadTemplates: dados recebidos:', data);
      setTemplates(data);
    } catch (error: any) {
      console.error('Erro ao carregar templates:', error);
      alert('Erro ao carregar templates: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Criar novo template
  const handleNewTemplate = () => {
    setView('editor');
  };

  // Editar template
  const handleEditTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setView('editor');
  };

  // Gerar carteirinha
  const handleGenerateCard = (template: Template) => {
    console.log('handleGenerateCard: template=', template);
    setSelectedTemplate(template);
    setCardData({
      templateId: template.id,
      fields: {},
      photoUrl: ''
    });
    setView('generator');
  };

  // Renderizar lista de templates
  const renderTemplateList = () => (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <FileText className="w-8 h-8 text-green-500" />
              <h1 className="text-2xl font-bold">Sistema OAB v3 - Simples</h1>
            </div>
            <button
              onClick={handleNewTemplate}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors"
            >
              <Plus size={20} />
              Novo Template
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Templates Disponíveis</h2>
              <p className="text-gray-600">Gerencie seus templates de carteirinhas</p>
            </div>
            <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium">
              �️ Supabase Conectado
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <p className="ml-4 text-gray-600">Carregando templates...</p>
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-12">
              <FileText size={48} className="mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum template encontrado</h3>
              <p className="text-gray-600 mb-6">Crie seu primeiro template para começar</p>
              <button
                onClick={handleNewTemplate}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
              >
                <Plus size={20} />
                Criar Template
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <div key={template.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                  <div className="aspect-video bg-gray-100 rounded-t-lg overflow-hidden">
                    {template.frontImage ? (
                      <img
                        src={template.frontImage}
                        alt={template.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <FileText size={32} />
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-semibold text-lg text-gray-900 mb-2">{template.name}</h3>
                    
                    <div className="text-sm text-gray-600 mb-4">
                      <p>Campos frente: {template.frontFields?.length || 0}</p>
                      <p>Campos verso: {template.backFields?.length || 0}</p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditTemplate(template)}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                      >
                        <Edit2 size={16} />
                        Editar
                      </button>
                      
                      <button
                        onClick={() => handleGenerateCard(template)}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
                      >
                        <Printer size={16} />
                        Gerar
                      </button>
                      
                      <button
                        onClick={() => {
                          if (confirm('Tem certeza que deseja deletar este template?')) {
                            // TODO: Implementar deleção quando TemplateEditor suportar
                            alert('Funcionalidade de deletar será implementada no TemplateEditor');
                          }
                        }}
                        className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );

  // Renderizar editor
  const renderEditor = () => (
    <TemplateEditor />
  );

  // Renderizar gerador
  const renderGenerator = () => {
    console.log('renderGenerator: selectedTemplate=', selectedTemplate);
    console.log('renderGenerator: cardData=', cardData);
    
    return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Printer className="w-8 h-8 text-green-500" />
              <h1 className="text-2xl font-bold">Gerador de Carteirinhas</h1>
            </div>
            <button
              onClick={() => setView('list')}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg font-medium transition-colors"
            >
              Voltar
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-bold mb-6">Dados da Carteirinha</h2>
            
            {selectedTemplate && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="font-semibold text-lg mb-4">{selectedTemplate.name}</h3>
                
                <div className="space-y-4">
                  {[...selectedTemplate.frontFields, ...selectedTemplate.backFields].map((field: any) => (
                    <div key={field.id}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {field.label}
                      </label>
                      
                      {field.type === 'photo' ? (
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                setCardData((prev: any) => ({
                                  ...prev,
                                  photoUrl: event.target?.result as string
                                }));
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <input
                          type="text"
                          value={cardData.fields[field.id] || ''}
                          onChange={(e) => setCardData((prev: any) => ({
                            ...prev,
                            fields: {
                              ...prev.fields,
                              [field.id]: e.target.value
                            }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={`Digite ${field.label.toLowerCase()}`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div>
            <h2 className="text-2xl font-bold mb-6">Preview</h2>
            {selectedTemplate && (
              <CardGenerator
                template={selectedTemplate}
                data={cardData}
                onGenerate={async (url) => {
                  console.log('Carteirinha gerada:', url);
                  
                  // Salvar carteirinha no Supabase
                  try {
                    await saveCard(
                      selectedTemplate.id,
                      selectedTemplate.name,
                      selectedTemplate.frontImage || '',
                      selectedTemplate.backImage,
                      cardData,
                      url
                    );
                    alert('Carteirinha salva com sucesso!');
                  } catch (error: any) {
                    console.error('Erro ao salvar carteirinha:', error);
                    alert('Erro ao salvar carteirinha: ' + error.message);
                  }
                }}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
  };

  // Renderizar view principal
  switch (view) {
    case 'editor':
      return renderEditor();
    case 'generator':
      return renderGenerator();
    default:
      return renderTemplateList();
  }
};

export default AppSimple;
