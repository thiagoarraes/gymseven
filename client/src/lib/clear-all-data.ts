import { LocalStorage } from './storage';
import { queryClient } from './queryClient';

/**
 * Função para limpar COMPLETAMENTE todos os dados do aplicativo
 * - LocalStorage e SessionStorage
 * - Cache do React Query
 * - Força limpeza do cache do navegador
 * - Recarrega a página para garantir estado limpo
 */
export async function clearAllAppData(): Promise<void> {
  try {
    console.log('🧹 Iniciando limpeza COMPLETA do aplicativo...');
    
    // 1. Limpar LocalStorage e SessionStorage
    LocalStorage.clearAll();
    sessionStorage.clear();
    
    // 2. Limpar cache do React Query COMPLETAMENTE
    queryClient.clear();
    queryClient.removeQueries();
    queryClient.cancelQueries();
    
    // 3. Limpar TODOS os cookies
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
    // 4. Limpar IndexedDB se houver
    if ('indexedDB' in window) {
      try {
        const databases = await indexedDB.databases();
        databases.forEach(db => {
          if (db.name) indexedDB.deleteDatabase(db.name);
        });
      } catch (err) {
        console.warn('Erro ao limpar IndexedDB:', err);
      }
    }
    
    // 5. Limpar Web SQL se houver (deprecated mas pode estar presente)
    if ('webkitStorageInfo' in window) {
      try {
        (window as any).webkitStorageInfo.requestQuota(0, 0, () => {}, () => {});
      } catch (err) {
        console.warn('Erro ao limpar WebSQL:', err);
      }
    }
    
    console.log('✅ TODOS os dados locais e cache foram limpos');
    console.log('🔄 Forçando reload completo...');
    
    // 6. Força reload completo ignorando cache
    setTimeout(() => {
      window.location.href = window.location.href + '?nocache=' + Date.now();
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