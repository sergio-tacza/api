document.addEventListener('DOMContentLoaded', () => {
    // Comprobar login

    const logoutBtn = document.getElementById('logoutBtn');
    const newServiceBtn = document.getElementById('newServiceBtn');
    const serviceFormSection = document.getElementById('serviceFormSection');
    const serviceFormTitle = document.getElementById('serviceFormTitle');
    const serviceForm = document.getElementById('serviceForm');
    const cancelEditBtn = document.getElementById('cancelServiceEditBtn');
    const tbody = document.getElementById('servicesTableBody');
    const noDataMessage = document.getElementById('servicesNoDataMessage');
    const filtroOrden = document.getElementById('filtroOrden');

    const idInput = document.getElementById('servicioId');
    const nombreInput = document.getElementById('servicioNombre');
    const duracionInput = document.getElementById('servicioDuracion');
    const precioInput = document.getElementById('servicioPrecio');

    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('logged');
            localStorage.removeItem('authToken');
            window.location.href = 'index.html';
        });
    }

    // Asegurar que el formulario está oculto al inicio
    if (serviceFormSection) {
        serviceFormSection.style.display = 'none';
    }

    // Botón "Nuevo servicio" -> abre formulario en modo nuevo
    if (newServiceBtn) {
        newServiceBtn.addEventListener('click', () => {
            abrirFormularioNuevoServicio();
        });
    }

    // Botón "Cancelar" -> oculta y limpia formulario
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', () => {
            serviceFormSection.style.display = 'none';
            limpiarFormularioServicio();
        });
    }

    // Guardar servicio (nuevo o edición)
    if (serviceForm) {
        serviceForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const id = idInput.value ? parseInt(idInput.value) : null;
            const servicio = {
                nombre: (nombreInput.value || '').trim(),
                duracionMin: duracionInput.value ? parseInt(duracionInput.value) : null,
                precio: precioInput.value ? parseFloat(precioInput.value) : null
            };

            if (!servicio.nombre || !servicio.duracionMin || servicio.duracionMin <= 0 || servicio.precio == null || servicio.precio <= 0) {
                alert('Nombre, duración (>0) y precio (>0) son obligatorios');
                return;
            }

            let ok = false;
            if (id) {
                ok = await actualizarServicio(id, servicio);
            } else {
                ok = await crearServicio(servicio);
            }

            if (ok) {
                const ordenActual = filtroOrden ? filtroOrden.value : 'az';
                await cargarServicios(tbody, noDataMessage, ordenActual);
                serviceFormSection.style.display = 'none';
                limpiarFormularioServicio();
            } else {
                alert('Error al guardar el servicio');
            }
        });
    }

    // Carga inicial de la tabla
    cargarServicios(tbody, noDataMessage, 'az');

    // Escuchar cambios en el filtro de orden
    if (filtroOrden) {
        filtroOrden.addEventListener('change', () => {
            const orden = filtroOrden.value;
            cargarServicios(tbody, noDataMessage, orden);
        });
    }
});

// =======================
// Funciones de API
// =======================

async function cargarServicios(tbody, noDataMessage, orden = 'az') {
    if (!tbody || !noDataMessage) return;

    tbody.innerHTML = '';
    noDataMessage.style.display = 'none';

    try {
        const response = await fetch('/servicios?soloActivos=false');
        if (!response.ok) {
            noDataMessage.textContent = 'No se han podido cargar los servicios.';
            noDataMessage.style.display = 'block';
            return;
        }

        const servicios = await response.json();
        if (!servicios || servicios.length === 0) {
            noDataMessage.textContent = 'No hay servicios registrados.';
            noDataMessage.style.display = 'block';
            return;
        }

        renderServicios(servicios, tbody, orden);

    } catch (err) {
        console.error('Error al cargar /servicios', err);
        noDataMessage.textContent = 'Error de conexión con el servidor.';
        noDataMessage.style.display = 'block';
    }
}

async function crearServicio(servicio) {
    try {
        const response = await fetch('/servicios', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(servicio)
        });
        return response.ok;
    } catch (err) {
        console.error('Error al crear servicio', err);
        return false;
    }
}

