# Configuracion Firebase (panel seguro + formulario publico)

## 1) Crear proyecto y Firestore
1. Cree un proyecto en Firebase.
2. Active Firestore Database en modo produccion.
3. En Firestore Rules, pegue el contenido de firestore.rules.

## 2) Habilitar Authentication
1. Vaya a Authentication > Sign-in method.
2. Active Email/Password.
3. Cree usuarios autorizados en Authentication > Users. Solo esos usuarios podran ver la base de registros.

## 3) Registrar app web
1. En Project settings > General > Your apps, registre una app web.
2. Copie el objeto de configuracion de Firebase.

## 4) Pegar configuracion en app.js
Edite firebaseConfig en app.js con los datos reales:
- apiKey
- authDomain
- projectId
- storageBucket
- messagingSenderId
- appId

## 5) Uso de login
- En el campo Usuario ingrese el correo del usuario de Firebase Authentication.
- En Contrasena ingrese la contrasena del usuario.
- Si abre la app con ?registro=1 al final de la URL, se mostrara solo el formulario publico.
- El formulario publico permite guardar registros, pero no leer la coleccion.
- La unicidad se controla por cédula: la misma persona no puede inscribirse dos veces.

## 6) Publicacion
Publique el sitio en un hosting HTTPS (Firebase Hosting, Netlify, Vercel o similar) para usarlo desde moviles y PCs.

### Despliegue con Firebase Hosting
Desde la carpeta del proyecto ejecute:

```bash
npx firebase-tools login
npx firebase-tools deploy
```

Ese despliegue publica:
- El sitio estatico configurado en firebase.json.
- Las reglas de Firestore definidas en firestore.rules.

## 7) Recomendacion de seguridad
- Mantenga usuarios administradores solo en Firebase Authentication.
- No comparta la URL normal del panel; comparta solamente el enlace generado por el boton de inscripcion.
- Despliegue siempre las reglas de firestore.rules antes de abrir el formulario al publico.
