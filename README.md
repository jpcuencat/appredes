# Proyecto Full Stack - React + Node.js

Este proyecto contiene una aplicación full stack con:
- **Frontend**: React con Vite
- **Backend**: Node.js con Express

## 🏗️ Estructura del Proyecto

```
appredes/
├── frontend-react/     # Aplicación React con Vite
│   ├── src/
│   ├── public/
│   └── package.json
├── backend-node/       # API REST con Express
│   ├── index.js
│   ├── .env
│   └── package.json
└── README.md
```

## ⚙️ Tecnologías Utilizadas

### Frontend
- React 18
- Vite (build tool)
- ESLint
- CSS3

### Backend
- Node.js v20.19.5
- Express.js v5.1.0
- CORS
- Dotenv
- Nodemon (desarrollo)

## 🚀 Instrucciones de Uso

### Prerrequisitos
- WSL con Ubuntu (distribución "redes")
- Node.js v20.x
- npm

### Configuración Inicial

1. **Navegar al directorio del proyecto:**
   ```bash
   cd /mnt/d/Desarrollo/appredes
   ```

### Frontend (React + Vite)

2. **Instalar dependencias del frontend:**
   ```bash
   cd frontend-react
   npm install
   ```

3. **Ejecutar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   - Acceder a: http://localhost:5173

4. **Comandos disponibles:**
   ```bash
   npm run dev      # Servidor de desarrollo
   npm run build    # Compilar para producción
   npm run preview  # Preview de la versión de producción
   npm run lint     # Ejecutar ESLint
   ```

### Backend (Node.js + Express)

5. **Instalar dependencias del backend:**
   ```bash
   cd ../backend-node
   npm install
   ```

6. **Configurar variables de entorno:**
   - Editar el archivo `.env` según tus necesidades

7. **Ejecutar el servidor:**
   ```bash
   # Desarrollo (con nodemon)
   npm run dev

   # Producción
   npm start
   ```
   - API disponible en: http://localhost:3000

8. **Comandos disponibles:**
   ```bash
   npm start    # Ejecutar servidor (producción)
   npm run dev  # Ejecutar servidor con nodemon (desarrollo)
   ```

## 📡 Endpoints de la API

### Endpoints disponibles:
- `GET /` - Información básica de la API
- `GET /api/health` - Estado de salud del servidor
- `GET /api/data` - Datos de ejemplo

### Ejemplos de uso:
```bash
# Verificar estado de la API
curl http://localhost:3000/

# Obtener datos de ejemplo
curl http://localhost:3000/api/data

# Verificar salud del servidor
curl http://localhost:3000/api/health
```

## 🔧 Comandos WSL Útiles

### Iniciar WSL con la distribución "redes":
```powershell
wsl -d redes
```

### Navegar al proyecto desde WSL:
```bash
cd /mnt/d/Desarrollo/appredes
```

### Ejecutar ambos servidores simultáneamente:
```bash
# Terminal 1 - Backend
cd backend-node && npm run dev

# Terminal 2 - Frontend  
cd frontend-react && npm run dev
```

## 📝 Notas Importantes

- El frontend corre en el puerto **5173**
- El backend corre en el puerto **3000**
- Ambos proyectos están configurados con CORS para permitir comunicación entre frontends y backend
- El backend incluye manejo básico de errores y rutas no encontradas
- El frontend está configurado con Vite para desarrollo rápido y hot reload

## 🏃‍♂️ Inicio Rápido

Para una configuración rápida, ejecutar en diferentes terminales WSL:

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

¡Ahora ya tienes tu stack completo funcionando! 🎉