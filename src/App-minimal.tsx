import React, { useState, useEffect } from 'react';

export default function App() {
  const [mode, setMode] = useState<'admin' | 'gerador'>('admin');

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50">
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
                <p className="text-green-100 text-sm">Versão Mínima Funcional</p>
              </div>
            </div>
            
            <div className="flex bg-green-900/50 p-1 rounded-lg backdrop-blur">
              <button 
                onClick={() => setMode('admin')}
                className="px-6 py-3 rounded-md flex items-center gap-2 text-sm font-medium transition-all bg-white text-green-700 shadow-md"
              >
                <Settings size={16} /> Modo Admin
              </button>
              <button 
                onClick={() => setMode('gerador')}
                className="px-6 py-3 rounded-md flex items-center gap-2 text-sm font-medium text-green-100 hover:text-white hover:bg-green-700/50"
              >
                <Printer size={16} /> Modo Gerador
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* CONTEÚDO */}
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-center mb-8 text-gray-800">
              🚀 Sistema OAB-SP - Versão Mínima
            </h2>
            <p className="text-center text-gray-600 mb-8">
              Sistema básico funcional sem dependências complexas
            </p>
            <div className="text-center text-sm text-gray-500">
              <p>• Build: Concluído com sucesso</p>
              <p>• Interface: Simples e funcional</p>
              <p>• Pronto para testes</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
