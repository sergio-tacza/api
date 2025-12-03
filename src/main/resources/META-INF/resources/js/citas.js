// js/citas.js

let barberos = []; // ← NUEVO: Para almacenar la lista de barberos

document.addEventListener('DOMContentLoaded', () => {
    // 1) Comprobamos login

    // 2) Referencias al DOM
    const logoutBtn = document.getElementById('logoutBtn');
    const newAppointmentBtn = document.getElementById('newAppointmentBtn');
    const newAppointmentFormSection = document.getElementById('newAppointmentFormSection');
    const newAppointmentForm = document.getElementById('newAppointmentForm');
    const tbody = document.getElementById('appointmentsTableBody');
    const noDataMessage = document.getElementById('noDataMessage');

    const selectCliente = document.getElementById('clienteId');
    const selectServicio = document.getElementById('servicioId');
    const selectBarbero = document.getElementById('barberoId'); // ← NUEVO
    const inputFecha = document.getElementById('fecha');
    const inputHora = document.getElementById('hora');
    const inputNotas = document.getElementById('notas');

    // 🔹 2.1 Leer ?fecha=YYYY-MM-DD si venimos desde calendario
    const urlParams = new URLSearchParams(window.location.search);
    const fechaFiltro = urlParams.get('fecha'); // puede ser null

    // Si hay fechaFiltro, precargamos el input de fecha
    if (fechaFiltro && inputFecha) {
        inputFecha.value = fechaFiltro;
    }

    // 3) Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('logged');
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            window.location.href = 'index.html';
        });
    }

    // 4) Mostrar / ocultar formulario "Nueva cita"
    if (newAppointmentBtn && newAppointmentFormSection) {
        newAppointmentBtn.addEventListener('click', () => {
            const current = newAppointmentFormSection.style.display;
            if (!current || current === 'none') {
                newAppointmentFormSection.style.display = 'block';
                // ← NUEVO: Cargar barberos cuando se abre el formulario
                cargarBarberos(selectBarbero);
            } else {
                newAppointmentFormSection.style.display = 'none';
            }
        });
    }

    // 5) Cargar datos iniciales
    cargarClientes(selectCliente);
    cargarServicios(selectServicio);
    cargarBarberos(selectBarbero); // ← NUEVO
    // 🔹 Usamos el filtro si viene de calendario
    cargarCitas(tbody, noDataMessage, fechaFiltro);

    // 6) Envío del formulario "Nueva cita"
    if (newAppointmentForm) {
        newAppointmentForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const clienteId = selectCliente.value;
            const servicioId = selectServicio.value;
            const barberoId = selectBarbero ? selectBarbero.value : null; // ← NUEVO
            const fecha = inputFecha.value; // 2025-11-18
            const hora = inputHora.value;   // 16:35
            const notas = inputNotas.value;

            if (!clienteId || !servicioId || !fecha || !hora) {
                alert('Cliente, servicio, fecha y hora son obligatorios.');
                return;
            }

            // Formato que espera el backend: "2025-11-18T16:35:00"
            const fechaHoraInicio = `${fecha}T${hora}:00`;

            const nuevaCita = {
                cliente:  { id: Number(clienteId) },
                servicio: { id: Number(servicioId) },
                barbero: barberoId ? { id: Number(barberoId) } : null, // ← NUEVO
                fechaHoraInicio: fechaHoraInicio,
                notas: notas
            };

            try {
                const response = await fetch('/citas', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(nuevaCita)
                });

                if (!response.ok) {
                    const txt = await response.text().catch(() => '');
                    console.error('Error al crear cita:', response.status, txt);
                    alert('Error al crear la cita. Mira la consola del navegador (F12).');
                    return;
                }

                newAppointmentForm.reset();
                // Si venimos filtrando por fecha, la dejamos de nuevo puesta
                if (fechaFiltro && inputFecha) {
                    inputFecha.value = fechaFiltro;
                }
                newAppointmentFormSection.style.display = 'none';
                await cargarCitas(tbody, noDataMessage, fechaFiltro);
            } catch (err) {
                console.error('Error de red al crear la cita:', err);
                alert('Error de conexión con el servidor.');
            }
        });
    }
});


// =======================
//   CARGA DE LISTAS
// =======================

async function cargarClientes(selectCliente) {
    if (!selectCliente) return;

    try {
        const res = await fetch('/clientes');
        if (!res.ok) {
            console.error('No se pudieron cargar los clientes');
            return;
        }

        const clientes = await res.json();
        selectCliente.innerHTML = '';

        clientes.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = (c.nombre || '') + (c.apellidos ? (' ' + c.apellidos) : '');
            selectCliente.appendChild(opt);
        });
    } catch (err) {
        console.error('Error al cargar /clientes', err);
    }
}

