import requests
base = "http://127.0.0.1:8000"
r = requests.post(f"{base}/api/auth/login/", json={"username": "admin", "password": "admin123"})
token = r.json()["access"]
print(f"Token: {token[:50]}...")
headers = {"Authorization": f"Bearer {token}"}

print("\n--- Testing endpoints ---")
endpoints = [
    ("GET", f"{base}/api/debug/user/"),
    ("GET", f"{base}/api/trabajadores"),
    ("GET", f"{base}/api/ciclos"),
    ("GET", f"{base}/api/stock/resumen"),
]
for method, url in endpoints:
    resp = requests.request(method, url, headers=headers)
    print(f"{method} {url} -> {resp.status_code} {resp.reason}")
    if resp.status_code != 200:
        print(f"  Detail: {resp.text[:200]}")
