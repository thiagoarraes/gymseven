import { LocalStorage } from './storage';
import { queryClient } from './queryClient';

/**
 * Função para limpar COMPLETAMENTE todos os dados do aplicativo
 * - LocalStorage e SessionStorage
 * - Cache do React Query
 * - Recarrega a página para garantir estado limpo
 */
export async function clearAllAppData(): Promise<void> {
  try {
    console.log('🧹 Iniciando limpeza completa do aplicativo...');
    
    // 1. Limpar LocalStorage e SessionStorage
    LocalStorage.clearAll();
    
    // 2. Limpar cache do React Query
    queryClient.clear();
    
    // 3. Limpar cookies se houver
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
    console.log('✅ Todos os dados locais foram limpos');
    console.log('🔄 Recarregando aplicação...');
    
    // 4. Aguardar um pouco e recarregar a página
    setTimeout(() => {
      window.location.reload();
    }, 500);
    
  } catch (error) {
    console.error('❌ Erro durante limpeza completa:', error);
    // Mesmo com erro, tentar recarregar a página
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }
}

/**
 * Função de desenvolvedor para limpar tudo via console
 * Execute: window.clearAllData() no console do navegador
 */
if (typeof window !== 'undefined') {
  (window as any).clearAllData = clearAllAppData;
}