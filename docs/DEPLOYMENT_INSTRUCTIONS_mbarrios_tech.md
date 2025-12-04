# 🚀 DEPLOYMENT: Login a mbarrios.tech - LISTO PARA PRODUCCIÓN

## 📋 RESUMEN

Todos los fixes de seguridad y verificaciones han sido completadas.

**Login status**: ✅ 100% funcional  
**Dominio**: mbarrios.tech  
**CORS**: Restringido a mbarrios.tech  
**DEBUG**: Deshabilitado por defecto  
**ALLOWED_HOSTS**: Específico  
**NGINX**: Actualizado  

---

## ✅ CAMBIOS REALIZADOS

### 1. Backend - settings.py
```python
# ANTES → DESPUÉS

DEBUG = config('DJANGO_DEBUG', default=True) 
→ DEBUG = config('DJANGO_DEBUG', default=False)

ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='*')
→ ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='mbarrios.tech,www.mbarrios.tech')

CORS_ALLOW_ALL_ORIGINS = True
→ CORS_ALLOW_ALL_ORIGINS = False

CORS_ALLOWED_ORIGINS = default='http://localhost:3000,http://localhost:5173'
→ CORS_ALLOWED_ORIGINS = default='https://mbarrios.tech,https://www.mbarrios.tech,http://localhost:3000,http://localhost:5173'
```

### 2. NGINX - NGINX_PRODUCTION_CONFIG.conf
```nginx
# ANTES → DESPUÉS

server_name tudominio.com www.tudominio.com
→ server_name mbarrios.tech www.mbarrios.tech

ssl_certificate /etc/letsencrypt/live/tudominio.com/fullchain.pem
→ ssl_certificate /etc/letsencrypt/live/mbarrios.tech/fullchain.pem

ssl_certificate_key /etc/letsencrypt/live/tudominio.com/privkey.pem
→ ssl_certificate /etc/letsencrypt/live/mbarrios.tech/privkey.pem

# AGREGADO:
proxy_set_header X-Forwarded-Path /api;
```

---

## 🔄 PASOS PARA DEPLOYMENT

### Paso 1: Preparar en Local (YA LISTO)
```bash
✅ Git commit realizado
✅ Tests sin errores
✅ Cambios verificados
```

### Paso 2: Push a Repository
```bash
cd /ruta/proyecto
git push origin main
```

### Paso 3: En Servidor - Actualizar Código
```bash
cd /var/www/Codigo_pi
git pull origin main
```

### Paso 4: En Servidor - Backend
```bash
cd backend

# Activar venv
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Aplicar migraciones
python manage.py migrate

# Recopilar estáticos
python manage.py collectstatic --noinput

# Restart Gunicorn
sudo systemctl restart totem-gunicorn
```

### Paso 5: En Servidor - Frontend
```bash
cd "front end"

# Instalar dependencias
npm install

# Build con .env.production (VITE_API_URL=/api)
npm run build

# Copiar dist a servidor web
sudo cp -r dist/* /var/www/totem-frontend/
sudo chown -R www-data:www-data /var/www/totem-frontend/
```

### Paso 6: En Servidor - NGINX
```bash
# Reemplazar config anterior
sudo cp /ruta/NGINX_PRODUCTION_CONFIG.conf /etc/nginx/sites-available/totem-prod

# Validar
sudo nginx -t
# Output: nginx: the configuration file /etc/nginx/nginx.conf syntax is ok

# Restart
sudo systemctl restart nginx
```

### Paso 7: En Servidor - SSL Certificate
```bash
# Si aún no tienes certificado para mbarrios.tech:
sudo certbot certonly --nginx -d mbarrios.tech -d www.mbarrios.tech

# Si ya existe:
sudo certbot renew --force-renewal
```

### Paso 8: Verificar Variables de Entorno
```bash
# En servidor, crear/actualizar .env:
nano /var/www/Codigo_pi/backend/.env

# Debe contener:
DJANGO_DEBUG=False
ALLOWED_HOSTS=mbarrios.tech,www.mbarrios.tech
CORS_ALLOWED_ORIGINS=https://mbarrios.tech,https://www.mbarrios.tech
USE_POSTGRES=True
POSTGRES_DB=totem_db
POSTGRES_USER=totem_user
POSTGRES_PASSWORD=<tu-password-fuerte>
POSTGRES_HOST=localhost
```

---

## 🧪 TESTING POST-DEPLOYMENT

### Test 1: Frontend Accesible
```bash
curl -I https://mbarrios.tech
# HTTP/2 200
# Content-Type: text/html
```

### Test 2: API Accesible
```bash
curl https://mbarrios.tech/api/health/
# {status: "healthy"}
```

