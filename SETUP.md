# 🚀 Guía de Instalación - Sistema Tótem Digital TMLUC

## Requisitos Previos
- Python 3.10 o superior
- Node.js 18 o superior
- Git
- CMD o PowerShell

---

## 📥 PASO 1: Clonar el Repositorio

```cmd
git clone https://github.com/Maxbarrioslopez/Codigo_pi.git
cd Codigo_pi
```

---

## 🔧 PASO 2: Configurar Backend (Django)

### 2.1 Navegar al directorio backend
```cmd
cd backend
```

### 2.2 Crear y activar entorno virtual

**En CMD:**
```cmd
python -m venv .venv
.venv\Scripts\activate.bat
```

**En PowerShell:**
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

### 2.3 Instalar dependencias
```cmd
pip install -r requirements.txt
```

### 2.4 Verificar configuración
✅ La base de datos `db.sqlite3` y el archivo `.env` ya están incluidos
✅ Los usuarios de prueba ya están creados

**Usuarios disponibles:**
- **Admin**: `admin` / `admin123`
- **Guardia**: `guardia` / `guardia123`
- **RRHH**: `rrhh` / `rrhh123`

### 2.5 Ejecutar servidor backend
```cmd
python manage.py runserver
```

✅ Servidor disponible en: **http://127.0.0.1:8000/**

---

## 🎨 PASO 3: Configurar Frontend (React + Vite)

### 3.1 Abrir nueva terminal/cmd y navegar al frontend
```cmd
cd Codigo_pi
cd "front end"
```

### 3.2 Instalar dependencias
```cmd
npm install
```

### 3.3 Ejecutar servidor de desarrollo
```cmd
npm run dev
```

✅ Frontend disponible en: **http://localhost:5173/**

---

## ✅ PASO 4: Verificar que Todo Funciona

### Verificar Backend
1. Abrir: http://127.0.0.1:8000/admin/
2. Login: `admin` / `admin123`
3. Deberías ver el panel de administración Django

### Verificar Frontend
1. Abrir: http://localhost:5173/
2. Hacer clic en cualquier módulo
3. Login con: `admin` / `admin123`
4. Deberías ver el dashboard correspondiente

### Ver Documentación API
Swagger UI: http://127.0.0.1:8000/api/docs/

---

## 🛠️ Comandos Útiles (Opcionales)

### Si necesitas recrear la base de datos:
```cmd
cd backend
del db.sqlite3
python manage.py migrate
python manage.py crear_usuarios_test
```

### Si necesitas crear más usuarios:
```cmd
python manage.py createsuperuser
```

### Build del frontend para producción:
```cmd
cd "front end"
npm run build
```

---

## 🐛 Solución de Problemas Comunes

### ❌ Error: "No module named 'decouple'"
```cmd
pip install python-decouple
```

### ❌ Error: "Puerto 8000 en uso"
```cmd
python manage.py runserver 8001
```

### ❌ Error: "npm no reconocido"
Instalar Node.js desde: https://nodejs.org/

### ❌ Error: "python no reconocido"
Instalar Python desde: https://www.python.org/downloads/
(Marcar "Add Python to PATH" durante instalación)

### ❌ Frontend no conecta con backend
Verificar que el backend esté corriendo en http://127.0.0.1:8000/

---

## 📁 Estructura del Proyecto

```
Codigo_pi/
├── backend/                 # Django + DRF API
│   ├── backend_project/    # Configuración
│   ├── totem/              # App principal
│   ├── guardia/            # App guardia
│   ├── rrhh/               # App RRHH
│   ├── db.sqlite3          # ✅ Base de datos incluida
│   ├── .env                # ✅ Config incluida
│   └── requirements.txt    # Dependencias Python
│
└── front end/              # React + Vite
    ├── src/
    │   ├── components/     # Módulos del sistema
    │   ├── contexts/       # Autenticación
    │   └── services/       # Cliente API
    └── package.json        # Dependencias Node
```

---

## 🔐 Información de Configuración

El archivo `.env` está preconfigurado para desarrollo:
- DEBUG activado
- SQLite como base de datos
- CORS habilitado para localhost:5173

**⚠️ IMPORTANTE:** En producción cambiar `SECRET_KEY` y `DEBUG=False`

---

## 📞 Soporte

- **Documentación Backend**: `backend/README.md`
- **Documentación Frontend**: `front end/README.md`
- **Issues**: https://github.com/Maxbarrioslopez/Codigo_pi/issues

---

## 📄 Licencia

Copyright © 2025 - Sistema Tótem Digital TMLUC
