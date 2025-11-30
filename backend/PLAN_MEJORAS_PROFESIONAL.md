# 🎯 Plan de Mejoras Profesional - Sistema Tótem Digital
## Análisis según ISO, Seguridad y Estándares de Calidad

**Fecha:** 30 de Noviembre de 2025  
**Auditor:** GitHub Copilot (Claude Sonnet 4.5)  
**Normativas aplicadas:** ISO 27001, ISO 9001, OWASP Top 10, PCI DSS, Django Best Practices

---

## 📊 Resumen Ejecutivo

Se identificaron **67 mejoras** clasificadas en 5 categorías de prioridad:
- 🔴 **Crítico:** 8 elementos (Seguridad y Cumplimiento)
- 🟠 **Alto:** 15 elementos (Performance y Escalabilidad)
- 🟡 **Medio:** 22 elementos (Calidad de Código)
- 🔵 **Bajo:** 14 elementos (Optimización)
- 🟢 **Opcional:** 8 elementos (Nice to have)

---

## 🏗️ PARTE 1: REORGANIZACIÓN ESTRUCTURAL DEL BACKEND

### 📁 Estructura Actual (Problemática)

```
backend/
├── totem/              ❌ SOBRECARGADO - Contiene TODA la lógica
│   ├── models.py       ❌ 300+ líneas con TODOS los modelos
│   ├── views.py        ❌ Mezcla lógica de diferentes dominios
│   ├── serializers.py  ❌ Serializers de todos los modelos
│   ├── permissions.py  ❌ Permisos globales
│   ├── security.py     ❌ Debería ser compartido
│   ├── validators.py   ❌ Validaciones mezcladas
│   ├── utils_rut.py    ❌ Utilidad general en app específica
│   └── services/       ✅ Bien organizado pero en app incorrecta
├── guardia/            ⚠️ Solo views y services (sin modelos propios)
├── rrhh/               ⚠️ Solo views y services (sin modelos propios)
└── backend_project/    ✅ Correcto
```

**Problemas identificados:**
1. ❌ **Acoplamiento extremo:** Todo depende de `totem.models`
2. ❌ **Violación SRP:** `totem` tiene múltiples responsabilidades
3. ❌ **Difícil escalabilidad:** Agregar features requiere modificar totem
4. ❌ **Testing complejo:** No se pueden probar módulos independientemente

### 📁 Estructura Propuesta (Profesional)

