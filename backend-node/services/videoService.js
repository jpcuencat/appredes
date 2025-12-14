const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

class VideoService {
  constructor() {
    this.tempDir = path.join(__dirname, '../temp');
    this.outputDir = path.join(__dirname, '../output');
  }

  /**
   * Crea un video a partir de una imagen y audio
   */
  createSceneVideo(imagePath, audioPath, outputPath, settings = {}) {
    return new Promise((resolve, reject) => {
      const { width = 1080, height = 1920, fps = 30 } = settings;

      ffmpeg()
        .input(imagePath)
        .inputOptions(['-loop 1']) // Loop infinito de la imagen
        .input(audioPath)
        .outputOptions([
          '-c:v libx264',
          '-tune stillimage',
          '-c:a copy', // Copiar audio sin recodificar para mantener duración
          '-pix_fmt yuv420p',
          '-shortest', // El video durará lo mismo que el audio
          `-r ${fps}`,
          `-s ${width}x${height}`,
          '-avoid_negative_ts make_zero'
        ])
        .output(outputPath)
        .on('start', (cmd) => {
          console.log('FFmpeg iniciado:', cmd);
        })
        .on('progress', (progress) => {
          if (progress.percent) {
            console.log(`Progreso: ${Math.round(progress.percent)}%`);
          }
        })
        .on('end', () => {
          console.log('✅ Video de escena creado:', path.basename(outputPath));
          resolve(outputPath);
        })
        .on('error', (err) => {
          console.error('❌ Error creando video de escena:', err.message);
          reject(err);
        })
        .run();
    });
  }

  /**
   * Concatena múltiples videos en uno solo
   */
  async concatenateVideos(videoPaths, outputPath) {
    return new Promise(async (resolve, reject) => {
      try {
        // Crear archivo de lista para FFmpeg
        const listFilePath = path.join(this.tempDir, `concat_${uuidv4()}.txt`);
        const listContent = videoPaths.map(p => `file '${p}'`).join('\n');
        await fs.writeFile(listFilePath, listContent);

        ffmpeg()
          .input(listFilePath)
          .inputOptions(['-f concat', '-safe 0'])
          .outputOptions(['-c copy'])
          .output(outputPath)
          .on('start', (cmd) => {
            console.log('Concatenando videos:', cmd);
          })
          .on('progress', (progress) => {
            if (progress.percent) {
              console.log(`Progreso concatenación: ${Math.round(progress.percent)}%`);
            }
          })
          .on('end', async () => {
            console.log('✅ Videos concatenados exitosamente');
            // Limpiar archivo de lista
            try {
              await fs.unlink(listFilePath);
            } catch (e) {
              console.error('Error eliminando archivo de lista:', e);
            }
            resolve(outputPath);
          })
          .on('error', (err) => {
            console.error('❌ Error concatenando videos:', err.message);
            reject(err);
          })
          .run();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Genera el video completo a partir de escenas
   */
  async generateVideo(scenes, audioFiles, imageFiles, settings = {}) {
    const sceneVideos = [];
    const { width = 1080, height = 1920, fps = 30 } = settings;

    // Paso 1: Crear video para cada escena
    for (let i = 0; i < scenes.length; i++) {
      const sceneVideoPath = path.join(this.tempDir, `scene_${i}_${uuidv4()}.mp4`);

      console.log(`\n📹 Creando video para escena ${i + 1}/${scenes.length}...`);
      
      // Verificar duración del audio
      try {
        const audioDuration = await this.getAudioDuration(audioFiles[i].audioPath);
        console.log(`🎵 Audio de escena ${i + 1}: ${audioDuration.toFixed(2)}s`);
      } catch (error) {
        console.warn(`⚠️  No se pudo verificar duración del audio ${i + 1}`);
      }

      await this.createSceneVideo(
        imageFiles[i].imagePath,
        audioFiles[i].audioPath,
        sceneVideoPath,
        { width, height, fps }
      );

      sceneVideos.push(sceneVideoPath);
    }

    // Paso 2: Concatenar todos los videos
    const finalVideoName = `video_${uuidv4()}.mp4`;
    const finalVideoPath = path.join(this.outputDir, finalVideoName);

    console.log(`\n🎬 Concatenando ${sceneVideos.length} escenas...`);
    await this.concatenateVideos(sceneVideos, finalVideoPath);

    // Paso 3: Limpiar videos temporales de escenas
    for (const videoPath of sceneVideos) {
      try {
        await fs.unlink(videoPath);
        console.log(`🗑️  Video temporal eliminado: ${path.basename(videoPath)}`);
      } catch (error) {
        console.error(`Error eliminando ${videoPath}:`, error.message);
      }
    }

    return {
      videoPath: finalVideoPath,
      videoName: finalVideoName,
      videoUrl: `/output/${finalVideoName}`
    };
  }

  /**
   * Obtiene la duración de un archivo de audio
   */
  getAudioDuration(audioPath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(audioPath, (err, metadata) => {
        if (err) {
          reject(err);
        } else {
          const duration = metadata.format.duration;
          console.log(`⏱️  Duración del audio: ${duration} segundos`);
          resolve(duration);
        }
      });
    });
  }

  /**
   * Añade música de fondo al video (opcional)
   */
  async addBackgroundMusic(videoPath, musicPath, outputPath, volume = 0.3) {
    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(videoPath)
        .input(musicPath)
        .complexFilter([
          `[1:a]volume=${volume}[music]`,
          '[0:a][music]amix=inputs=2:duration=shortest[aout]'
        ])
        .outputOptions([
          '-map 0:v',
          '-map [aout]',
          '-c:v copy',
          '-c:a aac'
        ])
        .output(outputPath)
        .on('end', () => {
          console.log('✅ Música de fondo añadida');
          resolve(outputPath);
        })
        .on('error', (err) => {
          console.error('❌ Error añadiendo música:', err.message);
          reject(err);
        })
        .run();
    });
  }
}

module.exports = new VideoService();
