

nano /tmp/deploy_vps.sh
#!/bin/bash
set -e

echo "🚀 DESPLIEGUE AUTOMÁTICO - VPS IONOS"
echo "====================================="
echo ""

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# PASO 1: Actualizar sistema
echo -e "${BLUE}📦 PASO 1: Actualizando sistema...${NC}"
apt update -qq && apt upgrade -y -qq
apt install -y -qq git curl wget ufw htop nano build-essential
timedatectl set-timezone America/Santiago
echo -e "${GREEN}✓ Sistema actualizado${NC}"
echo ""

# PASO 2: Instalar Python
echo -e "${BLUE}🐍 PASO 2: Configurando Python...${NC}"
apt install -y -qq python3-pip python3-venv python3-dev libpq-dev libjpeg-dev zlib1g-dev
python3 --version
echo -e "${GREEN}✓ Python configurado${NC}"
echo ""

# PASO 3: Instalar PostgreSQL
echo -e "${BLUE}🗄️ PASO 3: Instalando PostgreSQL...${NC}"
apt install -y -qq postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql

# Crear base de datos
sudo -u postgres psql -c "DROP DATABASE IF EXISTS codigo_pi_db;" 2>/dev/null || true
sudo -u postgres psql -c "DROP USER IF EXISTS codigo_pi_user;" 2>/dev/null || true
sudo -u postgres psql <<EOF
CREATE DATABASE codigo_pi_db;
CREATE USER codigo_pi_user WITH PASSWORD 'CodigoPi2024!Secure';
ALTER ROLE codigo_pi_user SET client_encoding TO 'utf8';
ALTER ROLE codigo_pi_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE codigo_pi_user SET timezone TO 'America/Santiago';
GRANT ALL PRIVILEGES ON DATABASE codigo_pi_db TO codigo_pi_user;
ALTER DATABASE codigo_pi_db OWNER TO codigo_pi_user;
EOF
echo -e "${GREEN}✓ PostgreSQL configurado${NC}"
echo ""

# PASO 4: Instalar Node.js
echo -e "${BLUE}📦 PASO 4: Instalando Node.js 20 LTS...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
apt install -y -qq nodejs
node --version
npm --version
echo -e "${GREEN}✓ Node.js instalado${NC}"
echo ""

# PASO 5: Clonar repositorio
echo -e "${BLUE}📂 PASO 5: Clonando repositorio...${NC}"
mkdir -p /var/www
cd /var/www
if [ -d "Codigo_pi" ]; then
    echo "Repositorio existe, actualizando..."
    cd Codigo_pi
    git pull origin main
else
    git clone https://github.com/Maxbarrioslopez/Codigo_pi.git
    cd Codigo_pi
fi
echo -e "${GREEN}✓ Repositorio clonado${NC}"
echo ""

# PASO 6: Configurar Backend
echo -e "${BLUE}🔐 PASO 6: Configurando Backend Django...${NC}"
cd /var/www/Codigo_pi/backend

# Crear entorno virtual
python3 -m venv venv
source venv/bin/activate

# Instalar dependencias
pip install --upgrade pip -q
pip install -r requirements.txt -q
pip install gunicorn -q

# Generar claves secretas
DJANGO_SECRET=$(openssl rand -hex 32)
JWT_SECRET=$(openssl rand -hex 32)
QR_SECRET=$(openssl rand -hex 32)

# Crear archivo .env
cat > .env <<EOF
# Django Core
DJANGO_SECRET_KEY=$DJANGO_SECRET
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
JWT_SECRET_KEY=$JWT_SECRET

# Security
QR_HMAC_SECRET=$QR_SECRET

# CORS
CORS_ALLOWED_ORIGINS=http://217.160.136.84,http://localhost

# Operational
MAX_AGENDAMIENTOS_PER_DAY=50
MAX_AGENDAMIENTOS_PER_WORKER=1
QR_TTL_MINUTES=30
EOF

# Crear directorio de logs
mkdir -p logs

# Ejecutar migraciones
python manage.py migrate --no-input

# Crear superusuario automático
echo "from totem.models import Usuario; Usuario.objects.filter(username='admin').exists() or Usuario.objects.create_superuser('admin', 'admin@codigo-pi.com', 'Admin2024!Secure', rol='ADMIN')" | python manage.py shell

# Colectar estáticos
mkdir -p staticfiles
python manage.py collectstatic --no-input

echo -e "${GREEN}✓ Backend configurado${NC}"
echo -e "${GREEN}  Usuario admin creado: admin / Admin2024!Secure${NC}"
echo ""

# PASO 7: Configurar Frontend
echo -e "${BLUE}🎨 PASO 7: Configurando Frontend React...${NC}"
cd "/var/www/Codigo_pi/front end"

# Instalar dependencias
npm install --silent

# Crear archivo .env
cat > .env <<EOF
# Backend API URL
VITE_API_URL=http://217.160.136.84/api

# Modo de aplicación
VITE_APP_MODE=production

# Mock mode (false para producción)
VITE_MOCK_MODE=false
EOF

# Build para producción
npm run build

echo -e "${GREEN}✓ Frontend buildeado${NC}"
echo ""

# PASO 8: Crear servicio systemd
echo -e "${BLUE}⚙️ PASO 8: Creando servicio systemd...${NC}"
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