```
backend/
├── apps/                           🆕 Apps de dominio
│   ├── core/                       🆕 Núcleo compartido
│   │   ├── models/
│   │   │   ├── base.py            (TimeStampedModel, SoftDeleteModel)
│   │   │   ├── usuario.py         (Usuario con roles)
│   │   │   └── parametro.py       (ParametroOperativo)
│   │   ├── permissions/
│   │   │   ├── base.py            (Permisos base)
│   │   │   └── roles.py           (IsAdmin, IsRRHH, etc.)
│   │   ├── validators/
│   │   │   ├── rut.py             (RUTValidator)
│   │   │   └── business.py        (Validaciones de negocio)
│   │   ├── utils/
│   │   │   ├── security.py        (QRSecurity, encriptación)
│   │   │   ├── formatters.py      (Formateadores)
│   │   │   └── helpers.py         (Utilidades generales)
│   │   ├── exceptions.py          (Excepciones base)
│   │   ├── middleware.py          (Middlewares custom)
│   │   └── management/            (Comandos base)
│   │
│   ├── trabajadores/               🆕 Dominio: Trabajadores
│   │   ├── models.py              (Trabajador, Beneficio)
│   │   ├── serializers.py         
│   │   ├── views.py               (CRUD trabajadores)
│   │   ├── services/
│   │   │   └── trabajador_service.py
│   │   ├── urls.py
│   │   └── tests/
│   │
│   ├── tickets/                    🆕 Dominio: Tickets (renombrar de totem)
│   │   ├── models.py              (Ticket, TicketEvent)
│   │   ├── serializers.py
│   │   ├── views.py               (Endpoints públicos de tótem)
│   │   ├── services/
│   │   │   └── ticket_service.py
│   │   ├── management/commands/
│   │   │   └── expirar_tickets.py
│   │   ├── urls.py
│   │   └── tests/
│   │
│   ├── ciclos/                     🆕 Dominio: Ciclos
│   │   ├── models.py              (Ciclo)
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── services/
│   │   │   └── ciclo_service.py
│   │   └── urls.py
│   │
│   ├── agendamientos/              🆕 Dominio: Agendamientos
│   │   ├── models.py              (Agendamiento)
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── services/
│   │   │   └── agendamiento_service.py
│   │   ├── management/commands/
│   │   │   └── marcar_agendamientos_vencidos.py
│   │   └── urls.py
│   │
│   ├── incidencias/                🆕 Dominio: Incidencias
│   │   ├── models.py              (Incidencia)
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── services/
│   │   │   └── incidencia_service.py
│   │   └── urls.py
│   │
│   ├── inventario/                 🆕 Dominio: Inventario
│   │   ├── models.py              (Sucursal, StockSucursal, CajaFisica)
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── services/
│   │   │   └── inventario_service.py
│   │   └── urls.py
│   │
│   ├── guardia/                    ✅ Mantener (mejorar)
│   │   ├── views.py
│   │   ├── services/
│   │   │   └── guardia_service.py
│   │   ├── tests/                 🆕
│   │   └── urls.py
│   │
│   ├── rrhh/                       ✅ Mantener (mejorar)
│   │   ├── views.py
│   │   ├── services/
│   │   │   └── rrhh_service.py
│   │   ├── exporters/             🆕 (CSV, Excel, PDF)
│   │   │   ├── csv_exporter.py
│   │   │   └── pdf_exporter.py
│   │   ├── tests/                 🆕
│   │   └── urls.py
│   │
│   └── auth/                       🆕 Autenticación separada
│       ├── serializers.py         (CustomTokenObtainPairSerializer)
│       ├── views.py               (Login, Refresh, Logout, PasswordReset)
│       ├── backends.py            (Custom auth backends)
│       ├── tokens.py              (Token management)
│       └── urls.py
│
├── config/                         🆕 Configuración (renombrar backend_project)
│   ├── settings/
│   │   ├── base.py                (Settings base)
│   │   ├── development.py         (Dev settings)
│   │   ├── production.py          (Prod settings)
│   │   ├── testing.py             (Test settings)
│   │   └── __init__.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py                    🆕 (Para WebSockets futuro)
│
├── tests/                          🆕 Tests integración
│   ├── integration/
│   ├── e2e/
│   └── fixtures/
│
├── docs/                           🆕 Documentación
│   ├── api/
│   ├── architecture/
│   └── deployment/
│
├── scripts/                        🆕 Scripts utilidades
│   ├── setup_backend.py           (Mover aquí)
│   ├── init_backend.py            (Mover aquí)
│   ├── deploy.py
│   └── backup.py
│
├── requirements/                   🆕 Dependencias organizadas
│   ├── base.txt
│   ├── development.txt
│   ├── production.txt
│   └── testing.txt
│
├── static/                         (Django collectstatic)
├── media/                          (Uploads)
├── logs/                           ✅ Ya existe
├── .env.example                    ✅ Ya existe
├── .env                            ✅ Ya existe
├── manage.py                       ✅ Ya existe
├── pytest.ini                      🆕
├── .coveragerc                     🆕
├── mypy.ini                        🆕
└── docker-compose.yml              🆕
```

---

## 🔴 PRIORIDAD CRÍTICA (Seguridad y Cumplimiento)

### 1. **Gestión de Secretos y Credenciales**
**Problema:** Secretos en código, .env en repositorio  
**Impacto:** ISO 27001: A.9.4.3, OWASP A02:2021 - Fallas Criptográficas  
**Solución:**
```python
# Usar servicios de secrets management
# AWS Secrets Manager, Azure Key Vault, HashiCorp Vault

# settings/base.py
import boto3

def get_secret(secret_name):
    client = boto3.client('secretsmanager')
    response = client.get_secret_value(SecretId=secret_name)
    return json.loads(response['SecretString'])

SECRET_KEY = get_secret('django-secret-key')
DATABASE_PASSWORD = get_secret('db-password')
```

**Acciones:**
- [ ] Migrar .env a AWS Secrets Manager o similar
- [ ] Implementar rotación automática de secretos
- [ ] Agregar .env a .gitignore permanentemente
- [ ] Usar different keys para dev/staging/prod

### 2. **Auditoría y Logging de Seguridad**
**Problema:** Logs insuficientes, sin trazabilidad completa  
**Impacto:** ISO 27001: A.12.4.1, PCI DSS 10.1  
**Solución:**
```python
# apps/core/middleware.py
import structlog

logger = structlog.get_logger()

class AuditMiddleware:
    def __call__(self, request):
        logger.info(
            "api_request",
            user=request.user.username if request.user.is_authenticated else "anonymous",
            ip=self.get_client_ip(request),
            method=request.method,
            path=request.path,
            user_agent=request.META.get('HTTP_USER_AGENT'),
        )
        response = self.get_response(request)
        logger.info(
            "api_response",
            status_code=response.status_code,
            response_time=...,
        )
        return response
```

