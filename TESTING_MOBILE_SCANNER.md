# 📱 Guía de Testing - Scanner QR Responsive Mobile

## Última Actualización
- **Commit:** `bd14bed` 
- **Cambios:** Camera fallback (environment→user) + responsive design completo
- **Estado:** Listo para testing en dispositivo móvil

---

## ✅ Verificaciones Previas

### 1. Servidor Backend Activo
```powershell
# Terminal 1
cd c:\Users\Maxi Barrios\Documents\Codigo_pi\backend
python manage.py runserver 0.0.0.0:8000
```
✅ Verificar: http://localhost:8000/api/health/

### 2. Servidor Frontend Activo
```powershell
# Terminal 2
cd "c:\Users\Maxi Barrios\Documents\Codigo_pi\front end"
npm run dev
```
✅ Verificar: http://localhost:3000/

---

## 🎯 Testing en Dispositivo Móvil

### Opción A: Mismo Equipo (Desktop)
```
1. Abre http://localhost:3000 en navegador de desktop
2. Abre DevTools (F12)
3. Activa Device Emulation (Ctrl+Shift+M)
4. Selecciona "iPhone 15" o "Pixel 8"
5. F5 para recargar
```

### Opción B: Red Local (Recomendado)
```
1. En tu celular, conecta a la MISMA red WiFi que tu PC
2. En desktop, abre PowerShell:
   ipconfig | findstr "IPv4 Address"
3. En celular, abre navegador y va a:
   http://<TU_IP>:3000
   (ej: http://192.168.1.100:3000)
4. Selecciona "TOTEM" como pantalla principal
```

### Opción C: Exposición Externa (ngrok)
```powershell
# Instalar ngrok (si no lo tienes)
npm install -g ngrok

# Exponer frontend
ngrok http 3000

# Usará URL como: https://xxxx-xx-xx-xx-xx.ngrok.io
# Comparte esta URL en tu celular
```

---

## 🎥 Pasos de Testing - Pantalla Inicial

### 1. **Carga y Renderizado Responsive**
```
✅ PANTALLA MOBILE (portrait):
   ✓ Logo TML: pequeño (w-16 h-16), visible en la parte superior
   ✓ Título: "Escanea tu Cédula de Identidad" - texto completo, legible
   ✓ Instrucción: "Acerca la parte posterior de tu carnet"
   ✓ Video: h-48 (192px height) - ocupa ~50% de pantalla
   ✓ Marco de guía: w-40 h-40 (160×160px) - caja cuadrada centrada
   ✓ Botones: "Validar Beneficio", "Consultar Incidencia", "Reportar Incidencia"
   ✓ Padding: p-3 (12px) - márgenes comprimidos para móvil
   
✅ PANTALLA TABLET (landscape/landscape):
   ✓ Logo TML: mediano (w-24 h-24)
   ✓ Video: h-80 (320px height) - más visible
   ✓ Marco de guía: w-64 h-64 (256×256px) - proporcionalmente más grande
   ✓ Padding: p-6 (24px) - espacios aumentados
   
✅ PANTALLA DESKTOP:
   ✓ Logo TML: grande (w-24 h-24 conservado)
   ✓ Video: h-[500px] - pantalla completa para desktop
   ✓ Marco de guía: w-80 h-80 (320×320px) - marco más grande
   ✓ Padding: p-12 (48px) - espacios generosos
```

### 2. **Activación de Cámara**
```
📷 AL CARGAR LA PÁGINA:
   1. Lee consola DevTools (F12 → Console tab)
   2. Busca logs con emojis: 🎥📷✅
   
   ✅ Logs esperados:
   🎥 Iniciando scanner...
   📷 X cámara(s) disponible(s)
   ✅ Scanner iniciado correctamente
   
❌ SI FALLA:
   1. Busca en consola:
      ❌ Error starting camera: ...
      
   2. Causas posibles:
      a) Permisos no concedidos → Acepta permiso en notificación
      b) No hay cámara → Fallback automático a cámara frontal
      c) HTTPS requerido → Algunos navegadores mobile requieren HTTPS
      
   3. IMPORTANTE: En mobile, el navegador muestra:
      "¿Permitir que [sitio] acceda a tu cámara?"
      → Selecciona "Permitir" o "Allow"
```

