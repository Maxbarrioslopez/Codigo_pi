# 🚀 Guía de Despliegue en Producción - Tótem Digital

## ⚠️ Error de Credenciales - Solución Rápida

Si recibes un error de credenciales al iniciar en producción, sigue estos pasos:

### Paso 1: Generar Claves Secretas

```bash
cd backend
python generar_secrets.py
```

Este comando generará:
- ✅ Archivo `.env.generated` con todas las claves necesarias
- ✅ Claves únicas y seguras para Django, JWT, QR y PostgreSQL

### Paso 2: Configurar Variables de Entorno

```bash
# Opción A: Renombrar el archivo generado
mv .env.generated .env

# Opción B: Copiar desde el template
cp .env.production .env
```

### Paso 3: Editar Configuración

Abre el archivo `.env` y ajusta:

```bash
# 1. Dominios permitidos (reemplaza con tus dominios reales)
ALLOWED_HOSTS=tu-servidor.com,www.tu-servidor.com,IP-SERVIDOR

# 2. URLs de frontend permitidas
CORS_ALLOWED_ORIGINS=https://tu-frontend.com,https://www.tu-frontend.com

# 3. Credenciales de PostgreSQL (si usas una base de datos externa)
POSTGRES_HOST=tu-servidor-db.com
POSTGRES_DB=nombre-base-datos
POSTGRES_USER=usuario-db
POSTGRES_PASSWORD=password-generada-o-la-tuya

# 4. Configuración de Email (opcional pero recomendado)
EMAIL_HOST=smtp.tu-proveedor.com
EMAIL_HOST_USER=tu-email@dominio.com
EMAIL_HOST_PASSWORD=tu-password
```

### Paso 4: Validar Configuración

```bash
python validar_credenciales.py
```

Este script verificará:
- ✅ Todas las variables de entorno requeridas
- ✅ Conexión a PostgreSQL
- ✅ Conexión a Redis (si está configurado)
- ✅ Estado de migraciones
- ✅ Archivos de configuración

### Paso 5: Preparar Base de Datos

```bash
# Aplicar migraciones
python manage.py migrate

# Crear superusuario
python manage.py createsuperuser

# Recopilar archivos estáticos
python manage.py collectstatic --noinput
```

### Paso 6: Iniciar en Producción

```bash
# Opción A: Usando Gunicorn (recomendado)
gunicorn backend_project.wsgi:application --bind 0.0.0.0:8000 --workers 4

# Opción B: Con servidor de desarrollo (solo para pruebas)
python manage.py runserver 0.0.0.0:8000
```

---

## 📋 Checklist de Producción

### Requisitos del Sistema

