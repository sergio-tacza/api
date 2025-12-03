document.addEventListener('DOMContentLoaded', () => {
    // Comprobar login

    const logoutBtn = document.getElementById('logoutBtn');
    const newClientBtn = document.getElementById('newClientBtn');
    const clientFormSection = document.getElementById('clientFormSection');
    const clientFormTitle = document.getElementById('clientFormTitle');
    const clientForm = document.getElementById('clientForm');
    const cancelClientEditBtn = document.getElementById('cancelClientEditBtn');
    const tbody = document.getElementById('clientsTableBody');
    const noDataMessage = document.getElementById('clientsNoDataMessage');
    const filtroEstado = document.getElementById('filtroEstado');
    const filtroOrden = document.getElementById('filtroOrden');

    const idInput = document.getElementById('clienteId');
    const nombreInput = document.getElementById('clienteNombre');
    const apellidosInput = document.getElementById('clienteApellidos');
    const telefonoInput = document.getElementById('clienteTelefono');
    const emailInput = document.getElementById('clienteEmail');
    const notasInput = document.getElementById('clienteNotas');

    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('logged');
            localStorage.removeItem('authToken');
            window.location.href = 'index.html';
        });
    }

    // Aseguramos que el formulario esté oculto al principio
    if (clientFormSection) {
        clientFormSection.style.display = 'none';
    }

    // Botón "Nuevo cliente" -> abre form en modo nuevo
    if (newClientBtn) {
        newClientBtn.addEventListener('click', () => {
            abrirFormularioNuevoCliente();
        });
    }

    // Botón cancelar
    if (cancelClientEditBtn) {
        cancelClientEditBtn.addEventListener('click', () => {
            clientFormSection.style.display = 'none';
            limpiarFormularioCliente();
        });
    }

    // Envío del formulario (crear o editar)
    if (clientForm) {
        clientForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const id = idInput.value ? parseInt(idInput.value) : null;
            const cliente = {
                nombre: nombreInput.value.trim(),
                apellidos: apellidosInput.value.trim(),
                telefono: telefonoInput.value.trim(),
                email: emailInput.value.trim(),
                notas: notasInput.value.trim()
            };

            if (!cliente.nombre || !cliente.telefono || !cliente.email) {
                alert('Nombre, teléfono y el email son obligatorios');
                return;
            }

            let ok = false;
            if (id) {
                ok = await actualizarCliente(id, cliente);
            } else {
                ok = await crearCliente(cliente);
            }

            if (ok) {
                const estadoActual = filtroEstado ? filtroEstado.value : 'todos';
                const ordenActual = filtroOrden ? filtroOrden.value : 'az';
                await cargarClientes(tbody, noDataMessage, estadoActual, ordenActual);
                clientFormSection.style.display = 'none';
                limpiarFormularioCliente();
            } else {
                alert('Error al guardar el cliente');
            }
        });
    }

    // Carga inicial
    cargarClientes(tbody, noDataMessage, 'todos', 'az');

    // Escuchar cambios en el filtro de estado
    if (filtroEstado) {
        filtroEstado.addEventListener('change', () => {
            const estado = filtroEstado.value;
            const orden = filtroOrden ? filtroOrden.value : 'az';
            cargarClientes(tbody, noDataMessage, estado, orden);
        });
    }

    // Escuchar cambios en el filtro de orden
    if (filtroOrden) {
        filtroOrden.addEventListener('change', () => {
            const estado = filtroEstado ? filtroEstado.value : 'todos';
            const orden = filtroOrden.value;
            cargarClientes(tbody, noDataMessage, estado, orden);
        });
    }
});


// =======================
// Funciones de API
// =======================

async function cargarClientes(tbody, noDataMessage, estado = 'todos', orden = 'az') {
    if (!tbody || !noDataMessage) return;

    tbody.innerHTML = '';
    noDataMessage.style.display = 'none';

    try {
        const response = await fetch('/clientes?soloActivos=false');
        if (!response.ok) {
            noDataMessage.textContent = 'No se han podido cargar los clientes.';
            noDataMessage.style.display = 'block';
            return;
        }

        const clientes = await response.json();
        if (!clientes || clientes.length === 0) {
            noDataMessage.textContent = 'No hay clientes registrados.';
            noDataMessage.style.display = 'block';
            return;
        }

        renderClientes(clientes, tbody, estado, orden);

    } catch (err) {
        console.error('Error al cargar /clientes', err);
        noDataMessage.textContent = 'Error de conexión con el servidor.';
        noDataMessage.style.display = 'block';
    }
}

async function crearCliente(cliente) {
    try {
        const response = await fetch('/clientes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(cliente)
        });
        return response.ok;
    } catch (err) {
        console.error('Error al crear cliente', err);
        return false;
    }
}

