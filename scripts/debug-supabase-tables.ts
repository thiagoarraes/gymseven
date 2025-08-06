import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function debugTables() {
  try {
    console.log('🔍 Verificando tabelas disponíveis no Supabase...')
    
    // Tentar acessar cada tabela e ver como ela responde
    const tables = ['workoutTemplateExercises', 'workout_template_exercises', 'WorkoutTemplateExercises']
    
    for (const tableName of tables) {
      try {
        console.log(`\n📋 Testando tabela: ${tableName}`)
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1)
        
        if (error) {
          console.log(`❌ Erro: ${error.message}`)
        } else {
          console.log(`✅ Tabela ${tableName} encontrada com sucesso`)
          console.log(`Dados de exemplo:`, data?.[0])
          
          // Se encontrou a tabela, teste uma inserção fake
          console.log(`\n🧪 Testando inserção na tabela ${tableName}...`)
          const testInsert = {
            templateId: '22789d1e-6528-4c2b-89de-08fb3420e6a9',
            exerciseId: '603c46d2-3690-4d23-aa72-56963bebc061', 
            sets: 3,
            reps: '8-12',
            weight: 50,
            order: 1
          }
          
          const { data: insertData, error: insertError } = await supabase
            .from(tableName)
            .insert(testInsert)
            .select()
          
          if (insertError) {
            console.log(`❌ Erro inserção: ${insertError.message}`)
            console.log(`Detalhes:`, insertError)
          } else {
            console.log(`✅ Inserção teste funcionou!`)
            // Deletar o teste
            await supabase.from(tableName).delete().eq('id', insertData[0].id)
          }
          break
        }
      } catch (e) {
        console.log(`❌ Exceção: ${e}`)
      }
    }
    
  } catch (error) {
    console.error('Erro geral:', error)
  }
}

debugTables()