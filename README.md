# Malla Curricular

Aplicación web para crear y gestionar mallas curriculares universitarias. Permite a los usuarios crear guías curriculares, añadir materias, gestionar prerrequisitos y compartir mallas públicamente.

## Características

- Autenticación de usuarios con Firebase
- Creación de guías curriculares personalizadas
- Gestión de materias y prerrequisitos
- Sistema de estados para materias (bloqueada/disponible/aprobada)
- Compartir mallas curriculares públicamente
- Exportar mallas a PDF
- Interfaz responsive con Tailwind CSS

## Tecnologías Utilizadas

- React
- Firebase (Authentication y Firestore)
- Tailwind CSS
- React Router DOM
- HTML2Canvas
- jsPDF

## Requisitos Previos

- Node.js (versión 14 o superior)
- npm o yarn
- Cuenta de Firebase y proyecto configurado

## Instalación

1. Clonar el repositorio:
```bash
git clone <url-del-repositorio>
cd malla-curricular
```

2. Instalar dependencias:
```bash
npm install
# o
yarn install
```

3. Configurar variables de entorno:
Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

4. Iniciar el servidor de desarrollo:
```bash
npm run dev
# o
yarn dev
```

## Despliegue

Para construir la aplicación para producción:

```bash
npm run build
# o
yarn build
```

Los archivos de la build se generarán en el directorio `dist`.

## Licencia

MIT
