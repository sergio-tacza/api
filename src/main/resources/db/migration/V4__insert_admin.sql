INSERT INTO usuario (id, nombre, email, password, rol, activo)
VALUES (1, 'admin', 'admin@tacbarber.com', '$2a$10$...', 'ADMIN', true)
    ON CONFLICT (id) DO NOTHING;
