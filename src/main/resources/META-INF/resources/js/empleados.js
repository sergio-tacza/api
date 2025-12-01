// Cargar empleados al inicio
document.addEventListener('DOMContentLoaded', () => {
    cargarEmpleados();

    document.getElementById('newEmployeeBtn').addEventListener('click', mostrarFormularioNuevo);
    document.getElementById('employeeForm').addEventListener('submit', guardarEmpleado);
    document.getElementById('cancelEmployeeEditBtn').addEventListener('click', ocultarFormulario);
});

async function cargarEmpleados() {
    try {
        const res = await fetch('/empleados');
        empleados = await res.json();

        console.log('Empleados recibidos:', empleados); // AÑADE ESTE LOG
        console.log('Cantidad:', empleados.length);      // AÑADE ESTE LOG

        const tbody = document.getElementById('employeesTableBody');
        const noData = document.getElementById('employeesNoDataMessage');

        if (empleados.length === 0) {
            tbody.innerHTML = '';
            noData.style.display = 'block';
            return;
        }

        noData.style.display = 'none';
        tbody.innerHTML = empleados.map(emp => `
            <tr>
                <td>${emp.nombre} ${emp.apellidos || ''}</td>
                <td>${emp.email}</td>
                <td>${emp.telefono || '-'}</td>
                <td><span class="estado ${emp.rol.toLowerCase()}">${emp.rol}</span></td>
                <td><span class="estado ${emp.activo ? 'confirmada' : 'cancelada'}">${emp.activo ? 'Activo' : 'Inactivo'}</span></td>
                <td class="rol-admin rol-jefe">
                    <button class="btn secondary" onclick="editarEmpleado(${emp.id})">Editar</button>
                    ${emp.activo
            ? `<button class="btn danger" onclick="desactivarEmpleado(${emp.id})">Desactivar</button>`
            : `<button class="btn primary" onclick="activarEmpleado(${emp.id})">Activar</button>`
        }
                </td>
            </tr>
        `).join('');

        console.log('HTML generado:', tbody.innerHTML); // AÑADE ESTE LOG
    } catch (error) {
        console.error('Error al cargar empleados:', error);
    }
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

    console.log('Enviando datos:', datos); // AÑADE ESTE LOG

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

        console.log('Respuesta:', res.status); // AÑADE ESTE LOG

        if (!res.ok) {
            const error = await res.text();
            console.error('Error del servidor:', error);
            alert('Error al guardar: ' + error);
            return;
        }

        alert('Empleado guardado correctamente');
        ocultarFormulario();
        cargarEmpleados();
    } catch (error) {
        console.error('Error al guardar empleado:', error);
        alert('Error de red: ' + error.message);
    }
}

async function desactivarEmpleado(id) {
    if (!confirm('¿Desactivar este empleado?')) return;

    try {
        await fetch(`/empleados/${id}/desactivar`, { method: 'PUT' });
        cargarEmpleados();
    } catch (error) {
        console.error('Error:', error);
    }
}

async function activarEmpleado(id) {
    try {
        await fetch(`/empleados/${id}/activar`, { method: 'PUT' });
        cargarEmpleados();
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