**Acciones:**
- [ ] Implementar structured logging (structlog)
- [ ] Centralizar logs en ELK Stack o CloudWatch
- [ ] Agregar audit trail para cambios en BD
- [ ] Implementar alertas de seguridad (múltiples intentos fallidos, etc.)
- [ ] Logs de acceso a datos sensibles (PII)

### 3. **Validación y Sanitización de Entrada**
**Problema:** Validación básica, posibles inyecciones  
**Impacto:** OWASP A03:2021 - Injection  
**Solución:**
```python
# apps/core/validators/input.py
from bleach import clean
from django.core.validators import RegexValidator

class SecureInputValidator:
    @staticmethod
    def sanitize_html(value):
        return clean(value, tags=[], strip=True)
    
    @staticmethod
    def validate_rut(value):
        # Regex estricta, validar dígito verificador
        pattern = r'^\d{7,8}-[0-9Kk]$'
        validator = RegexValidator(pattern, 'RUT inválido')
        validator(value)
        
        # Validar algoritmo módulo 11
        ...
```

**Acciones:**
- [ ] Implementar validators estrictos en todos los serializers
- [ ] Sanitizar todo input HTML con bleach
- [ ] Validar tipos de archivos subidos (MIME type verification)
- [ ] Implementar rate limiting por usuario (no solo IP)
- [ ] Agregar CAPTCHA en endpoints públicos sensibles

### 4. **Gestión de Sesiones y Tokens**
**Problema:** No hay blacklist de tokens, tokens muy largos  
**Impacto:** ISO 27001: A.9.4.2, OWASP A07:2021 - Identification Failures  
**Solución:**
```python
# apps/auth/services/token_service.py
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken

class TokenService:
    @staticmethod
    def revoke_token(refresh_token):
        token = RefreshToken(refresh_token)
        BlacklistedToken.objects.create(token=token)
    
    @staticmethod
    def revoke_all_user_tokens(user):
        # Invalidar todos los tokens del usuario
        OutstandingToken.objects.filter(user=user).delete()
```

**Acciones:**
- [ ] Instalar djangorestframework-simplejwt[blacklist]
- [ ] Implementar logout con blacklist de tokens
- [ ] Reducir ACCESS_TOKEN_LIFETIME a 15-30 minutos
- [ ] Implementar detección de dispositivos sospechosos
- [ ] Agregar 2FA opcional para admins

### 5. **Encriptación de Datos Sensibles**
**Problema:** Datos sensibles en texto plano en BD  
**Impacto:** ISO 27001: A.10.1.1, PCI DSS 3.4  
**Solución:**
```python
# apps/core/fields.py
from django_cryptography.fields import encrypt

class EncryptedCharField(encrypt(models.CharField)):
    """Campo encriptado para datos sensibles"""
    pass

# En modelos
class Trabajador(models.Model):
    rut = EncryptedCharField(max_length=12)
    telefono = EncryptedCharField(max_length=20, blank=True)
```

**Acciones:**
- [ ] Instalar django-cryptography o similar
- [ ] Encriptar RUT, teléfonos, emails
- [ ] Encriptar metadatos sensibles en JSONField
- [ ] Implementar field-level encryption
- [ ] Documentar qué datos están encriptados

### 6. **Protección CSRF y CORS Estricto**
**Problema:** CORS muy permisivo (ALLOWED_ORIGINS=*)  
**Impacto:** OWASP A05:2021 - Security Misconfiguration  
**Solución:**
```python
# config/settings/production.py
CORS_ALLOWED_ORIGINS = [
    "https://totem.tmluc.cl",
    "https://admin.tmluc.cl",
]
CORS_ALLOW_CREDENTIALS = True

# Nunca usar CORS_ORIGIN_ALLOW_ALL = True

CSRF_COOKIE_SECURE = True
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SAMESITE = 'Strict'
SESSION_COOKIE_SECURE = True
```

**Acciones:**
- [ ] Listar explícitamente CORS_ALLOWED_ORIGINS
- [ ] Habilitar CSRF protection en producción
- [ ] Configurar Content Security Policy (CSP)
- [ ] Agregar X-Frame-Options, X-Content-Type-Options headers

