INSERT INTO usuario (id, nombre, apellidos, email, password_hash, rol)
VALUES (100, 'Admin', 'TacBarber', 'admin@tacbarber.com', '$2a$10$jQxrG42P6Wni9BqdGm1L2.NoFtm5tP.hxE5fqC6SJJwtCQ5eriJQ', 'ADMIN');

SELECT setval('usuario_seq', 100);