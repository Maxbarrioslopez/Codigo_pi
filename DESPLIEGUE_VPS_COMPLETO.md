# 🚀 DESPLIEGUE COMPLETO - VPS IONOS

**Stack detectado:**
- Backend: Django 4.2 + PostgreSQL
- Frontend: React 18 + Vite 6.3.5
- Servidor: Ubuntu 24.04 (1 vCore, 1 GB RAM)

---

## 📋 DATOS DEL SERVIDOR

```
IP: 217.160.136.84
Usuario: root
Contraseña: AIfNYHY8
Sistema: Ubuntu 24.04
```

---

## 🔧 PASO 1: CONEXIÓN INICIAL Y ACTUALIZACIÓN DEL SISTEMA

**Conectar por SSH desde VS Code:**

1. Instala la extensión "Remote - SSH" en VS Code
2. Presiona `Ctrl+Shift+P` → "Remote-SSH: Connect to Host..."
3. Escribe: `root@217.160.136.84`
4. Ingresa contraseña: `AIfNYHY8`

**O desde terminal PowerShell:**
```powershell
ssh root@217.160.136.84
# Password: AIfNYHY8
```

**Una vez conectado, ejecuta:**

```bash
# Actualizar sistema
apt update && apt upgrade -y

# Instalar herramientas básicas
apt install -y git curl wget ufw htop nano

# Configurar zona horaria
timedatectl set-timezone America/Santiago
```

---

## 🐍 PASO 2: INSTALAR PYTHON Y DEPENDENCIAS

```bash
# Python 3.12 viene preinstalado en Ubuntu 24.04, verificar:
python3 --version

# Instalar pip y venv
apt install -y python3-pip python3-venv python3-dev

# Instalar dependencias de sistema para PostgreSQL y Pillow
apt install -y libpq-dev libjpeg-dev zlib1g-dev
```

---

## 🗄️ PASO 3: INSTALAR Y CONFIGURAR POSTGRESQL

```bash
# Instalar PostgreSQL
apt install -y postgresql postgresql-contrib

# Iniciar servicio
systemctl start postgresql
systemctl enable postgresql

# Crear base de datos y usuario
sudo -u postgres psql <<EOF
CREATE DATABASE codigo_pi_db;
CREATE USER codigo_pi_user WITH PASSWORD 'CodigoPi2024!Secure';
ALTER ROLE codigo_pi_user SET client_encoding TO 'utf8';
ALTER ROLE codigo_pi_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE codigo_pi_user SET timezone TO 'America/Santiago';
GRANT ALL PRIVILEGES ON DATABASE codigo_pi_db TO codigo_pi_user;
\q
EOF

# Verificar conexión
sudo -u postgres psql -c "SELECT version();"
```

---

## 📦 PASO 4: INSTALAR NODE.JS Y NPM

```bash
# Instalar Node.js 20 LTS (recomendado para producción)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Verificar instalación
node --version  # Debería mostrar v20.x.x
npm --version   # Debería mostrar 10.x.x
```

---

## 📂 PASO 5: CLONAR REPOSITORIO

```bash
# Crear directorio para aplicaciones
mkdir -p /var/www

# Clonar repositorio
cd /var/www
git clone https://github.com/Maxbarrioslopez/Codigo_pi.git
cd Codigo_pi

# Verificar estructura
ls -la
```

---

## 🔐 PASO 6: CONFIGURAR BACKEND (DJANGO)

