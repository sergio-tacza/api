let empleados = [];
let editandoId = null;

document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logoutBtn');
    const filtroOrden = document.getElementById('filtroOrden');

    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('logged');
            localStorage.removeItem('authToken');
            window.location.href = 'index.html';
        });
    }

    // Carga inicial
    cargarEmpleados('az');

    // Listener del filtro de orden
    if (filtroOrden) {
        filtroOrden.addEventListener('change', () => {
            const orden = filtroOrden.value;
            cargarEmpleados(orden);
        });
    }

    document.getElementById('newEmployeeBtn').addEventListener('click', mostrarFormularioNuevo);
    document.getElementById('employeeForm').addEventListener('submit', guardarEmpleado);
    document.getElementById('cancelEmployeeEditBtn').addEventListener('click', ocultarFormulario);
});

async function cargarEmpleados(orden = 'az') {
    try {
        const res = await fetch('/empleados?soloActivos=false');
        empleados = await res.json();

        console.log('Empleados recibidos:', empleados);
        console.log('Cantidad:', empleados.length);

        const tbody = document.getElementById('employeesTableBody');
        const noData = document.getElementById('employeesNoDataMessage');

        if (empleados.length === 0) {
            tbody.innerHTML = '';
            noData.style.display = 'block';
            return;
        }

        noData.style.display = 'none';
        renderEmpleados(empleados, tbody, orden);

    } catch (error) {
        console.error('Error al cargar empleados:', error);
    }
}

function renderEmpleados(empleados, tbody, orden = 'az') {
    // Ordenar según el filtro
    empleados.sort((a, b) => {
        const nombreA = ((a.nombre || '') + ' ' + (a.apellidos || '')).toLowerCase();
        const nombreB = ((b.nombre || '') + ' ' + (b.apellidos || '')).toLowerCase();

        if (orden === 'az') {
            return nombreA.localeCompare(nombreB);
        } else {
            return nombreB.localeCompare(nombreA);
        }
    });

    tbody.innerHTML = '';

    empleados.forEach(emp => {
        const tr = document.createElement('tr');

        const tdNombre = document.createElement('td');
        tdNombre.textContent = `${emp.nombre} ${emp.apellidos || ''}`;

        const tdEmail = document.createElement('td');
        tdEmail.textContent = emp.email;

        const tdTelefono = document.createElement('td');
        tdTelefono.textContent = emp.telefono || '-';

        const tdRol = document.createElement('td');
        const spanRol = document.createElement('span');
        spanRol.className = `estado ${emp.rol.toLowerCase()}`;
        spanRol.textContent = emp.rol;
        tdRol.appendChild(spanRol);

        const tdEstado = document.createElement('td');
        const spanEstado = document.createElement('span');
        spanEstado.className = `estado ${emp.activo ? 'confirmada' : 'cancelada'}`;
        spanEstado.textContent = emp.activo ? 'Activo' : 'Inactivo';
        tdEstado.appendChild(spanEstado);

        const tdAcciones = document.createElement('td');
        tdAcciones.classList.add('actions-cell');
        tdAcciones.classList.add('rol-admin', 'rol-jefe');

        const btnEditar = document.createElement('button');
        btnEditar.textContent = 'Editar';
        btnEditar.className = 'btn secondary';
        btnEditar.addEventListener('click', () => editarEmpleado(emp.id));
        tdAcciones.appendChild(btnEditar);

        // Solo el ADMIN puede ver el botón de Eliminar
        const rol = window.Roles ? window.Roles.rolActual : null;
        const esAdmin = rol === 'ADMIN';

        if (esAdmin) {
            const btnEliminar = document.createElement('button');
            btnEliminar.textContent = 'Eliminar';
            btnEliminar.className = 'btn danger';
            btnEliminar.addEventListener('click', async () => {
                const conf = confirm('¿Seguro que quieres eliminar este empleado?');
                if (!conf) return;

                // Aquí llamarías a la función de borrar
                // Por ahora usamos desactivar
                await desactivarEmpleado(emp.id);
            });
            tdAcciones.appendChild(btnEliminar);
        }

        tr.appendChild(tdNombre);
        tr.appendChild(tdEmail);
        tr.appendChild(tdTelefono);
        tr.appendChild(tdRol);
        tr.appendChild(tdEstado);
        tr.appendChild(tdAcciones);

        tbody.appendChild(tr);
    });

    console.log('HTML generado correctamente');
}

