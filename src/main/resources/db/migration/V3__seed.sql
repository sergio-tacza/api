-- ===============================================
--   TACBARBER · DATOS DE PRUEBA (SEED INICIAL)
--   VERSIÓN 3.0
-- ===============================================

-- 🧍 CLIENTES DE EJEMPLO
INSERT INTO cliente (id, nombre, apellidos, telefono, email, notas, activo)
VALUES (
           nextval('cliente_seq'),
           'Juan',
           'Pérez',
           '600111222',
           'juan@demo.com',
           'Prefiere degradado alto',
           true
       );

INSERT INTO cliente (id, nombre, apellidos, telefono, email, notas, activo)
VALUES (
           nextval('cliente_seq'),
           'Ana',
           'López',
           '600222333',
           'ana@demo.com',
           'Le gusta el flequillo largo',
           true
       );

INSERT INTO cliente (id, nombre, apellidos, telefono, email, notas, activo)
VALUES (
           nextval('cliente_seq'),
           'Marcos',
           'Ruiz',
           '600333444',
           'marcos@demo.com',
           'Cliente habitual los sábados',
           true
       );

-- 💈 SERVICIOS DE EJEMPLO
INSERT INTO servicio (id, nombre, duracion_min, precio, activo)
VALUES (
           nextval('servicio_seq'),
           'Corte clásico',
           30,
           12.00,
           true
       );

INSERT INTO servicio (id, nombre, duracion_min, precio, activo)
VALUES (
           nextval('servicio_seq'),
           'Degradado',
           45,
           15.00,
           true
       );

INSERT INTO servicio (id, nombre, duracion_min, precio, activo)
VALUES (
           nextval('servicio_seq'),
           'Barba completa',
           20,
           8.00,
           true
       );

-- 👤 USUARIO BARBERO DE EJEMPLO
INSERT INTO usuario (id, nombre, apellidos, email, password_hash, rol)
VALUES (
           nextval('usuario_seq'),
           'Alex',
           'Barbero',
           'alex@tacbarber.com',
           'demo123',   -- luego se puede cambiar por un hash real si metemos login
           'BARBERO'
       );

-- 📅 CITAS DE EJEMPLO
-- 📅 CITAS DE EJEMPLO
-- 1) Cita para Juan, servicio Corte clásico, con Alex
INSERT INTO cita (id, fecha_hora_inicio, fecha_hora_fin, estado, cliente_id, servicio_id, barbero_id, notas)
VALUES (
           nextval('cita_seq'),
           TIMESTAMP '2025-11-12 10:00:00',
           TIMESTAMP '2025-11-12 10:30:00',
           'CONFIRMADA',
           (SELECT id FROM cliente WHERE email = 'juan@demo.com' LIMIT 1),
       (SELECT id FROM servicio WHERE nombre = 'Corte clásico' LIMIT 1),
       (SELECT id FROM usuario  WHERE email = 'alex@tacbarber.com' LIMIT 1),
    'Primera visita, quiere degradado suave'
    );

-- 2) Cita para Ana, servicio Degradado, con Alex
INSERT INTO cita (id, fecha_hora_inicio, fecha_hora_fin, estado, cliente_id, servicio_id, barbero_id, notas)
VALUES (
           nextval('cita_seq'),
           TIMESTAMP '2025-11-12 11:00:00',
           TIMESTAMP '2025-11-12 11:45:00',
           'CONFIRMADA',
           (SELECT id FROM cliente WHERE email = 'ana@demo.com' LIMIT 1),
       (SELECT id FROM servicio WHERE nombre = 'Degradado' LIMIT 1),
       (SELECT id FROM usuario  WHERE email = 'alex@tacbarber.com' LIMIT 1),
    'Mantener largo por arriba'
    );

