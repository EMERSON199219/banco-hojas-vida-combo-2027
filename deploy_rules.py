import os
import json
import requests
from pathlib import Path

# Buscar el token de Firebase
config_paths = [
    Path.home() / '.config' / 'firebase' / 'credentials.json',
    Path(os.getenv('APPDATA')) / 'firebase' / 'credentials.json' if os.getenv('APPDATA') else None
]

access_token = None
print("🔍 Buscando token de Firebase...")

for path in config_paths:
    if path and path.exists():
        print(f"✓ Encontrado: {path}")
        try:
            with open(path, 'r') as f:
                data = json.load(f)
                if 'access_token' in data:
                    access_token = data['access_token']
                    print(f"✓ Token obtenido")
                    break
        except Exception as e:
            print(f"Error leyendo {path}: {e}")

if not access_token:
    # Intentar desde Node's cache
    node_cache = Path.home() / 'AppData' / 'Roaming' / '.firebase' / 'firebase-cli-tokens.json'
    if node_cache.exists():
        print(f"✓ Intentando: {node_cache}")
        try:
            with open(node_cache, 'r') as f:
                data = json.load(f)
                if 'tokens' in data and len(data['tokens']) > 0:
                    access_token = data['tokens'][0].get('access_token')
                    print(f"✓ Token obtenido de Node cache")
        except Exception as e:
            print(f"Error: {e}")

if access_token:
    print(f"\n✓ Usando token de acceso para deploy")
    
    # Leer las reglas
    with open(r'c:\Users\EMERSON\Downloads\BANCO DE HOJAS DE VIDA COMBO 2027\firestore.rules', 'r') as f:
        rules_content = f.read()
    
    # Hacer deploy
    url = "https://firebaserules.googleapis.com/v1/projects/banco-de-hojas-de-vida-b3794/releases"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "source": {
            "files": [
                {
                    "name": "firestore.rules",
                    "content": rules_content
                }
            ]
        }
    }
    
    print("\n📤 Enviando deploy a Firebase...")
    response = requests.post(url, json=payload, headers=headers, timeout=30)
    
    if response.status_code in [200, 201]:
        print(f"✓ Deploy exitoso: {response.status_code}")
        print(response.json())
    else:
        print(f"✗ Error: {response.status_code}")
        print(response.text)
else:
    print("✗ No se encontró token de acceso")
    print("Intenta ejecutar: firebase login --no-localhost")
