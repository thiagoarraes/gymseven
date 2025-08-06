import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function testWorkoutLogs() {
  try {
    console.log('Testando inserção na tabela workout_logs...')
    
    const testData = {
      template_id: 'dd8eaddb-51ea-4ae0-ad5f-e7334b05fb02',
      name: 'treino teste',
      start_time: '2025-08-06T20:32:45.460Z',
      completed: false
    }
    
    console.log('Dados enviados:', testData)
    
    const { data, error } = await supabase
      .from('workout_logs')
      .insert(testData)
      .select()
    
    if (error) {
      console.log('Erro encontrado:')
      console.log('  Código:', error.code)
      console.log('  Mensagem:', error.message)
      console.log('  Detalhes:', error.details)
    } else {
      console.log('✅ SUCESSO! Workout log criado:')
      console.log(data)
      
      // Limpar teste
      if (data?.[0]?.id) {
        await supabase.from('workout_logs').delete().eq('id', data[0].id)
        console.log('Teste limpo')
      }
    }
    
  } catch (e) {
    console.error('Exceção:', e)
  }
}

testWorkoutLogs()