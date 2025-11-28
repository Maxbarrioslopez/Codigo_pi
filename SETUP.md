SETUP y ejecución (Windows PowerShell)

Prerequisitos:
- Python 3.10+ instalado
- Node.js 18+ y npm
- PostgreSQL (opcional; por defecto usa sqlite para dev)

Backend (Django + DRF)
1) Entrar en carpeta backend:
   cd "C:\Users\Maxi Barrios\Documents\Codigo_pi\backend"

2) Crear y activar virtualenv (PowerShell):
   python -m venv .venv; .\.venv\Scripts\Activate.ps1

3) Instalar dependencias:
   pip install -r requirements.txt

4) Configurar PostgreSQL (opcional):
   Exportar variables de entorno o ajustar backend_project/settings.py
   Para usar Postgres en PowerShell:
   $env:USE_POSTGRES = '1'; $env:POSTGRES_DB = 'nombre'; $env:POSTGRES_USER = 'user'; $env:POSTGRES_PASSWORD = 'pass'; $env:POSTGRES_HOST = 'localhost'; $env:POSTGRES_PORT = '5432'

5) Migraciones y datos iniciales:
   python manage.py makemigrations
   python manage.py migrate

6) Crear superuser (opcional):
   python manage.py createsuperuser

7) Ejecutar servidor:
   python manage.py runserver

Backend tests (pytest):
- Instalar pytest y pytest-django (ya incluidos en requirements.txt)
- Ejecutar desde carpeta backend:
  pytest -q


Frontend (React + Vite)
1) Entrar en carpeta frontend:
   cd "C:\Users\Maxi Barrios\Documents\Codigo_pi\frontend"

2) Instalar dependencias:
   npm install

3) Ejecutar en modo desarrollo:
   npm run dev

4) Abrir http://localhost:3000 (o el puerto que indique vite)

Frontend tests (Jest):
- Ejecutar:
  npm run test

Notas y consideraciones:
- Durante desarrollo es común usar proxy para redirigir llamadas /api al backend. Puedes configurar esto en Vite si el frontend corre en otro puerto.
- El QR se genera en el backend y se guarda en MEDIA_ROOT/tickets/. En modo DEBUG Django sirve esos archivos.
- Validación RUT: se usa una versión estándar (función valid_rut en backend/totem/utils_rut.py). Si necesitas aceptar distintos formatos, hablamos y la adapto.

Problemas comunes:
- Errores de importación en TypeScript/React hasta instalar dependencias (npm install).
- Para Postgres, asegúrate de crear la BD y usuario antes de ejecutar migraciones.

Si quieres, puedo:
- Añadir un proxy dev en Vite para apuntar a http://localhost:8000/api
- Integrar auth con django.contrib.auth o tokens para endpoints protegidos
- Añadir más validaciones y pruebas automáticas
