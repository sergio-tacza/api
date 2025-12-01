-- ===============================================
--   TACBARBER · TABLA TOKEN RECUPERACIÓN
--   VERSIÓN 9.0
-- ===============================================

CREATE SEQUENCE tokenrecuperacion_seq START WITH 1 INCREMENT BY 50;

CREATE TABLE token_recuperacion (
                                    id BIGINT PRIMARY KEY,
                                    usuario_id BIGINT NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
                                    token VARCHAR(255) NOT NULL UNIQUE,
                                    fecha_expiracion TIMESTAMP NOT NULL,
                                    usado BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_token_recuperacion_token ON token_recuperacion(token);
