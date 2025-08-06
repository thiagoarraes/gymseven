import { Client } from 'pg'

async function recreateTable() {
  const client = new Client({ connectionString: process.env.DATABASE_URL! })
  
  try {
    await client.connect()
    console.log('Conectado ao Supabase PostgreSQL')
    
    // Primeiro, fazer backup dos dados existentes
    console.log('Fazendo backup dos dados existentes...')
    const backupData = await client.query(`
      SELECT * FROM workout_template_exercises
    `)
    console.log(`Backup realizado: ${backupData.rows.length} registros`)
    
    // Dropar e recriar a tabela com a estrutura correta
    console.log('Removendo tabela existente...')
    await client.query('DROP TABLE IF EXISTS workout_template_exercises CASCADE')
    
    console.log('Criando nova tabela com estrutura correta...')
    await client.query(`
      CREATE TABLE workout_template_exercises (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        template_id VARCHAR NOT NULL,
        exercise_id VARCHAR NOT NULL,
        sets INTEGER NOT NULL,
        reps TEXT NOT NULL,
        weight REAL,
        rest_duration_seconds INTEGER DEFAULT 90,
        "order" INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (template_id) REFERENCES workout_templates(id) ON DELETE CASCADE,
        FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
      )
    `)
    
    // Restaurar os dados
    if (backupData.rows.length > 0) {
      console.log('Restaurando dados...')
      for (const row of backupData.rows) {
        await client.query(`
          INSERT INTO workout_template_exercises 
          (id, template_id, exercise_id, sets, reps, weight, rest_duration_seconds, "order", created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          row.id, 
          row.template_id, 
          row.exercise_id, 
          row.sets, 
          String(row.reps), // Converter para string
          row.weight, 
          row.rest_duration_seconds || 90, 
          row.order,
          row.created_at || new Date()
        ])
      }
      console.log('Dados restaurados com sucesso')
    }
    
    // Verificar a nova estrutura
    console.log('Verificando nova estrutura...')
    const newStructure = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'workout_template_exercises'
      ORDER BY ordinal_position
    `)
    
    console.log('Nova estrutura da tabela:')
    newStructure.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`)
    })
    
    console.log('✅ Tabela recriada com sucesso!')
    
  } catch (error) {
    console.error('Erro:', error)
  } finally {
    await client.end()
  }
}

recreateTable()