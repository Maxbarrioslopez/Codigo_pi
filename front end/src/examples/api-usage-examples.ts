/**
 * EJEMPLOS DE USO - Cliente Axios Unificado
 * 
 * Este archivo muestra cómo usar correctamente el cliente Axios unificado
 * para hacer llamadas autenticadas a la API del backend.
 */

import { apiClient } from '@/services/apiClient';
import AuthService from '@/services/authService';

// ============================================================================
// AUTENTICACIÓN
// ============================================================================

/**
 * Ejemplo 1: Login
 */
async function ejemploLogin() {
    try {
        const { access, refresh } = await AuthService.login('admin', 'tu_password');
        console.log('Login exitoso!');
        console.log('Access token:', access);
        console.log('Refresh token:', refresh);
    } catch (error: any) {
        console.error('Error en login:', error.message);
    }
}

/**
 * Ejemplo 2: Obtener usuario actual
 */
async function ejemploObtenerUsuario() {
    try {
        const usuario = await AuthService.me();
        console.log('Usuario actual:', usuario);
        // { id, username, email, rol, first_name, last_name, debe_cambiar_contraseña }
    } catch (error: any) {
        console.error('Error obteniendo usuario:', error.response?.data || error.message);
    }
}

/**
 * Ejemplo 3: Logout
 */
function ejemploLogout() {
    AuthService.logout();
    // Limpia tokens y redirige a /login
}

// ============================================================================
// ENDPOINTS PROTEGIDOS - GET
// ============================================================================

/**
 * Ejemplo 4: Listar usuarios (requiere admin)
 */
async function ejemploListarUsuarios() {
    try {
        const { data } = await apiClient.get('/usuarios/');
        console.log('Usuarios:', data);
        // Array de usuarios con: id, username, email, rol, is_active, etc.
    } catch (error: any) {
        if (error.response?.status === 401) {
            console.error('Token inválido o expirado');
        } else if (error.response?.status === 403) {
            console.error('No tienes permisos (requiere rol admin)');
        } else {
            console.error('Error:', error.response?.data || error.message);
        }
    }
}

/**
 * Ejemplo 5: Obtener ciclo activo
 */
async function ejemploObtenerCicloActivo() {
    try {
        const { data } = await apiClient.get('/ciclo/activo/');
        console.log('Ciclo activo:', data);
        // { id, fecha_inicio, fecha_fin, activo, dias_restantes }
    } catch (error: any) {
        console.error('Error:', error.response?.data || error.message);
    }
}

/**
 * Ejemplo 6: Listar trabajadores (requiere RRHH o admin)
 */
async function ejemploListarTrabajadores() {
    try {
        const { data } = await apiClient.get('/trabajadores/');
        console.log('Trabajadores:', data);
    } catch (error: any) {
        console.error('Error:', error.response?.data || error.message);
    }
}

/**
 * Ejemplo 7: Obtener métricas de guardia
 */
async function ejemploMetricasGuardia() {
    try {
        const { data } = await apiClient.get('/metricas/guardia/');
        console.log('Métricas:', data);
        // { entregados, pendientes, incidencias_pendientes }
    } catch (error: any) {
        console.error('Error:', error.response?.data || error.message);
    }
}

// ============================================================================
// ENDPOINTS PROTEGIDOS - POST
// ============================================================================

/**
 * Ejemplo 8: Crear incidencia
 */
async function ejemploCrearIncidencia() {
    try {
        const { data } = await apiClient.post('/incidencias/', {
            tipo: 'hardware',
            descripcion: 'Tótem no imprime ticket',
            origen: 'guardia',
            // trabajador_rut: '12345678-9' // Opcional
        });
        console.log('Incidencia creada:', data);
        // { id, codigo, tipo, descripcion, estado, creada_por, created_at, ... }
    } catch (error: any) {
        console.error('Error:', error.response?.data || error.message);
    }
}

/**
 * Ejemplo 9: Crear ticket
 */
async function ejemploCrearTicket() {
    try {
        const { data } = await apiClient.post('/tickets/', {
            trabajador_rut: '12345678-9',
            data: {
                sucursal: 'Principal',
                tipo_caja: 'Estándar'
            }
        });
        console.log('Ticket creado:', data);
        // { id, uuid, trabajador, qr_image, estado, ttl_expira_at, ... }
    } catch (error: any) {
        console.error('Error:', error.response?.data || error.message);
    }
}

/**
 * Ejemplo 10: Validar ticket en guardia
 */
async function ejemploValidarTicket(uuid: string) {
    try {
        const { data } = await apiClient.post(`/tickets/${uuid}/validar_guardia/`, {
            codigo_caja: 'CAJA-001' // Opcional
        });
        console.log('Ticket validado:', data);
    } catch (error: any) {
        console.error('Error:', error.response?.data || error.message);
    }
}

/**
 * Ejemplo 11: Crear usuario (requiere admin)
 */
async function ejemploCrearUsuario() {
    try {
        const { data } = await apiClient.post('/usuarios/', {
            username: 'nuevo.usuario',
            email: 'nuevo@tmluc.cl',
            first_name: 'Nuevo',
            last_name: 'Usuario',
            rol: 'guardia',
            password: 'Temporal123!' // Opcional, se genera si no se proporciona
        });
        console.log('Usuario creado:', data);
        // { id, username, email, rol, password (temporal), debe_cambiar_contraseña }
    } catch (error: any) {
        console.error('Error:', error.response?.data || error.message);
    }
}

