Plataforma de Beneficios TMLUC — Backend (Django DRF) + Frontend (React + Vite)

Estructura actual:
- backend/: proyecto Django con apps de dominio
	- backend_project/: settings, urls, wsgi
	- totem/: modelos y vistas núcleo (tickets, agendamientos, incidencias, ciclo, parámetros)
	- guardia/: vistas de validación y métricas de portería
	- rrhh/: listados administrativos y reportes diarios
- front end/: aplicación React + Vite (TypeScript)
	- src/components/: módulos Totem, Guardia, RRHH, Administrador y UI
	- src/services/api.ts: capa de servicios tipada + auth stub
	- src/hooks/: useCicloActivo, useMetricasGuardia, useParametrosOperativos

Objetivo:
- Gestión integral de beneficios con tickets QR, validación en guardia y reportes para RRHH.

Endpoints principales:
- Ver `backend/README.md` para tabla completa; el frontend los consume vía `/api/...`.

Ejecución (PowerShell):
- Backend: ver `backend/README.md` (virtualenv, install, migrate, runserver)
- Frontend:
	```powershell
	cd "front end"
	npm install
	npm run dev
	```

Tests frontend:
```powershell
cd "front end"; npm test
```

Notas:
- Documentación detallada del frontend en `front end/README.md` (arquitectura, hooks y endpoints).
