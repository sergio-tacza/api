// js/roles.js
document.addEventListener('DOMContentLoaded', () => {
    const usuarioStr = localStorage.getItem('usuarioActual');
    if (!usuarioStr) {
        // Sesion.js ya se encarga de echarte si no hay sesión
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

    // Exponemos helpers globales por si los necesitamos en otros JS
    window.Roles = {
        rolActual: rol,
        esAdmin: () => rol === 'ADMIN',
        esJefe: () => rol === 'JEFE',
        esEmpleado: () => rol === 'EMPLEADO',
        esBecario: () => rol === 'BECARIO'
    };

    // ==========================
    // REGLAS POR ROL
    // ==========================
    //
    // ADMIN: ve todo
    // JEFE: ve todo
    // EMPLEADO:
    //   - NO ve el menú de Clientes
    //   - NO ve el menú de Servicios
    //   - NO ve los botones "Nuevo cliente" / "Nuevo servicio"
    // BECARIO:
    //   - SOLO ve Calendario
    //   - Redirige si intenta acceder a otras páginas
    //

    // ==========================
    // BECARIO: Restricción máxima
    // ==========================
    if (rol === 'BECARIO') {
        const paginaActual = window.location.pathname;
        const paginasPermitidas = ['/calendario.html', '/index.html'];

        // Si el becario intenta acceder a otra página, redirigir
        const tieneAcceso = paginasPermitidas.some(p => paginaActual.includes(p));

        if (!tieneAcceso) {
            alert('No tienes permisos para acceder a esta sección. Solo puedes ver el Calendario.');
            window.location.href = 'calendario.html';
            return;
        }

        // Ocultar TODOS los menús excepto Calendario
        const menuCitas = document.querySelector("a[href='citas.html']");
        const menuClientes = document.querySelector("a[href='clientes.html']");
        const menuEmpleados = document.querySelector("a[href='empleados.html']");
        const menuServicios = document.querySelector("a[href='servicios.html']");
        const menuDashboard = document.querySelector("a[href='dashboard.html']");

        if (menuCitas) menuCitas.style.display = 'none';
        if (menuClientes) menuClientes.style.display = 'none';
        if (menuEmpleados) menuEmpleados.style.display = 'none';
        if (menuServicios) menuServicios.style.display = 'none';
        if (menuDashboard) menuDashboard.style.display = 'none';

        console.log('[ROLES] BECARIO: Acceso restringido solo a Calendario');
        return; // Ya no hace falta seguir con otras reglas
    }

    // ==========================
    // EMPLEADO: Restricciones medias
    // ==========================
    if (rol === 'EMPLEADO') {
        // Ocultar items de menú
        const menuClientes = document.querySelector("a[href='clientes.html']");
        const menuServicios = document.querySelector("a[href='servicios.html']");

        if (menuClientes) menuClientes.style.display = 'none';
        if (menuServicios) menuServicios.style.display = 'none';

        // Ocultar botones de creación si está en esas páginas
        const btnNuevoCliente = document.getElementById('newClientBtn');
        if (btnNuevoCliente) {
            btnNuevoCliente.style.display = 'none';
        }

        const btnNuevoServicio = document.getElementById('newServiceBtn');
        if (btnNuevoServicio) {
            btnNuevoServicio.style.display = 'none';
        }

        console.log('[ROLES] EMPLEADO: Restricciones aplicadas');
    }

    // ADMIN y JEFE: sin restricciones adicionales
    console.log('[ROLES] Restricciones aplicadas correctamente');
});
