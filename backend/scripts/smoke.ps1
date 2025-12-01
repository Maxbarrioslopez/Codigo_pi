Param(
    [string]$BaseUrl = "http://127.0.0.1:8000",
    [string]$Username = "admin",
    [string]$Password = "admin123"
)

$ErrorActionPreference = "Stop"

Write-Host "Authenticating..."
$login = Invoke-WebRequest -Uri "$BaseUrl/api/auth/login/" -Method POST -ContentType "application/json" -Body (ConvertTo-Json @{ username=$Username; password=$Password }) -UseBasicParsing
$token = (ConvertFrom-Json $login.Content).access
$headers = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }

function Test-Endpoint($method, $url, $body) {
    try {
        if ($method -eq 'GET') { $resp = Invoke-WebRequest -Uri $url -Headers $headers -UseBasicParsing }
        elseif ($method -eq 'POST') { $resp = Invoke-WebRequest -Uri $url -Headers $headers -Method POST -ContentType "application/json" -Body $body -UseBasicParsing }
        elseif ($method -eq 'PUT') { $resp = Invoke-WebRequest -Uri $url -Headers $headers -Method PUT -ContentType "application/json" -Body $body -UseBasicParsing }
        else { throw "Unsupported method $method" }
        Write-Host "OK $method $url ($($resp.StatusCode))"
    } catch {
        Write-Host "FAIL $method $url : $($_.Exception.Message)"
    }
}

# Trabajadores
Test-Endpoint 'GET' "$BaseUrl/api/trabajadores" $null
Test-Endpoint 'POST' "$BaseUrl/api/trabajadores" '{"rut":"11111111-1","nombre":"Prueba","seccion":"A","contrato":"Indefinido","sucursal":"Central"}'

# Ciclos
Test-Endpoint 'GET' "$BaseUrl/api/ciclos" $null
Test-Endpoint 'POST' "$BaseUrl/api/ciclos" '{"nombre":"Ciclo Smoke"}'

# Stock
Test-Endpoint 'GET' "$BaseUrl/api/stock/resumen" $null

# Tickets
Test-Endpoint 'POST' "$BaseUrl/api/tickets" '{"rut":"11111111-1","beneficio":"Caja"}'

# Incidencias
Test-Endpoint 'POST' "$BaseUrl/api/incidencias" '{"tipo":"Falla","descripcion":"Prueba"}'

Write-Host "Smoke tests finished."