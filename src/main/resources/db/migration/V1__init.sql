-- ===============================================
--   TACBARBER · ESTRUCTURA BASE DE DATOS
--   VERSIÓN 1.0 (INICIAL)
-- ===============================================

-- 🧍 TABLA CLIENTE
CREATE TABLE cliente (
  id BIGSERIAL PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL,
  apellidos VARCHAR(120),
  telefono VARCHAR(20) NOT NULL,              -- obligatorio para avisos por WhatsApp
  email VARCHAR(120),
  fecha_alta TIMESTAMP NOT NULL DEFAULT NOW(),
  notas TEXT,
  activo BOOLEAN NOT NULL DEFAULT TRUE        -- permite marcar cliente como inactivo sin borrarlo
);

-- 💈 TABLA SERVICIO
CREATE TABLE servicio (
  id BIGSERIAL PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL,
  duracion_min INT NOT NULL,                  -- duración estimada en minutos
  precio NUMERIC(10,2) NOT NULL,              -- precio con 2 decimales (€, etc.)
  activo BOOLEAN NOT NULL DEFAULT TRUE
);

-- 👤 TABLA USUARIO (ADMIN / BARBERO / RECEPCIÓN)
CREATE TABLE usuario (
  id BIGSERIAL PRIMARY KEY,
  nombre VARCHAR(80),
  apellidos VARCHAR(120),
  email VARCHAR(120) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,        -- contraseña encriptada (BCrypt o Argon2)
  rol VARCHAR(30) NOT NULL                    -- ej: ADMIN, BARBERO, RECEPCION
);

-- 📅 TABLA CITA (RESERVAS)
CREATE TABLE cita (
  id BIGSERIAL PRIMARY KEY,
  fecha_hora_inicio TIMESTAMP NOT NULL,       -- inicio de la cita
  fecha_hora_fin   TIMESTAMP NOT NULL,        -- fin calculado según duración del servicio
  estado VARCHAR(20) NOT NULL,                -- ej: PROGRAMADA, COMPLETADA, CANCELADA
  cliente_id BIGINT NOT NULL REFERENCES cliente(id),
  servicio_id BIGINT NOT NULL REFERENCES servicio(id),
  barbero_id BIGINT REFERENCES usuario(id),
  notas TEXT,                                 -- ej: “quiere degradado alto”, “no tocar barba”
  creado_en TIMESTAMP DEFAULT NOW()           -- fecha de creación del registro
);

-- ⚡ ÍNDICE PARA MEJORAR BÚSQUEDAS POR FECHA
CREATE INDEX idx_cita_inicio ON cita(fecha_hora_inicio);
