# App Móvil de Eventos y Actividades — UNADECA

Sistema para centralizar los eventos universitarios de UNADECA: los **estudiantes** consultan eventos, se inscriben y reciben notificaciones en la app Android; los **coordinadores** crean eventos, ven inscritos y registran asistencia desde la webapp; el **administrador** gestiona usuarios y reportes globales.

**Curso:** IS-593 Metodología y Diseño de Sistemas II · **Estudiante:** Moisés Moncada · **Período:** 6 de septiembre – 29 de noviembre de 2026

[![CI](https://github.com/espinalenrique123-dev/app-eventos-unadeca/actions/workflows/ci.yml/badge.svg)](https://github.com/espinalenrique123-dev/app-eventos-unadeca/actions/workflows/ci.yml)

---

## Arquitectura

Arquitectura en 3 capas (DEDS): **presentación** (webapp React y app Android), **lógica de negocio** (API REST en Node.js + Express) y **datos** (Firebase: Firestore, Auth y Cloud Messaging).

| Patrón | Dónde |
|---|---|
| **Singleton** | `backend/src/config/FirebaseConfig.js` — una sola inicialización de Firebase Admin |
| **Facade** | `backend/src/facade/FirebaseFacade.js` — los repositorios no usan el SDK de Firebase directamente |
| **Repository** | `backend/src/repositories/` — acceso a cada colección de Firestore |
| **Observer** | `functions/src/observer/` — `EventSubject` notifica a `PushNotificationObserver` cuando cambia un evento |

Flujo de una petición: `routes` → `middleware` (verifica el token y el rol) → `controllers` → `services` (reglas de negocio) → `repositories` → `FirebaseFacade` → Firestore.

## Estructura del repositorio

```
app-eventos-unadeca/
├── backend/                  API REST (Node.js 20 + Express)
│   ├── src/
│   │   ├── config/           FirebaseConfig (Singleton)
│   │   ├── facade/           FirebaseFacade (Facade)
│   │   ├── repositories/     User, Event, Inscription, Attendance
│   │   ├── services/         Reglas de negocio (cupos, estados, permisos)
│   │   ├── controllers/      Traducción HTTP ↔ servicios
│   │   ├── routes/           Definición de endpoints
│   │   ├── middleware/       Autenticación, roles y manejo de errores
│   │   ├── models/           Enumeraciones y validaciones
│   │   ├── app.js            Aplicación Express
│   │   └── server.js         Punto de entrada
│   └── tests/                Pruebas unitarias e integración (Jest + Supertest)
├── web/                      Webapp administrativa (React + Vite) — coordinador y administrador
├── android/                  App móvil del estudiante (Kotlin)
├── functions/                Cloud Functions — notificaciones push (Observer) y recordatorio de 24 h
├── firebase/                 Reglas de seguridad e índices de Firestore
├── firebase.json             Configuración de Firebase CLI (emuladores, hosting, functions)
└── .github/workflows/        Integración continua (GitHub Actions)
```

## Modelo de datos (Firestore)

| Colección | Campos |
|---|---|
| `users` | id, nombre, email, rol (`estudiante` · `coordinador` · `administrador`), activo |
| `events` | id, nombre, descripcion, fecha, hora, lugar, categoria, cupoMaximo, cuposOcupados, estado, coordinadorId |
| `inscriptions` | id = `{eventId}_{userId}`, eventId, userId, estado, fcmToken, fecha |
| `attendance` | eventId, userId, asistio, fechaRegistro |

Enumeraciones: `EstadoEvento { PUBLICADO, CUPO_LLENO, CANCELADO, FINALIZADO }` y `EstadoInscripcion { ACTIVA, CANCELADA }`.

## Puesta en marcha

Requisitos: Node.js 20, Android Studio (para `android/`) y un proyecto de Firebase.

### 1. Backend

```bash
cd backend
cp .env.example .env          # complete los valores
# Descargue la clave de la cuenta de servicio desde Firebase Console y guárdela como
# backend/serviceAccountKey.json (está en .gitignore; NO la suba a GitHub).
npm install
npm run dev                   # http://localhost:3000  ·  GET /health
npm test                      # pruebas + cobertura
```

### 2. Webapp

```bash
cd web
cp .env.example .env.local    # configuración de la app web de Firebase
npm install
npm run dev                   # http://localhost:5173  (redirige /api al backend)
```

### 3. App Android

Abra la carpeta `android/` en Android Studio. Descargue `google-services.json` desde Firebase Console y colóquelo en `android/app/` (está en `.gitignore`). En el emulador, la app se conecta al backend local en `http://10.0.2.2:3000/api/`.

### 4. Firebase (reglas, índices y functions)

```bash
npm install -g firebase-tools
cp .firebaserc.example .firebaserc
firebase deploy --only firestore:rules,firestore:indexes
cd functions && npm install && npm test && firebase deploy --only functions
```

## API principal

Todas las rutas `/api` requieren `Authorization: Bearer <ID token de Firebase Auth>`.

| Método y ruta | Rol |
|---|---|
| `GET /api/events` · `GET /api/events/:id` | cualquiera autenticado |
| `POST /api/events/:id/inscriptions` · `DELETE /api/events/:id/inscriptions/me` | estudiante |
| `GET /api/events/manage` · `POST /api/events` · `PUT /api/events/:id` | coordinador, administrador |
| `POST /api/events/:id/cancel` · `POST /api/events/:id/finish` | coordinador del evento, administrador |
| `GET /api/events/:id/inscriptions` · `GET/POST /api/events/:id/attendance` · `GET /api/events/:id/report` | coordinador del evento, administrador |
| `GET/PUT /api/users/me` · `GET /api/users/me/inscriptions` | cualquiera autenticado |
| `GET /api/admin/users` · `PUT /api/admin/users/:id/role` · `PUT /api/admin/users/:id/active` · `GET /api/admin/reports` | administrador |

## Seguridad

- La contraseña nunca pasa por el backend: el inicio de sesión lo hace **Firebase Auth** y el backend verifica el ID token (JWT firmado por Google) en cada petición.
- Los roles se validan en el backend; un usuario no puede cambiar su propio rol.
- Las inscripciones usan **transacciones** de Firestore para que nunca se supere el cupo.
- Las reglas de Firestore bloquean toda escritura desde los clientes; solo el backend escribe.
- Las credenciales (`.env`, `serviceAccountKey.json`, `google-services.json`) están en `.gitignore`, y el CI ejecuta **gitleaks** para detectar secretos.

## Cronograma

| Sprint | Semanas | Objetivo |
|---|---|---|
| Fase 1 | 1–3 | Repositorio, entorno, ajustes al DEDS y plan de pruebas |
| Sprint 1 | 4–6 | Núcleo funcional: autenticación, eventos e inscripciones |
| Sprint 2 | 7–9 | Funcionalidad avanzada: notificaciones, asistencia y reportes |
| Sprint 3 | 10–12 | Estabilización: pruebas de sistema y despliegue |
| Cierre | 13 | Integración final y presentación (29 de noviembre) |

## Licencia

MIT — ver [LICENSE](LICENSE).
