# Sistema OAB-SP de Carteirinhas

Sistema completo para criação e emissão de carteirinhas digitais com templates personalizáveis.

## 🚀 Deploy

### Vercel
O deploy automático está configurado para o branch `main`.

### Deploy Manual
```bash
# Instalar Vercel CLI
npm i -g vercel

# Fazer deploy
vercel --prod
```

## 🛠️ Tecnologias

- **Frontend**: React 18 + TypeScript + Vite
- **Estilos**: Tailwind CSS
- **Backend**: Supabase
- **Deploy**: Vercel

## 📋 Funcionalidades

- ✅ Criação de templates visuais
- ✅ Editor de campos arrastáveis
- ✅ Upload e corte de fotos
- ✅ Processamento com IA (remoção de background)
- ✅ Geração de carteirinhas
- ✅ Salvamento no Supabase
- ✅ Tema institucional de justiça

## 🔧 Configuração

### Variáveis de Ambiente
Configure as seguintes variáveis no Vercel:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Build
```bash
npm run build
```

## 📱 Acesso

- **Produção**: https://oab1v.vercel.app
- **Repositório**: https://github.com/bauerlucks-tech/OAB1v