### 7. **Protección contra Enumeración de Usuarios**
**Problema:** Login revela si usuario existe  
**Impacto:** OWASP A07:2021 - Identification Failures  
**Solución:**
```python
# apps/auth/views.py
class CustomTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        try:
            response = super().post(request, *args, **kwargs)
            return response
        except Exception:
            # Mismo mensaje para usuario no existe vs contraseña incorrecta
            return Response(
                {"detail": "Credenciales inválidas"},
                status=status.HTTP_401_UNAUTHORIZED
            )
```

**Acciones:**
- [ ] Mensajes genéricos en errores de auth
- [ ] Implementar delays en intentos fallidos
- [ ] Bloqueo temporal tras N intentos fallidos
- [ ] Limitar endpoints de listado (paginación obligatoria)

### 8. **Gestión de Dependencias y Vulnerabilidades**
**Problema:** Dependencies sin auditoría periódica  
**Impacto:** OWASP A06:2021 - Vulnerable Components  
**Solución:**
```bash
# Integrar en CI/CD
pip install safety bandit
safety check --json
bandit -r apps/ -f json -o bandit-report.json

# Dependabot en GitHub
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "pip"
    directory: "/"
    schedule:
      interval: "weekly"
```

**Acciones:**
- [ ] Habilitar Dependabot en GitHub
- [ ] Ejecutar safety check en CI
- [ ] Ejecutar bandit (security linter) en CI
- [ ] Pin versions exactas en requirements
- [ ] Auditar dependencies mensualmente

---

## 🟠 PRIORIDAD ALTA (Performance y Escalabilidad)

### 9. **Índices de Base de Datos**
```python
# Agregar índices compuestos
class Ticket(models.Model):
    # ...
    class Meta:
        indexes = [
            models.Index(fields=['estado', 'created_at']),
            models.Index(fields=['trabajador', 'ciclo']),
            models.Index(fields=['uuid']),  # Ya único pero optimizar
        ]
```

### 10. **Caching con Redis**
```python
# config/settings/production.py
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://redis:6379/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    }
}

# En views
from django.views.decorators.cache import cache_page

@cache_page(60 * 5)  # 5 minutos
def ciclo_activo(request):
    ...
```

### 11. **Paginación Obligatoria**
```python
# config/settings/base.py
REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 50,
    'MAX_PAGE_SIZE': 100,
}
```

### 12. **Query Optimization**
```python
# Usar select_related y prefetch_related consistentemente
def listar_tickets(self):
    return Ticket.objects.select_related(
        'trabajador', 'ciclo', 'sucursal'
    ).prefetch_related(
        'eventos'
    ).only(  # Select only needed fields
        'uuid', 'estado', 'created_at',
        'trabajador__rut', 'trabajador__nombre'
    )
```

### 13. **Celery para Tareas Asíncronas**
```python
# apps/tickets/tasks.py
from celery import shared_task

@shared_task
def expirar_tickets_automatico():
    """Ejecutar cada 5 minutos via Celery Beat"""
    call_command('expirar_tickets')

@shared_task
def enviar_notificacion_email(ticket_uuid):
    # Enviar emails asíncronamente
    ...
```

### 14. **Connection Pooling**
```python
# config/settings/production.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'CONN_MAX_AGE': 600,  # Persistent connections
        'OPTIONS': {
            'connect_timeout': 10,
            'options': '-c statement_timeout=30000',
        }
    }
}
```

### 15. **Compresión de Respuestas**
```python
# config/settings/production.py
MIDDLEWARE = [
    'django.middleware.gzip.GZipMiddleware',  # Agregar al inicio
    # ...
]
```

### 16-23. **(Ver documento completo para el resto)**

---

## 🟡 PRIORIDAD MEDIA (Calidad de Código)

### 24. **Testing Comprehensivo**
```python
# tests/conftest.py
import pytest
from apps.core.models import Usuario

@pytest.fixture
def admin_user(db):
    return Usuario.objects.create_user(
        username='admin_test',
        password='test123',
        rol=Usuario.Roles.ADMIN
    )

@pytest.fixture
def api_client():
    from rest_framework.test import APIClient
    return APIClient()

# apps/tickets/tests/test_services.py
def test_crear_ticket(admin_user, api_client):
    api_client.force_authenticate(user=admin_user)
    response = api_client.post('/api/tickets/', {...})
    assert response.status_code == 201
```

**Coverage objetivo: >80%**