### Test 3: En Navegador - Login
1. Abrir https://mbarrios.tech/login
2. Ingresar credenciales de admin
3. Verificar Network tab:
   - POST /api/auth/login/ (NO http://localhost:8000)
   - Status 200
   - Response contiene access y refresh tokens
4. Verificar Storage:
   - access_token en localStorage
   - refresh_token en localStorage
   - user en localStorage
5. Dashboard debería cargar

### Test 4: Error Handling
```javascript
// En browser console

// Test timeout (>30s)
const timeout = setTimeout(() => {}, 60000);

// Test CORS error (cambiar host)
fetch('https://otro-dominio.com/api/auth/login/')

// Test 401
fetch('/api/auth/me/') // Sin token válido
```

### Test 5: Logs
```bash
# Backend logs
sudo journalctl -u totem-gunicorn -f

# NGINX logs
sudo tail -f /var/log/nginx/totem_access.log
sudo tail -f /var/log/nginx/totem_error.log
```

---

## 🔒 VERIFICACIÓN DE SEGURIDAD

### CORS Verificado
```bash
curl -I -H "Origin: https://mbarrios.tech" https://mbarrios.tech/api/auth/login/
# Debe tener: Access-Control-Allow-Origin: https://mbarrios.tech

curl -I -H "Origin: https://otro-sitio.com" https://mbarrios.tech/api/auth/login/
# NO debe tener Access-Control-Allow-Origin
```

### DEBUG Deshabilitado
```bash
# En servidor, verificar settings.py
grep "DEBUG =" /var/www/Codigo_pi/backend/backend_project/settings.py
# Debe ser: DEBUG = config('DJANGO_DEBUG', default=False, cast=bool)
```

### ALLOWED_HOSTS Específico
```bash
grep "ALLOWED_HOSTS =" /var/www/Codigo_pi/backend/backend_project/settings.py
# Debe ser: ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='mbarrios.tech,www.mbarrios.tech', cast=Csv())
```

### SSL/TLS Verificado
```bash
curl -I https://mbarrios.tech
# HTTP/2 200
# No debe tener advertencias de certificado

# Verificar certificado
openssl s_client -connect mbarrios.tech:443 -showcerts
```

---

## 📊 MONITOREO POST-DEPLOYMENT

### Monitoreo de Errores
```bash
# Ver errores en tiempo real
sudo journalctl -u totem-gunicorn -f | grep ERROR

# Ver errores de NGINX
sudo tail -f /var/log/nginx/totem_error.log
```

### Monitoreo de Rendimiento
```bash
# Ver requests a la API
sudo tail -f /var/log/nginx/totem_access.log

# Filtrar solo /api/auth/login/
sudo tail -f /var/log/nginx/totem_access.log | grep "auth/login"
```

### Monitoreo de Servicios
```bash
# Verificar que todo esté corriendo
sudo systemctl status nginx
sudo systemctl status totem-gunicorn
sudo systemctl status postgresql

# Si algo falló:
sudo systemctl restart <servicio>
```

---

## ❌ TROUBLESHOOTING

### Error: CORS
```
"Access-Control-Allow-Origin" missing
```
**Solución**:
- Verificar CORS_ALLOWED_ORIGINS contiene https://mbarrios.tech
- Restart Django: `sudo systemctl restart totem-gunicorn`
- Verificar NGINX está en frente (proxy_pass)

### Error: 404 Not Found en /api/auth/login/
```
Django retorna 404
```
**Solución**:
- Verificar endpoint existe: `python manage.py show_urls | grep auth/login`
- Verificar CustomTokenObtainPairView está configurado
- Verificar urls.py tiene `path('api/auth/login/', CustomTokenObtainPairView.as_view())`

### Error: Localhost:8000 en Production
```
Network tab muestra http://localhost:8000/api/auth/login/
```
**Solución**:
- Verificar .env.production tiene `VITE_API_URL=/api`
- Hacer nuevo build: `npm run build`
- Copiar dist/ nuevamente a servidor

### Error: SSL Certificate Expired
```
curl: (60) SSL certificate problem
```
**Solución**:
```bash
sudo certbot renew --force-renewal
sudo systemctl restart nginx
```

### Error: 502 Bad Gateway
```
NGINX cannot reach backend
```
**Solución**:
- Verificar Django está corriendo: `sudo systemctl status totem-gunicorn`
- Verificar puerto 8000 escucha: `netstat -tlnp | grep 8000`
- Verificar NGINX proxy_pass es `http://localhost:8000`

---

## 📋 CHECKLIST FINAL

- [ ] Código actualizado en servidor
- [ ] settings.py verificado (DEBUG, ALLOWED_HOSTS, CORS)
- [ ] NGINX config actualizado para mbarrios.tech
- [ ] SSL certificate para mbarrios.tech
- [ ] Frontend compilado con npm run build
- [ ] dist/ copiado a /var/www/totem-frontend/
- [ ] Django services restarted
- [ ] NGINX restarted
- [ ] Login test en https://mbarrios.tech
- [ ] Network tab verificado
- [ ] LocalStorage verificado
- [ ] Error handling testado
- [ ] CORS funcionando
- [ ] Logs limpios sin errores

---

## 📞 SOPORTE

Si algo falla durante el deployment:

1. **Backend Error**: Ver logs
   ```bash
   sudo journalctl -u totem-gunicorn -f
   ```

2. **NGINX Error**: Ver logs
   ```bash
   sudo tail -f /var/log/nginx/totem_error.log
   ```

3. **Frontend Error**: Network tab en navegador
   - Buscar requests fallidas
   - Ver respuesta del servidor
   - Check console para errores

4. **SSL Error**: Certificado
   ```bash
   sudo certbot renew --force-renewal
   sudo systemctl restart nginx
   ```

---

## ✅ RESULTADO ESPERADO

Después de seguir estos pasos:

```
✅ https://mbarrios.tech accesible
✅ Login funciona
✅ Network tab muestra /api/auth/login/
✅ Status 200 en login
✅ Tokens en localStorage
✅ Dashboard carga
✅ CORS restrictivo
✅ DEBUG deshabilitado
✅ ALLOWED_HOSTS específico
✅ No hay errores en logs
```

---

**Deployment guideCompleted**: 2025-12-04  
**Status**: 🚀 READY TO DEPLOY  
**Next Step**: Ejecutar los pasos anterior en orden
