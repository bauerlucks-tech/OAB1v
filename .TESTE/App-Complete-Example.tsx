import React, { useState, useEffect } from 'react';
import TemplateEditor from './components/TemplateEditor';
import CardGenerator from './components/CardGenerator';
import { getAllTemplates, saveTemplate, deleteTemplate } from './services/templateService';
import type { Template, TemplateCardData } from './types/template';
import { Plus, Edit2, Trash2, FileText } from 'lucide-react';

type View = 'list' | 'editor' | 'generator';

const App: React.FC = () => {
  const [view, setView] = useState<View>('list');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(false);

  // Dados exemplo para geração de carteirinha
  const [cardData, setCardData] = useState<TemplateCardData>({
    templateId: '',
    fields: {},
    photoUrl: ''
  });

  // Carregar templates
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
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
  const handleEditTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setView('editor');
  };

  // Deletar template
  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este template?')) return;

    try {
      await deleteTemplate(id);
      await loadTemplates();
      alert('Template deletado com sucesso!');
    } catch (error) {
      console.error('Erro ao deletar:', error);
      alert('Erro ao deletar template');
    }
  };

  // Gerar carteirinha
  const handleGenerateCard = (template: Template) => {
    setSelectedTemplate(template);
    
    // Inicializar dados dos campos
    const fields: { [key: string]: string } = {};
    [...template.frontFields, ...template.backFields].forEach(field => {
      if (field.type === 'text') {
        fields[field.id] = ''; // Valor vazio, será preenchido pelo usuário
      }
    });

    setCardData({
      templateId: template.id,
      fields,
      photoUrl: ''
    });

    setView('generator');
  };

  // Salvar template editado
  const handleSaveTemplate = async (template: Template) => {
    try {
      await saveTemplate(template);
      await loadTemplates();
      setView('list');
      alert('Template salvo com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar template');
    }
  };

  // Renderizar views
  if (view === 'editor') {
    return (
      <div className="h-screen">
        <TemplateEditor 
          initialTemplate={selectedTemplate}
          onSave={handleSaveTemplate}
          onCancel={() => setView('list')}
        />
      </div>
    );
  }

  if (view === 'generator' && selectedTemplate) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => setView('list')}
              className="text-blue-400 hover:text-blue-300 mb-4"
            >
              ← Voltar para templates
            </button>
            <h1 className="text-3xl font-bold">Gerar Carteirinha</h1>
            <p className="text-gray-400">Template: {selectedTemplate.name}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Formulário */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Dados da Carteirinha</h2>
              
              {/* Upload de foto */}
              {selectedTemplate.frontFields.some(f => f.type === 'photo') && (
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">Foto</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          setCardData(prev => ({
                            ...prev,
                            photoUrl: ev.target?.result as string
                          }));
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                  />
                </div>
              )}

              {/* Campos de texto */}
              {[...selectedTemplate.frontFields, ...selectedTemplate.backFields]
                .filter(f => f.type === 'text')
                .map(field => (
                  <div key={field.id} className="mb-4">
                    <label className="block text-sm font-medium mb-2">
                      {field.label}
                    </label>
                    <input
                      type="text"
                      value={cardData.fields[field.id] || ''}
                      onChange={(e) => {
                        setCardData(prev => ({
                          ...prev,
                          fields: {
                            ...prev.fields,
                            [field.id]: e.target.value
                          }
                        }));
                      }}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder={`Digite ${field.label.toLowerCase()}`}
                    />
                  </div>
                ))}
            </div>

            {/* Preview */}
            <CardGenerator 
              template={selectedTemplate}
              data={cardData}
            />
          </div>
        </div>
      </div>
    );
  }

  // Lista de templates
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Templates de Carteirinhas</h1>
            <p className="text-gray-400">Gerencie seus templates</p>
          </div>
          <button
            onClick={handleNewTemplate}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium"
          >
            <Plus size={20} />
            Novo Template
          </button>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Carregando templates...</p>
          </div>
        ) : templates.length === 0 ? (
          // Empty state
          <div className="text-center py-12 bg-gray-800 rounded-lg">
            <FileText size={48} className="mx-auto mb-4 text-gray-600" />
            <h3 className="text-xl font-semibold mb-2">Nenhum template encontrado</h3>
            <p className="text-gray-400 mb-6">Comece criando seu primeiro template</p>
            <button
              onClick={handleNewTemplate}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium"
            >
              <Plus size={20} />
              Criar Primeiro Template
            </button>
          </div>
        ) : (
          // Grid de templates
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map(template => (
              <div
                key={template.id}
                className="bg-gray-800 rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all"
              >
                {/* Preview da imagem */}
                <div className="aspect-video bg-gray-900 flex items-center justify-center p-4">
                  <img
                    src={template.frontImage}
                    alt={template.name}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-2">{template.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                    <span>Frente: {template.frontFields.length} campos</span>
                    {template.backImage && (
                      <span>Verso: {template.backFields.length} campos</span>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleGenerateCard(template)}
                      className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-sm font-medium"
                    >
                      Gerar Carteirinha
                    </button>
                    <button
                      onClick={() => handleEditTemplate(template)}
                      className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors"
                      title="Deletar"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
