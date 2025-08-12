-- SQL para adicionar colunas faltantes na tabela users
-- Execute este script no SQL Editor do Supabase

-- Adicionar coluna date_of_birth
ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth TIMESTAMP;

-- Adicionar coluna height (altura em cm)
ALTER TABLE users ADD COLUMN IF NOT EXISTS height REAL;

-- Adicionar coluna weight (peso em kg)  
ALTER TABLE users ADD COLUMN IF NOT EXISTS weight REAL;

-- Adicionar coluna activity_level (nível de atividade)
ALTER TABLE users ADD COLUMN IF NOT EXISTS activity_level TEXT DEFAULT 'moderado';

-- Verificar se as colunas foram criadas
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('date_of_birth', 'height', 'weight', 'activity_level')
ORDER BY column_name;