#!/usr/bin/env bash
# Script para ejecutar la batería de tests críticos
# Uso: bash run_tests.sh [test_type] [options]

set -e

PROJECT_NAME="Totem + Guardia System"
COLOR_GREEN='\033[0;32m'
COLOR_BLUE='\033[0;34m'
COLOR_YELLOW='\033[1;33m'
COLOR_RED='\033[0;31m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${COLOR_BLUE}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${COLOR_BLUE}║${NC} $1"
    echo -e "${COLOR_BLUE}╚════════════════════════════════════════════════════════╝${NC}"
}

print_success() {
    echo -e "${COLOR_GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${COLOR_YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${COLOR_RED}❌ $1${NC}"
}

# Verificar si pytest está instalado
check_dependencies() {
    print_header "Verificando dependencias..."
    
    if ! command -v pytest &> /dev/null; then
        print_error "pytest no está instalado"
        echo "Instala con: pip install pytest pytest-django"
        exit 1
    fi
    print_success "pytest instalado"
    
    if ! python -c "import rest_framework" &> /dev/null; then
        print_warning "djangorestframework no encontrado"
        echo "Instala con: pip install djangorestframework"
    fi
    
    if ! python -c "import rest_framework_simplejwt" &> /dev/null; then
        print_warning "djangorestframework-simplejwt no encontrado"
        echo "Instala con: pip install djangorestframework-simplejwt"
    fi
}

# Ejecutar todos los tests
run_all_tests() {
    print_header "Ejecutando TODOS los tests"
    pytest tests/ -v --tb=short
}

# TEST 1: E2E Completo
run_test_1() {
    print_header "TEST 1: E2E Flujo Completo"
    pytest tests/test_guardia_validation.py::TestValidacionGuardiaBasica::test_validacion_exitosa_beneficio_pendiente -vv
}

# TEST 2: Idempotencia
run_test_2() {
    print_header "TEST 2: Idempotencia del Totem"
    pytest tests/test_totem_flow.py::TestTotemIdempotencia -vv
}

# TEST 3: TTL
run_test_3() {
    print_header "TEST 3: TTL Expirado"
    pytest tests/test_guardia_validation.py::TestValidacionTTL -vv
}

# TEST 4: Race Condition
run_test_4() {
    print_header "TEST 4: Race Condition (Concurrencia)"
    pytest tests/test_guardia_validation.py::TestValidacionConcurrencia -vv
}

# TEST 5: Seguridad
run_test_5() {
    print_header "TEST 5: Seguridad HMAC"
    pytest tests/test_guardia_validation.py::TestValidacionSeguridad -vv
}

# Tests Totem
run_totem_tests() {
    print_header "Tests de Totem (Flujo + Idempotencia)"
    pytest tests/test_totem_flow.py -v --tb=short
}

# Tests Guardia
run_guardia_tests() {
    print_header "Tests de Guardia (Validación + Seguridad)"
    pytest tests/test_guardia_validation.py -v --tb=short
}

# Coverage
run_coverage() {
    print_header "Generando Coverage Report"
    pytest tests/ --cov=totem --cov=guardia --cov-report=html --cov-report=term
    print_success "Coverage report generado en htmlcov/index.html"
}

# Mostrar menú
show_menu() {
    echo ""
    echo -e "${COLOR_BLUE}Test Suite: $PROJECT_NAME${NC}"
    echo "═══════════════════════════════════════════════════════"
    echo ""
    echo "Opciones:"
    echo "  all              - Ejecutar TODOS los tests"
    echo "  1                - TEST 1: E2E Completo"
    echo "  2                - TEST 2: Idempotencia"
    echo "  3                - TEST 3: TTL Expirado"
    echo "  4                - TEST 4: Race Condition"
    echo "  5                - TEST 5: Seguridad HMAC"
    echo ""
    echo "  totem            - Tests Totem (1+2)"
    echo "  guardia          - Tests Guardia (3+4+5)"
    echo "  coverage         - Generar coverage report"
    echo ""
    echo "  help             - Mostrar este menú"
    echo ""
}

# Main
if [ $# -eq 0 ]; then
    show_menu
    exit 0
fi

check_dependencies

case "$1" in
    all)
        run_all_tests
        ;;
    1)
        run_test_1
        ;;
    2)
        run_test_2
        ;;
    3)
        run_test_3
        ;;
    4)
        run_test_4
        ;;
    5)
        run_test_5
        ;;
    totem)
        run_totem_tests
        ;;
    guardia)
        run_guardia_tests
        ;;
    coverage)
        run_coverage
        ;;
    help)
        show_menu
        ;;
    *)
        print_error "Opción desconocida: $1"
        show_menu
        exit 1
        ;;
esac

print_success "Tests completados"
