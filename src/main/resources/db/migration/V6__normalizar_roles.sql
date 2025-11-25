-- V6__normalizar_roles.sql

UPDATE usuario
SET rol = 'EMPLEADO'
WHERE rol = 'BARBERO';