function mostrarFormularioNuevo() {
    editandoId = null;
    document.getElementById('employeeFormTitle').textContent = 'Nuevo empleado';
    document.getElementById('employeeForm').reset();
    document.getElementById('empleadoId').value = '';
    document.getElementById('employeeFormSection').style.display = 'block';
}

async function editarEmpleado(id) {
    editandoId = id;
    const empleado = empleados.find(e => e.id === id);

    document.getElementById('employeeFormTitle').textContent = 'Editar empleado';
    document.getElementById('empleadoId').value = empleado.id;
    document.getElementById('empleadoNombre').value = empleado.nombre;
    document.getElementById('empleadoApellidos').value = empleado.apellidos || '';
    document.getElementById('empleadoEmail').value = empleado.email;
    document.getElementById('empleadoTelefono').value = empleado.telefono || '';
    document.getElementById('empleadoPassword').value = '';
    document.getElementById('empleadoPassword').required = false;
    document.getElementById('empleadoRol').value = empleado.rol;

    document.getElementById('employeeFormSection').style.display = 'block';
}

async function guardarEmpleado(e) {
    e.preventDefault();

    const datos = {
        nombre: document.getElementById('empleadoNombre').value,
        apellidos: document.getElementById('empleadoApellidos').value,
        email: document.getElementById('empleadoEmail').value,
        telefono: document.getElementById('empleadoTelefono').value,
        passwordHash: document.getElementById('empleadoPassword').value,
        rol: document.getElementById('empleadoRol').value
    };

    console.log('Enviando datos:', datos);

    try {
        let res;
        if (editandoId) {
            res = await fetch(`/empleados/${editandoId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datos)
            });
        } else {
            res = await fetch('/empleados', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datos)
            });
        }

        console.log('Respuesta:', res.status);

        if (!res.ok) {
            const error = await res.text();
            console.error('Error del servidor:', error);
            alert('Error al guardar: ' + error);
            return;
        }

        alert('Empleado guardado correctamente');
        ocultarFormulario();

        const filtroOrden = document.getElementById('filtroOrden');
        const ordenActual = filtroOrden ? filtroOrden.value : 'az';
        cargarEmpleados(ordenActual);
    } catch (error) {
        console.error('Error al guardar empleado:', error);
        alert('Error de red: ' + error.message);
    }
}

async function desactivarEmpleado(id) {
    if (!confirm('¿Desactivar este empleado?')) return;

    try {
        await fetch(`/empleados/${id}/desactivar`, { method: 'PUT' });

        const filtroOrden = document.getElementById('filtroOrden');
        const ordenActual = filtroOrden ? filtroOrden.value : 'az';
        cargarEmpleados(ordenActual);
    } catch (error) {
        console.error('Error:', error);
    }
}

async function activarEmpleado(id) {
    try {
        await fetch(`/empleados/${id}/activar`, { method: 'PUT' });

        const filtroOrden = document.getElementById('filtroOrden');
        const ordenActual = filtroOrden ? filtroOrden.value : 'az';
        cargarEmpleados(ordenActual);
    } catch (error) {
        console.error('Error:', error);
    }
}

function ocultarFormulario() {
    document.getElementById('employeeFormSection').style.display = 'none';
    document.getElementById('employeeForm').reset();
    document.getElementById('empleadoPassword').required = true;
    editandoId = null;
}