async function cargarServicios(selectServicio) {
    if (!selectServicio) return;

    try {
        const res = await fetch('/servicios');
        if (!res.ok) {
            console.error('No se pudieron cargar los servicios');
            return;
        }

        const servicios = await res.json();
        selectServicio.innerHTML = '';

        servicios.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.id;
            opt.textContent = s.nombre || '';
            selectServicio.appendChild(opt);
        });
    } catch (err) {
        console.error('Error al cargar /servicios', err);
    }
}

// ← NUEVO: Función para cargar barberos
async function cargarBarberos(selectBarbero) {
    if (!selectBarbero) return;

    try {
        const res = await fetch('/empleados?soloActivos=true');
        if (!res.ok) {
            console.error('No se pudieron cargar los barberos');
            return;
        }

        barberos = await res.json();
        selectBarbero.innerHTML = '<option value="">Sin asignar</option>';

        barberos.forEach(b => {
            const opt = document.createElement('option');
            opt.value = b.id;
            opt.textContent = (b.nombre || '') + (b.apellidos ? (' ' + b.apellidos) : '');
            selectBarbero.appendChild(opt);
        });
    } catch (err) {
        console.error('Error al cargar /empleados', err);
    }
}


// =======================
//   CARGAR Y PINTAR CITAS
// =======================

async function cargarCitas(tbody, noDataMessage, fechaFiltro) {
    if (!tbody || !noDataMessage) return;

    tbody.innerHTML = '';
    noDataMessage.style.display = 'none';

    try {
        // 🔹 Si tenemos filtro de fecha, llamamos a /citas?fecha=YYYY-MM-DD
        let url = '/citas';
        if (fechaFiltro) {
            url += `?fecha=${encodeURIComponent(fechaFiltro)}`;
        }

        const res = await fetch(url);
        if (!res.ok) {
            noDataMessage.textContent = 'No se han podido cargar las citas.';
            noDataMessage.style.display = 'block';
            return;
        }

        const citas = await res.json();
        if (!citas || citas.length === 0) {
            noDataMessage.textContent = fechaFiltro
                ? `No hay citas registradas para el día ${fechaFiltro}.`
                : 'No hay citas registradas.';
            noDataMessage.style.display = 'block';
            return;
        }

        renderCitas(citas, tbody);

    } catch (err) {
        console.error('Error al cargar /citas', err);
        noDataMessage.textContent = 'Error de conexión con el servidor.';
        noDataMessage.style.display = 'block';
    }
}

function renderCitas(citas, tbody) {
    tbody.innerHTML = '';

    citas.forEach(cita => {
        const tr = document.createElement('tr');

        // Cliente
        const tdCliente = document.createElement('td');
        let nombreCliente = '-';
        if (cita.cliente && cita.cliente.nombre) {
            nombreCliente = cita.cliente.nombre;
            if (cita.cliente.apellidos) {
                nombreCliente += ' ' + cita.cliente.apellidos;
            }
        }
        tdCliente.textContent = nombreCliente;

        // Teléfono
        const tdTelefono = document.createElement('td');
        tdTelefono.textContent = (cita.cliente && cita.cliente.telefono) ? cita.cliente.telefono : '-';

        // Servicio
        const tdServicio = document.createElement('td');
        tdServicio.textContent = (cita.servicio && cita.servicio.nombre) ? cita.servicio.nombre : '-';

        // ← NUEVO: Barbero
        const tdBarbero = document.createElement('td');
        let nombreBarbero = 'Sin asignar';
        if (cita.barbero && cita.barbero.nombre) {
            nombreBarbero = cita.barbero.nombre;
            if (cita.barbero.apellidos) {
                nombreBarbero += ' ' + cita.barbero.apellidos;
            }
        }
        tdBarbero.textContent = nombreBarbero;

        // Fecha / hora
        let fecha = '-';
        let hora = '-';
        if (cita.fechaHoraInicio) {
            const partes = cita.fechaHoraInicio.split('T');
            if (partes.length === 2) {
                fecha = partes[0];
                hora = partes[1].substring(0, 5);
            }
        }

        const tdFecha = document.createElement('td');
        tdFecha.textContent = fecha;

        const tdHora = document.createElement('td');
        tdHora.textContent = hora;

        // Estado
        const tdEstado = document.createElement('td');
        const spanEstado = document.createElement('span');
        const estado = (cita.estado || 'PENDIENTE').toUpperCase();
        spanEstado.textContent = estado;
        spanEstado.className = 'estado-badge estado-' + estado.toLowerCase();
        tdEstado.appendChild(spanEstado);

        // Notas
        const tdNotas = document.createElement('td');
        tdNotas.textContent = cita.notas || '-';

        // WhatsApp
        const tdWhatsapp = document.createElement('td');
        const btnWhatsapp = document.createElement('button');
        btnWhatsapp.textContent = 'WhatsApp';
        btnWhatsapp.className = 'btn whatsapp-btn';
        btnWhatsapp.addEventListener('click', () => abrirWhatsapp(cita));
        tdWhatsapp.appendChild(btnWhatsapp);

        // Acciones (confirmar / completar / cancelar / borrar)
        const tdAcciones = document.createElement('td');
        tdAcciones.classList.add('actions-cell');

        const btnConfirmar = document.createElement('button');
        btnConfirmar.textContent = 'Confirmar';
        btnConfirmar.className = 'btn secondary';
        btnConfirmar.addEventListener('click', async () => {
            await cambiarEstadoCita(cita.id, 'confirmar');
        });

        const btnCompletar = document.createElement('button');
        btnCompletar.textContent = 'Completar';
        btnCompletar.className = 'btn secondary';
        btnCompletar.addEventListener('click', async () => {
            await cambiarEstadoCita(cita.id, 'completar');
        });

        const btnCancelar = document.createElement('button');
        btnCancelar.textContent = 'Cancelar';
        btnCancelar.className = 'btn secondary';
        btnCancelar.addEventListener('click', async () => {
            await cambiarEstadoCita(cita.id, 'cancelar');
        });

// === ACCIONES SEGÚN ROL ===
        tdAcciones.appendChild(btnConfirmar);
        tdAcciones.appendChild(btnCompletar);
        tdAcciones.appendChild(btnCancelar);

        const rol = window.Roles ? window.Roles.rolActual : null;
        const puedeBorrar = rol === 'ADMIN' || rol === 'JEFE';

        if (puedeBorrar) {
            const btnBorrar = document.createElement('button');
            btnBorrar.textContent = 'Borrar';
            btnBorrar.className = 'btn danger';
            btnBorrar.addEventListener('click', async () => {
                const conf = confirm('¿Seguro que quieres borrar esta cita?');
                if (!conf) return;
                await borrarCita(cita.id);
            });
            tdAcciones.appendChild(btnBorrar);
        }



        tr.appendChild(tdCliente);
        tr.appendChild(tdTelefono);
        tr.appendChild(tdServicio);
        tr.appendChild(tdBarbero); // ← NUEVO: Columna barbero
        tr.appendChild(tdFecha);
        tr.appendChild(tdHora);
        tr.appendChild(tdEstado);
        tr.appendChild(tdNotas);
        tr.appendChild(tdWhatsapp);
        tr.appendChild(tdAcciones);

        tbody.appendChild(tr);
    });
}


