# 🏢 Sistema Retiro Digital TMLUC

Sistema integral de gestión de beneficios para trabajadores con módulos de autoservicio, validación y administración.

## 📁 Estructura del Proyecto

```
Codigo_pi/
├── backend/              # API Django + Django REST Framework
│   ├── backend_project/  # Configuración principal
│   ├── totem/           # App principal de beneficios
│   ├── guardia/         # App módulo guardia
│   ├── rrhh/            # App módulo RRHH
│   └── scripts/         # Scripts de utilidad
├── frontend/            # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/  # Componentes React
│   │   ├── services/    # Servicios API
│   │   ├── hooks/       # Custom hooks
│   │   ├── contexts/    # Context providers
│   │   └── types/       # TypeScript types
│   └── public/          # Archivos estáticos
└── docs/                # Documentación del proyecto
```

## 🚀 Inicio Rápido

### Backend (Django)

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend (React)

```bash
cd frontend
npm install
npm run dev
```

El sistema estará disponible en:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

## 🔑 Módulos Principales

### 🖥️ Tótem Autoservicio
- Escaneo QR de cédulas
- Validación de beneficios
- Generación de tickets

### 🛡️ Panel Guardia
- Validación de entregas
- Escaneo QR de tickets
- Registro de incidencias

### 📊 Dashboard RRHH
- Gestión de ciclos y beneficios
- Administración de cajas
- Control de stock
- Reportes y métricas

### ⚙️ Administración
- Gestión de usuarios
- Configuración de roles
- Parámetros del sistema

## 🔐 Roles de Usuario

- **Admin**: Acceso total al sistema
- **RRHH**: Gestión de beneficios y ciclos
- **Guardia**: Validación de entregas
- **Supervisor**: Vista de reportes

## 📚 Documentación

Toda la documentación técnica y guías se encuentra en la carpeta `/docs`:

- Guías de deployment
- Especificaciones técnicas
- Flujos de trabajo
- Configuración de producción

## 🛠️ Tecnologías

**Backend:**
- Django 4.2
- Django REST Framework
- PostgreSQL / SQLite
- JWT Authentication

**Frontend:**
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Shadcn UI

## 🌐 Deployment

Ver `docs/DEPLOYMENT_INSTRUCTIONS_mbarrios_tech.md` para instrucciones completas de deployment en producción.

**Dominio**: mbarrios.tech

## 📄 Licencia

Propietario - TMLUC (Terminal Marítimo de Lirquén)
