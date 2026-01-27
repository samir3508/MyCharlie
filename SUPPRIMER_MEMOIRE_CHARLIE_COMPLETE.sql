-- 🗑️ Supprimer TOUTE la mémoire CHARLIE dans Postgres n8n
-- ⚠️ ATTENTION : Cela supprime TOUT l'historique de conversation de CHARLIE

-- Option 1 : Supprimer toutes les sessions pour un tenant spécifique
DELETE FROM langchain_pg_messages 
WHERE session_id LIKE '%4370c96b-2fda-4c4f-a8b5-476116b8f2fc%';

-- Option 2 : Supprimer toutes les sessions CHARLIE (si tu utilises un préfixe "charlie" dans les Session Keys)
DELETE FROM langchain_pg_messages 
WHERE session_id LIKE '%charlie%' 
   OR session_id LIKE '%CHARLIE%'
   OR session_id LIKE '%Charlie%';

-- Option 3 : Supprimer TOUT l'historique (⚠️ ATTENTION : supprime TOUT pour TOUS les agents)
-- TRUNCATE TABLE langchain_pg_messages;

-- Vérification après suppression
SELECT 
  COUNT(*) as total_messages,
  COUNT(DISTINCT session_id) as total_sessions
FROM langchain_pg_messages;

-- Vérifier qu'il ne reste plus de sessions CHARLIE
SELECT DISTINCT session_id 
FROM langchain_pg_messages 
WHERE session_id LIKE '%4370c96b-2fda-4c4f-a8b5-476116b8f2fc%'
   OR session_id LIKE '%charlie%'
   OR session_id LIKE '%CHARLIE%';
