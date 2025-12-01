import requests
base = "http://127.0.0.1:8000"
r = requests.post(f"{base}/api/auth/login/", json={"username": "admin", "password": "admin123"})
token = r.json()["access"]
headers = {"Authorization": f"Bearer {token}"}

# Test cycle creation
payload = {"fecha_inicio": "2025-12-01", "fecha_fin": "2026-01-31"}
resp = requests.post(f"{base}/api/ciclos", json=payload, headers=headers)
print(f"Status: {resp.status_code}")
print(f"Headers: {dict(resp.headers)}")
print(f"Body:\n{resp.text}")