```bash
cd /var/www/Codigo_pi/backend

# Crear entorno virtual
python3 -m venv venv

# Activar entorno virtual
source venv/bin/activate

# Instalar dependencias
pip install --upgrade pip
pip install -r requirements.txt
pip install gunicorn

# Crear archivo .env para producción
cat > .env <<'EOF'
# Django Core
DJANGO_SECRET_KEY=tu-super-secreto-key-cambiar-esto-$(openssl rand -hex 32)
DJANGO_DEBUG=False
ALLOWED_HOSTS=217.160.136.84,localhost,127.0.0.1

# Database PostgreSQL
USE_POSTGRES=True
POSTGRES_DB=codigo_pi_db
POSTGRES_USER=codigo_pi_user
POSTGRES_PASSWORD=CodigoPi2024!Secure
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# JWT
JWT_SECRET_KEY=$(openssl rand -hex 32)

# Security
QR_HMAC_SECRET=$(openssl rand -hex 32)

# CORS (ajustar con tu dominio si tienes)
CORS_ALLOWED_ORIGINS=http://217.160.136.84,http://localhost

# Operational
MAX_AGENDAMIENTOS_PER_DAY=50
MAX_AGENDAMIENTOS_PER_WORKER=1
QR_TTL_MINUTES=30
EOF

# Reemplazar las claves generadas aleatoriamente
sed -i "s/\$(openssl rand -hex 32)/$(openssl rand -hex 32)/" .env

# Crear directorio de logs
mkdir -p logs

# Ejecutar migraciones
python manage.py migrate

# Crear superusuario (interactivo - sigue las instrucciones)
python manage.py createsuperuser

# Colectar archivos estáticos
python manage.py collectstatic --no-input

# Probar que funciona
python manage.py check
```

**Nota:** Cuando ejecutes `createsuperuser`, te pedirá:
- Username: (elige uno, ej: admin)
- Email: (tu email)
- Password: (elige una contraseña segura)

---

## 🎨 PASO 7: CONFIGURAR FRONTEND (REACT)

```bash
cd /var/www/Codigo_pi/front\ end

# Instalar dependencias
npm install

# Crear archivo .env para producción
cat > .env <<'EOF'
# Backend API URL
VITE_API_URL=http://217.160.136.84:8000/api

# Modo de aplicación
VITE_APP_MODE=production

# Mock mode (false para producción)
VITE_MOCK_MODE=false
EOF

# Build para producción
npm run build

# Verificar que se creó la carpeta build/
ls -la build/
```

---

## 🔧 PASO 8: CREAR SERVICIO SYSTEMD PARA GUNICORN

```bash
# Crear archivo de servicio
cat > /etc/systemd/system/codigo-pi-backend.service <<'EOF'
[Unit]
Description=Codigo Pi Django Backend (Gunicorn)
After=network.target postgresql.service

[Service]
Type=notify
User=root
Group=root
WorkingDirectory=/var/www/Codigo_pi/backend
Environment="PATH=/var/www/Codigo_pi/backend/venv/bin"
ExecStart=/var/www/Codigo_pi/backend/venv/bin/gunicorn \
    --workers 2 \
    --threads 2 \
    --worker-class gthread \
    --bind 127.0.0.1:8000 \
    --timeout 120 \
    --access-logfile /var/www/Codigo_pi/backend/logs/gunicorn-access.log \
    --error-logfile /var/www/Codigo_pi/backend/logs/gunicorn-error.log \
    --log-level info \
    backend_project.wsgi:application

Restart=always
RestartSec=3

# Limitar memoria para VPS de 1GB
MemoryMax=400M
MemoryHigh=350M

[Install]
WantedBy=multi-user.target
EOF

# Recargar systemd
systemctl daemon-reload

# Iniciar servicio
systemctl start codigo-pi-backend

# Habilitar al inicio
systemctl enable codigo-pi-backend

# Verificar estado
systemctl status codigo-pi-backend
```

**Explicación del servicio:**
- 2 workers + 2 threads = capacidad para 4 requests concurrentes (óptimo para 1GB RAM)
- Logs en `/var/www/Codigo_pi/backend/logs/`
- Bind en localhost:8000 (Nginx hará de proxy reverso)
- Límite de memoria: 400MB máximo

---

## 🌐 PASO 9: CONFIGURAR NGINX

