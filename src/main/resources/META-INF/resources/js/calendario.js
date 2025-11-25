document.addEventListener('DOMContentLoaded', async () => {
    // 1) Comprobar login


    // 2) Botón de logout
    const logoutBtn = document.getElementById('logoutBtn');


    // 3) Cargar las citas desde el backend
    const citas = await cargarCitas();

    // 4) Pintar calendario
    initCalendar(citas);
});

async function cargarCitas() {
    try {
        const res = await fetch('/citas');
        if (!res.ok) {
            console.error('Error al cargar /citas para el calendario');
            return [];
        }
        return await res.json();
    } catch (err) {
        console.error('Error de conexión al cargar /citas', err);
        return [];
    }
}

function initCalendar(citas) {
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl || !window.FullCalendar) {
        console.error('No existe #calendar o no está cargado FullCalendar');
        return;
    }

    // Transformar citas → eventos del calendario
    const eventos = (citas || [])
        .filter(c => c.fechaHoraInicio)
        .map(cita => {
            const clienteNombre =
                cita.cliente && cita.cliente.nombre
                    ? cita.cliente.nombre + (cita.cliente.apellidos ? ' ' + cita.cliente.apellidos : '')
                    : 'Cliente';

            const servicioNombre =
                cita.servicio && cita.servicio.nombre
                    ? cita.servicio.nombre
                    : 'Servicio';

            const titulo = `${clienteNombre} – ${servicioNombre}`;
            const estado = (cita.estado || 'PENDIENTE').toUpperCase();

            let color = '#3b82f6'; // azul por defecto
            if (estado === 'PENDIENTE')  color = '#facc15';
            if (estado === 'CONFIRMADA') color = '#22c55e';
            if (estado === 'COMPLETADA') color = '#0ea5e9';
            if (estado === 'CANCELADA')  color = '#ef4444';

            // Sacamos la fecha YYYY-MM-DD para usarla en el click
            let fechaStr = null;
            try {
                fechaStr = cita.fechaHoraInicio.split('T')[0];
            } catch (e) {
                fechaStr = null;
            }

            return {
                id: cita.id,
                title: titulo,
                start: cita.fechaHoraInicio,
                end: cita.fechaHoraFin || null,
                backgroundColor: color,
                borderColor: color,
                textColor: '#000',
                extendedProps: {
                    citaId: cita.id,
                    fechaStr: fechaStr
                }
            };
        });

    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'es',          // idioma español
        firstDay: 1,           // lunes
        height: 'auto',

        // Textos de los botones en español
        buttonText: {
            today: 'Hoy',
            month: 'Mes',
            week: 'Semana',
            day: 'Día'
        },

        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },

        events: eventos,

        // Click en un día → abrir citas con filtro por fecha
        dateClick(info) {
            const fecha = info.dateStr; // YYYY-MM-DD
            window.location.href = `citas.html?fecha=${fecha}`;
        },

        // Click en un evento → también ir a citas de ese día
        eventClick(info) {
            const fechaStr = info.event.extendedProps.fechaStr;
            if (fechaStr) {
                window.location.href = `citas.html?fecha=${fechaStr}`;
            } else {
                window.location.href = 'citas.html';
            }
        }
    });

    calendar.render();
}