- [ ] **PostgreSQL 12+** instalado y corriendo
- [ ] **Redis** instalado (opcional pero recomendado)
- [ ] **Python 3.10+** instalado
- [ ] **Nginx/Apache** configurado como reverse proxy
- [ ] **SSL/TLS** certificado instalado (Let's Encrypt recomendado)

### Variables de Entorno Críticas

```bash
# OBLIGATORIAS
✅ DJANGO_SECRET_KEY          # Clave secreta única
✅ ALLOWED_HOSTS              # Dominios permitidos
✅ POSTGRES_DB                # Nombre base de datos
✅ POSTGRES_USER              # Usuario PostgreSQL
✅ POSTGRES_PASSWORD          # Password PostgreSQL
✅ POSTGRES_HOST              # Host PostgreSQL
✅ CORS_ALLOWED_ORIGINS       # URLs frontend permitidas

# RECOMENDADAS
⚠️ JWT_SECRET_KEY             # Para JWT (si no se usa DJANGO_SECRET_KEY)
⚠️ REDIS_URL                  # Para cache y Celery
⚠️ EMAIL_HOST                 # Para notificaciones
⚠️ SENTRY_DSN                 # Para tracking de errores

# OPCIONALES
📌 CELERY_BROKER_URL          # Para tareas async
📌 QR_HMAC_SECRET             # Para firma de QR
📌 ADMIN_URL                  # URL personalizada admin
```

---

## 🔧 Solución de Problemas Comunes

### Error: "DJANGO_SECRET_KEY not found"

```bash
# Solución:
python generar_secrets.py
mv .env.generated .env
```

### Error: "could not connect to server: Connection refused"

```bash
# Problema: PostgreSQL no está corriendo o las credenciales son incorrectas

# Verificar PostgreSQL:
sudo systemctl status postgresql

# Iniciar PostgreSQL:
sudo systemctl start postgresql

# Verificar credenciales en .env:
POSTGRES_HOST=localhost  # o la IP correcta
POSTGRES_PORT=5432
POSTGRES_USER=usuario_correcto
POSTGRES_PASSWORD=password_correcta
```

### Error: "ALLOWED_HOSTS invalid"

```bash
# Agregar el dominio/IP al .env:
ALLOWED_HOSTS=localhost,127.0.0.1,tu-dominio.com,123.456.789.0
```

### Error: "CORS origin not allowed"

```bash
# Agregar la URL del frontend al .env:
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://tu-frontend.com
```

---

## 🐳 Despliegue con Docker (Alternativa)

Si prefieres usar Docker:

```bash
# Crear archivo docker-compose.yml
version: '3.8'

services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: totem_production
      POSTGRES_USER: totem_user
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes

  web:
    build: .
    command: gunicorn backend_project.wsgi:application --bind 0.0.0.0:8000
    volumes:
      - ./backend:/app
      - static_volume:/app/staticfiles
    ports:
      - "8000:8000"
    depends_on:
      - db
      - redis
    env_file:
      - .env

volumes:
  postgres_data:
  static_volume:
```

```bash
# Construir y levantar
docker-compose up -d

# Ver logs
docker-compose logs -f web
```

---

## 📊 Monitoreo y Logs

### Ver logs en tiempo real:

```bash
# Logs Django
tail -f /var/log/totem/django.log

# Logs de seguridad
tail -f /var/log/totem/security.log

# Logs de auditoría
tail -f /var/log/totem/audit.log
```

### Configurar logrotate:

```bash
# /etc/logrotate.d/totem
/var/log/totem/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        systemctl reload totem
    endscript
}
```

---

## 🔒 Seguridad en Producción

### 1. Permisos de Archivos

```bash
# .env debe ser privado
chmod 600 .env

# Logs solo para el usuario web
chmod 640 /var/log/totem/*.log
```

### 2. Firewall

```bash
# Permitir solo puertos necesarios
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

### 3. SSL/TLS con Let's Encrypt

```bash
# Instalar certbot
sudo apt install certbot python3-certbot-nginx

# Obtener certificado
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com

# Renovación automática
sudo certbot renew --dry-run
```

---

## 📞 Soporte

Si sigues teniendo problemas:

1. **Ejecuta el diagnóstico completo:**
   ```bash
   python validar_credenciales.py
   ```

2. **Revisa los logs:**
   ```bash
   tail -f /var/log/totem/django.log
   ```

3. **Verifica servicios:**
   ```bash
   sudo systemctl status postgresql
   sudo systemctl status redis
   sudo systemctl status nginx
   ```

4. **Documentación adicional:**
   - Django Production: https://docs.djangoproject.com/en/5.0/howto/deployment/
   - PostgreSQL: https://www.postgresql.org/docs/
   - Gunicorn: https://docs.gunicorn.org/

---

## 📝 Notas Finales

- ⚠️ **NUNCA** subas el archivo `.env` a Git
- ⚠️ **SIEMPRE** usa `DEBUG=False` en producción
- ⚠️ **CAMBIA** todas las claves secretas por defecto
- ✅ **USA** PostgreSQL en producción (no SQLite)
- ✅ **CONFIGURA** SSL/TLS para HTTPS
- ✅ **IMPLEMENTA** backups automáticos de la base de datos

---

**Última actualización:** Diciembre 2024
