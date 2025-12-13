# Creador de Videos Cortos - Aplicación Full Stack

Aplicación completa para **generar videos cortos automáticamente** basados en guiones, utilizando herramientas 100% open source.

## Características Principales

- Editor de guiones con múltiples escenas
- Generación automática de audio (Text-to-Speech)
- Creación de imágenes para cada escena
- Composición automática de video con FFmpeg
- Procesamiento en cola con Bull
- Interfaz moderna y responsive
- Descarga de videos generados

## Tecnologías Open Source Utilizadas

### Frontend
- **React 19** - Framework de UI
- **Vite** - Build tool ultrarrápido
- **Axios** - Cliente HTTP
- **Lucide React** - Iconos modernos

### Backend
- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web
- **Bull** - Sistema de colas con Redis
- **gTTS** - Google Text-to-Speech (open source)
- **Canvas** - Generación de imágenes
- **FFmpeg** - Procesamiento y composición de video
- **fluent-ffmpeg** - Wrapper de FFmpeg para Node.js

## Estructura del Proyecto

```
appredes/
├── frontend-react/           # Aplicación React
│   ├── src/
│   │   ├── components/       # Componentes React
│   │   │   ├── ScriptEditor.jsx    # Editor de guiones
│   │   │   ├── VideoGenerator.jsx  # Generador de videos
│   │   │   └── VideoList.jsx       # Lista de videos
│   │   ├── App.jsx           # Componente principal
│   │   └── App.css           # Estilos globales
│   └── package.json
│
├── backend-node/             # API Node.js
│   ├── routes/               # Rutas de la API
│   │   ├── scripts.js        # CRUD de guiones
│   │   └── videos.js         # Generación de videos
│   ├── services/             # Servicios del backend
│   │   ├── ttsService.js     # Text-to-Speech
│   │   ├── imageService.js   # Generación de imágenes
│   │   ├── videoService.js   # Composición de video
│   │   └── videoQueue.js     # Cola de procesamiento
│   ├── temp/                 # Archivos temporales
│   ├── output/               # Videos generados
│   ├── index.js              # Servidor principal
│   ├── .env                  # Variables de entorno
│   └── package.json
│
└── README.md
```

## Requisitos Previos

### Software Necesario

1. **Node.js v20.x o superior**
   ```bash
   node --version  # Verificar versión
   ```

2. **FFmpeg** (esencial para generación de videos)
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install ffmpeg

   # Verificar instalación
   ffmpeg -version
   ```

3. **Redis** (opcional, para sistema de colas)
   ```bash
   # Ubuntu/Debian
   sudo apt install redis-server
   sudo systemctl start redis

   # Verificar
   redis-cli ping  # Debe responder "PONG"
   ```

   **Nota:** Redis es opcional. Si no está disponible, Bull usará memoria local.

## Instalación y Configuración

### 1. Clonar o navegar al proyecto
```bash
cd /ruta/al/proyecto/appredes
```

### 2. Configurar Backend

```bash
cd backend-node

# Instalar dependencias
npm install

# El archivo .env ya está configurado con valores por defecto
# Puedes editarlo si necesitas cambiar configuraciones
```

### 3. Configurar Frontend

```bash
cd ../frontend-react

# Instalar dependencias
npm install
```

## Ejecución de la Aplicación

### Opción 1: Usando dos terminales (Recomendado)

**Terminal 1 - Backend:**
```bash
cd backend-node
npm run dev
```
El backend estará disponible en: `http://localhost:3000`

**Terminal 2 - Frontend:**
```bash
cd frontend-react
npm run dev
```
La aplicación estará disponible en: `http://localhost:5173`

### Opción 2: WSL (si aplica)

**Terminal 1 (Backend):**
```bash
wsl -d redes
cd /mnt/d/Desarrollo/appredes/backend-node
npm run dev
```

**Terminal 2 (Frontend):**
```bash
wsl -d redes
cd /mnt/d/Desarrollo/appredes/frontend-react
npm run dev
```

## Cómo Usar la Aplicación

### 1. Crear un Guion

1. Abre la aplicación en `http://localhost:5173`
2. En la pestaña "**Editor de Guiones**":
   - Ingresa un título para tu video
   - Agrega escenas (cada escena es un segmento del video)
   - Para cada escena:
     - **Narración/Texto**: Lo que se dirá en el video
     - **Descripción de Imagen** (opcional): Describe la imagen que quieres
   - Haz clic en "**Guardar y Continuar**"

### 2. Generar el Video

1. Automáticamente irás a la pestaña "**Generar Video**"
2. Verás un resumen de tu guion
3. Haz clic en "**Generar Video**"
4. El proceso incluye 3 fases:
   - **Fase 1 (0-33%)**: Generación de audios con TTS
   - **Fase 2 (33-66%)**: Creación de imágenes para cada escena
   - **Fase 3 (66-100%)**: Composición del video final
5. Cuando termine, podrás ver y descargar tu video

### 3. Ver tus Videos

1. Ve a la pestaña "**Mis Videos**"
2. Encontrarás todos los videos que has generado
3. Puedes reproducirlos o descargarlos

## API Endpoints

### Guiones

