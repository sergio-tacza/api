// Mes que se está mostrando en el calendario
let currentMonth = new Date();

document.addEventListener('DOMContentLoaded', () => {
    // Cargar dashboard
    cargarDashboard();
});

async function cargarDashboard() {
    try {
        const [citasResp, clientesResp, serviciosResp] = await Promise.all([
            fetch('/citas'),
            fetch('/clientes'),
            fetch('/servicios')
        ]);

        if (!citasResp.ok || !clientesResp.ok || !serviciosResp.ok) {
            console.error('Error cargando datos para el dashboard');
            return;
        }

        const citas = await citasResp.json();
        const clientes = await clientesResp.json();
        const servicios = await serviciosResp.json();

        // Tarjetas de arriba
        actualizarTarjetas(citas, clientes, servicios);

        // Alertas
        actualizarAlertas(citas);

        // Tabla de estado de hoy
        actualizarTablaEstadosHoy(citas);

        // Últimas citas
        actualizarUltimasCitas(citas);

    } catch (err) {
        console.error('Error en cargarDashboard', err);
    }
}

// ================= ALERTAS =================

function actualizarAlertas(citas) {
    const hoyStr = new Date().toISOString().substring(0, 10);
    const ahora = new Date();

    // Citas de hoy
    let citasHoy = 0;
    citas.forEach(cita => {
        if (!cita.fechaHoraInicio) return;
        const fechaStr = cita.fechaHoraInicio.split('T')[0];
        if (fechaStr === hoyStr) {
            citasHoy++;
        }
    });

    document.getElementById('alertCitasHoy').textContent = `${citasHoy} cita${citasHoy !== 1 ? 's' : ''}`;

    // Clientes esta semana (puedes personalizar según tu lógica)
    document.getElementById('alertClientesSemana').textContent = '0 nuevos';
}

// ================= TARJETAS RESUMEN =================

function actualizarTarjetas(citas, clientes, servicios) {
    const hoyStr = new Date().toISOString().substring(0, 10);
    const ahora = new Date();

    let citasHoy = 0;
    let citasSemana = 0;
    let ingresosHoy = 0;

    citas.forEach(cita => {
        if (!cita.fechaHoraInicio) return;

        const fechaStr = cita.fechaHoraInicio.split('T')[0];
        const fechaObj = new Date(cita.fechaHoraInicio);

        // Citas de hoy
        if (fechaStr === hoyStr) {
            citasHoy++;

            // Ingresos hoy: solo COMPLETADAS
            if (cita.estado === 'COMPLETADA' &&
                cita.servicio && cita.servicio.precio != null) {
                ingresosHoy += parseFloat(cita.servicio.precio);
            }
        }

        // Citas últimos 7 días (incluido hoy)
        const diffMs = ahora - fechaObj;
        const diffDias = diffMs / (1000 * 60 * 60 * 24);
        if (diffDias >= 0 && diffDias <= 7) {
            citasSemana++;
        }
    });

    const clientesActivos = clientes.filter(c => c.activo !== false).length;
    const serviciosActivos = servicios.filter(s => s.activo !== false).length;

    document.getElementById('citasHoy').textContent = citasHoy;
    document.getElementById('citasSemana').textContent = citasSemana;
    document.getElementById('clientesActivos').textContent = clientesActivos;
    document.getElementById('serviciosActivos').textContent = serviciosActivos;
    document.getElementById('ingresosHoy').textContent = ingresosHoy.toFixed(2) + ' €';
}

// ================= ESTADO DE HOY =================

function actualizarTablaEstadosHoy(citas) {
    const hoyStr = new Date().toISOString().substring(0, 10);

    let pendientes = 0;
    let confirmadas = 0;
    let completadas = 0;
    let canceladas = 0;

    citas.forEach(cita => {
        if (!cita.fechaHoraInicio) return;
        const fechaStr = cita.fechaHoraInicio.split('T')[0];
        if (fechaStr !== hoyStr) return;

        const estado = (cita.estado || 'PENDIENTE').toUpperCase();
        if (estado === 'PENDIENTE') pendientes++;
        else if (estado === 'CONFIRMADA') confirmadas++;
        else if (estado === 'COMPLETADA') completadas++;
        else if (estado === 'CANCELADA') canceladas++;
    });

    document.getElementById('citasPendientesHoy').textContent = pendientes;
    document.getElementById('citasConfirmadasHoy').textContent = confirmadas;
    document.getElementById('citasCompletadasHoy').textContent = completadas;
    document.getElementById('citasCanceladasHoy').textContent = canceladas;
}

// ================= ÚLTIMAS CITAS =================

function actualizarUltimasCitas(citas) {
    const tbody = document.getElementById('ultimasCitasBody');
    const noData = document.getElementById('ultimasCitasNoData');

    tbody.innerHTML = '';
    noData.style.display = 'none';

    if (!citas || citas.length === 0) {
        noData.style.display = 'block';
        return;
    }

    const ordenadas = [...citas]
        .filter(c => c.fechaHoraInicio)
        .sort((a, b) => new Date(b.fechaHoraInicio) - new Date(a.fechaHoraInicio));

    const ultimas = ordenadas.slice(0, 10);

    ultimas.forEach(cita => {
        const tr = document.createElement('tr');

        let fecha = '-';
        let hora = '-';
        if (cita.fechaHoraInicio) {
            const partes = cita.fechaHoraInicio.split('T');
            if (partes.length === 2) {
                fecha = partes[0];
                hora = partes[1].substring(0, 5);
            }
        }

        const clienteNombre =
            cita.cliente && cita.cliente.nombre
                ? cita.cliente.nombre + (cita.cliente.apellidos ? (' ' + cita.cliente.apellidos) : '')
                : '-';

        const servicioNombre =
            cita.servicio && cita.servicio.nombre
                ? cita.servicio.nombre
                : '-';

        const estado = cita.estado || 'PENDIENTE';

        tr.innerHTML = `
            <td>${fecha}</td>
            <td>${hora}</td>
            <td>${clienteNombre}</td>
            <td>${servicioNombre}</td>
            <td>${estado}</td>
        `;

        tbody.appendChild(tr);
    });
}
