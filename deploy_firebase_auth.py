import requests
import json
import webbrowser
import time
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

class OAuthHandler(BaseHTTPRequestHandler):
    auth_code = None
    
    def do_GET(self):
        query_components = parse_qs(urlparse(self.path).query)
        if 'code' in query_components:
            OAuthHandler.auth_code = query_components['code'][0]
            self.send_response(200)
            self.send_header('Content-type', 'text/html; charset=utf-8')
            self.end_headers()
            self.wfile.write(b'<h1>Autenticacion completada!</h1><p>Cierra esta ventana.</p>')
        else:
            self.send_response(400)
            self.end_headers()
    
    def log_message(self, format, *args):
        pass  # Silenciar logs

# Google OAuth constants
import os

CLIENT_ID = os.environ.get("FIREBASE_OAUTH_CLIENT_ID", "")
CLIENT_SECRET = os.environ.get("FIREBASE_OAUTH_CLIENT_SECRET", "")
REDIRECT_URI = "http://localhost:8888/callback"
SCOPES = "https://www.googleapis.com/auth/firebase https://www.googleapis.com/auth/cloud-platform"

if not CLIENT_ID or not CLIENT_SECRET:
    raise SystemExit(
        "Error: define FIREBASE_OAUTH_CLIENT_ID y FIREBASE_OAUTH_CLIENT_SECRET en variables de entorno antes de ejecutar este script."
    )

print("📱 Iniciando flujo OAuth de Google...")
print("1. Se abrirá una ventana del navegador")
print("2. Completa la autenticación")
print("3. Permite el acceso a Firebase")

# Construir URL de autorización
auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?client_id={CLIENT_ID}&redirect_uri={REDIRECT_URI}&response_type=code&scope={SCOPES}&access_type=offline"

# Abrir navegador
webbrowser.open(auth_url)

# Esperar respuesta
server = HTTPServer(('localhost', 8888), OAuthHandler)
print("⏳ Esperando respuesta de OAuth...")
server.timeout = 120
server.handle_request()

if OAuthHandler.auth_code:
    print(f"✓ Código de autorización obtenido")
    
    # Intercambiar código por token de acceso
    token_url = "https://oauth2.googleapis.com/token"
    token_data = {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "code": OAuthHandler.auth_code,
        "grant_type": "authorization_code",
        "redirect_uri": REDIRECT_URI
    }
    
    print("📤 Intercambiando código por token...")
    response = requests.post(token_url, data=token_data)
    
    if response.status_code == 200:
        tokens = response.json()
        access_token = tokens.get('access_token')
        print(f"✓ Token de acceso obtenido: {access_token[:30]}...")
        
        # Guardar token en archivo
        with open('firebase_token.txt', 'w') as f:
            f.write(access_token)
        print("✓ Token guardado en firebase_token.txt")
        
        # Ahora desplegar las reglas
        print("\n📋 Leyendo firestore.rules...")
        with open('firestore.rules', 'r') as f:
            rules_content = f.read()
        
        print("📤 Desplegando reglas a Firebase...")
        url = "https://firebaserules.googleapis.com/v1/projects/banco-de-hojas-de-vida-b3794:testRuleset"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        # Crear ruleset
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
        
        response = requests.post(url, json=payload, headers=headers)
        if response.status_code in [200, 201]:
            print(f"✓ Ruleset creado: {response.status_code}")
            ruleset = response.json()
            
            # Ahora publicar el ruleset
            release_url = f"https://firebaserules.googleapis.com/v1/projects/banco-de-hojas-de-vida-b3794/releases"
            release_payload = {
                "name": "projects/banco-de-hojas-de-vida-b3794/releases/prod",
                "rulesetName": ruleset['name']
            }
            
            response = requests.post(release_url, json=release_payload, headers=headers)
            if response.status_code in [200, 201]:
                print(f"✓ Reglas desplegadas exitosamente!")
            else:
                print(f"✗ Error al publicar reglas: {response.status_code}")
                print(response.text)
        else:
            print(f"✗ Error al crear ruleset: {response.status_code}")
            print(response.text)
    else:
        print(f"✗ Error al obtener token: {response.status_code}")
        print(response.text)
else:
    print("✗ No se recibió código de autorización")
