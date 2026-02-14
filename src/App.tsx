import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, FileText, Printer } from 'lucide-react';
import { Template } from './types/template';
import TemplateEditorAdvanced from './components/TemplateEditorAdvanced';
import DocumentGenerator from './components/DocumentGenerator';
import { getAllTemplates, saveTemplate, getTemplateById, deleteTemplate } from './services/templateService';

type View = 'list' | 'editor' | 'generator' | 'document';

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Oops! Algo deu errado.</h1>
            <p className="text-gray-400 mb-4">
              {this.state.error?.message || 'Erro desconhecido'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  const [view, setView] = useState<View>('list');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(false);

  // Carregar templates ao iniciar
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await getAllTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
      alert('Erro ao carregar templates');
    } finally {
      setLoading(false);
    }
  };

  // Criar novo template
  const handleNewTemplate = () => {
    setSelectedTemplate(null);
    setView('editor');
  };

  // Editar template
  const handleEditTemplate = async (template: Template) => {
    try {
      const fullTemplate = await getTemplateById(template.id);
      setSelectedTemplate(fullTemplate);
      setView('editor');
    } catch (error) {
      console.error('Erro ao carregar template para edição:', error);
      alert('Erro ao carregar template para edição');
    }
  };

  // Excluir template
  const handleDeleteTemplate = async (template: Template) => {
    if (!confirm(`Tem certeza que deseja excluir o template "${template.name}"?`)) {
      return;
    }

    try {
      await deleteTemplate(template.id);
      await loadTemplates();
    } catch (error) {
      console.error('Erro ao excluir template:', error);
      alert('Erro ao excluir template');
    }
  };

  // Gerar documento
  const handleGenerateDocument = (template: Template) => {
    setSelectedTemplate(template);
    setView('document');
  };

  // Salvar template
  const handleSaveTemplate = async (template: Template) => {
    try {
      const savedTemplate = await saveTemplate(template);
      setSelectedTemplate(savedTemplate);
      await loadTemplates();
      return savedTemplate;
    } catch (error) {
      console.error('Erro ao salvar template:', error);
      alert('Erro ao salvar template');
      throw error;
    }
  };

  // Renderizar lista de templates
  const renderList = () => (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <FileText className="w-8 h-8 text-green-500" />
              <h1 className="text-2xl font-bold">Gerador de Templates</h1>
            </div>
            <button
              onClick={handleNewTemplate}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors"
            >
              <Plus size={20} />
              Novo Template
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-r-2 border-green-500"></div>
            <p className="mt-4 text-gray-600">Carregando templates...</p>
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum template encontrado</h3>
            <p className="text-gray-500 mb-4">
              Crie seu primeiro template para começar a usar o sistema.
            </p>
            <button
              onClick={handleNewTemplate}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
            >
              Criar Primeiro Template
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div key={template.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {template.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleGenerateDocument(template)}
                        className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                        title="Gerar Documento"
                      >
                        <Printer size={16} className="text-white" />
                      </button>
                      <button
                        onClick={() => handleEditTemplate(template)}
                        className="p-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
                        title="Editar Template"
                      >
                        <Edit2 size={16} className="text-white" />
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template)}
                        className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                        title="Excluir Template"
                      >
                        <Trash2 size={16} className="text-white" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <p>Dimensões: {template.width} x {template.height}</p>
                    <p>Campos: {template.fields.length}</p>
                    <p>
                      Fotos: {template.fields.filter(f => f.type === 'photo').length} (máx. 1 no verso)
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );

  // Renderizar editor
  const renderEditor = () => (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <FileText className="w-8 h-8 text-green-500" />
              <h1 className="text-2xl font-bold">Editor de Templates</h1>
            </div>
            <button
              onClick={() => {
                setSelectedTemplate(null);
                setView('list');
              }}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg font-medium transition-colors"
            >
              Voltar ao Menu
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <TemplateEditorAdvanced 
          template={selectedTemplate}
          onChange={async (updatedTemplate) => {
            try {
              await handleSaveTemplate(updatedTemplate);
            } catch (error) {
              // Erro já tratado em handleSaveTemplate
            }
          }}
        />
      </main>
    </div>
  );

  // Renderizar gerador de documento
  const renderDocument = () => {
    if (!selectedTemplate) return null;

    return (
      <DocumentGenerator
        template={selectedTemplate}
        onSave={(data) => {
          console.log('Dados do documento:', data);
          alert('Documento salvo com sucesso!');
          setView('list');
        }}
      />
    );
  };

  // Renderizar view principal
  if (view === 'list') return renderList();
  if (view === 'editor') return renderEditor();
  if (view === 'document') return renderDocument();

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">View não encontrada</h1>
          <p className="text-gray-400 mb-4">A view solicitada não existe.</p>
          <button
            onClick={() => setView('list')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            Voltar ao Menu
          </button>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;