// ============================================================================
// ENDPOINTS PROTEGIDOS - PATCH
// ============================================================================

/**
 * Ejemplo 12: Cambiar estado de incidencia
 */
async function ejemploCambiarEstadoIncidencia(codigo: string) {
    try {
        const { data } = await apiClient.patch(`/incidencias/${codigo}/estado/`, {
            estado: 'resuelta'
        });
        console.log('Estado actualizado:', data);
    } catch (error: any) {
        console.error('Error:', error.response?.data || error.message);
    }
}

// ============================================================================
// MANEJO DE ERRORES
// ============================================================================

/**
 * Ejemplo 13: Manejo robusto de errores
 */
async function ejemploManejoErrores() {
    try {
        const { data } = await apiClient.get('/usuarios/');
        console.log('Éxito:', data);
    } catch (error: any) {
        // Error de Axios con respuesta del servidor
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);

            switch (error.response.status) {
                case 401:
                    // El interceptor ya manejó el refresh automáticamente
                    // Si llegamos aquí, el refresh también falló
                    console.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
                    break;
                case 403:
                    console.error('No tienes permisos para esta operación.');
                    break;
                case 404:
                    console.error('Recurso no encontrado.');
                    break;
                case 500:
                    console.error('Error del servidor.');
                    break;
                default:
                    console.error('Error:', error.response.data.detail || 'Error desconocido');
            }
        }
        // Error de red (backend no disponible)
        else if (error.request) {
            console.error('No se pudo conectar con el backend.');
            console.error('Verifica que el servidor esté ejecutándose en:', import.meta.env.VITE_API_URL);
        }
        // Otro tipo de error
        else {
            console.error('Error:', error.message);
        }
    }
}

// ============================================================================
// REFRESH AUTOMÁTICO
// ============================================================================

/**
 * Ejemplo 14: El refresh es automático
 * 
 * Si tu access_token expira, el interceptor detecta el 401,
 * usa el refresh_token para obtener un nuevo access_token,
 * y reintenta la request automáticamente.
 * 
 * NO necesitas manejar esto manualmente.
 */
async function ejemploRefreshAutomatico() {
    // Supongamos que el access_token está expirado

    try {
        // Esta llamada dará 401
        const { data } = await apiClient.get('/auth/me/');

        // El interceptor:
        // 1. Detecta el 401
        // 2. Llama a POST /auth/refresh/ con el refresh_token
        // 3. Guarda el nuevo access_token
        // 4. Reintenta GET /auth/me/ con el nuevo token
        // 5. Retorna el resultado exitoso

        console.log('Usuario (después de refresh automático):', data);
    } catch (error) {
        // Solo llegas aquí si el refresh también falló
        console.error('Refresh falló, sesión expirada completamente');
    }
}

/**
 * Ejemplo 15: Refresh manual (raramente necesario)
 */
async function ejemploRefreshManual() {
    try {
        const newAccessToken = await AuthService.refresh();
        console.log('Nuevo access token:', newAccessToken);
    } catch (error: any) {
        console.error('Error en refresh:', error.message);
        // Aquí deberías redirigir a login
        AuthService.logout();
    }
}

// ============================================================================
// CONFIGURACIÓN Y DEBUGGING
// ============================================================================

/**
 * Ejemplo 16: Ver estado de tokens
 */
function ejemploVerTokens() {
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    const user = localStorage.getItem('user');

    console.log('Access Token:', accessToken ? 'Presente ✓' : 'Ausente ✗');
    console.log('Refresh Token:', refreshToken ? 'Presente ✓' : 'Ausente ✗');
    console.log('Usuario:', user ? JSON.parse(user) : 'No hay sesión');

    // Decodificar token JWT (solo la parte del payload, sin verificar firma)
    if (accessToken) {
        try {
            const payload = JSON.parse(atob(accessToken.split('.')[1]));
            console.log('Token payload:', payload);
            console.log('Expira en:', new Date(payload.exp * 1000));
        } catch {
            console.error('Token inválido o corrupto');
        }
    }
}

/**
 * Ejemplo 17: Limpiar sesión completa
 */
function ejemploLimpiarSesion() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    console.log('Sesión limpiada');
}

// ============================================================================
// EXPORTAR PARA USO EN CONSOLA DEL NAVEGADOR
// ============================================================================

// Descomentar para debugging en navegador:
/*
(window as any).ejemplos = {
  login: ejemploLogin,
  obtenerUsuario: ejemploObtenerUsuario,
  logout: ejemploLogout,
  listarUsuarios: ejemploListarUsuarios,
  cicloActivo: ejemploObtenerCicloActivo,
  crearIncidencia: ejemploCrearIncidencia,
  verTokens: ejemploVerTokens,
  limpiarSesion: ejemploLimpiarSesion,
};

console.log('Ejemplos disponibles en: window.ejemplos');
console.log('Prueba: window.ejemplos.verTokens()');
*/
