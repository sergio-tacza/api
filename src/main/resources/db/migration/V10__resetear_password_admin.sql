-- ===============================================
--   TACBARBER · RESETEAR CONTRASEÑA ADMIN
--   Contraseña: admin123
-- ===============================================

UPDATE usuario
SET password_hash = '$2a$10$N9qo8uLOickgx2ZaVzK1e.wr8gOLXN6JL8dLw0Y5Z5x8qJQQ5pS8u'
WHERE email = 'admin@tacbarber.com';