systemctl daemon-reload
systemctl enable codigo-pi-backend
systemctl start codigo-pi-backend
sleep 3
echo -e "${GREEN}✓ Servicio systemd creado y activo${NC}"
echo ""

# PASO 9: Configurar Nginx
echo -e "${BLUE}🌐 PASO 9: Configurando Nginx...${NC}"
apt install -y -qq nginx

cat > /etc/nginx/sites-available/codigo-pi <<'EOF'
upstream django_backend {
    server 127.0.0.1:8000 fail_timeout=10s max_fails=3;
}

server {
    listen 80;
    server_name 217.160.136.84;
    
    client_max_body_size 10M;
    
    access_log /var/log/nginx/codigo-pi-access.log;
    error_log /var/log/nginx/codigo-pi-error.log warn;

    location / {
        root /var/www/Codigo_pi/front end/build;
        try_files $uri $uri/ /index.html;
        
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    location /api/ {
        proxy_pass http://django_backend;
        proxy_http_version 1.1;
        
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        proxy_buffering off;
    }

    location /admin/ {
        proxy_pass http://django_backend;
        proxy_http_version 1.1;
        
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /static/ {
        alias /var/www/Codigo_pi/backend/staticfiles/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /media/ {
        alias /var/www/Codigo_pi/backend/media/;
        expires 1y;
        add_header Cache-Control "public";
    }

    location /health {
        access_log off;
        return 200 "OK\n";
        add_header Content-Type text/plain;
    }
}
EOF

ln -sf /etc/nginx/sites-available/codigo-pi /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable nginx
systemctl restart nginx
echo -e "${GREEN}✓ Nginx configurado${NC}"
echo ""

# PASO 10: Configurar Firewall
echo -e "${BLUE}🔥 PASO 10: Configurando Firewall...${NC}"
ufw --force enable
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
echo -e "${GREEN}✓ Firewall configurado${NC}"
echo ""

# PASO 11: Configurar Swap
echo -e "${BLUE}💾 PASO 11: Configurando Swap (1GB)...${NC}"
if [ ! -f /swapfile ]; then
    fallocate -l 1G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    sysctl vm.swappiness=10
    echo 'vm.swappiness=10' >> /etc/sysctl.conf
fi
echo -e "${GREEN}✓ Swap configurado${NC}"
echo ""

# PASO 12: Crear script de actualización
echo -e "${BLUE}🔄 PASO 12: Creando script de actualización...${NC}"
cat > /var/www/Codigo_pi/update.sh <<'UPDATEEOF'
#!/bin/bash
set -e
echo "🚀 Actualizando desde GitHub..."
cd /var/www/Codigo_pi
git stash
git pull origin main

echo "🐍 Actualizando backend..."
cd backend
source venv/bin/activate
pip install -r requirements.txt -q
python manage.py migrate --no-input
python manage.py collectstatic --no-input
systemctl restart codigo-pi-backend

echo "🎨 Actualizando frontend..."
cd "/var/www/Codigo_pi/front end"
npm install --silent
npm run build
systemctl restart nginx

echo "✅ Servicios:"
systemctl is-active --quiet codigo-pi-backend && echo "✅ Backend: OK" || echo "❌ Backend: FAIL"
systemctl is-active --quiet nginx && echo "✅ Nginx: OK" || echo "❌ Nginx: FAIL"
echo "🎉 Actualización completada!"
UPDATEEOF

chmod +x /var/www/Codigo_pi/update.sh
echo -e "${GREEN}✓ Script de actualización creado${NC}"
echo ""

# VERIFICACIÓN FINAL
echo -e "${BLUE}✅ VERIFICACIÓN FINAL${NC}"
echo "=================================="
echo ""

systemctl is-active --quiet codigo-pi-backend && echo -e "${GREEN}✓ Backend: ACTIVO${NC}" || echo -e "${RED}✗ Backend: INACTIVO${NC}"
systemctl is-active --quiet nginx && echo -e "${GREEN}✓ Nginx: ACTIVO${NC}" || echo -e "${RED}✗ Nginx: INACTIVO${NC}"
systemctl is-active --quiet postgresql && echo -e "${GREEN}✓ PostgreSQL: ACTIVO${NC}" || echo -e "${RED}✗ PostgreSQL: INACTIVO${NC}"

echo ""
echo -e "${GREEN}🎉 DESPLIEGUE COMPLETADO EXITOSAMENTE${NC}"
echo "====================================="
echo ""
echo "📊 URLs de acceso:"
echo "  Frontend:  http://217.160.136.84"
echo "  Admin:     http://217.160.136.84/admin/"
echo "  API:       http://217.160.136.84/api/"
echo ""
echo "🔐 Credenciales Admin Django:"
echo "  Usuario:   admin"
echo "  Password:  Admin2024!Secure"
echo ""
echo "📝 Comandos útiles:"
echo "  Ver logs backend:   journalctl -u codigo-pi-backend -f"
echo "  Ver logs nginx:     tail -f /var/log/nginx/codigo-pi-error.log"
echo "  Actualizar:         /var/www/Codigo_pi/update.sh"
echo "  Reiniciar backend:  systemctl restart codigo-pi-backend"
echo "  Reiniciar nginx:    systemctl restart nginx"
echo ""
chmod +x /tmp/deploy_vps.sh
bash /tmp/deploy_vps.sh