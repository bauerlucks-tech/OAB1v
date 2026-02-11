# Deploy - Sistema OAB-SP de Carteirinhas

## 🚀 Opções de Deploy

### 1. Vercel (Recomendado)
1. Instale o Vercel CLI: `npm i -g vercel`
2. Execute: `vercel --prod`
3. Siga as instruções no terminal

### 2. Netlify
1. Crie uma conta em [netlify.com](https://netlify.com)
2. Arraste a pasta `dist` para o site
3. O site será publicado automaticamente

### 3. GitHub Pages
1. Faça upload do projeto para GitHub
2. Vá em Settings > Pages do repositório
3. Selecione a branch `main` e pasta `dist`
4. O site será publicado em `https://username.github.io/repo-name`

### 4. Servidor Próprio
1. Faça upload da pasta `dist` para seu servidor
2. Configure o servidor para servir arquivos estáticos

## 📁 Arquivos Gerados

Após executar `npm run build`, a pasta `dist` contém:
- `index.html` - Página principal
- `assets/` - CSS e JavaScript otimizados
- Tamanho total: ~520KB (gzipped: ~160KB)

## ⚙️ Configurações

- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Node Version**: 18+
- **Environment**: Production

## 🔧 Variáveis de Ambiente

Não são necessárias variáveis de ambiente para esta aplicação.

## 🌐 Funcionalidades Deployadas

- ✅ Sistema completo de templates
- ✅ Editor de fotos com crop
- ✅ Visual OAB-SP responsivo
- ✅ Download em alta resolução
- ✅ Persistência local de dados

## 📱 Compatibilidade

- ✅ Desktop (Chrome, Firefox, Safari, Edge)
- ✅ Mobile (iOS Safari, Chrome Mobile)
- ✅ Tablets
- ✅ PWA Ready
