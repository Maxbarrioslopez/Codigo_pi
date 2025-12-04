# Debug Frontend - Botón "Agregar Beneficio" No Visible

## Pasos para Diagnosticar

### 1. Verificar Autenticación
Abre DevTools (F12) → Console y ejecuta:
```javascript
console.log('Token:', localStorage.getItem('token'));
console.log('User:', localStorage.getItem('user'));
```

### 2. Verificar Peticiones API
En DevTools → Network tab:
- Busca la petición `GET /api/ciclos/`
- Verifica que retorne status 200
- Revisa la respuesta JSON - debe tener 13 ciclos

### 3. Verificar Estado del Componente
En React DevTools (extensión de Chrome):
- Busca el componente `CicloBimensualModule`
- Verifica el estado:
  - `ciclos`: debe tener array con 13 elementos
  - `beneficios`: debe tener array con 2 elementos
  - `loading`: debe ser `false`

### 4. Verificar DOM
En Elements tab:
- Busca los botones con texto "Agregar Beneficio"
- Verifica que existan en el DOM
- Comprueba si tienen `display: none` o `visibility: hidden`

### 5. Logs en Consola
Si hay errores, cópialos y repórtalos.

## Solución Rápida

Si los datos están correctos pero no se ven visualmente, intenta:

1. **Hard Refresh**: `Ctrl + Shift + R`
2. **Limpiar Cache**: 
   - DevTools → Network → Disable cache
   - Application → Clear storage
3. **Verificar que estás en la tab correcta**: Debe estar en tab "Ciclos"

## Datos Esperados

El API debe devolver ciclos con esta estructura:
```json
{
  "id": 13,
  "nombre": "Ciclo 8 (2025-12-04)",
  "fecha_inicio": "2025-12-04",
  "fecha_fin": "2025-12-12",
  "activo": true,
  "beneficios_activos": [
    {
      "id": 1,
      "nombre": "Caja de Navidad",
      "descripcion": "...",
      "activo": true
    }
  ],
  "dias_restantes": 8,
  "duracion_dias": 8,
  "progreso_porcentaje": 0
}
```

## Capturas que Necesito

Si el problema persiste, envía:
1. Screenshot de la pantalla actual
2. Screenshot de Network tab mostrando GET /api/ciclos/
3. Screenshot de Console (errores si los hay)
