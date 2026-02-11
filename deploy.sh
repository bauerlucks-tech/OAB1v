#!/bin/bash

echo "🚀 Iniciando deploy do Sistema OAB-SP..."

# Build do projeto
echo "📦 Buildando projeto..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build concluído com sucesso!"
    echo "📁 Arquivos gerados na pasta 'dist':"
    ls -la dist/
    
    echo ""
    echo "🌐 Opções de deploy:"
    echo "1. Vercel: vercel --prod"
    echo "2. Netlify: Arraste pasta 'dist' para netlify.com"
    echo "3. GitHub: Faça push e configure GitHub Pages"
    echo ""
    echo "📊 Tamanho total:"
    du -sh dist/
else
    echo "❌ Build falhou! Verifique os erros acima."
    exit 1
fi
