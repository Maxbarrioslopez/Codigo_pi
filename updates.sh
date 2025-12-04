#!/bin/bash

################################################################################
# SCRIPT DE AUTO-ACTUALIZACIÓN - TÓTEM DIGITAL
################################################################################
# Autor: Sistema Tótem Digital
# Fecha: Diciembre 2024
# Propósito: Automatizar actualizaciones de Nginx, Frontend, Backend y PostgreSQL
# 
# Uso: ./updates.sh [opción]
# Opciones:
#   --full      Actualizar todo (Nginx, Frontend, Backend, Postgres)
#   --frontend  Solo actualizar frontend
#   --backend   Solo actualizar backend
#   --nginx     Solo reiniciar nginx
#   --migrate   Solo ejecutar migraciones Django
#   --backup    Hacer backup antes de actualizar
#   --dry-run   Ver qué se actualizaría sin hacer cambios
#
# Configuración del servidor:
#   IP: 217.160.136.84
#   Dominio: mbarrios.tech
#   Usuario: root (o el usuario que ejecute el script)
################################################################################

set -e  # Salir si hay error

# ============================================================================
# CONFIGURACIÓN
# ============================================================================

SERVIDOR_IP="217.160.136.84"
DOMINIO="mbarrios.tech"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="/var/log/totem/updates_${TIMESTAMP}.log"
BACKUP_DIR="/var/backups/totem"
REPO_DIR="/home/totem/codigo_pi"  # Ajusta según tu ruta real

# Colores para terminal
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# FUNCIONES DE UTILIDAD
# ============================================================================

print_header() {
    echo -e "\n${BLUE}════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}${1}${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ ${1}${NC}"
}

print_error() {
    echo -e "${RED}✗ ${1}${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ ${1}${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ ${1}${NC}"
}

log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

check_root() {
    if [[ $EUID -ne 0 ]]; then
        print_error "Este script debe ejecutarse como root"
        exit 1
    fi
}

check_directories() {
    if [[ ! -d "$REPO_DIR" ]]; then
        print_error "Directorio del repositorio no encontrado: $REPO_DIR"
        exit 1
    fi
    if [[ ! -d "$BACKUP_DIR" ]]; then
        mkdir -p "$BACKUP_DIR"
        print_success "Directorio de backup creado: $BACKUP_DIR"
    fi
}

# ============================================================================
# FUNCIONES DE BACKUP
# ============================================================================

backup_database() {
    print_header "CREANDO BACKUP DE BASE DE DATOS"
    
    local backup_file="$BACKUP_DIR/postgres_backup_${TIMESTAMP}.sql.gz"
    
    if command -v pg_dump &> /dev/null; then
        print_info "Haciendo backup de PostgreSQL..."
        pg_dump -U postgres totem_production | gzip > "$backup_file"
        
        if [[ $? -eq 0 ]]; then
            print_success "Backup de base de datos creado: $backup_file"
            log_message "Backup DB: $backup_file"
        else
            print_error "Error al hacer backup de base de datos"
            return 1
        fi
    else
        print_warning "PostgreSQL no encontrado, saltando backup de DB"
    fi
}

backup_code() {
    print_header "CREANDO BACKUP DE CÓDIGO"
    
    local backup_file="$BACKUP_DIR/codigo_backup_${TIMESTAMP}.tar.gz"
    
    print_info "Haciendo backup del repositorio..."
    tar -czf "$backup_file" -C "$(dirname "$REPO_DIR")" "$(basename "$REPO_DIR")" \
        --exclude='.git' \
        --exclude='__pycache__' \
        --exclude='node_modules' \
        --exclude='.env'
    
    if [[ $? -eq 0 ]]; then
        print_success "Backup de código creado: $backup_file"
        log_message "Backup CODE: $backup_file"
    else
        print_error "Error al hacer backup de código"
        return 1
    fi
}

# ============================================================================
# ACTUALIZACIÓN DE CÓDIGO
# ============================================================================

update_git() {
    print_header "ACTUALIZANDO REPOSITORIO GIT"
    
    cd "$REPO_DIR"
    
    print_info "Obteniendo cambios del repositorio remoto..."
    git fetch origin main
    
    # Verificar si hay cambios
    local local_hash=$(git rev-parse HEAD)
    local remote_hash=$(git rev-parse origin/main)
    
    if [[ "$local_hash" == "$remote_hash" ]]; then
        print_success "El código ya está actualizado"
        return 0
    fi
    
    print_info "Hay cambios nuevos. Actualizando..."
    git pull origin main
    
    if [[ $? -eq 0 ]]; then
        print_success "Repositorio actualizado"
        log_message "Git pull completado"
    else
        print_error "Error al actualizar repositorio"
        return 1
    fi
}

