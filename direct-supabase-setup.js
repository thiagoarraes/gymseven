// Script para conectar diretamente ao Supabase usando pg e criar as tabelas
import pg from 'pg';
const { Client } = pg;

// Usar a DATABASE_URL que já aponta para o Supabase
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL não encontrada');
  process.exit(1);
}

const client = new Client({
  connectionString: databaseUrl
});

const createTablesQueries = [
  `
  CREATE TABLE IF NOT EXISTS usuarios (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "dateOfBirth" TIMESTAMP,
    height REAL,
    weight REAL,
    "activityLevel" TEXT DEFAULT 'moderado',
    "fitnessGoals" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "profileImageUrl" TEXT,
    "experienceLevel" TEXT DEFAULT 'iniciante',
    "preferredWorkoutDuration" INTEGER DEFAULT 60,
    "isActive" BOOLEAN DEFAULT true,
    "emailVerified" BOOLEAN DEFAULT false,
    "lastLoginAt" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
  )
  `,
  `
  CREATE TABLE IF NOT EXISTS "historicoPeso" (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    "usuarioId" VARCHAR NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    peso REAL NOT NULL,
    date TIMESTAMP DEFAULT NOW(),
    observacoes TEXT
  )
  `,
  `
  CREATE TABLE IF NOT EXISTS "objetivosUsuario" (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    "usuarioId" VARCHAR NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    "targetValue" REAL,
    "currentValue" REAL,
    unit TEXT,
    "targetDate" TIMESTAMP,
    "isCompleted" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP DEFAULT NOW()
  )
  `,
  `
  CREATE TABLE IF NOT EXISTS "preferenciasUsuario" (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    "usuarioId" VARCHAR NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    theme TEXT DEFAULT 'dark',
    units TEXT DEFAULT 'metric',
    language TEXT DEFAULT 'pt-BR',
    notifications BOOLEAN DEFAULT true,
    "soundEffects" BOOLEAN DEFAULT true,
    "restTimerAutoStart" BOOLEAN DEFAULT true,
    "defaultRestTime" INTEGER DEFAULT 90,
    "weekStartsOn" INTEGER DEFAULT 1,
    "trackingData" TEXT DEFAULT 'all'
  )
  `,
  `
  CREATE TABLE IF NOT EXISTS "conquistasUsuario" (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    "usuarioId" VARCHAR NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    "achievementId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP DEFAULT NOW(),
    progress INTEGER DEFAULT 0,
    "isCompleted" BOOLEAN DEFAULT true
  )
  `,
  `
  CREATE TABLE IF NOT EXISTS exercicios (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    "usuarioId" VARCHAR NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    "grupoMuscular" TEXT NOT NULL,
    descricao TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW()
  )
  `,
  `
  CREATE TABLE IF NOT EXISTS "modelosTreino" (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    "usuarioId" VARCHAR NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    descricao TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW()
  )
  `,
  `
  CREATE TABLE IF NOT EXISTS "exerciciosModeloTreino" (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    "modeloId" VARCHAR NOT NULL REFERENCES "modelosTreino"(id) ON DELETE CASCADE,
    "exercicioId" VARCHAR NOT NULL REFERENCES exercicios(id) ON DELETE CASCADE,
    series INTEGER NOT NULL,
    repeticoes TEXT NOT NULL,
    weight REAL,
    "restDurationSeconds" INTEGER DEFAULT 90,
    "order" INTEGER NOT NULL
  )
  `,
  `
  CREATE TABLE IF NOT EXISTS "registrosTreino" (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    "usuarioId" VARCHAR NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    "modeloId" VARCHAR REFERENCES "modelosTreino"(id),
    nome TEXT NOT NULL,
    "startTime" TIMESTAMP NOT NULL,
    "endTime" TIMESTAMP
  )
  `,
  `
  CREATE TABLE IF NOT EXISTS "exerciciosRegistroTreino" (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    "registroId" VARCHAR NOT NULL REFERENCES "registrosTreino"(id) ON DELETE CASCADE,
    "exercicioId" VARCHAR NOT NULL REFERENCES exercicios(id),
    "nomeExercicio" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP DEFAULT NOW()
  )
  `,
  `
  CREATE TABLE IF NOT EXISTS "seriesRegistroTreino" (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    "exercicioRegistroId" VARCHAR NOT NULL REFERENCES "exerciciosRegistroTreino"(id) ON DELETE CASCADE,
    "setNumber" INTEGER NOT NULL,
    reps INTEGER,
    weight REAL,
    completed BOOLEAN DEFAULT false
  )
  `
];

async function createTables() {
  try {
    console.log('🔗 Conectando ao banco Supabase...');
    console.log(`📍 URL: ${databaseUrl.substring(0, 50)}...`);
    
    await client.connect();
    console.log('✅ Conectado ao Supabase!');
    
    // Verificar se já existem tabelas
    const checkResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📋 Tabelas existentes:', checkResult.rows.map(r => r.table_name));
    
    // Criar cada tabela
    for (let i = 0; i < createTablesQueries.length; i++) {
      const query = createTablesQueries[i];
      const tableName = query.match(/CREATE TABLE IF NOT EXISTS (\S+)/)[1];
      
      try {
        console.log(`📋 Criando tabela ${tableName}...`);
        await client.query(query);
        console.log(`✅ Tabela ${tableName} criada com sucesso`);
      } catch (error) {
        console.error(`❌ Erro ao criar tabela ${tableName}:`, error.message);
      }
    }
    
    // Verificar tabelas criadas
    const finalResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('🎉 PROCESSO CONCLUÍDO!');
    console.log('📋 Tabelas finais no Supabase:');
    finalResult.rows.forEach(row => {
      console.log(`  ✅ ${row.table_name}`);
    });
    
  } catch (error) {
    console.error('❌ Erro durante o processo:', error);
  } finally {
    await client.end();
    console.log('🔌 Conexão encerrada');
  }
}

createTables();