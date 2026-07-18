# Banco de Hojas de Vida Combo 2027

Aplicacion web para gestionar hojas de vida con registro, edicion, eliminacion, busqueda avanzada, exportacion a Excel y sincronizacion en la nube.

## Funcionalidades

- Login de acceso para el panel administrativo.
- Registro de aspirantes con campos personalizados.
- Campo de disponibilidad para viajar a otra ciudad.
- Campo de zona de influencia.
- Busqueda por nombre, cedula, perfil, disponibilidad, zona y correo.
- Exportacion de registros a Excel.
- Sincronizacion multi-dispositivo con Firebase Firestore.
- Autenticacion con Firebase Authentication (email/password) cuando Firebase esta configurado.
- Fallback local con localStorage si Firebase no esta configurado.

## Estructura del proyecto

- index.html: interfaz principal.
- styles.css: estilos y diseno.
- app.js: logica de negocio, sincronizacion y autenticacion.
- firestore.rules: reglas de seguridad para Firestore.
- FIREBASE_SETUP.md: guia de configuracion Firebase.

## Requisitos

- Navegador moderno.
- Cuenta de Firebase para sincronizacion segura.

## Configuracion rapida de Firebase

1. Crear proyecto Firebase.
2. Activar Firestore Database.
3. Activar Authentication con Email/Password.
4. Crear usuarios autorizados.
5. Pegar credenciales en firebaseConfig dentro de app.js.
6. Publicar reglas desde firestore.rules.

Ver detalles completos en FIREBASE_SETUP.md.

## Uso local

1. Abrir index.html en el navegador, o servir la carpeta con un servidor estatico.
2. Iniciar sesion.
3. Crear y administrar registros.
4. Exportar a Excel cuando lo necesites.

## Publicacion

Este repositorio esta preparado para publicarse en GitHub Pages.

## Autor

EMERSON199219
