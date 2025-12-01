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
                alert('Nombre,teléfono y el email son obligatorios');
                return;
            }

            let ok = false;
            if (id) {
                ok = await actualizarCliente(id, cliente);
            } else {
                ok = await crearCliente(cliente);
            }

            if (ok) {
                await cargarClientes(tbody, noDataMessage);
                clientFormSection.style.display = 'none';
                limpiarFormularioCliente();
            } else {
                alert('Error al guardar el cliente');
            }
        });
    }

    // Carga inicial
    cargarClientes(tbody, noDataMessage);
});


// =======================
// Funciones de API
// =======================

async function cargarClientes(tbody, noDataMessage) {
    if (!tbody || !noDataMessage) return;

    tbody.innerHTML = '';
    noDataMessage.style.display = 'none';

    try {
        // Si quieres solo activos, pon ?soloActivos=true
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

        renderClientes(clientes, tbody);

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

function renderClientes(clientes, tbody) {
    tbody.innerHTML = '';

    clientes.forEach(cliente => {
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
        tdEstado.textContent = cliente.activo === false ? 'INACTIVO' : 'ACTIVO';

        // Acciones
        const tdAcciones = document.createElement('td');

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
            btnDesactivar.className = 'btn secondary';
            btnDesactivar.style.marginLeft = '4px';
            btnDesactivar.addEventListener('click', async () => {
                const conf = confirm(`¿Seguro que quieres ${cliente.activo ? 'desactivar' : 'activar'} este cliente?`);
                if (!conf) return;

                const ok = await cambiarEstadoCliente(cliente.id, !cliente.activo);

                if (ok) {
                    // Recargar la tabla
                    const tbodyElement = document.getElementById('clientsTableBody');
                    const noDataElement = document.getElementById('clientsNoDataMessage');
                    await cargarClientes(tbodyElement, noDataElement);
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
        tr.appendChild(tdAcciones);
        tr.appendChild(tdEstado);

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