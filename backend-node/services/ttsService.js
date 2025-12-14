const gtts = require('gtts');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

class TTSService {
  constructor() {
    this.tempDir = path.join(__dirname, '../temp');
  }

  /**
   * Genera audio a partir de texto usando gTTS
   * @param {string} text - Texto a convertir en audio
   * @param {string} language - Código de idioma (default: 'es')
   * @param {Object} options - Opciones adicionales para el TTS
   * @returns {Promise<string>} - Ruta del archivo de audio generado
   */
  async textToSpeech(text, language = 'es', options = {}) {
    return new Promise((resolve, reject) => {
      try {
        if (!text || text.trim().length === 0) {
          reject(new Error('El texto no puede estar vacío'));
          return;
        }

        const filename = `audio_${uuidv4()}.mp3`;
        const filepath = path.join(this.tempDir, filename);

        // Configurar gTTS con velocidad lenta para audio más largo
        const gttsOptions = {
          lang: language,
          slow: options.slow || false // Velocidad lenta para más duración
        };

        console.log(`🎙️  Generando audio para: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);

        const gttsInstance = new gtts(text, gttsOptions.lang);

        gttsInstance.save(filepath, (err) => {
          if (err) {
            console.error('Error generando audio:', err);
            reject(err);
          } else {
            console.log(`✅ Audio generado: ${filename} (${text.length} caracteres)`);
            resolve(filepath);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Genera múltiples audios para un array de escenas
   * @param {Array} scenes - Array de escenas con texto
   * @param {string} language - Código de idioma
   * @returns {Promise<Array>} - Array de rutas de archivos de audio
   */
  async generateSceneAudios(scenes, language = 'es') {
    const audioFiles = [];

    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      console.log(`Generando audio para escena ${i + 1}/${scenes.length}...`);

      try {
        const audioPath = await this.textToSpeech(scene.text || scene.narration, language);
        audioFiles.push({
          sceneIndex: i,
          audioPath,
          text: scene.text || scene.narration
        });
      } catch (error) {
        console.error(`Error en escena ${i + 1}:`, error);
        throw error;
      }
    }

    return audioFiles;
  }

  /**
   * Limpia archivos de audio temporales
   * @param {Array} audioPaths - Array de rutas de archivos a eliminar
   */
  async cleanupAudioFiles(audioPaths) {
    for (const audioPath of audioPaths) {
      try {
        await fs.unlink(audioPath);
        console.log(`🗑️  Audio eliminado: ${path.basename(audioPath)}`);
      } catch (error) {
        console.error(`Error eliminando ${audioPath}:`, error.message);
      }
    }
  }
}

module.exports = new TTSService();
