const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Crear directorios necesarios
const dirs = ['uploads', 'temp', 'output'];
dirs.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Servir archivos estáticos (videos generados)
app.use('/output', express.static(path.join(__dirname, 'output')));

// Importar rutas
const scriptsRoutes = require('./routes/scripts');
const videosRoutes = require('./routes/videos');

// Rutas básicas
app.get('/', (req, res) => {
  res.json({
    message: 'API para Generación de Videos Cortos',
    status: 'OK',
    timestamp: new Date().toISOString(),
    endpoints: {
      scripts: '/api/scripts',
      videos: '/api/videos',
      health: '/api/health'
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Rutas de la API
app.use('/api/scripts', scriptsRoutes);
app.use('/api/videos', videosRoutes);

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    message: `La ruta ${req.originalUrl} no existe en este servidor`
  });
});

// Manejo de errores
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: error.message
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
  console.log(`📁 Directorio de salida: ${path.join(__dirname, 'output')}`);
});