### 3. **Fallback de Cámara (Nueva Característica)**
```
🔄 MECANISMO DE FALLBACK:

INTENTO 1: Cámara trasera (environment)
   ✓ Preferida en móviles (típicamente la mejor calidad)
   ✓ Si hay back camera disponible, la usa
   
FALLBACK: Si intento 1 falla
   ✓ Automáticamente cambia a cámara frontal (user)
   ✓ Se muestra en consola:
     📷 Cámara trasera no disponible, usando frontal...
   
✅ RESULTADO: En cualquier tipo de dispositivo:
   - iPhone, Android, iPad con cámara trasera → usa back
   - Laptop/tablet sin back camera → usa front automáticamente
   
📱 PARA VERIFICAR EN CELULAR:
   1. Abre DevTools (F12)
   2. Consola debería mostrar:
      Opción A: No sale "Cámara trasera no disponible" → está usando back ✅
      Opción B: Sale "Cámara trasera no disponible" → está usando front (fallback) ✅
   3. Intenta escanear en ambos casos - debe funcionar
```

### 4. **Prueba de Escaneo - Lógica de Validación**
```
🔍 ACEPTADOS (detendrá el scanner):
   ✅ PDF_417 con RUT extraído
      (Format: PDF_417, rutPattern: 12.345.678-9)
   ✅ QR_CODE con RUT extraído
      
   Ejemplo: Escanear carnet físico chileno → detecta PDF417 + RUT → PARA

🚫 IGNORADOS (continúa escaneando):
   ❌ PDF_417/QR sin RUT válido extraído
      → Log: "⚠️ Carnet detectado pero sin RUT válido"
   ❌ Código de barras no PDF417 (CODE_128, EAN, etc)
      → Log: "⚠️ Ignorando: se espera carnet, formato: ..."
   
📊 LOGS EN CONSOLA (cada scan exitoso):
   ✅ [Scan #42] Código detectado! { formato: "PDF_417", texto: "..." }
   📋 Patrón X (descripción): 12.345.678-9
   🎯 RUT FINAL formateado: 12.345.678-9
   📱 Formato aceptado (carnet): PDF_417
   ✋ Scanner detenido - Carnet capturado exitosamente
```

### 5. **Condiciones Óptimas de Escaneo**
```
🌟 MEJORES CONDICIONES:

ILUMINACIÓN:
   ✓ Luz natural o LED blanca fría (5000K+)
   ✗ Luz naranja/incandescente débil
   ✗ Luz directa muy brillante (reflejos)
   → Recomendación: Lámpara de escritorio cerca

DISTANCIA & POSICIÓN:
   ✓ 10-20 cm del carnet a la cámara
   ✓ Mantener paralelo a la cámara (sin ángulos)
   ✓ Carnet completamente dentro del marco de guía
   
MOVIMIENTO:
   ✓ Mantener la cámara estable (usar trípode si es posible)
   ✗ Mover rápido la cámara
   ✗ Respiración que causa vibración
   
ENFOQUE:
   ✓ Esperar 1-2 segundos a que auto-enfoque se establezca
   ✓ Escuchar sonido de escaneo exitoso (beep)
   ✓ Video debería mostrar la imagen clara del carnet

⏱️ TIMEOUT:
   Si no detecta en 30 segundos:
   1. Presiona X para cerrar cámara
   2. Presiona "Activar Cámara" nuevamente
   3. Reposiciona el carnet
```

---

## 🧪 Scenarios de Testing

### Escenario 1: Testing Básico (5 min)
```
1. Carga página en mobile
2. Verifica que el logo y texto están centrados y responsive
3. Presiona "Activar Cámara" → espera permiso
4. Revisa consola: "✅ Scanner iniciado correctamente"
5. Intenta escanear QR conocido (ej: WiFi QR)
   → Esperado: detecta pero no para (formato no aceptado)
6. Presiona X → cámara cierra
7. Resultado: ✅ Cámara fallback + responsive funcionando
```

### Escenario 2: Testing de Fallback (3 min)
```
1. Abre DevTools (F12) → Console
2. Carga página
3. Escribe en consola:
   navigator.mediaDevices.enumerateDevices()
       .then(d => d.filter(x=>x.kind==='videoinput')
                   .forEach(x=>console.log(x.label)))
4. Verifica cuántas cámaras detecta
5. Revisa logs al activar cámara:
   - Si sale "Cámara trasera no disponible..." → fallback activado ✅
   - Si NO sale nada → usando back camera directamente ✅
6. Ambos casos = éxito
```

