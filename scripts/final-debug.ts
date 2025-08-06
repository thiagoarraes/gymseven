import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function finalDebug() {
  try {
    console.log('🔍 Testando diferentes formatos de dados...')
    
    const variations = [
      {
        name: 'camelCase com workout_template_exercises',
        table: 'workout_template_exercises',
        data: {
          templateId: '22789d1e-6528-4c2b-89de-08fb3420e6a9',
          exerciseId: '603c46d2-3690-4d23-aa72-56963bebc061',
          sets: 3,
          reps: '8-12',
          weight: 50,
          order: 1
        }
      },
      {
        name: 'snake_case com workout_template_exercises',
        table: 'workout_template_exercises', 
        data: {
          template_id: '22789d1e-6528-4c2b-89de-08fb3420e6a9',
          exercise_id: '603c46d2-3690-4d23-aa72-56963bebc061',
          sets: 3,
          reps: '8-12',
          weight: 50,
          order: 1
        }
      },
      {
        name: 'camelCase com workoutTemplateExercises',
        table: 'workoutTemplateExercises',
        data: {
          templateId: '22789d1e-6528-4c2b-89de-08fb3420e6a9',
          exerciseId: '603c46d2-3690-4d23-aa72-56963bebc061',
          sets: 3,
          reps: '8-12',
          weight: 50,
          order: 1
        }
      }
    ]
    
    for (const variation of variations) {
      console.log(`\n📋 Testando: ${variation.name}`)
      console.log(`Tabela: ${variation.table}`)
      console.log(`Dados:`, variation.data)
      
      try {
        const { data, error } = await supabase
          .from(variation.table)
          .insert(variation.data)
          .select()
        
        if (error) {
          console.log(`❌ Erro: ${error.message}`)
          console.log(`Código: ${error.code}`)
        } else {
          console.log(`✅ SUCESSO! Configuração que funciona encontrada:`)
          console.log(`  Tabela: ${variation.table}`)
          console.log(`  Formato dos campos: ${variation.name}`)
          console.log(`  Resultado:`, data?.[0])
          
          // Limpar o teste
          if (data?.[0]?.id) {
            await supabase.from(variation.table).delete().eq('id', data[0].id)
            console.log(`  🧹 Teste limpo`)
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

finalDebug()