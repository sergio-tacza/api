// Mes que se está mostrando en el calendario
let currentMonth = new Date();

document.addEventListener('DOMContentLoaded', () => {


    const logoutBtn = document.getElementById('logoutBtn');

    // Cargar todo el dashboard
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

        // Tabla de estado de hoy
        actualizarTablaEstadosHoy(citas);

        // Últimas citas
        actualizarUltimasCitas(citas);

        // Calendario
        renderCalendar(citas);
        setupCalendarNav(citas);

    } catch (err) {
        console.error('Error en cargarDashboard', err);
    }
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

// ================= CALENDARIO =================

function setupCalendarNav(citas) {
    const prevBtn = document.getElementById('prevMonthBtn');
    const nextBtn = document.getElementById('nextMonthBtn');

    prevBtn.onclick = () => {
        currentMonth.setMonth(currentMonth.getMonth() - 1);
        renderCalendar(citas);
    };

    nextBtn.onclick = () => {
        currentMonth.setMonth(currentMonth.getMonth() + 1);
        renderCalendar(citas);
    };
}

function renderCalendar(citas) {
    const grid = document.getElementById('calendarGrid');
    const label = document.getElementById('calendarMonthLabel');

    grid.innerHTML = '';

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth(); // 0–11

    const nombresMes = [
        'enero','febrero','marzo','abril','mayo','junio',
        'julio','agosto','septiembre','octubre','noviembre','diciembre'
    ];
    label.textContent = `${nombresMes[month]} ${year}`;

    // Primer día del mes
    const firstDay = new Date(year, month, 1);
    // Día de la semana (0 domingo, 1 lunes…). Lo pasamos a base lunes.
    let startWeekday = firstDay.getDay(); // 0–6 (domingo-sábado)
    if (startWeekday === 0) startWeekday = 7; // domingo -> 7
    const leadingEmpty = startWeekday - 1;   // cuántos huecos antes

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const hoy = new Date();
    const hoyStr = hoy.toISOString().substring(0, 10);

    // Mételo todo en la grid
    // 1) Huecos vacíos antes del día 1
    for (let i = 0; i < leadingEmpty; i++) {
        const empty = document.createElement('div');
        empty.className = 'calendar-day empty';
        grid.appendChild(empty);
    }

    // 2) Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
        const fechaStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;

        const citasDia = citas.filter(c => {
            if (!c.fechaHoraInicio) return false;
            return c.fechaHoraInicio.startsWith(fechaStr);
        });

        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day';

        // ¿es hoy?
        if (fechaStr === hoyStr) {
            dayDiv.classList.add('today');
        }

        // ¿tiene citas?
        if (citasDia.length > 0) {
            dayDiv.classList.add('has-events');
        }

        const numDiv = document.createElement('div');
        numDiv.className = 'calendar-day-number';
        numDiv.textContent = day;

        dayDiv.appendChild(numDiv);

        if (citasDia.length > 0) {
            const evDiv = document.createElement('div');
            evDiv.className = 'calendar-day-events';
            evDiv.textContent = `${citasDia.length} cita${citasDia.length > 1 ? 's' : ''}`;
            dayDiv.appendChild(evDiv);
        }

        grid.appendChild(dayDiv);
    }
}