document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm');
    const errorMsg = document.getElementById('loginError');

    if (!form) {
        console.error('No se encontró #loginForm en index.html');
        return;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMsg.style.display = 'none';

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();

        if (!email || !password) {
            errorMsg.textContent = 'Rellena todos los campos.';
            errorMsg.style.display = 'block';
            return;
        }

        try {
            // IMPORTANTE: mantenemos /auth/login y { email, password }
            const response = await fetch('/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                errorMsg.textContent = 'Usuario o contraseña incorrectos.';
                errorMsg.style.display = 'block';
                return;
            }

            let data = null;
            try {
                data = await response.json();
            } catch (_) {
                // si no devuelve JSON, seguimos sin romper
            }

            // Guardamos info de usuario y rol
            if (data) {
                // tu AuthResource devuelve userId, email, rol, mensaje
                if (data.rol) {
                    localStorage.setItem('rolUsuario', data.rol);
                }
                if (data.userId != null) {
                    localStorage.setItem('idUsuario', data.userId);
                }
                if (data.email) {
                    localStorage.setItem('usuarioEmail', data.email);
                }
            }

            // Claves de sesión que mira el resto de la app
            localStorage.setItem('logueado', 'true');  // NUEVA
            localStorage.setItem('logged', 'true');    // POR COMPATIBILIDAD

            // Ir a citas
            window.location.href = 'citas.html';

        } catch (err) {
            console.error('Error en /auth/login', err);
            errorMsg.textContent = 'Error de conexión con el servidor.';
            errorMsg.style.display = 'block';
        }
    });
});