### Escenario 3: Testing Carnet Real (10 min)
```
1. Carnet físico chileno a mano
2. Carga página en mobile
3. Enciende luz/lámpara apropiada
4. Presiona "Activar Cámara" + acepta permiso
5. Acerca el carnet a 15cm de la cámara
6. Mantén paralelo al marco de guía
7. Espera 2-3 segundos
   → Debería detectar PDF_417
   → Deberían ver: 🎯 RUT FINAL en consola
   → Deberían oír: sonido de éxito (beep)
   → Video debería cerrar automáticamente
8. Verifica que RUT quedó en el campo de input
9. Presiona "Validar Beneficio"
10. Resultado: ✅ Carnet escaneado y validado correctamente
```

---

## 🔧 Debugging Si Hay Problemas

### Problema 1: "No se pudo acceder a la cámara"
```
Causa: Permisos denegados o cámara no disponible

PASOS:
1. Consola debería mostrar error específico:
   ❌ Error starting camera: NotAllowedError (permisos denegados)
   ❌ Error starting camera: NotFoundError (sin cámara)
   
2. Si es NotAllowedError:
   Desktop:
      a) DevTools → Settings → Permissions → Camera → Allow
      b) Recargar página (F5)
      
   Mobile:
      a) Barra de notificaciones → Busca permiso de cámara
      b) Presiona "Permitir" o "Allow"
      c) Recargar página
      
3. Si es NotFoundError:
   → Dispositivo no tiene cámara
   → No debería ocurrir con el fallback nuevo
   → Si ocurre: revisar navegador (algunos mobile no permiten getUserMedia)
```

### Problema 2: "Cámara abierta pero video en negro"
```
Causa: Cámara abierta pero sin acceso a stream

DEBUG:
1. Consola:
   📷 X cámara(s) disponible(s) → debería listar las cámaras
   
2. Si lista está vacía:
   a) Permisos del sistema operativo denegados
   b) En Android: Settings → Apps → [Navegador] → Permissions → Camera → Allow
   c) En iOS: Settings → [Navegador] → Camera → Allow
   
3. Si lista tiene cámaras pero video negro:
   a) Intenta presionar X y "Activar Cámara" nuevamente
   b) Si persiste: cierra navegador y abre otra vez
   c) Última opción: reinicia el dispositivo
```

### Problema 3: "Escanea pero no detecta el carnet"
```
Causa: Luz, enfoque, distancia o formato incorrecto

CHECKLIST:
1. 🌟 Iluminación:
   ✓ Enciende lámpara de escritorio
   ✓ Posiciona la luz perpendicular (no reflejos)
   ✓ Evita sombras en el carnet
   
2. 📐 Posición:
   ✓ Carnet completamente dentro del marco cuadrado rojo
   ✓ Paralelo a la cámara (no en ángulo)
   ✓ El código de barras visible en el centro
   
3. 📏 Distancia:
   ✓ 10-20 cm es rango óptimo
   ✓ Intenta acercar/alejar gradualmente
   
4. ⏱️ Tiempo:
   ✓ Mantén la posición 2-3 segundos
   ✓ PDF417 puede tardar más que QR simple
   
5. 📱 Enfoque:
   ✓ Pulsa pantalla para forzar auto-enfoque
   ✓ Espera a que la imagen se vuelva clara
   
6. 🎯 Último recurso:
   a) Consola: "⚠️ Ignorando: formato detectado: ..."
      → No es carnet, es otro código de barras
   b) Consola: "⚠️ Carnet detectado pero sin RUT"
      → Es carnet pero imagen mala para extraer RUT
      c) Prueba con mejores condiciones de luz
      d) Si persiste: revisar integridad del carnet
```