# ============================================================================
# ACTUALIZACIÓN DE BACKEND
# ============================================================================

update_backend() {
    print_header "ACTUALIZANDO BACKEND"
    
    cd "$REPO_DIR/backend"
    
    # 1. Activar entorno virtual
    print_info "Activando entorno virtual..."
    if [[ -f "venv/bin/activate" ]]; then
        source venv/bin/activate
        print_success "Entorno virtual activado"
    else
        print_warning "Entorno virtual no encontrado. Creando..."
        python3 -m venv venv
        source venv/bin/activate
    fi
    
    # 2. Instalar/actualizar dependencias
    print_info "Actualizando dependencias Python..."
    pip install -q --upgrade pip
    if [[ -f "requirements.txt" ]]; then
        pip install -q -r requirements.txt
        print_success "Dependencias instaladas"
    else
        print_warning "requirements.txt no encontrado"
    fi
    
    # 3. Recopilar archivos estáticos
    print_info "Recopilando archivos estáticos..."
    python manage.py collectstatic --noinput --clear 2>&1 | grep -v "^$"
    if [[ $? -eq 0 ]]; then
        print_success "Archivos estáticos recopilados"
    fi
    
    # 4. Ejecutar migraciones
    print_info "Ejecutando migraciones de base de datos..."
    python manage.py migrate --noinput
    if [[ $? -eq 0 ]]; then
        print_success "Migraciones ejecutadas"
        log_message "Django migrations completed"
    else
        print_error "Error al ejecutar migraciones"
        return 1
    fi
    
    # 5. Compilar mensajes
    if command -v msgfmt &> /dev/null; then
        print_info "Compilando mensajes i18n..."
        python manage.py compilemessages
        print_success "Mensajes compilados"
    fi
    
    deactivate
}

restart_backend_service() {
    print_header "REINICIANDO SERVICIO BACKEND"
    
    print_info "Reiniciando Gunicorn/Supervisord..."
    
    if systemctl is-active --quiet gunicorn; then
        systemctl restart gunicorn
        print_success "Gunicorn reiniciado"
        log_message "Gunicorn restarted"
    elif systemctl is-active --quiet supervisord; then
        systemctl restart supervisord
        print_success "Supervisord reiniciado"
        log_message "Supervisord restarted"
    else
        print_warning "No se encontró servicio de backend activo"
        print_info "Opciones: gunicorn, supervisord"
    fi
    
    sleep 2
    
    # Verificar que el servicio esté corriendo
    if systemctl is-active --quiet gunicorn || systemctl is-active --quiet supervisord; then
        print_success "Servicio backend está corriendo"
    else
        print_error "Servicio backend no está corriendo"
        return 1
    fi
}

# ============================================================================
# ACTUALIZACIÓN DE FRONTEND
# ============================================================================

