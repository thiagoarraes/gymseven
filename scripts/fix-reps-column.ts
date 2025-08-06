import { Client } from 'pg'

async function fixRepsColumn() {
  const client = new Client({ connectionString: process.env.DATABASE_URL! })
  
  try {
    await client.connect()
    console.log('✅ Conectado ao Supabase')
    
    // Verificar estrutura atual do campo reps
    console.log('🔍 Verificando estrutura atual...')
    
    // Primeiro, encontrar o nome correto da tabela
    const tableNames = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name ILIKE '%template%exercise%'
    `)
    
    console.log('Tabelas encontradas:', tableNames.rows)
    
    const correctTableName = tableNames.rows[0]?.table_name
    if (!correctTableName) {
      throw new Error('Tabela não encontrada')
    }
    
    const currentType = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = $1 
      AND column_name = 'reps'
    `, [correctTableName])
    
    console.log('Estrutura atual do campo reps:', currentType.rows[0])
    
    if (currentType.rows[0]?.data_type === 'integer') {
      console.log('🔧 Alterando campo reps de INTEGER para TEXT...')
      
      // Alterar o tipo da coluna
      await client.query(`
        ALTER TABLE "${correctTableName}" 
        ALTER COLUMN reps TYPE TEXT
      `)
      
      console.log('✅ Campo reps alterado para TEXT com sucesso!')
    } else {
      console.log('✅ Campo reps já está como TEXT')
    }
    
    // Verificar nova estrutura
    const newType = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = $1 
      AND column_name = 'reps'
    `, [correctTableName])
    
    console.log('Nova estrutura do campo reps:', newType.rows[0])
    
  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    await client.end()
  }
}

fixRepsColumn()