```bash
# Instalar Nginx
apt install -y nginx

# Crear configuración del sitio
cat > /etc/nginx/sites-available/codigo-pi <<'EOF'
# Upstream para Django backend
upstream django_backend {
    server 127.0.0.1:8000 fail_timeout=10s max_fails=3;
}

# Servidor principal
server {
    listen 80;
    server_name 217.160.136.84;
    
    client_max_body_size 10M;
    
    # Logs
    access_log /var/log/nginx/codigo-pi-access.log;
    error_log /var/log/nginx/codigo-pi-error.log warn;

    # Frontend estático (React build)
    location / {
        root /var/www/Codigo_pi/front end/build;
        try_files $uri $uri/ /index.html;
        
        # Headers de seguridad
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        
        # Cache para assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API (Django)
    location /api/ {
        proxy_pass http://django_backend;
        proxy_http_version 1.1;
        
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # No buffering para SSE/streaming
        proxy_buffering off;
    }

    # Admin de Django
    location /admin/ {
        proxy_pass http://django_backend;
        proxy_http_version 1.1;
        
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Archivos estáticos de Django
    location /static/ {
        alias /var/www/Codigo_pi/backend/staticfiles/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Archivos media (uploads)
    location /media/ {
        alias /var/www/Codigo_pi/backend/media/;
        expires 1y;
        add_header Cache-Control "public";
    }

    # Health check
    location /health {
        access_log off;
        return 200 "OK\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Habilitar sitio
ln -sf /etc/nginx/sites-available/codigo-pi /etc/nginx/sites-enabled/

# Eliminar sitio por defecto
rm -f /etc/nginx/sites-enabled/default

# Verificar configuración
nginx -t

# Reiniciar Nginx
systemctl restart nginx
systemctl enable nginx

# Verificar estado
systemctl status nginx
```

---

## 🔥 PASO 10: CONFIGURAR FIREWALL

```bash
# Habilitar UFW
ufw --force enable

# Permitir SSH (IMPORTANTE - no te bloquees)
ufw allow 22/tcp

# Permitir HTTP y HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Verificar reglas
ufw status verbose
```

---

## ✅ PASO 11: VERIFICACIÓN COMPLETA

```bash
# Verificar servicios
systemctl status codigo-pi-backend
systemctl status nginx
systemctl status postgresql

# Verificar logs del backend
tail -f /var/www/Codigo_pi/backend/logs/gunicorn-error.log

# Verificar logs de Nginx
tail -f /var/log/nginx/codigo-pi-error.log

# Probar endpoint API
curl http://localhost:8000/api/health/

# Probar desde fuera (desde tu PC local)
# Abre navegador: http://217.160.136.84
```

---

## 🔄 FLUJO DE ACTUALIZACIÓN CON GITHUB

### Script de actualización automática

```bash
# Crear script de actualización
cat > /var/www/Codigo_pi/update.sh <<'EOF'
#!/bin/bash
set -e

echo "🚀 Iniciando actualización desde GitHub..."

# Ir al directorio del proyecto
cd /var/www/Codigo_pi

# Guardar cambios locales si existen
git stash

# Actualizar código
echo "📥 Descargando cambios..."
git pull origin main

# BACKEND
echo "🐍 Actualizando backend..."
cd backend
source venv/bin/activate

# Instalar nuevas dependencias
pip install -r requirements.txt

# Migrar base de datos
python manage.py migrate

# Colectar estáticos
python manage.py collectstatic --no-input

# Reiniciar servicio backend
echo "🔄 Reiniciando backend..."
systemctl restart codigo-pi-backend

# FRONTEND
echo "🎨 Actualizando frontend..."
cd "/var/www/Codigo_pi/front end"

# Instalar nuevas dependencias
npm install

# Rebuild
npm run build

# Reiniciar Nginx
echo "🔄 Reiniciando Nginx..."
systemctl restart nginx

# Verificar servicios
echo "✅ Verificando servicios..."
systemctl is-active --quiet codigo-pi-backend && echo "✅ Backend: OK" || echo "❌ Backend: FAIL"
systemctl is-active --quiet nginx && echo "✅ Nginx: OK" || echo "❌ Nginx: FAIL"

echo "🎉 Actualización completada!"
echo "📊 Ver logs: journalctl -u codigo-pi-backend -f"
EOF

# Dar permisos de ejecución
chmod +x /var/www/Codigo_pi/update.sh
```

### Uso del script

```bash
# Actualizar proyecto completo
/var/www/Codigo_pi/update.sh
```

### Actualización manual paso a paso

```bash
# 1. Ir al directorio
cd /var/www/Codigo_pi

# 2. Descargar cambios
git pull origin main

# 3. Actualizar backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --no-input
systemctl restart codigo-pi-backend

# 4. Actualizar frontend
cd "/var/www/Codigo_pi/front end"
npm install
npm run build
systemctl restart nginx

# 5. Verificar
systemctl status codigo-pi-backend
systemctl status nginx
```

