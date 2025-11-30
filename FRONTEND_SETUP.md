# 🚀 Instalación y Ejecución del Frontend - Copiar y Pegar en CMD

## Paso 1: Ir al directorio del frontend
```cmd
cd "C:\Users\Maxi Barrios\Documents\Codigo_pi\front end"
```

## Paso 2: Instalar dependencias de Node.js
```cmd
npm install
```

## Paso 3: Ejecutar el servidor de desarrollo
```cmd
npm run dev
```

## Paso 4: Abrir en el navegador
http://localhost:5173/

## Usuarios de prueba (modo mock - funciona sin backend):
- Admin: `admin` / `admin123`
- Guardia: `guardia` / `guardia123`
- RRHH: `rrhh` / `rrhh123`

---

# 📋 VERSIÓN PARA COPIAR TODO DE UNA VEZ:

```cmd
cd "C:\Users\Maxi Barrios\Documents\Codigo_pi\front end" && npm install && npm run dev
```

---

# ⚠️ Si tienes problemas:

## Error: npm no reconocido
Instalar Node.js desde: https://nodejs.org/

## Error: Puerto en uso
El servidor cambiará automáticamente al siguiente puerto disponible (5174, 5175, etc.)

## Limpiar y reinstalar dependencias
```cmd
cd "C:\Users\Maxi Barrios\Documents\Codigo_pi\front end"
rmdir /s /q node_modules
del package-lock.json
npm install
npm run dev
```
