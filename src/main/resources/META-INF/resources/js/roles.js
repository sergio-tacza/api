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
        esEmpleado: () => rol === 'EMPLEADO'
    };

    // ==========================
    // REGLAS BÁSICAS POR AHORA
    // ==========================
    //
    // ADMIN: ve todo
    // JEFE:  ve todo (de momento igual que ADMIN)
    // EMPLEADO:
    //   - NO ve el menú de Clientes
    //   - NO ve el menú de Servicios
    //   - NO ve los botones "Nuevo cliente" / "Nuevo servicio"
    //

    if (rol === 'EMPLEADO') {
        // Ocultar items de menú
        const menuClientes = document.querySelector("a[href='clientes.html']");
        const menuServicios = document.querySelector("a[href='servicios.html']");

        if (menuClientes)  menuClientes.style.display = 'none';
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
    }

    // Más adelante aquí podemos añadir normas específicas para JEFE vs ADMIN
});