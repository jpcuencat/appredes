const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const videoQueue = require('../services/videoQueue');
const ttsService = require('../services/ttsService');
const imageService = require('../services/imageService');
const videoService = require('../services/videoService');
const fs = require('fs').promises;
const path = require('path');

// Almacenamiento en memoria para trabajos de video
let videoJobs = [];

// Función para procesar video directamente sin cola
async function processVideoDirectly(jobId, script, settings) {
  console.log(`\n🎬 Iniciando generación de video - Job ID: ${jobId}`);
  
  // Actualizar estado
  const updateJob = (updates) => {
    const jobIndex = videoJobs.findIndex(j => j.id === jobId);
    if (jobIndex !== -1) {
      videoJobs[jobIndex] = { ...videoJobs[jobIndex], ...updates, updatedAt: new Date().toISOString() };
    }
  };

  try {
    updateJob({ status: 'processing', progress: 10 });

    // Paso 1: Generar audios
    console.log('\n🎤 Generando audios...');
    const audioFiles = await ttsService.generateSceneAudios(script, settings.voice || 'es');
    updateJob({ progress: 33 });

    // Paso 2: Generar imágenes
    console.log(`\n🖼️  Generando ${script.length} imágenes...`);
    console.log('📝 Configuración de imágenes:', {
      width: settings.videoWidth || 1080,
      height: settings.videoHeight || 1920,
      style: settings.imageStyle || 'digital art'
    });
    
    let imageFiles;
    try {
      imageFiles = await imageService.generateSceneImages(script, {
        width: settings.videoWidth || 1080,
        height: settings.videoHeight || 1920,
        style: settings.imageStyle || 'digital art'
      });
      console.log(`✅ ${imageFiles.length} imágenes generadas exitosamente`);
      updateJob({ progress: 66 });
    } catch (imageError) {
      console.error('❌ Error generando imágenes:', imageError);
      console.error('❌ Stack trace:', imageError.stack);
      throw new Error(`Fallo en generación de imágenes: ${imageError.message}`);
    }

    // Paso 3: Componer video
    console.log('\n🎞️  Componiendo video...');
    const videoResult = await videoService.generateVideo(script, audioFiles, imageFiles, {
      width: settings.videoWidth || 1080,
      height: settings.videoHeight || 1920,
      fps: settings.fps || 30
    });
    updateJob({ progress: 90 });

    // Limpieza
    console.log('\n🧹 Limpiando archivos temporales...');
    await ttsService.cleanupAudioFiles(audioFiles.map(a => a.audioPath));
    await imageService.cleanupImageFiles(imageFiles.map(i => i.imagePath));

    updateJob({ 
      status: 'completed', 
      progress: 100, 
      videoUrl: videoResult.videoUrl,
      videoPath: videoResult.videoPath 
    });

    console.log(`\n✅ Video completado: ${videoResult.videoName}`);

  } catch (error) {
    console.error('\n❌ Error:', error);
    updateJob({ status: 'failed', error: error.message });
  }
}

// POST - Generar video desde un guion
router.post('/generate', async (req, res) => {
  try {
    const { scriptId, script, settings } = req.body;

    if (!script || !script.scenes || !Array.isArray(script.scenes)) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos. Se requiere un guion con escenas'
      });
    }

    const jobId = uuidv4();

    const videoJob = {
      id: jobId,
      scriptId: scriptId || null,
      script,
      settings: settings || {
        videoWidth: 1080,
        videoHeight: 1920,
        fps: 30,
        voice: 'es-ES'
      },
      status: 'pending',
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      videoUrl: null,
      error: null
    };

    videoJobs.push(videoJob);

    // Procesar directamente sin cola
    processVideoDirectly(jobId, script.scenes, {
      ...videoJob.settings,
      imageStyle: settings?.imageStyle || 'digital art',
      generateImages: true
    });

    res.status(202).json({
      success: true,
      message: 'Video en proceso de generación',
      data: {
        jobId,
        status: 'pending'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET - Obtener estado de un trabajo de video
router.get('/status/:jobId', async (req, res) => {
  try {
    const videoJob = videoJobs.find(j => j.id === req.params.jobId);

    if (!videoJob) {
      return res.status(404).json({
        success: false,
        error: 'Trabajo no encontrado'
      });
    }

    res.json({
      success: true,
      data: videoJob
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET - Listar todos los videos generados
router.get('/', async (req, res) => {
  try {
    const completedVideos = videoJobs.filter(j => j.status === 'completed');

    res.json({
      success: true,
      data: completedVideos
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Función helper para actualizar estado del trabajo
function updateJobStatus(jobId, updates) {
  const index = videoJobs.findIndex(j => j.id === jobId);
  if (index !== -1) {
    videoJobs[index] = {
      ...videoJobs[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
  }
}

// Exportar función para que el worker pueda actualizar el estado
router.updateJobStatus = updateJobStatus;
global.updateVideoJobStatus = updateJobStatus;

module.exports = router;
