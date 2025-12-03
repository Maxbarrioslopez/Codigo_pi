Plataforma de Beneficios TMLUC — Backend (Django DRF) + Frontend (React + Vite)

## 🟢 STATUS: PRODUCCIÓN LISTA

**Última actualización:** 2 Diciembre 2025  
**Commits:** 4 (12f8558, 5a006c0, aa05eeb, 6de5e0c)  
**Features:** Agregar trabajador, CRUD Ciclos, Nómina Preview, Upload Excel/CSV Funcional, Descarga Plantilla, Responsive Mobile

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
Upload Excel/CSV Nómina → Drag&Drop + Click, validación 10MB, SheetJS parsing
Descarga Plantilla CSV → /plantillas/nomina_ejemplo.csv
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

| Característica     | Status | Móvil | Desktop |
| ------------------ | ------ | ----- | ------- |
| Agregar Trabajador | ✅     | ✅    | ✅      |
| Gestión Ciclos     | ✅     | ✅    | ✅      |
| Nómina Preview     | ✅     | ✅    | ✅      |
| Upload Excel/CSV   | ✅     | ✅    | ✅      |
| Descarga Plantilla | ✅     | ✅    | ✅      |
| Trazabilidad QR    | ✅     | ✅    | ✅      |
| Reportes           | ✅     | ✅    | ✅      |
| Responsive         | ✅     | ✅    | ✅      |

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

- **NominaModule.tsx**: Upload funcional con SheetJS (xlsx), drag&drop, validación de extensiones (.xlsx, .xls, .csv) y tamaño (10MB), preview de primeros 5 registros, flujo completo upload → preview → processing → complete
- **Descarga de plantilla**: Botón operativo con archivo estático en `public/plantillas/nomina_ejemplo.csv`
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
