# Configuracion Firebase (sincronizacion segura)

## 1) Crear proyecto y Firestore
1. Cree un proyecto en Firebase.
2. Active Firestore Database en modo produccion.
3. En Firestore Rules, pegue el contenido de firestore.rules.

## 2) Habilitar Authentication
1. Vaya a Authentication > Sign-in method.
2. Active Email/Password.
3. Cree usuarios autorizados en Authentication > Users.

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

## 6) Publicacion
Publique el sitio en un hosting HTTPS (Firebase Hosting, Netlify, Vercel o similar) para usarlo desde moviles y PCs.
