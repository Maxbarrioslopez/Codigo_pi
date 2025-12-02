# Actualización del Servidor a Nueva Versión

## 📋 Requisitos Previos
- Acceso SSH al servidor VPS (usuario: root o con sudo)
- Git instalado en el servidor
- Node.js 20+ y npm instalados
- Python 3.10+ y pip instalados
- PostgreSQL configurado

## 🚀 Pasos de Actualización (Paso a Paso)

### Paso 1: Conectarse al Servidor
```bash
ssh root@217.160.136.84
# O con tu usuario si no es root:
# ssh usuario@217.160.136.84
```

### Paso 2: Navegar al Directorio del Proyecto
```bash
cd /opt/Codigo_pi
# O donde esté alojado tu proyecto
```

### Paso 3: Detener los Servicios Actuales
```bash
# Detener Gunicorn (backend)
sudo systemctl stop tmluc-backend

# Detener Node.js/Frontend (si está como servicio)
sudo systemctl stop tmluc-frontend
# O si está corriendo en tmux/screen:
# tmux kill-session -t frontend
```

### Paso 4: Actualizar el Código desde GitHub
```bash
git pull origin main
```

### Paso 5: Actualizar Backend
```bash
cd backend

# Actualizar dependencias de Python
pip install -r requirements.txt

# Hacer migraciones de base de datos (si hay cambios)
python manage.py migrate

# Recolectar archivos estáticos
python manage.py collectstatic --noinput

# Reiniciar Gunicorn
sudo systemctl restart tmluc-backend

# Verificar que está corriendo
sudo systemctl status tmluc-backend
```

### Paso 6: Actualizar Frontend
```bash
cd ../front\ end

# Instalar dependencias
npm install

# Compilar para producción
npm run build

# Si usas un servicio systemd, reiniciar:
sudo systemctl restart tmluc-frontend

# O si está en Nginx, solo verifica que apunte a la carpeta build
# La carpeta build/ ya está en su lugar
```

### Paso 7: Reiniciar Nginx (si aplica)
```bash
sudo systemctl restart nginx

# Verificar que Nginx está corriendo
sudo systemctl status nginx
```

### Paso 8: Verificar que Todo Funciona
```bash
# Backend (debe retornar 200 con JSON)
curl http://localhost:8000/api/health

# Frontend (debe servir index.html)
curl http://217.160.136.84 -I
```

### Paso 9: Ver Logs (si hay problemas)
```bash
# Logs de Gunicorn
sudo journalctl -u tmluc-backend -f

# Logs de Nginx
sudo tail -f /var/log/nginx/error.log
```

---

## 👥 Cargar Usuarios de Test

### Opción A: Desde el Servidor (Recomendado)
```bash
cd /opt/Codigo_pi/backend

# Ejecutar script de test data
python create_test_data.py
```

**Resultado esperado:**
```
✅ Trabajador creado: Maximiliano Barrios (RUT: 21037970-3)
✅ Trabajador creado: Pablo Larrondo (RUT: 16741794-9)
✅ Stock creado en 3 sucursales
✅ Ciclo activo creado
```

### Opción B: Desde Django Admin (Manual)
```bash
# Crear superusuario si no existe
python manage.py createsuperuser

# Iniciar servidor
python manage.py runserver
```

Luego accede a: `http://217.160.136.84/admin`
- Usuario: tu_usuario_admin
- Contraseña: tu_contraseña

**Crear trabajadores manualmente:**
1. Ir a **Totem > Trabajador**
2. Click en **Agregar Trabajador**
3. Rellenar:
   - **RUT**: 21037970-3
   - **Nombre**: Maximiliano Barrios
   - **Beneficio disponible**: Copiar JSON:
   ```json
   {
     "disponible": true,
     "tipo": "INDEFINIDO",
     "items": [
       {
         "codigo": "ALIM001",
         "nombre": "Caja de Alimentos",
         "descripcion": "Caja mensual con productos básicos",
         "cantidad": 1
       },
       {
         "codigo": "UTIL001",
         "nombre": "Kit Útiles Escolares",
         "descripcion": "Set completo de útiles",
         "cantidad": 1
       },
       {
         "codigo": "ROPA001",
         "nombre": "Voucher Ropa",
         "descripcion": "Cupón de vestimenta",
         "cantidad": 1
       }
     ]
   }
   ```
4. **Guardar**

Repetir para:
- **RUT**: 16741794-9
- **Nombre**: Pablo Larrondo
- **Mismo beneficio**

### Opción C: Importar desde CSV (Si existe archivo)
```bash
# Si tienes archivo nómina.csv en backend/
python manage.py shell

# Dentro del shell:
from totem.models import Trabajador
import csv

with open('nomina.csv', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        Trabajador.objects.create(
            rut=row['RUT'],
            nombre=row['NOMBRE'],
            beneficio_disponible={
                "disponible": True,
                "tipo": "INDEFINIDO",
                "items": [...]
            }
        )
```

---

## 🔍 Verificar Que Los Usuarios Fueron Cargados

### Desde el Servidor
```bash
cd /opt/Codigo_pi/backend
python manage.py shell

# En el shell de Django:
from totem.models import Trabajador

# Ver todos los trabajadores
Trabajador.objects.all().values('rut', 'nombre')

# Ver uno específico
Trabajador.objects.get(rut='21037970-3')

# Salir del shell
exit()
```

### Desde la API
```bash
curl http://217.160.136.84/api/trabajadores/21037970-3/
```

Debe retornar JSON con los datos del trabajador.

---

## 🧪 Probar el Totem con Usuarios de Test

1. Abre navegador en: `http://217.160.136.84`
2. Debería mostrar el **Totem de Autoservicio**
3. Escanea el carnet o ingresa RUT: **21037970-3**
4. Verifica que aparecen los 3 beneficios
5. Prueba con el otro usuario: **16741794-9**

---

## ⚠️ Troubleshooting

### Backend no inicia
```bash
# Ver logs detallados
sudo journalctl -u tmluc-backend -n 50

# Reintentar manualmente
cd /opt/Codigo_pi/backend
gunicorn backend_project.wsgi:application --bind 0.0.0.0:8000
```

### Frontend no carga
```bash
# Verificar que build existe
ls -la /opt/Codigo_pi/front\ end/build/

# Si no existe, compilar
cd /opt/Codigo_pi/front\ end
npm run build

# Verificar permisos
sudo chown -R www-data:www-data /opt/Codigo_pi/front\ end/build/
```

### Base de datos sin cambios
```bash
# Ver si hay migraciones pendientes
python manage.py showmigrations

# Aplicar todas
python manage.py migrate
```

---

## 📞 Soporte
Si tienes problemas, verifica:
1. ✅ Git pull completó sin errores
2. ✅ Dependencias instaladas (pip install, npm install)
3. ✅ Migraciones aplicadas
4. ✅ Servicios reiniciados
5. ✅ Puertos abiertos (8000, 80/443)