### Problema 4: "Responsive no se ve bien en mobile"
```
Causa: Cache del navegador o CSS no actualizado

PASOS:
1. Fuerza recarga sin cache (Ctrl+Shift+R) o (Cmd+Shift+R)
2. Limpia cache del navegador:
   Desktop:
      DevTools → Settings → Storage → Clear site data
   Mobile:
      Chrome: Menu → Settings → Privacy → Clear browsing data
      Safari: Settings → [Nombre app] → Website Data → Edit → Remove all
3. Si aún hay problema:
   a) Verifica que npm run dev está ejecutándose
   b) Terminal debería mostrar: "Vite is running"
   c) Si no: Ctrl+C y npm run dev nuevamente
   
4. Espera a que compile:
   > [1] Vite v6.3.5 running at: http://localhost:3000/
   > [2] READY in XXXms
   
5. Recarga página (F5)
```

---

## 📊 Checklist de Validación

```
✅ FUNCIONALIDADES ESPERADAS:

CÁMARA & SCANNER:
  □ Cámara inicia automáticamente al cargar página
  □ Intenta cámara trasera (environment) primero
  □ Fallback a frontal (user) si no hay trasera
  □ Video se muestra en h-48 (mobile) / h-80 (tablet) / h-[500px] (desktop)
  □ Marco de guía se adapta: w-40→w-64→w-80 según pantalla
  □ Botón X funciona para cerrar cámara
  □ Botón "Activar Cámara" reabre cámara

RESPONSIVIDAD:
  □ Mobile (360-480px): Logo w-16, padding p-3, video h-48
  □ Tablet (768-1024px): Logo w-24, padding p-6, video h-80
  □ Desktop (1200px+): Logo w-24, padding p-12, video h-[500px]
  □ Todos los textos legibles sin scroll horizontal
  □ Botones tienen tamaño táctil (min 44px en mobile)

ESCANEO:
  □ Detecta PDF_417 (carnet chileno)
  □ Detecta QR_CODE
  □ Extrae RUT en formatos: 12.345.678-9, 12345678-9, 123456789
  □ Ignora otros códigos de barras (CODE_128, EAN, etc)
  □ Detiene scanner solo con formato aceptado + RUT válido
  □ Reproduce sonido de éxito (beep) al capturar carnet
  □ RUT queda en campo input para validación

CONSOLA:
  □ Logs detallados con emojis 🎥📷✅
  □ ⚠️ avisos cuando se ignoran códigos no carnet
  □ Muestra número de cámara(s) disponible(s)
  □ ✋ confirma cuando scanner se detiene

UI:
  □ Título centrado y responsive
  □ Instrucciones claras en español
  □ Botones con hover effects
  □ Colores consistentes (rojo #E12019)
  □ Bordes del marco rojo animado
  □ Punto central del marco pulsante
```

---

## 🚀 Pasos Siguientes

Si todo funciona correctamente:

1. **Validación en Producción:**
   ```powershell
   cd backend
   python manage.py migrate
   python create_test_data.py  # Verifica trabajadores
   ```

2. **Deployment:**
   Sigue la guía en `ACTUALIZACION_SERVIDOR.md` para subir a VPS

3. **Testing Final en Servidor:**
   ```
   http://217.160.136.84/totem
   (Una vez que el servidor esté actualizado)
   ```

---

## 📞 Contacto & Soporte

**Si encuentras problemas:**

1. Captura screenshots del error
2. Abre DevTools (F12) → Console
3. Copia los logs con errores
4. Incluye:
   - Dispositivo (iPhone 15 Pro, Samsung Galaxy S24, etc)
   - Navegador y versión
   - URL (localhost:3000 o dirección IP)
   - Pasos que causaron el error

**Última versión:** Commit `bd14bed`

---

## 📝 Notas Técnicas

### Cambios en este Ciclo:
- ✅ Fallback de cámara automático (environment → user)
- ✅ Responsive completo (mobile-first: sm → md → lg)
- ✅ Mantiene todas las validaciones de RUT/carnet
- ✅ Soporte para múltiples idiomas en consola

### Compatibilidad:
- ✅ Chrome/Chromium (Android, Linux, Windows)
- ✅ Firefox (todas las plataformas)
- ✅ Safari (iOS 14.5+, macOS)
- ✅ Edge (basado en Chromium)

### Limitaciones Conocidas:
- ⚠️ HTTPS requerido en algunos navegadores mobile (excepto localhost)
- ⚠️ Algunos dispositivos muy antiguos podrían no tener getUserMedia
- ⚠️ PDF417 en condiciones de luz pobre requiere más tiempo

---

**¡Éxito con el testing! 🎉**
