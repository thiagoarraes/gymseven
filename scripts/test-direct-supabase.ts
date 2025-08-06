import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function testDirectSupabase() {
  try {
    console.log('Testando inserção direta no Supabase com reps como string...')
    
    const testData = {
      template_id: '22789d1e-6528-4c2b-89de-08fb3420e6a9',
      exercise_id: '603c46d2-3690-4d23-aa72-56963bebc061',
      sets: 3,
      reps: '8-12', // String
      weight: null,
      order: 1
    }
    
    console.log('Dados enviados:', testData)
    
    const { data, error } = await supabase
      .from('workout_template_exercises')
      .insert(testData)
      .select()
    
    if (error) {
      console.log('Erro encontrado:')
      console.log('  Código:', error.code)
      console.log('  Mensagem:', error.message)
      console.log('  Detalhes:', error.details)
      
      if (error.code === '22P02') {
        console.log('\n❌ Ainda há problema de tipo de dados!')
        console.log('O campo reps ainda está configurado como INTEGER na tabela do Supabase')
      }
    } else {
      console.log('✅ SUCESSO! Exercício adicionado:')
      console.log(data)
      
      // Limpar teste
      if (data?.[0]?.id) {
        await supabase.from('workoutTemplateExercises').delete().eq('id', data[0].id)
        console.log('Teste limpo')
      }
    }
    
  } catch (e) {
    console.error('Exceção:', e)
  }
}

testDirectSupabase()