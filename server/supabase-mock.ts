// Mock para desenvolvimento quando Supabase não está configurado
// Este arquivo fornece uma interface compatível para desenvolvimento local

export const createMockSupabaseClient = () => {
  console.log('⚠️ Usando cliente Supabase simulado - configure credenciais reais!');
  
  const mockResponse = {
    data: [],
    error: { message: 'Supabase não configurado - dados simulados', code: 'MOCK_ERROR' },
    status: 200,
    statusText: 'Mock Response'
  };

  const mockQueryBuilder = {
    select: () => mockQueryBuilder,
    insert: () => mockQueryBuilder,
    update: () => mockQueryBuilder,
    delete: () => mockQueryBuilder,
    eq: () => mockQueryBuilder,
    order: () => mockQueryBuilder,
    limit: () => mockQueryBuilder,
    single: () => mockResponse,
    then: (callback: any) => callback(mockResponse)
  };

  return {
    from: () => mockQueryBuilder,
    auth: {
      signIn: () => mockResponse,
      signOut: () => mockResponse,
      getUser: () => mockResponse
    }
  };
};