# 📱 App Móvil de Eventos UNADECA

[![Licencia: MIT](https://img.shields.io/badge/Licencia-MIT-green.svg)](LICENSE)
[![Estado: En Desarrollo](https://img.shields.io/badge/Estado-En%20Desarrollo-yellow.svg)](#)
[![Android](https://img.shields.io/badge/Android-12+-green?logo=android)](https://developer.android.com)
[![Kotlin](https://img.shields.io/badge/Kotlin-1.9+-purple?logo=kotlin)](https://kotlinlang.org)

Aplicación móvil nativa para gestionar, descubrir y participar en eventos y actividades de la Universidad Adventista de Centro América (UNADECA). Desarrollada con Kotlin en Android y backend RESTful en Node.js.

## 📋 Tabla de Contenidos

- [Características](#características)
- [Tech Stack](#tech-stack)
- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Uso](#uso)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [API Backend](#api-backend)
- [Contribuciones](#contribuciones)
- [Licencia](#licencia)
- [Contacto](#contacto)

---

## ✨ Características

### 📅 Gestión de Eventos
- Ver listado de eventos próximos y pasados
- Filtrar eventos por categoría, fecha y ubicación
- Buscar eventos específicos por nombre o descripción
- Detalles completos de cada evento (descripción, horario, ubicación, asistentes)

### 👤 Gestión de Usuarios
- Registro e inicio de sesión seguro
- Perfil de usuario personalizable
- Historial de eventos asistidos
- Lista de eventos guardados (favoritos)

### 📍 Funcionalidades Avanzadas
- Notificaciones en tiempo real de nuevos eventos
- Confirmación de asistencia a eventos
- Mapa de ubicación de eventos
- Compartir eventos en redes sociales

---

## 🛠️ Tech Stack

### Frontend Mobile
- **Lenguaje:** Kotlin
- **IDE:** Android Studio
- **Mínimo API:** 21 (Android 5.0+)
- **Arquitectura:** MVVM (Model-View-ViewModel)
- **Dependencias:** 
  - Retrofit (HTTP Client)
  - Room Database (SQLite Local)
  - LiveData & ViewModel
  - Navigation Component

### Backend API
- **Runtime:** Node.js (v18+)
- **Framework:** Express.js
- **Base de Datos:** MongoDB / Firebase Firestore
- **Autenticación:** JWT (JSON Web Tokens)
- **Documentación:** Swagger/OpenAPI

### DevOps & Tools
- **Control de Versiones:** Git
- **Hosting:** (Firebase Hosting / Heroku / AWS)
- **CI/CD:** GitHub Actions (planeado)

---

## 📦 Requisitos

### Para Desarrollo

**Frontend Android:**
- Android Studio Giraffe o superior
- JDK 11+
- Android SDK 21 o superior
- Gradle 7.4+

**Backend Node.js:**
- Node.js v18.0.0 o superior
- npm 9.0.0 o superior
- MongoDB Community o Atlas (si usas MongoDB)
- Firebase Project (si usas Firestore)

---

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/espinalenrique123-dev/app-eventos-unadeca.git
cd app-eventos-unadeca
```

### 2. Configurar Frontend (Android)

```bash
# Navegar a carpeta Android
cd frontend/android

# Abrir en Android Studio
open -a "Android Studio" .

# O compilar desde terminal
./gradlew build

# Instalar APK en emulador/dispositivo
./gradlew installDebug
```

**Configurar Firebase:**
1. Descargar `google-services.json` desde Firebase Console
2. Copiar a `app/` en el proyecto Android
3. Sincronizar Gradle

### 3. Configurar Backend (Node.js)

```bash
# Navegar a carpeta backend
cd backend

# Instalar dependencias
npm install

# Crear archivo .env
cp .env.example .env

# Configurar variables de entorno:
# MONGODB_URI=mongodb://localhost:27017/eventos_unadeca
# JWT_SECRET=tu_clave_secreta_aqui
# PORT=3000
# NODE_ENV=development

# Ejecutar servidor
npm start

# Para desarrollo con auto-reload
npm run dev
```

---

## 📱 Uso

### Ejecutar la Aplicación

**Desde Android Studio:**
1. Abrir el proyecto
2. Seleccionar dispositivo o emulador
3. Click en "Run" o presionar `Shift + F10`

**Desde Terminal:**
```bash
./gradlew runDebug
```

### Endpoints API Base

```
http://localhost:3000/api
```

**Ejemplos de uso:**

```bash
# Obtener todos los eventos
curl -X GET http://localhost:3000/api/eventos

# Crear cuenta
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"123456"}'

# Iniciar sesión
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"123456"}'
```

---

## 📁 Estructura del Proyecto

```
app-eventos-unadeca/
├── frontend/
│   └── android/
│       ├── app/
│       │   ├── src/
│       │   │   ├── main/
│       │   │   │   ├── java/com/unadeca/eventos/
│       │   │   │   │   ├── ui/              # Fragmentos y Activities
│       │   │   │   │   ├── viewmodel/       # ViewModels
│       │   │   │   │   ├── repository/      # Repositorios de datos
│       │   │   │   │   ├── network/         # Cliente HTTP (Retrofit)
│       │   │   │   │   ├── database/        # Room Database
│       │   │   │   │   └── model/           # Modelos de datos
│       │   │   │   └── res/                 # Recursos (layouts, strings, etc)
│       │   │   └── test/
│       │   └── build.gradle
│       └── settings.gradle
├── backend/
│   ├── src/
│   │   ├── routes/                 # Rutas API
│   │   ├── controllers/            # Lógica de negocio
│   │   ├── models/                 # Esquemas BD
│   │   ├── middleware/             # Autenticación, validación
│   │   ├── config/                 # Configuración
│   │   └── app.js                  # Entrada principal
│   ├── .env.example
│   ├── package.json
│   └── README.md
├── docs/                           # Documentación
├── LICENSE                         # MIT License
└── README.md                       # Este archivo
```

---

## 🔌 API Backend

### Autenticación
```
POST   /api/auth/signup      - Registrar nuevo usuario
POST   /api/auth/login       - Iniciar sesión
POST   /api/auth/logout      - Cerrar sesión
POST   /api/auth/refresh     - Refrescar token JWT
```

### Eventos
```
GET    /api/eventos          - Listar todos los eventos
GET    /api/eventos/:id      - Obtener detalles de un evento
POST   /api/eventos          - Crear nuevo evento (admin)
PUT    /api/eventos/:id      - Actualizar evento (admin)
DELETE /api/eventos/:id      - Eliminar evento (admin)
POST   /api/eventos/:id/join - Confirmar asistencia
```

### Usuarios
```
GET    /api/usuarios/:id     - Obtener perfil de usuario
PUT    /api/usuarios/:id     - Actualizar perfil
GET    /api/usuarios/:id/eventos - Eventos del usuario
```

Para documentación completa ver: `/backend/README.md` o Swagger en `http://localhost:3000/api-docs`

---

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Para cambios importantes:

1. Fork el repositorio
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

**Estándares de código:**
- Kotlin: Seguir [Kotlin Coding Conventions](https://kotlinlang.org/docs/coding-conventions.html)
- JavaScript: ESLint + Prettier

---

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver archivo `LICENSE` para más detalles.

---

## 📧 Contacto

**Desarrollador:** Moises Espinal  
**Email:** moises.espinal@unadeca.ac.cr  
**LinkedIn:** [linkedin.com/in/moises-espinal](https://linkedin.com)  
**GitHub:** [@espinalenrique123-dev](https://github.com/espinalenrique123-dev)

---

## 🙌 Agradecimientos

- Universidad Adventista de Centro América (UNADECA)
- Profesores: Edy Echenique, Dodanim Castillo
- Comunidad de desarrollo Kotlin y Node.js

---

**Última actualización:** Agosto 2026  
**Estado:** En Desarrollo ⚙️

---

*Este proyecto es parte del Trabajo de Grado de Licenciatura en Ingeniería de Sistemas.*
