import { Client } from 'pg'

async function forceFixReps() {
  const client = new Client({ connectionString: process.env.DATABASE_URL! })
  
  try {
    await client.connect()
    console.log('Conectado ao banco')
    
    // Listar todas as tabelas
    const allTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `)
    
    console.log('Todas as tabelas:', allTables.rows.map(r => r.table_name))
    
    // Procurar pela tabela que tem template e exercise no nome
    const templateTable = allTables.rows.find(r => 
      r.table_name.toLowerCase().includes('template') && 
      r.table_name.toLowerCase().includes('exercise')
    )
    
    if (templateTable) {
      const tableName = templateTable.table_name
      console.log(`Tabela encontrada: ${tableName}`)
      // Verificar todas as colunas da tabela
      const allColumns = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position
      `, [tableName])
      
      console.log('Todas as colunas da tabela:')
      allColumns.rows.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`)
      })
      
      if (columnInfo.rows[0]?.data_type === 'integer') {
        console.log('Alterando coluna reps de integer para text...')
        await client.query(`ALTER TABLE "${tableName}" ALTER COLUMN reps TYPE TEXT USING reps::TEXT`)
        console.log('Coluna alterada com sucesso!')
      } else {
        console.log('Coluna já é do tipo correto')
      }
      
      // Verificar após mudança
      const newColumnInfo = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns 
        WHERE table_name = $1 
        AND column_name = 'reps'
      `, [tableName])
      
      console.log('Nova estrutura:', newColumnInfo.rows[0])
    }
    
  } catch (error) {
    console.error('Erro:', error)
  } finally {
    await client.end()
  }
}

forceFixReps()