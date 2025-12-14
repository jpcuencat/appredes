const Queue = require('bull');
const ttsService = require('./ttsService');
const imageService = require('./imageService');
const videoService = require('./videoService');

// Crear cola de videos sin Redis (modo local)
const videoQueue = new Queue('video-generation', {
  // Configuración para funcionar sin Redis
  settings: {
    stalledInterval: 30 * 1000,
    maxStalledCount: 1
  },
  defaultJobOptions: {
    removeOnComplete: 5,
    removeOnFail: 10,
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  }
});

// Manejar errores de conexión sin interrumpir el servicio
videoQueue.on('error', (error) => {
  console.log('⚠️  Cola funcionando en modo local (sin Redis)');
});

// Procesar trabajos de generación de video
videoQueue.process('generate-video', async (job) => {
  const { jobId, script, settings } = job.data;

  console.log(`\n🎬 Iniciando generación de video - Job ID: ${jobId}`);
  console.log(`📝 Número de escenas: ${script.length}`);

  try {
    // Actualizar estado: iniciando
    if (global.updateVideoJobStatus) {
      global.updateVideoJobStatus(jobId, {
        status: 'processing',
        progress: 0
      });
    }

    // Paso 1: Generar audios (33% del progreso)
    job.progress(10);
    console.log('\n🎤 Paso 1/3: Generando audios...');
    const audioFiles = await ttsService.generateSceneAudios(
      script,
      settings.voice || 'es'
    );

    if (global.updateVideoJobStatus) {
      global.updateVideoJobStatus(jobId, {
        status: 'processing',
        progress: 33
      });
    }
    job.progress(33);

    // Paso 2: Generar imágenes (66% del progreso)
    console.log('\n🖼️  Paso 2/3: Generando imágenes...');
    const imageFiles = await imageService.generateSceneImages(script, {
      width: settings.videoWidth || 1080,
      height: settings.videoHeight || 1920
    });

    if (global.updateVideoJobStatus) {
      global.updateVideoJobStatus(jobId, {
        status: 'processing',
        progress: 66
      });
    }
    job.progress(66);

    // Paso 3: Componer video final (100% del progreso)
    console.log('\n🎞️  Paso 3/3: Componiendo video final...');
    const videoResult = await videoService.generateVideo(
      script,
      audioFiles,
      imageFiles,
      {
        width: settings.videoWidth || 1080,
        height: settings.videoHeight || 1920,
        fps: settings.fps || 30
      }
    );

    job.progress(90);

    // Limpieza de archivos temporales
    console.log('\n🧹 Limpiando archivos temporales...');
    await ttsService.cleanupAudioFiles(audioFiles.map(a => a.audioPath));
    await imageService.cleanupImageFiles(imageFiles.map(i => i.imagePath));

    // Actualizar estado: completado
    if (global.updateVideoJobStatus) {
      global.updateVideoJobStatus(jobId, {
        status: 'completed',
        progress: 100,
        videoUrl: videoResult.videoUrl,
        videoPath: videoResult.videoPath
      });
    }

    job.progress(100);

    console.log(`\n✅ Video generado exitosamente: ${videoResult.videoName}`);
    console.log(`📍 URL: ${videoResult.videoUrl}`);

    return {
      success: true,
      videoUrl: videoResult.videoUrl,
      videoName: videoResult.videoName
    };

  } catch (error) {
    console.error('\n❌ Error generando video:', error);

    // Actualizar estado: error
    if (global.updateVideoJobStatus) {
      global.updateVideoJobStatus(jobId, {
        status: 'failed',
        error: error.message
      });
    }

    throw error;
  }
});

// Event listeners para monitoreo
videoQueue.on('completed', (job, result) => {
  console.log(`\n🎉 Job ${job.id} completado exitosamente`);
});

videoQueue.on('failed', (job, err) => {
  console.error(`\n💥 Job ${job.id} falló:`, err.message);
});

videoQueue.on('progress', (job, progress) => {
  console.log(`📊 Job ${job.id} progreso: ${progress}%`);
});

// Manejo de errores de conexión a Redis
videoQueue.on('error', (error) => {
  console.error('❌ Error en la cola:', error.message);
  if (error.message.includes('ECONNREFUSED')) {
    console.log('⚠️  Redis no disponible. La cola funcionará en modo local.');
  }
});

module.exports = videoQueue;
