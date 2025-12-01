INSERT INTO usuario (id, nombre, email, password, rol, activo)
VALUES (100, 'admin', 'admin@tacbarber.com', '$2a$10$jQxrG42P6Wni9BqdGm1L2.NoFtm5tP.hxE5fqC6SJJwtCQ5eriJQ.', 'ADMIN', true);

SELECT setval('usuario_seq', 100);