---

## 🛠️ OPTIMIZACIONES PARA VPS 1GB RAM

### Configuración de Swap (memoria virtual)

```bash
# Crear archivo swap de 1GB
fallocate -l 1G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# Hacer permanente
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# Configurar swappiness (usar swap solo cuando sea necesario)
sysctl vm.swappiness=10
echo 'vm.swappiness=10' >> /etc/sysctl.conf

# Verificar
free -h
```

### Limitar memoria de PostgreSQL

```bash
# Editar configuración PostgreSQL
nano /etc/postgresql/16/main/postgresql.conf

# Buscar y modificar estas líneas:
shared_buffers = 128MB          # 128MB para VPS pequeño
effective_cache_size = 512MB    # Mitad de la RAM
maintenance_work_mem = 64MB
work_mem = 4MB

# Reiniciar PostgreSQL
systemctl restart postgresql
```

### Monitoreo de recursos

```bash
# Ver uso de memoria en tiempo real
htop

# Ver procesos que más consumen
ps aux --sort=-%mem | head -10

# Ver uso de disco
df -h

# Ver logs del sistema
journalctl -xe
```

---

## 🚨 COMANDOS ÚTILES DE TROUBLESHOOTING

### Ver logs en tiempo real

```bash
# Logs del backend
journalctl -u codigo-pi-backend -f

# Logs de Nginx
tail -f /var/log/nginx/codigo-pi-error.log

# Logs de PostgreSQL
tail -f /var/log/postgresql/postgresql-16-main.log
```

### Reiniciar servicios

```bash
# Reiniciar backend
systemctl restart codigo-pi-backend

# Reiniciar Nginx
systemctl restart nginx

# Reiniciar PostgreSQL
systemctl restart postgresql

# Reiniciar todo
systemctl restart codigo-pi-backend nginx postgresql
```

### Verificar puertos abiertos

```bash
# Ver qué está escuchando en cada puerto
ss -tulpn | grep LISTEN

# Debería mostrar:
# - :80 (Nginx)
# - :8000 (Gunicorn)
# - :5432 (PostgreSQL)
```

### Acceso a Django shell

```bash
cd /var/www/Codigo_pi/backend
source venv/bin/activate
python manage.py shell
```

### Backup de base de datos

```bash
# Crear backup
sudo -u postgres pg_dump codigo_pi_db > /root/backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurar backup
sudo -u postgres psql codigo_pi_db < /root/backup_20241201_120000.sql
```

---

## 📊 URLS DE ACCESO

Una vez completado el despliegue:

- **Frontend:** http://217.160.136.84
- **API Backend:** http://217.160.136.84/api/
- **Admin Django:** http://217.160.136.84/admin/
- **Health Check:** http://217.160.136.84/health

---

## 🎯 CHECKLIST FINAL

- [ ] Sistema actualizado
- [ ] Python y Node.js instalados
- [ ] PostgreSQL configurado
- [ ] Repositorio clonado
- [ ] Backend configurado (.env, migraciones, superuser)
- [ ] Frontend buildeado
- [ ] Servicio systemd creado y activo
- [ ] Nginx configurado y activo
- [ ] Firewall habilitado
- [ ] Servicios verificados
- [ ] Frontend accesible en navegador
- [ ] API respondiendo correctamente
- [ ] Admin de Django funcionando
- [ ] Script de actualización creado

---

## 🆘 SOPORTE

Si algo falla, verifica:

1. **Servicios activos:**
   ```bash
   systemctl status codigo-pi-backend nginx postgresql
   ```

2. **Logs de errores:**
   ```bash
   journalctl -u codigo-pi-backend --no-pager | tail -50
   tail -50 /var/log/nginx/codigo-pi-error.log
   ```

3. **Puerto 8000 escuchando:**
   ```bash
   ss -tulpn | grep 8000
   ```

4. **Frontend buildeado:**
   ```bash
   ls -la "/var/www/Codigo_pi/front end/build/"
   ```

---

**¡Despliegue completo! Tu aplicación debería estar funcionando en http://217.160.136.84** 🎉
