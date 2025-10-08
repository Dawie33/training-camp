-- Supprimer les entrées des migrations obsolètes
DELETE FROM knex_migrations
WHERE name = '20250926070657_create_workout_bases.ts';

-- Vérifier les migrations restantes
SELECT * FROM knex_migrations ORDER BY id;