// =======================
//   ACCIONES SOBRE CITAS
// =======================

async function cambiarEstadoCita(id, accion) {
    try {
        const res = await fetch(`/citas/${id}/${accion}`, {
            method: 'PUT'
        });
        if (!res.ok) {
            console.error('Error al cambiar estado:', accion, res.status);
            alert('No se pudo cambiar el estado de la cita.');
            return;
        }
        await cargarCitas(
            document.getElementById('appointmentsTableBody'),
            document.getElementById('noDataMessage')
        );
    } catch (err) {
        console.error('Error de red al cambiar estado', err);
        alert('Error de conexión con el servidor.');
    }
}

async function borrarCita(id) {
    try {
        const res = await fetch(`/citas/${id}`, {
            method: 'DELETE'
        });
        if (!res.ok) {
            console.error('Error al borrar cita:', res.status);
            alert('No se pudo borrar la cita.');
            return;
        }
        await cargarCitas(
            document.getElementById('appointmentsTableBody'),
            document.getElementById('noDataMessage')
        );
    } catch (err) {
        console.error('Error de red al borrar cita', err);
        alert('Error de conexión con el servidor.');
    }
}


// =======================
//   WHATSAPP (wa.me)
// =======================

function abrirWhatsapp(cita) {
    if (!cita || !cita.cliente || !cita.cliente.telefono) {
        alert('Este cliente no tiene teléfono válido.');
        return;
    }

    // Normalizamos teléfono
    let tel = cita.cliente.telefono.toString().replace(/\D/g, '');
    if (!tel.startsWith('34')) {
        tel = '34' + tel;
    }

    let nombre = cita.cliente.nombre || 'cliente';
    if (cita.cliente.apellidos) {
        nombre += ' ' + cita.cliente.apellidos;
    }

    let servicioNombre = (cita.servicio && cita.servicio.nombre) ? cita.servicio.nombre : 'tu cita';

    let fecha = '-', hora = '-';
    if (cita.fechaHoraInicio) {
        const partes = cita.fechaHoraInicio.split('T');
        if (partes.length === 2) {
            fecha = partes[0];
            hora = partes[1].substring(0, 5);
        }
    }

    const mensaje = `Hola ${nombre}, te recordamos tu cita en TacBarber para ${servicioNombre} el día ${fecha} a las ${hora}. Si no puedes asistir, avísanos respondiendo a este mensaje.`;

    const url = `https://api.whatsapp.com/send?phone=${tel}&text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
}
