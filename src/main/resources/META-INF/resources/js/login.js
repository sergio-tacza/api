// js/login.js
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm');
    const errorMsg = document.getElementById('loginError');

    if (!form) {
        console.error('[LOGIN] No se encuentra #loginForm');
        return;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (errorMsg) {
            errorMsg.style.display = 'none';
        }

        const email = document.getElementById('email')?.value.trim();
        const password = document.getElementById('password')?.value.trim();

        if (!email || !password) {
            if (errorMsg) {
                errorMsg.textContent = 'Rellena todos los campos.';
                errorMsg.style.display = 'block';
            }
            return;
        }

        try {
            const resp = await fetch('/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!resp.ok) {
                console.error('[LOGIN] Respuesta no OK:', resp.status);
                if (errorMsg) {
                    errorMsg.textContent = 'Usuario o contraseña incorrectos.';
                    errorMsg.style.display = 'block';
                }
                return;
            }

            const data = await resp.json().catch(() => null);

            // Guardamos la sesión SIEMPRE igual
            localStorage.setItem('sesionActiva', 'true');
            if (data) {
                localStorage.setItem('usuarioActual', JSON.stringify(data));
            } else {
                localStorage.removeItem('usuarioActual');
            }

            console.log('[LOGIN] Login correcto, redirigiendo a citas.html');
            window.location.href = 'citas.html';

        } catch (err) {
            console.error('[LOGIN] Error en llamada a /auth/login', err);
            if (errorMsg) {
                errorMsg.textContent = 'Error de conexión con el servidor.';
                errorMsg.style.display = 'block';
            }
        }
    });
});