async function actualizarCliente(id, cliente) {
    try {
        const response = await fetch(`/clientes/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(cliente)
        });
        return response.ok;
    } catch (err) {
        console.error('Error al actualizar cliente', err);
        return false;
    }
}

async function cambiarEstadoCliente(id, activar) {
    try {
        const endpoint = activar ? 'activar' : 'desactivar';
        const response = await fetch(`/clientes/${id}/${endpoint}`, {
            method: 'PUT'
        });
        return response.ok;
    } catch (err) {
        console.error('Error al cambiar estado cliente', err);
        return false;
    }
}


async function borrarCliente(id) {
    try {
        const response = await fetch(`/clientes/${id}`, {
            method: 'DELETE'
        });
        return response.ok;
    } catch (err) {
        console.error('Error al borrar cliente', err);
        return false;
    }
}


// =======================
// Renderizado tabla
// =======================

function renderClientes(clientes, tbody, estado = 'todos', orden = 'az') {
    tbody.innerHTML = '';

    // Filtrar clientes según el estado
    let clientesFiltrados = clientes;
    if (estado === 'activos') {
        clientesFiltrados = clientes.filter(c => c.activo !== false);
    } else if (estado === 'inactivos') {
        clientesFiltrados = clientes.filter(c => c.activo === false);
    }

    // Ordenar según el filtro
    clientesFiltrados.sort((a, b) => {
        const nombreA = ((a.nombre || '') + ' ' + (a.apellidos || '')).toLowerCase();
        const nombreB = ((b.nombre || '') + ' ' + (b.apellidos || '')).toLowerCase();

        if (orden === 'az') {
            return nombreA.localeCompare(nombreB);
        } else {
            return nombreB.localeCompare(nombreA);
        }
    });

    if (clientesFiltrados.length === 0) {
        const noDataMessage = document.getElementById('clientsNoDataMessage');
        if (noDataMessage) {
            noDataMessage.textContent = `No hay clientes ${estado === 'activos' ? 'activos' : estado === 'inactivos' ? 'inactivos' : ''}.`;
            noDataMessage.style.display = 'block';
        }
        return;
    }

    clientesFiltrados.forEach(cliente => {
        const tr = document.createElement('tr');

        const nombreCompleto =
            (cliente.nombre || '') +
            (cliente.apellidos ? (' ' + cliente.apellidos) : '');

        const tdNombre = document.createElement('td');
        tdNombre.textContent = nombreCompleto || '-';

        const tdTelefono = document.createElement('td');
        tdTelefono.textContent = cliente.telefono || '-';

        const tdEmail = document.createElement('td');
        tdEmail.textContent = cliente.email || '-';

        const tdNotas = document.createElement('td');
        tdNotas.textContent = cliente.notas || '-';

        const tdEstado = document.createElement('td');
        const spanEstado = document.createElement('span');
        spanEstado.className = `estado ${cliente.activo === false ? 'cancelada' : 'confirmada'}`;
        spanEstado.textContent = cliente.activo === false ? 'INACTIVO' : 'ACTIVO';
        tdEstado.appendChild(spanEstado);


        // Acciones
        const tdAcciones = document.createElement('td');
        tdAcciones.classList.add('actions-cell');

        const btnEditar = document.createElement('button');
        btnEditar.textContent = 'Editar';
        btnEditar.className = 'btn secondary';
        btnEditar.addEventListener('click', () => {
            abrirFormularioEditarCliente(cliente);
        });
        tdAcciones.appendChild(btnEditar);

        const rol = window.Roles ? window.Roles.rolActual : null;
        const esAdminOJefe = rol === 'ADMIN' || rol === 'JEFE';

        // Solo ADMIN/JEFE pueden desactivar y borrar
        if (esAdminOJefe) {
            const btnDesactivar = document.createElement('button');
            btnDesactivar.textContent = cliente.activo ? 'Desactivar' : 'Activar';
            btnDesactivar.className = cliente.activo ? 'btn danger' : 'btn primary';
            btnDesactivar.addEventListener('click', async () => {
                const conf = confirm(`¿Seguro que quieres ${cliente.activo ? 'desactivar' : 'activar'} este cliente?`);
                if (!conf) return;

                const ok = await cambiarEstadoCliente(cliente.id, !cliente.activo);

                if (ok) {
                    const tbodyElement = document.getElementById('clientsTableBody');
                    const noDataElement = document.getElementById('clientsNoDataMessage');
                    const filtroEstado = document.getElementById('filtroEstado');
                    const filtroOrden = document.getElementById('filtroOrden');
                    const estadoActual = filtroEstado ? filtroEstado.value : 'todos';
                    const ordenActual = filtroOrden ? filtroOrden.value : 'az';
                    await cargarClientes(tbodyElement, noDataElement, estadoActual, ordenActual);
                } else {
                    alert('Error al cambiar estado del cliente');
                }
            });
            tdAcciones.appendChild(btnDesactivar);
        }

        tr.appendChild(tdNombre);
        tr.appendChild(tdTelefono);
        tr.appendChild(tdEmail);
        tr.appendChild(tdNotas);
        tr.appendChild(tdEstado);
        tr.appendChild(tdAcciones);


        tbody.appendChild(tr);
    });
}



// =======================
// Helpers formulario
// =======================

function abrirFormularioNuevoCliente() {
    const section = document.getElementById('clientFormSection');
    const title = document.getElementById('clientFormTitle');
    limpiarFormularioCliente();
    if (title) title.textContent = 'Nuevo cliente';
    if (section) section.style.display = 'block';
}

function abrirFormularioEditarCliente(cliente) {
    const section = document.getElementById('clientFormSection');
    const title = document.getElementById('clientFormTitle');

    document.getElementById('clienteId').value = cliente.id;
    document.getElementById('clienteNombre').value = cliente.nombre || '';
    document.getElementById('clienteApellidos').value = cliente.apellidos || '';
    document.getElementById('clienteTelefono').value = cliente.telefono || '';
    document.getElementById('clienteEmail').value = cliente.email || '';
    document.getElementById('clienteNotas').value = cliente.notas || '';

    if (title) title.textContent = 'Editar cliente';
    if (section) section.style.display = 'block';
}

function limpiarFormularioCliente() {
    document.getElementById('clienteId').value = '';
    document.getElementById('clienteNombre').value = '';
    document.getElementById('clienteApellidos').value = '';
    document.getElementById('clienteTelefono').value = '';
    document.getElementById('clienteEmail').value = '';
    document.getElementById('clienteNotas').value = '';
}
