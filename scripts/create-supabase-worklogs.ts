import { Client } from 'pg'

async function createSupabaseWorkLogs() {
  const client = new Client({ connectionString: process.env.DATABASE_URL! })
  
  try {
    await client.connect()
    console.log('Conectado ao Supabase PostgreSQL')
    
    // Dropar todas as tabelas relacionadas se existirem
    console.log('Removendo tabelas existentes...')
    await client.query('DROP TABLE IF EXISTS "workoutLogs" CASCADE')
    await client.query('DROP TABLE IF EXISTS workout_logs CASCADE')
    
    console.log('Criando tabela workoutLogs (camelCase)...')
    await client.query(`
      CREATE TABLE "workoutLogs" (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        "templateId" VARCHAR,
        name TEXT NOT NULL,
        "startTime" TIMESTAMP NOT NULL,
        "endTime" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY ("templateId") REFERENCES "workoutTemplates"(id)
      )
    `)
    
    // Verificar nova estrutura
    const newStructure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'workoutLogs'
      ORDER BY ordinal_position
    `)
    
    console.log('Nova estrutura da tabela workoutLogs:')
    newStructure.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`)
    })
    
    console.log('✅ Tabela workoutLogs criada com sucesso!')
    
  } catch (error) {
    console.error('Erro:', error)
  } finally {
    await client.end()
  }
}

createSupabaseWorkLogs()