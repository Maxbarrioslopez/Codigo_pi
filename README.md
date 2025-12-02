Plataforma de Beneficios TMLUC — Backend (Django DRF) + Frontend (React + Vite)

## 🟢 STATUS: PRODUCCIÓN LISTA

**Última actualización:** 1 Diciembre 2025  
**Commits:** 3 (12f8558, 5a006c0, aa05eeb)  
**Features:** Agregar trabajador, CRUD Ciclos, Nómina Preview, Responsive Mobile

---

## Estructura actual
- **backend/**: proyecto Django con apps de dominio
	- backend_project/: settings, urls, wsgi
	- totem/: modelos y vistas núcleo (tickets, agendamientos, incidencias, ciclo, parámetros)
	- guardia/: vistas de validación y métricas de portería
	- rrhh/: listados administrativos y reportes diarios (18+ endpoints)

- **front end/**: aplicación React + Vite (TypeScript)
	- src/components/: Totem, Guardia, RRHHModuleNew (6 tabs integrados), Administrador y UI
	- src/services/: trabajador, ciclo, nomina, stock (singleton pattern)
	- src/hooks/: useCicloActivo, useMetricasGuardia, useParametrosOperativos

---

## ✨ LO QUE FUNCIONA

```
Agregar Trabajador para Beneficio → POST /api/trabajadores/
CRUD Ciclos Bimensuales → /api/ciclos/
Vista Previa Nómina → POST /api/nomina/preview/
Confirmar Nómina → POST /api/nomina/confirmar/
Listar Incidencias/Trazabilidad → /api/incidencias/
Reportes por período → /api/reportes/
Responsive Mobile (360px-1440px)
Sincronización BD en tiempo real
```

---

## 🚀 INICIO RÁPIDO

### Terminal 1: Backend
```powershell
cd "c:\Users\Maxi Barrios\Documents\Codigo_pi\backend"
python manage.py runserver 0.0.0.0:8000
```

### Terminal 2: Frontend
```powershell
cd "c:\Users\Maxi Barrios\Documents\Codigo_pi\front end"
npm run dev
```

### Navegador
```
http://localhost:3000/
→ Click "Dashboard RRHH"
→ Testear cualquier tab
```

---

## 📖 DOCUMENTACIÓN

👉 **[VER ÍNDICE COMPLETO](./DOCUMENTACION_INDEX.md)** ← EMPIEZA AQUÍ

**Rutas rápidas:**
- **5 min**: `GUIA_RAPIDA_INICIO.md` — Empezar ahora mismo
- **10 min**: `RESUMEN_VISUAL.md` — Entender el problema y solución  
- **15 min**: `RESUMEN_EJECUTIVO_CAMBIOS.md` — Visión de impacto
- **20 min**: `CAMBIOS_TECNICOS_EXACTOS.md` — Detalles de código
- **30 min**: `IMPLEMENTACION_COMPLETADA.md` — Guía completa
- **30 min**: `CHECKLIST_VALIDACION_FINAL.md` — Testing y validación
- **60 min**: `AUDIT_FRONTEND_BACKEND_ALIGNMENT.md` — Análisis profundo

---

## 🔧 ENDPOINTS PRINCIPALES

**Trabajadores:**
- `GET /api/trabajadores/` — Listar todos
- `POST /api/trabajadores/` — Crear nuevo ← FUNCIONA AHORA
- `PUT /api/trabajadores/{rut}/` — Actualizar
- `DELETE /api/trabajadores/{rut}/` — Eliminar

**Ciclos:**
- `GET /api/ciclos/` — Listar todos
- `POST /api/ciclos/` — Crear ciclo
- `POST /api/ciclos/{id}/cerrar/` — Cerrar ciclo

**Nómina:**
- `POST /api/nomina/preview/` — Previsualizar
- `POST /api/nomina/confirmar/` — Confirmar generación

Ver `backend/README.md` para lista completa (40+ endpoints).

---

## Características nuevas

| Característica | Status | Móvil | Desktop |
|---|---|---|---|
| Agregar Trabajador | Sí | Sí | Sí |
| Gestión Ciclos | Sí | Sí | Sí |
| Nómina Preview | Sí | Sí | Sí |
| Trazabilidad QR | Sí | Sí | Sí |
| Reportes | Sí | Sí | Sí |
| Responsive | Sí | Sí | Sí |

---

## 🧪 TESTING

```powershell
# Frontend tests
cd "front end"
npm test

# Backend tests
cd "backend"
pytest
```

---

## Cambios recientes

- **RRHHModuleNew.tsx**: 6 tabs integrados (dashboard, trabajadores, ciclo, nómina, trazabilidad, reportes)
- **ciclo.service.ts**: CRUD completo para ciclos bimensuales
- **nomina.service.ts**: Preview + confirmar nómina
- **trabajador.service.ts**: Completado con create, update, delete, getTimeline
- **App.tsx**: Simplificado de 10 a 5 módulos en sidebar
- **Responsivity**: Mobile-first Tailwind en todos los componentes

---

## 🛠️ PRÓXIMAS MEJORAS

- [ ] Validación avanzada de campos
- [ ] Mensajes de error mejorados
- [ ] Historial de cambios (audit log)
- [ ] Exportar reportes (CSV/PDF)
- [ ] AdministradorModule responsive
- [ ] GuardiaModule responsive

---

## 📝 NOTAS

- Documentación detallada del frontend en `front end/README.md`
- Ver `GUIA_RAPIDA_INICIO.md` para primer uso y troubleshooting
- BD desarrollo: `backend/db.sqlite3`
- Todos los cambios en Git con commits trazables
