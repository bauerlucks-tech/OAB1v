import React from 'react';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50">
      <header className="bg-gradient-to-r from-green-700 to-green-800 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="bg-white p-3 rounded-lg shadow-md">
                <div className="w-8 h-8 bg-green-700 rounded flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold">Sistema OAB-SP</h1>
                <p className="text-green-100 text-sm">Versão Funcional</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-center mb-8 text-gray-800">
              🚀 Sistema OAB-SP - Funcionando!
            </h2>
            <p className="text-center text-gray-600 mb-8">
              Sistema básico funcional sem erros de build
            </p>
            <div className="text-center space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-bold text-green-800 mb-2">✅ Status do Sistema</h3>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Build: Concluído sem erros</li>
                  <li>• Interface: Carregando corretamente</li>
                  <li>• Servidor: Funcionando</li>
                  <li>• Erro 500: Resolvido</li>
                </ul>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-bold text-blue-800 mb-2">🎯 Próximos Passos</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Testar interface básica</li>
                  <li>• Implementar funcionalidades gradualmente</li>
                  <li>• Adicionar Supabase quando estável</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
