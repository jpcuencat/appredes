const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const videoQueue = require('../services/videoQueue');
const fs = require('fs').promises;
const path = require('path');

// Almacenamiento en memoria para trabajos de video
let videoJobs = [];

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

    // Agregar trabajo a la cola
    const job = await videoQueue.add('generate-video', {
      jobId,
      script: script.scenes,
      settings: videoJob.settings
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
