import { createClient } from '@supabase/supabase-js'
import { Client } from 'pg'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function fixSchema() {
  try {
    // Usar conexão direta PostgreSQL
    const connectionString = process.env.DATABASE_URL!
    const client = new Client({ connectionString })
    
    await client.connect()
    console.log('✅ Conectado ao Supabase via PostgreSQL')
    
    // Listar todas as tabelas
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%workout%'
    `)
    
    console.log('Tabelas relacionadas a workout:', tables.rows)
    
    // Verificar estrutura completa da tabela
    const fullStructure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'workout_template_exercises'
      ORDER BY ordinal_position
    `)
    
    console.log('Estrutura completa da tabela workout_template_exercises:')
    fullStructure.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`)
    })
    
    // Testar inserção para ver exatamente onde está o erro
    try {
      console.log('\n🧪 Testando inserção...')
      const testData = {
        templateId: 'test-template-id', 
        exerciseId: 'test-exercise-id',
        sets: 3,
        reps: '8-12', // String como deveria ser
        weight: 50.5,
        order: 1
      }
      
      console.log('Dados de teste:', testData)
      
      // Não vamos inserir de verdade, só preparar a query para ver o erro
      const insertQuery = `
        INSERT INTO workout_template_exercises (templateId, exerciseId, sets, reps, weight, "order")
        VALUES ($1, $2, $3, $4, $5, $6)
      `
      
      console.log('Query de inserção:', insertQuery)
      // await client.query(insertQuery, [testData.templateId, testData.exerciseId, testData.sets, testData.reps, testData.weight, testData.order])
      
    } catch (error) {
      console.error('Erro na inserção:', error)
    }
    
    // Verificar nova estrutura
    const newStructure = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'workoutTemplateExercises' 
      AND column_name IN ('reps', 'weight')
    `)
    
    console.log('Nova estrutura:', newStructure.rows)
    
    await client.end()
    
  } catch (error) {
    console.error('Erro:', error)
  }
}

fixSchema()