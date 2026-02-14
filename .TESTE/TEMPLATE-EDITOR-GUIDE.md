# 🎨 Editor de Templates - Guia Completo

## 📦 Instalação

```bash
npm install lucide-react @supabase/supabase-js
```

## 🚀 Como Usar

### 1. Importar o componente

```tsx
import TemplateEditor from './components/TemplateEditor';

function App() {
  return <TemplateEditor />;
}
```

### 2. Estrutura de Arquivos

```
src/
├── components/
│   └── TemplateEditor.tsx       # Componente principal
├── types/
│   └── template.ts              # Tipos TypeScript
├── services/
│   └── templateService.ts       # Integração Supabase
└── App.tsx
```

## 🎯 Funcionalidades

### ✅ Implementadas

- **Upload de PNG** - Frente e verso
- **Preview interativo** - Visualização em tempo real
- **Zoom** - Aumentar/diminuir (50% a 300%)
- **Pan (Arrastar)** - Alt+Click ou botão do meio do mouse
- **Mapear campos de texto** - Clique e arraste para criar
- **Mapear campo de foto** - Apenas na frente
- **Múltiplos campos** - Quantos você precisar
- **Editar labels** - Renomear cada campo
- **Deletar campos** - Remover campos desnecessários
- **Alternância Frente/Verso** - Switch fácil entre os lados
- **Salvar no Supabase** - Persistência de dados

### 🎮 Controles

| Ação | Como Fazer |
|------|------------|
| **Criar campo** | Selecione tipo (Texto/Foto) → Clique e arraste no canvas |
| **Arrastar canvas** | Alt + Click ou Botão do meio do mouse |
| **Zoom In** | Botão + ou Ctrl + Scroll |
| **Zoom Out** | Botão - ou Ctrl + Scroll |
| **Reset view** | Botão "↻" |
| **Selecionar campo** | Clique no campo no canvas ou na lista |
| **Deletar campo** | Clique na lixeira do campo selecionado |
| **Editar label** | Digite no input do campo na sidebar |

## ⚙️ Configuração do Supabase

### 1. Criar a tabela

Vá em **SQL Editor** no Supabase e execute:

```sql
CREATE TABLE templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  front_image TEXT NOT NULL,
  back_image TEXT,
  front_fields JSONB NOT NULL DEFAULT '[]',
  back_fields JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX idx_templates_created_at ON templates(created_at DESC);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_templates_updated_at 
  BEFORE UPDATE ON templates 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
```

### 2. Criar bucket de storage

No **Dashboard** do Supabase:
1. Vá em **Storage**
2. Clique em **Create bucket**
3. Nome: `template-images`
4. **Public**: ✅ Marque como público
5. Clique em **Create**

### 3. Configurar variáveis de ambiente

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
```

## 🎨 Personalização

### Ajustar cores

No `TemplateEditor.tsx`, você pode personalizar:

```tsx
// Cores dos campos
const fieldColors = {
  text: {
    border: 'border-green-500',
    bg: 'bg-green-500/20'
  },
  photo: {
    border: 'border-purple-500',
    bg: 'bg-purple-500/20'
  }
};
```

### Limites de zoom

```tsx
const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 5)); // Máx: 500%
const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.3)); // Mín: 30%
```

### Tamanho mínimo de campo

```tsx
if (width > 50 && height > 50) { // Aumentar para 50px mínimo
  // criar campo...
}
```

## 🔧 Próximas Melhorias

### Funcionalidades Avançadas

1. **Redimensionar campos** - Arrastar cantos para mudar tamanho
2. **Mover campos** - Arrastar campos existentes
3. **Copiar/Colar campos** - Duplicar configurações
4. **Grids e guias** - Alinhamento preciso
5. **Undo/Redo** - Desfazer/Refazer ações
6. **Campos predefinidos** - Templates prontos (Nome, CPF, etc.)
7. **Validação de campos** - Tipos de dados específicos
8. **Export/Import JSON** - Compartilhar templates

### Interface

1. **Atalhos de teclado** - Delete, Ctrl+Z, Ctrl+C, etc.
2. **Context menu** - Botão direito nos campos
3. **Minimap** - Visão geral do canvas
4. **Réguas** - Medidas em pixels
5. **Snap to grid** - Magnetismo

## 📊 Exemplo de Uso Completo

```tsx
import { useState, useEffect } from 'react';
import TemplateEditor from './components/TemplateEditor';
import { getAllTemplates } from './services/templateService';

function TemplateManager() {
  const [templates, setTemplates] = useState([]);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    const data = await getAllTemplates();
    setTemplates(data);
  };

  return (
    <div>
      {editing ? (
        <TemplateEditor 
          onSave={() => {
            setEditing(false);
            loadTemplates();
          }}
        />
      ) : (
        <div>
          <button onClick={() => setEditing(true)}>
            Novo Template
          </button>
          
          {templates.map(template => (
            <div key={template.id}>
              <h3>{template.name}</h3>
              <img src={template.frontImage} alt="Preview" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## 🐛 Troubleshooting

### Canvas não aparece
- Verifique se a imagem foi carregada
- Confira o console para erros

### Campos não salvam
- Verifique credenciais do Supabase
- Confira se a tabela foi criada
- Veja logs no console

### Imagem borrada no zoom
- Adicione `image-rendering: crisp-edges` no CSS
- Use imagens de alta resolução

### Performance lenta
- Otimize tamanho das imagens (max 2MB)
- Use `useMemo` para campos complexos
- Considere virtual scrolling para muitos campos

## 💡 Dicas de Uso

1. **Resolução ideal**: Use PNGs de 1200x600px para carteirinhas
2. **Contraste**: Use cores que se destaquem no background
3. **Margens**: Deixe 20-30px de margem nas bordas
4. **Campos de foto**: Geralmente 200x250px (3x4)
5. **Organização**: Nomeie campos de forma descritiva

## 📞 Suporte

Se precisar de ajuda:
1. Verifique este guia primeiro
2. Confira os logs no console
3. Teste em modo de desenvolvimento

---

## 🎉 Você está pronto!

Agora você tem um editor completo de templates. Integre com o resto do seu sistema de carteirinhas! 🚀
