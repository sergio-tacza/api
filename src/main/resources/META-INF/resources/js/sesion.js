// js/sesion.js
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    const file = path.split('/').pop() || 'index.html';

    // De momento NO BLOQUEAMOS NADA
    if (file === '' || file === 'index.html') {
        console.log('[SESION] Página pública (login). No se comprueba sesión.');
    } else {
        console.log('[SESION] Página privada, pero control de sesión DESACTIVADO temporalmente.');
    }

    // Sólo gestionamos el botón de logout si existe
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            console.log('[SESION] Cerrando sesión...');
            localStorage.removeItem('sesionActiva');
            localStorage.removeItem('usuarioActual');
            window.location.href = 'index.html';
        });
    }
});