```bash
# Obtener todos los guiones
GET /api/scripts

# Obtener un guion específico
GET /api/scripts/:id

# Crear un nuevo guion
POST /api/scripts
Body: {
  "title": "Mi Video",
  "scenes": [
    {
      "text": "Texto de la escena",
      "imagePrompt": "Descripción de la imagen"
    }
  ],
  "settings": {
    "videoWidth": 1080,
    "videoHeight": 1920,
    "fps": 30,
    "voice": "es"
  }
}

# Actualizar un guion
PUT /api/scripts/:id

# Eliminar un guion
DELETE /api/scripts/:id
```

### Videos

```bash
# Generar un video
POST /api/videos/generate
Body: {
  "script": {
    "title": "Mi Video",
    "scenes": [...]
  },
  "settings": {...}
}

# Obtener estado de generación
GET /api/videos/status/:jobId

# Listar videos generados
GET /api/videos
```

### Salud del servidor

```bash
GET /
GET /api/health
```

## Configuración Avanzada

### Variables de Entorno (.env)

```env
# Puerto del servidor
PORT=3000

# Redis (sistema de colas)
REDIS_HOST=localhost
REDIS_PORT=6379

# Directorios
UPLOADS_DIR=./uploads
TEMP_DIR=./temp
OUTPUT_DIR=./output

# Configuración de video
DEFAULT_VIDEO_WIDTH=1080
DEFAULT_VIDEO_HEIGHT=1920
DEFAULT_FPS=30
```

### Integración con APIs de Generación de Imágenes

Por defecto, la aplicación genera imágenes placeholder. Para integrar servicios como Stable Diffusion:

1. Edita `backend-node/services/imageService.js`
2. En la función `generateImageFromPrompt`, implementa la integración con tu servicio preferido:
   - Replicate (Stable Diffusion)
   - Stability AI
   - DALL-E (OpenAI)
   - Midjourney API
   - Stable Diffusion local

Ejemplo con Replicate:
```javascript
// Instalar: npm install replicate
const Replicate = require('replicate');
const replicate = new Replicate({ auth: process.env.REPLICATE_API_KEY });

const output = await replicate.run(
  "stability-ai/sdxl",
  { input: { prompt: imagePrompt } }
);
```

## Troubleshooting

### Error: FFmpeg no encontrado

```bash
# Verificar instalación
ffmpeg -version

# Si no está instalado:
sudo apt update
sudo apt install ffmpeg
```

### Error: Redis connection refused

Si ves este error, es normal si no tienes Redis instalado. La aplicación funcionará en modo local.

Para usar Redis:
```bash
sudo apt install redis-server
sudo systemctl start redis
```

### Error: Cannot find module

```bash
# En el directorio con el error:
npm install
```

### Puerto ya en uso

Si el puerto 3000 o 5173 ya está en uso:
```bash
# Cambiar puerto del backend en .env
PORT=3001

# El puerto del frontend se puede cambiar en vite.config.js
```

## Ejemplos de Uso

### Ejemplo 1: Video Tutorial Simple

```json
{
  "title": "Cómo hacer café",
  "scenes": [
    {
      "text": "Bienvenidos a nuestro tutorial sobre cómo hacer el café perfecto",
      "imagePrompt": "Taza de café humeante en una mesa de madera"
    },
    {
      "text": "Primero, necesitarás granos de café frescos y de buena calidad",
      "imagePrompt": "Granos de café recién molidos"
    },
    {
      "text": "Calienta el agua a 90-95 grados Celsius",
      "imagePrompt": "Tetera hirviendo agua"
    }
  ]
}
```

### Ejemplo 2: Video Motivacional

```json
{
  "title": "Motivación Diaria",
  "scenes": [
    {
      "text": "Cada día es una nueva oportunidad para ser mejor",
      "imagePrompt": "Amanecer sobre montañas"
    },
    {
      "text": "No importa cuántas veces caigas, lo importante es levantarse",
      "imagePrompt": "Persona escalando una montaña"
    }
  ]
}
```

## Comandos Útiles

### Desarrollo

```bash
# Backend con hot reload
cd backend-node && npm run dev

# Frontend con hot reload
cd frontend-react && npm run dev

# Ver logs de Redis (si está instalado)
redis-cli monitor
```

### Producción

```bash
# Build del frontend
cd frontend-react && npm run build

# Ejecutar backend en producción
cd backend-node && npm start
```

### Limpieza

```bash
# Limpiar archivos temporales
cd backend-node
rm -rf temp/*
rm -rf output/*
```

## Próximas Mejoras

- [ ] Integración con Stable Diffusion para generación de imágenes reales
- [ ] Soporte para múltiples voces y idiomas en TTS
- [ ] Editor de video para ajustes post-generación
- [ ] Biblioteca de música de fondo
- [ ] Transiciones entre escenas
- [ ] Subtítulos automáticos
- [ ] Exportación en múltiples formatos y resoluciones
- [ ] Base de datos para persistencia
- [ ] Autenticación de usuarios
- [ ] Compartir videos en redes sociales

## Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## Soporte

Si encuentras algún problema o tienes sugerencias, por favor:
1. Verifica la sección de Troubleshooting
2. Revisa que todas las dependencias estén instaladas
3. Asegúrate de que FFmpeg esté disponible en tu sistema

---

Desarrollado con herramientas 100% open source
