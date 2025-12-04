# 🚀 GUÍA DE DEPLOYMENT A PRODUCCIÓN

## 📋 Índice
1. [Preparación de Entorno](#preparación-de-entorno)
2. [Build del Frontend](#build-del-frontend)
3. [Configuración del Backend](#configuración-del-backend)
4. [Setup de NGINX](#setup-de-nginx)
5. [Testing](#testing)
6. [Troubleshooting](#troubleshooting)

---

## 📦 Preparación de Entorno

### Servidor Ubuntu 20.04+ (Recomendado)

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependencias del sistema
sudo apt install -y \
    python3.10 \
    python3.10-venv \
    python3-pip \
    nodejs \
    npm \
    nginx \
    postgresql \
    postgresql-contrib \
    redis-server \
    git \
    curl \
    certbot \
    python3-certbot-nginx
```

### Crear estructura de directorios

```bash
# En /var/www/
sudo mkdir -p /var/www/totem-{frontend,backend}
sudo chown $USER:$USER /var/www/totem-*

# Estructura final:
# /var/www/totem-frontend/    → React build
# /var/www/totem-backend/     → Django app
```

---

## 🔨 Build del Frontend

### Paso 1: Clonar repositorio

```bash
cd /var/www/totem-frontend
git clone https://github.com/Maxbarrioslopez/Codigo_pi.git .
cd "front end"
```

### Paso 2: Instalar dependencias

```bash
npm install
# o
npm ci  # (más recomendado para producción)
```

### Paso 3: Build de producción

```bash
# Construir para producción (usa .env.production)
npm run build

# Resultado: carpeta dist/ con la app compilada
# ✅ VITE_API_URL=/api está baked en el build
```

### Paso 4: Servir con NGINX

```bash
# Los archivos estáticos van en /var/www/html o donde configure nginx
# Copiar contenido de dist/ a la carpeta del servidor
sudo cp -r dist/* /var/www/totem-frontend/
sudo chown -R www-data:www-data /var/www/totem-frontend/
```

---

## ⚙️ Configuración del Backend

### Paso 1: Clonar repositorio

```bash
cd /var/www/totem-backend
git clone https://github.com/Maxbarrioslopez/Codigo_pi.git .
cd backend
```

### Paso 2: Crear virtual environment

```bash
python3.10 -m venv venv
source venv/bin/activate  # En Linux/Mac
# o
venv\Scripts\activate.ps1  # En Windows PowerShell
```

### Paso 3: Instalar dependencias

```bash
pip install -r requirements/production.txt
```

### Paso 4: Configurar variables de entorno

Crear `/var/www/totem-backend/.env`:

```bash
# Django
DEBUG=False
SECRET_KEY=tu-clave-secreta-super-larga-aqui  # Generar con: python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
ALLOWED_HOSTS=tudominio.com,www.tudominio.com

# Database PostgreSQL
DB_ENGINE=django.db.backends.postgresql
DB_NAME=totem_db
DB_USER=totem_user
DB_PASSWORD=contraseña-fuerte
DB_HOST=localhost
DB_PORT=5432

# JWT Tokens (en segundos)
JWT_ACCESS_TOKEN_EXPIRE=900          # 15 minutos
JWT_REFRESH_TOKEN_EXPIRE=604800      # 7 días

# CORS - CRÍTICO para production
CORS_ALLOWED_ORIGINS=https://tudominio.com,https://www.tudominio.com

# Email (para notificaciones)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=tu-email@gmail.com
EMAIL_HOST_PASSWORD=tu-contraseña-app
EMAIL_USE_TLS=True

# Logging
LOG_LEVEL=INFO

# Redis (para cache y tasks)
REDIS_URL=redis://localhost:6379/0

# Sentry (error tracking - opcional)
SENTRY_DSN=
```

### Paso 5: Setup de Base de Datos

```bash
# Conectarse a PostgreSQL
sudo -u postgres psql

# En postgres:
CREATE DATABASE totem_db;
CREATE USER totem_user WITH PASSWORD 'contraseña-fuerte';
ALTER ROLE totem_user SET client_encoding TO 'utf8';
ALTER ROLE totem_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE totem_user SET default_transaction_deferrable TO on;
ALTER ROLE totem_user SET default_transaction_level TO 'read committed';
GRANT ALL PRIVILEGES ON DATABASE totem_db TO totem_user;
\q
```

### Paso 6: Preparar Django

```bash
cd /var/www/totem-backend/backend

# Aplicar migraciones
python manage.py migrate --settings=backend_project.settings.production

# Crear superusuario (admin)
python manage.py createsuperuser --settings=backend_project.settings.production

# Recopilar archivos estáticos
python manage.py collectstatic --noinput --settings=backend_project.settings.production

# Prueba rápida
python manage.py check --settings=backend_project.settings.production
# ✅ System check identified no issues (2 silenced).
```

---

## 🌐 Setup de NGINX

### Paso 1: Copiar configuración

```bash
sudo cp NGINX_PRODUCTION_CONFIG.conf /etc/nginx/sites-available/totem-prod

# Ajustar: servidor_name, rutas, certificados
sudo nano /etc/nginx/sites-available/totem-prod
```

### Paso 2: Habilitar sitio

```bash
sudo ln -s /etc/nginx/sites-available/totem-prod /etc/nginx/sites-enabled/

# Deshabilitar default
sudo unlink /etc/nginx/sites-enabled/default
```

### Paso 3: Obtener certificado SSL

```bash
# Let's Encrypt (automático)
sudo certbot certonly --nginx -d tudominio.com -d www.tudominio.com

# El certificado se guarda en:
# /etc/letsencrypt/live/tudominio.com/
```

### Paso 4: Validar y reiniciar NGINX

```bash
# Validar sintaxis
sudo nginx -t
# ✅ nginx: the configuration file /etc/nginx/nginx.conf syntax is ok

# Reiniciar
sudo systemctl restart nginx
sudo systemctl status nginx
# ✅ active (running)
```

---

## 🐍 Setup de Gunicorn (Django App Server)

### Paso 1: Instalar Gunicorn

```bash
cd /var/www/totem-backend
source venv/bin/activate
pip install gunicorn
```

### Paso 2: Crear systemd service

Crear `/etc/systemd/system/totem-gunicorn.service`:

```ini
[Unit]
Description=Gunicorn daemon for TOTEM
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/totem-backend/backend
Environment="PATH=/var/www/totem-backend/venv/bin"
ExecStart=/var/www/totem-backend/venv/bin/gunicorn \
    --workers 4 \
    --worker-class gthread \
    --threads 2 \
    --timeout 60 \
    --bind 127.0.0.1:8000 \
    --log-level info \
    --access-logfile /var/log/totem/gunicorn_access.log \
    --error-logfile /var/log/totem/gunicorn_error.log \
    backend_project.wsgi:application

Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### Paso 3: Crear carpeta de logs

```bash
sudo mkdir -p /var/log/totem
sudo chown www-data:www-data /var/log/totem
```

### Paso 4: Iniciar servicio

```bash
sudo systemctl daemon-reload
sudo systemctl start totem-gunicorn
sudo systemctl enable totem-gunicorn
sudo systemctl status totem-gunicorn
# ✅ active (running)
```

---

## ✅ Testing

### Prueba 1: Frontend accesible

```bash
curl -I https://tudominio.com
# ✅ HTTP/2 200
# ✅ Content-Type: text/html
```

### Prueba 2: API accesible

```bash
curl https://tudominio.com/api/health/
# ✅ {"status": "healthy"}
```

### Prueba 3: Login funciona

Abrir en navegador: `https://tudominio.com`

1. Ir a Login
2. Ingresar usuario admin
3. Verificar en Network tab:
   - POST a `/api/auth/login/` (no a localhost:8000)
   - Status 200 ✅
4. Verificar que acceso_token está en localStorage
5. Acceder a dashboard

### Prueba 4: Debug en navegador

```javascript
// En consola del navegador
console.log('API URL:', await fetch('/api/health/').then(r => r.json()))

// Verificar token
localStorage.getItem('access_token')

// Hacer request autenticado
fetch('/api/auth/me/', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('access_token')
  }
}).then(r => r.json()).then(console.log)
```

---

## 🔍 Troubleshooting

### Error 1: "Failed to connect to API"

```bash
# Verificar que Gunicorn está corriendo
sudo systemctl status totem-gunicorn

# Ver logs
tail -f /var/log/totem/gunicorn_error.log

# Probar conexión directa
curl http://127.0.0.1:8000/api/health/

# Verificar NGINX proxy
curl -v https://tudominio.com/api/health/
# Buscar "Proxy" en headers
```

### Error 2: CORS error en login

```bash
# Backend debe permitir origin del frontend
# En settings.py:
CORS_ALLOWED_ORIGINS = ["https://tudominio.com", "https://www.tudominio.com"]

# Verificar header en response:
curl -I https://tudominio.com/api/auth/login/
# ✅ Access-Control-Allow-Origin: https://tudominio.com
```

### Error 3: "Invalid token" después de login

```bash
# Verificar que SECRET_KEY es consistente
# En .env:
SECRET_KEY=el-mismo-valor

# Restart services:
sudo systemctl restart totem-gunicorn
```

### Error 4: 502 Bad Gateway en NGINX

```bash
# Verificar que Gunicorn está corriendo
ps aux | grep gunicorn

# Ver logs de NGINX
tail -f /var/log/nginx/error.log

# Verificar puerto 8000 está escuchando
netstat -tlnp | grep 8000
# ✅ tcp 127.0.0.1:8000 LISTEN

# Reintentar NGINX
sudo systemctl restart nginx
```

### Error 5: Certificado SSL caducado

```bash
# Renovar certificado Let's Encrypt
sudo certbot renew --dry-run

# O renovar directamente
sudo certbot renew --force-renewal

# El relleno automático debería estar habilitado:
sudo systemctl enable certbot.timer
```

---

## 📊 Monitoreo en Producción

### Setup de Logs

```bash
# Logs centralizados
sudo tee /etc/rsyslog.d/50-totem.conf > /dev/null << EOF
:programname, isequal, "totem" /var/log/totem/app.log
& stop
EOF

# Reiniciar rsyslog
sudo systemctl restart rsyslog
```

### Monitoreo con Supervisor (alternativa a systemd)

Crear `/etc/supervisor/conf.d/totem.conf`:

```ini
[program:totem-gunicorn]
command=/var/www/totem-backend/venv/bin/gunicorn \
    --workers 4 \
    --bind 127.0.0.1:8000 \
    backend_project.wsgi:application
directory=/var/www/totem-backend/backend
user=www-data
stdout_logfile=/var/log/totem/gunicorn.log
autostart=true
autorestart=true
redirect_stderr=true
```

---

## 🔒 Checklist de Seguridad

- [ ] DEBUG=False en settings.py
- [ ] SECRET_KEY es segura (generada aleatoriamente)
- [ ] ALLOWED_HOSTS contiene solo dominios permitidos
- [ ] CORS_ALLOWED_ORIGINS restringido al dominio del frontend
- [ ] SSL/HTTPS habilitado (redirigir HTTP → HTTPS)
- [ ] Base de datos tiene contraseña fuerte
- [ ] JWT tokens con expiración adecuada
- [ ] Logs no contienen información sensible
- [ ] Backups automáticos de base de datos
- [ ] Firewall configurable (ufw)

---

## 📚 Comandos Útiles

```bash
# Ver status de servicios
sudo systemctl status nginx totem-gunicorn

# Reiniciar todo
sudo systemctl restart nginx totem-gunicorn

# Ver logs en tiempo real
sudo journalctl -u totem-gunicorn -f

# Conectarse a base de datos
sudo -u postgres psql totem_db

# Limpiar cache Redis
redis-cli FLUSHALL

# Ver tamaño de base de datos
du -sh /var/lib/postgresql/*/

# Verificar espacio en disco
df -h

# Certificado SSL - próxima renovación
certbot certificates
```

---

**Fecha de creación**: 2025-12-04
**Versión**: 1.0
**Última actualización**: -

Próximos pasos: Seguir esta guía paso a paso en tu servidor.
