import { Client } from 'pg'

async function recreateWorkoutLogs() {
  const client = new Client({ connectionString: process.env.DATABASE_URL! })
  
  try {
    await client.connect()
    console.log('Conectado ao Supabase PostgreSQL')
    
    // Fazer backup dos dados existentes
    console.log('Fazendo backup dos dados existentes...')
    const backupData = await client.query(`SELECT * FROM workout_logs`)
    console.log(`Backup realizado: ${backupData.rows.length} registros`)
    
    // Dropar e recriar a tabela
    console.log('Removendo tabela existente...')
    await client.query('DROP TABLE IF EXISTS workout_logs CASCADE')
    
    console.log('Criando nova tabela workout_logs...')
    await client.query(`
      CREATE TABLE workout_logs (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        template_id VARCHAR,
        name TEXT NOT NULL,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP,
        completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (template_id) REFERENCES workout_templates(id)
      )
    `)
    
    // Restaurar dados se existirem
    if (backupData.rows.length > 0) {
      console.log('Restaurando dados...')
      for (const row of backupData.rows) {
        await client.query(`
          INSERT INTO workout_logs (id, template_id, name, start_time, end_time, completed, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          row.id,
          row.template_id,
          row.name,
          row.start_time,
          row.end_time,
          row.completed || false,
          row.created_at || new Date()
        ])
      }
      console.log('Dados restaurados')
    }
    
    // Verificar nova estrutura
    const newStructure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'workout_logs'
      ORDER BY ordinal_position
    `)
    
    console.log('Nova estrutura da tabela workout_logs:')
    newStructure.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`)
    })
    
    console.log('✅ Tabela workout_logs recriada com sucesso!')
    
  } catch (error) {
    console.error('Erro:', error)
  } finally {
    await client.end()
  }
}

recreateWorkoutLogs()