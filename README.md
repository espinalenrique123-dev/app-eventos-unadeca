# App de Eventos y Actividades UNADECA

Aplicación web para gestionar los eventos de la Universidad Adventista de Centro América (UNADECA). Proyecto del curso IS-593 Metodología y Diseño de Sistemas II.

## Tecnologías

- **Web:** React 18 + Vite
- **Firebase:** Authentication (cuentas), Cloud Firestore (datos) y Cloud Functions (gestión de cuentas)
- **Seguridad de datos:** reglas de Firestore en `firestore.rules`

## Funciones

**Estudiante**
- Crear cuenta e iniciar sesión
- Ver eventos, buscar y filtrar por categoría
- Ver el detalle e inscribirse (con control de cupos y sin duplicados)
- Notificación en el navegador al confirmar la inscripción
- Mis eventos: próximos, realizados y cancelados
- Editar su perfil (nombre, teléfono y correo de contacto)

**Administrador**
- Crear, editar y eliminar eventos
- Panel con indicadores
- Registrar asistencia e imprimir o guardar el reporte en PDF

## Estructura

```
src/
├── pages/          Pantallas (Dashboard, detalle, Mis eventos, asistencia, perfil…)
├── api.js          Acceso a Firebase (fachada única para las pantallas)
├── firebase.js     Inicialización única de Firebase
└── notifications.js Notificaciones del navegador
functions/          Cloud Functions (gestión de cuentas para administradores)
firestore.rules     Reglas de seguridad de Firestore
```

## Ejecutar en local

1. Copiar `.env.example` como `.env.local` y completar los valores de la app web de Firebase
   (Firebase Console → Configuración del proyecto → Tus apps).
2. Instalar y ejecutar:

```bash
npm install
npm run dev
```

## Seguridad

- Los archivos `.env` y las claves de cuentas de servicio **no se suben** al repositorio (ver `.gitignore`).
- El CI busca secretos en todo el historial con gitleaks en cada cambio.
- Los permisos de lectura y escritura se controlan en `firestore.rules`.

## Licencia

MIT
