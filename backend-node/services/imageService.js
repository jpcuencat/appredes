const { createCanvas, loadImage } = require('canvas');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

class ImageService {
  constructor() {
    this.tempDir = path.join(__dirname, '../temp');
  }

  /**
   * Genera una imagen simple con texto (placeholder)
   * Útil cuando no hay API de generación de imágenes disponible
   */
  async generatePlaceholderImage(text, sceneIndex, width = 1080, height = 1920) {
    const filename = `image_${uuidv4()}.png`;
    const filepath = path.join(this.tempDir, filename);

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Fondo con degradado
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Texto de la escena
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 60px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Dibujar número de escena
    ctx.font = 'bold 120px Arial';
    ctx.fillText(`Escena ${sceneIndex + 1}`, width / 2, height / 3);

    // Dibujar texto descriptivo (con word wrap)
    ctx.font = '40px Arial';
    const maxWidth = width - 100;
    const words = text.split(' ');
    let line = '';
    let y = height / 2;
    const lineHeight = 50;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, width / 2, y);
        line = words[n] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, width / 2, y);

    // Guardar imagen
    const buffer = canvas.toBuffer('image/png');
    await fs.writeFile(filepath, buffer);

    console.log(`🖼️  Imagen generada: ${filename}`);
    return filepath;
  }

  /**
   * Genera una imagen usando Stable Diffusion API (cuando esté disponible)
   * Por ahora usa placeholder
   */
  async generateImageFromPrompt(prompt, sceneIndex, settings = {}) {
    const { width = 1080, height = 1920 } = settings;

    // Aquí se integraría con Stable Diffusion API, Replicate, o similar
    // Por ahora, usamos placeholder
    console.log(`Generando imagen para: "${prompt}"`);

    // TODO: Integrar con API real de generación de imágenes
    // Ejemplo con Replicate:
    // const output = await replicate.run("stability-ai/sdxl", { input: { prompt } });

    return await this.generatePlaceholderImage(prompt, sceneIndex, width, height);
  }

  /**
   * Genera imágenes para todas las escenas
   */
  async generateSceneImages(scenes, settings = {}) {
    const imageFiles = [];

    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      console.log(`Generando imagen para escena ${i + 1}/${scenes.length}...`);

      try {
        const prompt = scene.imagePrompt || scene.text || scene.narration;
        const imagePath = await this.generateImageFromPrompt(prompt, i, settings);

        imageFiles.push({
          sceneIndex: i,
          imagePath,
          prompt
        });
      } catch (error) {
        console.error(`Error en escena ${i + 1}:`, error);
        throw error;
      }
    }

    return imageFiles;
  }

  /**
   * Descarga una imagen desde una URL
   */
  async downloadImage(url) {
    const filename = `downloaded_${uuidv4()}.png`;
    const filepath = path.join(this.tempDir, filename);

    const response = await axios.get(url, { responseType: 'arraybuffer' });
    await fs.writeFile(filepath, response.data);

    console.log(`📥 Imagen descargada: ${filename}`);
    return filepath;
  }

  /**
   * Limpia archivos de imagen temporales
   */
  async cleanupImageFiles(imagePaths) {
    for (const imagePath of imagePaths) {
      try {
        await fs.unlink(imagePath);
        console.log(`🗑️  Imagen eliminada: ${path.basename(imagePath)}`);
      } catch (error) {
        console.error(`Error eliminando ${imagePath}:`, error.message);
      }
    }
  }
}

module.exports = new ImageService();
