// js/roles.js
document.addEventListener('DOMContentLoaded', () => {
    const usuarioStr = localStorage.getItem('usuarioActual');
    if (!usuarioStr) {
        console.log('[ROLES] No hay usuarioActual en localStorage');
        return;
    }

    let usuario;
    try {
        usuario = JSON.parse(usuarioStr);
    } catch (e) {
        console.error('[ROLES] Error parseando usuarioActual', e);
        return;
    }

    if (!usuario || !usuario.rol) {
        console.warn('[ROLES] Usuario sin rol, no aplico restricciones');
        return;
    }

    const rol = (usuario.rol || '').toUpperCase();
    console.log('[ROLES] Rol actual:', rol);

    // Exponemos helpers globales
    window.Roles = {
        rolActual: rol,
        esAdmin: () => rol === 'ADMIN',
        esJefe: () => rol === 'JEFE',
        esEmpleado: () => rol === 'EMPLEADO',
        esBecario: () => rol === 'BECARIO'
    };

    // ==========================
    // OCULTAR ELEMENTOS SEGÚN CLASES DE ROL
    // ==========================
    const rolClass = `rol-${rol.toLowerCase()}`;

    // Buscar todos los elementos con clases de rol
    document.querySelectorAll('[class*="rol-"]').forEach(elemento => {
        // Si el elemento NO tiene la clase del rol actual, ocultarlo
        if (!elemento.classList.contains(rolClass) && !elemento.classList.contains('rol-' + rol.toLowerCase())) {
            // Verificar si tiene alguna clase rol-*
            const tieneRolPermitido = Array.from(elemento.classList).some(clase => {
                if (clase.startsWith('rol-')) {
                    const rolRequerido = clase.replace('rol-', '').toUpperCase();
                    return rolRequerido === rol;
                }
                return false;
            });

            if (!tieneRolPermitido) {
                elemento.style.display = 'none';
            }
        }
    });

    // ==========================
    // BECARIO: Restricción máxima
    // ==========================
    if (rol === 'BECARIO') {
        const paginaActual = window.location.pathname;
        const paginasPermitidas = ['/calendario.html', '/index.html'];

        const tieneAcceso = paginasPermitidas.some(p => paginaActual.includes(p));

        if (!tieneAcceso) {
            alert('No tienes permisos para acceder a esta sección. Solo puedes ver el Calendario.');
            window.location.href = 'calendario.html';
            return;
        }
    }

    console.log('[ROLES] Restricciones aplicadas correctamente');
});