async function actualizarServicio(id, servicio) {
    try {
        const response = await fetch(`/servicios/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(servicio)
        });
        return response.ok;
    } catch (err) {
        console.error('Error al actualizar servicio', err);
        return false;
    }
}

async function borrarServicio(id) {
    try {
        const response = await fetch(`/servicios/${id}`, {
            method: 'DELETE'
        });
        return response.ok;
    } catch (err) {
        console.error('Error al borrar servicio', err);
        return false;
    }
}

// =======================
// Renderizado tabla
// =======================

function renderServicios(servicios, tbody, orden = 'az') {
    tbody.innerHTML = '';

    // Ordenar según el filtro
    servicios.sort((a, b) => {
        const nombreA = (a.nombre || '').toLowerCase();
        const nombreB = (b.nombre || '').toLowerCase();

        if (orden === 'az') {
            return nombreA.localeCompare(nombreB);
        } else {
            return nombreB.localeCompare(nombreA);
        }
    });

    if (servicios.length === 0) {
        const noDataMessage = document.getElementById('servicesNoDataMessage');
        if (noDataMessage) {
            noDataMessage.textContent = 'No hay servicios registrados.';
            noDataMessage.style.display = 'block';
        }
        return;
    }

    servicios.forEach(servicio => {
        const tr = document.createElement('tr');

        const tdNombre = document.createElement('td');
        tdNombre.textContent = servicio.nombre || '-';

        const tdDuracion = document.createElement('td');
        tdDuracion.textContent =
            servicio.duracionMin != null ? servicio.duracionMin + ' min' : '-';

        const tdPrecio = document.createElement('td');
        tdPrecio.textContent =
            servicio.precio != null ? Number(servicio.precio).toFixed(2) + ' €' : '-';

        const tdAcciones = document.createElement('td');
        tdAcciones.classList.add('actions-cell');

        // Botón editar
        const btnEditar = document.createElement('button');
        btnEditar.textContent = 'Editar';
        btnEditar.className = 'btn secondary';
        btnEditar.addEventListener('click', () => {
            abrirFormularioEditarServicio(servicio);
        });
        tdAcciones.appendChild(btnEditar);

        const rol = window.Roles ? window.Roles.rolActual : null;
        const esAdminOJefe = rol === 'ADMIN' || rol === 'JEFE';

        if (esAdminOJefe) {
            const btnEliminar = document.createElement('button');
            btnEliminar.textContent = 'Eliminar';
            btnEliminar.className = 'btn danger';
            btnEliminar.addEventListener('click', async () => {
                const conf = confirm('¿Seguro que quieres eliminar este servicio?');
                if (!conf) return;

                const ok = await borrarServicio(servicio.id);
                if (ok) {
                    const filtroOrden = document.getElementById('filtroOrden');
                    const ordenActual = filtroOrden ? filtroOrden.value : 'az';
                    cargarServicios(tbody, document.getElementById('servicesNoDataMessage'), ordenActual);
                } else {
                    alert('Error al eliminar el servicio');
                }
            });
            tdAcciones.appendChild(btnEliminar);
        }

        tr.appendChild(tdNombre);
        tr.appendChild(tdDuracion);
        tr.appendChild(tdPrecio);
        tr.appendChild(tdAcciones);

        tbody.appendChild(tr);
    });
}

// =======================
// Helpers formulario
// =======================

function abrirFormularioNuevoServicio() {
    const section = document.getElementById('serviceFormSection');
    const title = document.getElementById('serviceFormTitle');

    limpiarFormularioServicio();
    if (title) title.textContent = 'Nuevo servicio';
    if (section) section.style.display = 'block';
}

function abrirFormularioEditarServicio(servicio) {
    const section = document.getElementById('serviceFormSection');
    const title = document.getElementById('serviceFormTitle');

    document.getElementById('servicioId').value = servicio.id;
    document.getElementById('servicioNombre').value = servicio.nombre || '';
    document.getElementById('servicioDuracion').value =
        servicio.duracionMin != null ? servicio.duracionMin : '';
    document.getElementById('servicioPrecio').value =
        servicio.precio != null ? servicio.precio : '';

    if (title) title.textContent = 'Editar servicio';
    if (section) section.style.display = 'block';
}

function limpiarFormularioServicio() {
    document.getElementById('servicioId').value = '';
    document.getElementById('servicioNombre').value = '';
    document.getElementById('servicioDuracion').value = '';
    document.getElementById('servicioPrecio').value = '';
}