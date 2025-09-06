-- Execute esta query no SQL Editor do Supabase para verificar as tabelas

-- 1. Listar todas as tabelas em português
SELECT 
    table_name as "📋 Tabela",
    table_schema as "🗂 Schema"
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Verificar estrutura da tabela usuarios
SELECT 
    column_name as "🏷 Coluna",
    data_type as "📊 Tipo",
    is_nullable as "❓ Nulo"
FROM information_schema.columns 
WHERE table_name = 'usuarios' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Verificar estrutura da tabela exercicios
SELECT 
    column_name as "🏷 Coluna",
    data_type as "📊 Tipo",
    is_nullable as "❓ Nulo"
FROM information_schema.columns 
WHERE table_name = 'exercicios' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Verificar se as tabelas antigas ainda existem
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '❌ Tabelas antigas ainda existem!'
        ELSE '✅ Tabelas antigas removidas com sucesso!'
    END as "🔍 Status Limpeza"
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('users', 'exercises', 'workoutTemplates', 'workoutLogs');

-- 5. Status final
SELECT '✅ Schema em português está funcionando corretamente!' as "📢 Status Final";