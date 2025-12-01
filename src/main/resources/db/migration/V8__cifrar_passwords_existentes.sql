-- V8__cifrar_passwords_existentes.sql
-- Cifrar contraseñas existentes con BCrypt
-- NOTA: Esto resetea todas las contraseñas a "123456" cifrado

-- Password "123456" cifrada con BCrypt = $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy

UPDATE usuario
SET password_hash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
WHERE password_hash = '123456' OR LENGTH(password_hash) < 50;

-- Esto actualiza todos los usuarios que tengan contraseñas en texto plano