update_frontend() {
    print_header "ACTUALIZANDO FRONTEND"
    
    cd "$REPO_DIR/front end" 2>/dev/null || cd "$REPO_DIR/frontend"
    
    # 1. Instalar dependencias
    print_info "Instalando dependencias Node.js..."
    if command -v npm &> /dev/null; then
        npm install --quiet
        print_success "Dependencias instaladas"
    else
        print_error "npm no encontrado. Instala Node.js"
        return 1
    fi
    
    # 2. Compilar/Build
    print_info "Compilando frontend..."
    npm run build 2>&1 | tail -5
    
    if [[ $? -eq 0 ]]; then
        print_success "Frontend compilado"
        log_message "Frontend build completed"
    else
        print_error "Error al compilar frontend"
        return 1
    fi
    
    # 3. Copiar archivos a Nginx (si está configurado)
    if [[ -d "/var/www/html/totem" ]]; then
        print_info "Copiando archivos compilados a Nginx..."
        cp -r build/* /var/www/html/totem/
        print_success "Archivos copiados a Nginx"
    elif [[ -d "/usr/share/nginx/html" ]]; then
        print_info "Copiando archivos compilados a Nginx..."
        cp -r build/* /usr/share/nginx/html/
        print_success "Archivos copiados a Nginx"
    else
        print_warning "Directorio de Nginx no encontrado"
        print_info "Archivos compilados están en: $(pwd)/build"
    fi
}

# ============================================================================
# ACTUALIZACIÓN DE NGINX
# ============================================================================

update_nginx() {
    print_header "ACTUALIZANDO NGINX"
    
    print_info "Verificando configuración de Nginx..."
    
    if ! command -v nginx &> /dev/null; then
        print_error "Nginx no encontrado. Instalando..."
        apt-get update -qq
        apt-get install -y nginx > /dev/null
    fi
    
    # Verificar sintaxis
    nginx -t > /dev/null 2>&1
    if [[ $? -eq 0 ]]; then
        print_success "Configuración de Nginx es válida"
    else
        print_error "Error en configuración de Nginx"
        nginx -t
        return 1
    fi
    
    # Recargar Nginx
    print_info "Recargando Nginx..."
    systemctl reload nginx
    
    if [[ $? -eq 0 ]]; then
        print_success "Nginx recargado"
        log_message "Nginx reloaded"
    else
        print_error "Error al recargar Nginx"
        return 1
    fi
    
    # Verificar que Nginx esté corriendo
    sleep 1
    if systemctl is-active --quiet nginx; then
        print_success "Nginx está corriendo"
    else
        print_error "Nginx no está corriendo"
        return 1
    fi
}

# ============================================================================
# ACTUALIZACIÓN DE POSTGRESQL
# ============================================================================

update_postgres() {
    print_header "VERIFICANDO POSTGRESQL"
    
    if ! command -v psql &> /dev/null; then
        print_error "PostgreSQL no encontrado"
        return 1
    fi
    
    print_info "PostgreSQL version:"
    psql --version
    
    print_info "Analizando base de datos..."
    sudo -u postgres psql -c "ANALYZE totem_production;" 2>/dev/null
    
    print_info "Vacuum de mantenimiento..."
    sudo -u postgres psql -c "VACUUM ANALYZE totem_production;" 2>/dev/null
    
    if [[ $? -eq 0 ]]; then
        print_success "PostgreSQL mantenimiento completado"
        log_message "PostgreSQL maintenance completed"
    else
        print_warning "Error en PostgreSQL maintenance (no crítico)"
    fi
}

# ============================================================================
# VERIFICACIÓN DE SALUD
# ============================================================================

health_check() {
    print_header "VERIFICACIÓN DE SALUD DEL SISTEMA"
    
    # Check Backend
    print_info "Verificando Backend..."
    if systemctl is-active --quiet gunicorn || systemctl is-active --quiet supervisord; then
        print_success "Backend: ACTIVO"
    else
        print_error "Backend: INACTIVO"
    fi
    
    # Check Nginx
    print_info "Verificando Nginx..."
    if systemctl is-active --quiet nginx; then
        print_success "Nginx: ACTIVO"
    else
        print_error "Nginx: INACTIVO"
    fi
    
    # Check PostgreSQL
    print_info "Verificando PostgreSQL..."
    if sudo -u postgres psql -c "SELECT 1;" > /dev/null 2>&1; then
        print_success "PostgreSQL: ACTIVO"
    else
        print_error "PostgreSQL: INACTIVO"
    fi
    
    # Check HTTP
    print_info "Verificando conectividad HTTP..."
    if curl -sf http://localhost > /dev/null 2>&1; then
        print_success "HTTP: RESPONDIENDO"
    else
        print_warning "HTTP: NO RESPONDE (podría ser normal si hay redirects)"
    fi
    
    # Check HTTPS
    print_info "Verificando conectividad HTTPS..."
    if curl -sf https://$DOMINIO > /dev/null 2>&1; then
        print_success "HTTPS: RESPONDIENDO"
    else
        print_warning "HTTPS: NO RESPONDE"
    fi
}

# ============================================================================
# GENERACIÓN DE REPORTE
# ============================================================================

generate_report() {
    print_header "REPORTE DE ACTUALIZACIÓN"
    
    echo "Servidor: $DOMINIO ($SERVIDOR_IP)"
    echo "Timestamp: $TIMESTAMP"
    echo "Log: $LOG_FILE"
    echo ""
    echo "Cambios realizados:"
    echo "  ✓ Repositorio Git actualizado"
    echo "  ✓ Backend (Django, migraciones, static files)"
    echo "  ✓ Frontend (Node.js, build)"
    echo "  ✓ Nginx (reload)"
    echo "  ✓ PostgreSQL (mantenimiento)"
    echo ""
    echo "Próximas acciones recomendadas:"
    echo "  • Verificar logs: tail -f $LOG_FILE"
    echo "  • Monitorear servicios: systemctl status gunicorn nginx postgresql"
    echo "  • Revisar aplicación en: https://$DOMINIO"
}

# ============================================================================
# OPCIONES DRY-RUN
# ============================================================================

dry_run_mode() {
    print_header "MODO DRY-RUN - VER CAMBIOS SIN APLICARLOS"
    
    cd "$REPO_DIR"
    
    print_info "Cambios pendientes en Git:"
    git fetch origin main
    git log --oneline HEAD..origin/main
    
    print_info "Archivos modificados:"
    git diff --name-only HEAD origin/main
    
    print_info "Tamaño de descarga estimado:"
    git diff --stat HEAD origin/main
}

# ============================================================================
# MENÚ PRINCIPAL
# ============================================================================

show_menu() {
    echo ""
    echo "OPCIONES DE ACTUALIZACIÓN:"
    echo "  1. Actualizar TODO (Nginx, Frontend, Backend, Postgres)"
    echo "  2. Solo Frontend"
    echo "  3. Solo Backend"
    echo "  4. Solo Nginx"
    echo "  5. Solo Migraciones Django"
    echo "  6. Ver qué se actualizaría (dry-run)"
    echo "  7. Hacer backup"
    echo "  8. Verificar salud del sistema"
    echo "  9. Salir"
    echo ""
}

# ============================================================================
# FUNCIÓN PRINCIPAL
# ============================================================================

main() {
    check_root
    check_directories
    
    # Crear archivo de log
    mkdir -p "$(dirname "$LOG_FILE")"
    log_message "===== INICIO ACTUALIZACIÓN ====="
    
    # Procesar argumentos
    case "${1:---full}" in
        --full)
            print_header "ACTUALIZACIÓN COMPLETA DEL SISTEMA"
            log_message "Mode: FULL UPDATE"
            
            backup_database && \
            backup_code && \
            update_git && \
            update_backend && \
            update_frontend && \
            update_nginx && \
            update_postgres && \
            restart_backend_service && \
            health_check && \
            generate_report
            ;;
        
        --frontend)
            print_header "ACTUALIZACIÓN FRONTEND"
            log_message "Mode: FRONTEND ONLY"
            update_git && \
            update_frontend && \
            update_nginx && \
            health_check
            ;;
        
        --backend)
            print_header "ACTUALIZACIÓN BACKEND"
            log_message "Mode: BACKEND ONLY"
            update_git && \
            update_backend && \
            restart_backend_service && \
            health_check
            ;;
        
        --nginx)
            print_header "REINICIO NGINX"
            log_message "Mode: NGINX ONLY"
            update_nginx && \
            health_check
            ;;
        
        --migrate)
            print_header "MIGRACIONES DJANGO"
            log_message "Mode: MIGRATE ONLY"
            cd "$REPO_DIR/backend"
            source venv/bin/activate
            python manage.py migrate --noinput
            deactivate
            health_check
            ;;
        
        --backup)
            print_header "BACKUP"
            log_message "Mode: BACKUP ONLY"
            backup_database && \
            backup_code
            ;;
        
        --dry-run)
            print_header "DRY-RUN"
            log_message "Mode: DRY-RUN"
            dry_run_mode
            ;;
        
        --health)
            print_header "VERIFICACIÓN DE SALUD"
            log_message "Mode: HEALTH CHECK"
            health_check
            ;;
        
        *)
            print_header "SISTEMA DE ACTUALIZACIÓN - TÓTEM DIGITAL"
            print_info "Servidor: $DOMINIO ($SERVIDOR_IP)"
            show_menu
            
            read -p "Selecciona una opción (1-9): " option
            
            case $option in
                1) "$0" --full ;;
                2) "$0" --frontend ;;
                3) "$0" --backend ;;
                4) "$0" --nginx ;;
                5) "$0" --migrate ;;
                6) "$0" --dry-run ;;
                7) "$0" --backup ;;
                8) "$0" --health ;;
                9) print_info "Saliendo..."; exit 0 ;;
                *) print_error "Opción inválida"; exit 1 ;;
            esac
            ;;
    esac
    
    local exit_code=$?
    log_message "===== FIN ACTUALIZACIÓN ===== (Exit code: $exit_code)"
    
    if [[ $exit_code -eq 0 ]]; then
        print_success "\n✓ ACTUALIZACIÓN COMPLETADA EXITOSAMENTE"
    else
        print_error "\n✗ ERRORES DURANTE LA ACTUALIZACIÓN"
        print_info "Revisa el log: $LOG_FILE"
    fi
    
    exit $exit_code
}

# ============================================================================
# EJECUTAR MAIN
# ============================================================================

main "$@"