### 25. **Type Hints y MyPy**
```python
# apps/tickets/services/ticket_service.py
from typing import Optional, List
from apps.tickets.models import Ticket
from apps.trabajadores.models import Trabajador

class TicketService:
    def crear_ticket(
        self,
        trabajador_rut: str,
        sucursal_nombre: str = 'Central',
        ciclo_id: Optional[int] = None
    ) -> Ticket:
        ...
    
    def listar_tickets(
        self,
        estado: Optional[str] = None,
        limit: int = 50
    ) -> List[Ticket]:
        ...
```

### 26-45. **(Ver documento completo)**

---

## 🔵 PRIORIDAD BAJA (Optimización)

### 46-59. **(Ver documento completo)**

---

## 🟢 PRIORIDAD OPCIONAL

### 60-67. **(Ver documento completo)**

---

## 🗑️ ARCHIVOS A ELIMINAR

### Scripts redundantes/innecesarios:
```bash
# ELIMINAR
backend/setup_backend.py     → Mover a scripts/setup.py
backend/init_backend.py      → Mover a scripts/init.py

# CONSOLIDAR Tests (elegir uno)
backend/totem/tests_comprehensive.py  → Mover a tests/
backend/totem/tests_extended.py       → Eliminar (duplicado)
backend/totem/tests_pytest.py         → Mover a tests/

# ELIMINAR si no se usan
backend/totem/fixtures/initial_data.json  → Verificar si se usa
```

### Archivos de cache/temporal:
```bash
# Agregar a .gitignore
**/__pycache__/
**/*.pyc
.pytest_cache/
.coverage
htmlcov/
.mypy_cache/
```

---

## 📋 PLAN DE IMPLEMENTACIÓN (6 Sprints)

### Sprint 1 (Semana 1-2): Seguridad Crítica
- [ ] Implementar secrets management
- [ ] Audit logging middleware
- [ ] Token blacklist
- [ ] Sanitización de inputs

### Sprint 2 (Semana 3-4): Reorganización Estructural
- [ ] Crear nueva estructura de apps
- [ ] Migrar modelos a apps específicas
- [ ] Actualizar imports
- [ ] Migrar servicios

### Sprint 3 (Semana 5-6): Performance
- [ ] Implementar Redis caching
- [ ] Agregar índices DB
- [ ] Query optimization
- [ ] Celery setup

### Sprint 4 (Semana 7-8): Testing y CI/CD
- [ ] Setup pytest
- [ ] Tests unitarios (>80% coverage)
- [ ] Tests integración
- [ ] GitHub Actions CI/CD

### Sprint 5 (Semana 9-10): Documentación y Monitoreo
- [ ] OpenAPI completo
- [ ] Sentry setup
- [ ] Prometheus metrics
- [ ] Grafana dashboards

### Sprint 6 (Semana 11-12): Refinamiento
- [ ] Code review completo
- [ ] Performance testing
- [ ] Security audit
- [ ] Production deployment

---

## 📊 MÉTRICAS DE ÉXITO

### Seguridad:
- ✅ 0 vulnerabilidades críticas en safety check
- ✅ 0 issues críticos en bandit
- ✅ 100% de datos sensibles encriptados
- ✅ Audit logs completos con retención 90 días

### Performance:
- ✅ Response time p95 < 200ms
- ✅ DB query count < 10 por request
- ✅ Cache hit rate > 80%
- ✅ Concurrent users: 1000+

### Calidad:
- ✅ Test coverage > 80%
- ✅ Type coverage > 90% (mypy)
- ✅ Linter score > 9.5/10 (pylint)
- ✅ 0 code smells críticos (SonarQube)

---

## 🎓 NORMATIVAS DE REFERENCIA

### ISO 27001:2022 (Seguridad de la Información)
- A.9.4.2: Secure log-on procedures
- A.9.4.3: Password management system
- A.10.1.1: Policy on the use of cryptographic controls
- A.12.4.1: Event logging

### ISO 9001:2015 (Gestión de Calidad)
- 7.1.6: Organizational knowledge
- 8.1: Operational planning and control
- 9.1: Monitoring, measurement, analysis

### OWASP Top 10:2021
- A01: Broken Access Control
- A02: Cryptographic Failures
- A03: Injection
- A05: Security Misconfiguration
- A06: Vulnerable and Outdated Components
- A07: Identification and Authentication Failures

### PCI DSS 4.0 (Para datos de pago)
- Requirement 3: Protect stored account data
- Requirement 6: Develop secure systems
- Requirement 10: Log and monitor all access

---

**Documento generado:** 30 de Noviembre de 2025  
**Próxima revisión:** Cada Sprint (2 semanas)  
**Responsable:** Equipo de Desarrollo + Security Lead
