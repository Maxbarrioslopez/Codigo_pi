# 🚀 Instalación Rápida - Backend Actualizado

## 📋 Requisitos Previos

- Python 3.10+
- pip
- PostgreSQL 14+ (opcional, se puede usar SQLite en desarrollo)
- Redis (opcional en desarrollo)

## ⚡ Instalación Rápida (5 minutos)

### 1. Instalar dependencias

```bash
cd backend

# Development
pip install -r requirements/development.txt

# O Production
pip install -r requirements/production.txt
```

### 2. Configurar variables de entorno

```bash
# Copiar template
cp .env.example .env

# Editar (mínimo cambiar SECRET_KEY)
nano .env
```

**Variables mínimas requeridas:**
```bash
DJANGO_SECRET_KEY=tu-clave-secreta-muy-larga-aqui
DEBUG=True
```

### 3. Aplicar migraciones

```bash
python manage.py makemigrations
python manage.py migrate
```

### 4. Crear superusuario

```bash
python manage.py createsuperuser
```

### 5. Ejecutar servidor

```bash
python manage.py runserver
```

✅ Backend corriendo en http://127.0.0.1:8000/

## 🔧 Configuración Opcional

### Redis (Caching)

**No es necesario en desarrollo** - usa LocMemCache automáticamente.

Si quieres Redis:

```bash
# Windows (WSL2)
wsl --install
sudo apt install redis-server
sudo service redis-server start

# Linux
sudo apt install redis-server
sudo systemctl start redis

# Mac
brew install redis
brew services start redis
```

Verificar:
```bash
redis-cli ping
# Output: PONG
```

### Celery (Tareas Asíncronas)

**No es necesario en desarrollo** - usa modo "eager" (síncrono).

Si quieres workers reales:

```bash
# Terminal 1: Worker
celery -A backend_project worker -l info

# Terminal 2: Beat (scheduler)
celery -A backend_project beat -l info
```

### PostgreSQL (Base de Datos)

**No es necesario en desarrollo** - usa SQLite automáticamente.

Si quieres PostgreSQL:

1. Instalar PostgreSQL
2. Crear base de datos:
```sql
CREATE DATABASE totem_digital;
CREATE USER totem_user WITH PASSWORD 'tu_password';
GRANT ALL PRIVILEGES ON DATABASE totem_digital TO totem_user;
```

3. Actualizar `.env`:
```bash
USE_POSTGRES=True
POSTGRES_DB=totem_digital
POSTGRES_USER=totem_user
POSTGRES_PASSWORD=tu_password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
```

## 🧪 Ejecutar Tests

```bash
# Todos los tests
pytest

# Con coverage
pytest --cov=. --cov-report=html

# Abrir reporte
open htmlcov/index.html
```

## 📚 Documentación Completa

Ver `CAMBIOS_IMPLEMENTADOS.md` para:
- Lista completa de cambios
- Guía de deployment
- Troubleshooting
- Referencias

## ❓ Problemas Comunes

### `ImportError: No module named 'environ'`
```bash
pip install django-environ
```

### `SECRET_KEY` no encontrado
```bash
# Generar nueva clave
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"

# Copiar al .env
```

### Tests fallan por permisos
```bash
mkdir -p logs
chmod 755 logs
```

## 🎉 ¡Listo!

El backend está corriendo con todas las mejoras implementadas:
- ✅ Seguridad ISO 27001
- ✅ Performance optimizado
- ✅ Logging estructurado
- ✅ Testing setup
- ✅ Production-ready

**Próximo paso:** Ver `CAMBIOS_IMPLEMENTADOS.md` para deployment en producción.
