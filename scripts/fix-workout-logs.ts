import { Client } from 'pg'

async function fixWorkoutLogs() {
  const client = new Client({ connectionString: process.env.DATABASE_URL! })
  
  try {
    await client.connect()
    console.log('Conectado ao Supabase')
    
    // Verificar estrutura atual da tabela workout_logs
    const currentStructure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'workout_logs'
      ORDER BY ordinal_position
    `)
    
    console.log('Estrutura atual da tabela workout_logs:')
    currentStructure.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`)
    })
    
    // Verificar se a coluna 'completed' existe
    const hasCompleted = currentStructure.rows.some(col => col.column_name === 'completed')
    
    if (!hasCompleted) {
      console.log('Adicionando coluna completed...')
      await client.query(`
        ALTER TABLE workout_logs 
        ADD COLUMN completed BOOLEAN DEFAULT FALSE
      `)
      console.log('Coluna completed adicionada com sucesso')
    } else {
      console.log('Coluna completed já existe')
    }
    
    // Verificar se a coluna 'end_time' existe
    const hasEndTime = currentStructure.rows.some(col => col.column_name === 'end_time')
    
    if (!hasEndTime) {
      console.log('Adicionando coluna end_time...')
      await client.query(`
        ALTER TABLE workout_logs 
        ADD COLUMN end_time TIMESTAMP
      `)
      console.log('Coluna end_time adicionada com sucesso')
    } else {
      console.log('Coluna end_time já existe')
    }
    
    // Verificar nova estrutura
    const newStructure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'workout_logs'
      ORDER BY ordinal_position
    `)
    
    console.log('\nNova estrutura da tabela workout_logs:')
    newStructure.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`)
    })
    
  } catch (error) {
    console.error('Erro:', error)
  } finally {
    await client.end()
  }
}

fixWorkoutLogs()