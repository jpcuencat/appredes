const { createCanvas, loadImage } = require('canvas');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const OpenAI = require('openai');

// Configurar OpenAI para DALL-E
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

class ImageService {
  constructor() {
    this.tempDir = path.join(__dirname, '../temp');
  }

  /**
   * Genera una imagen simple con texto (placeholder)
   * Útil cuando no hay API de generación de imágenes disponible
   */
  async generatePlaceholderImage(text, sceneIndex, width = 1080, height = 1920) {
    console.log(`     🖼️ Creando placeholder ${sceneIndex + 1}...`);
    console.log(`     📏 Canvas: ${width}x${height}`);
    
    const filename = `image_${uuidv4()}.png`;
    const filepath = path.join(this.tempDir, filename);
    console.log(`     💾 Archivo destino: ${filepath}`);

    try {
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');
      console.log(`     🎨 Canvas creado exitosamente`);

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
      console.log(`     💾 Generando buffer PNG...`);
      const buffer = canvas.toBuffer('image/png');
      
      console.log(`     💾 Escribiendo archivo...`);
      await fs.writeFile(filepath, buffer);

      console.log(`     ✅ Imagen placeholder guardada: ${filename}`);
      return filepath;
      
    } catch (error) {
      console.error(`     ❌ Error creando placeholder: ${error.message}`);
      throw error;
    }
  }

  /**
   * Genera una imagen usando IA (DALL-E, Replicate, etc.)
   */
  async generateImageFromPrompt(prompt, sceneIndex, settings = {}) {
    const { width = 1080, height = 1920, style = 'digital art' } = settings;

    console.log(`\n🎨 [IMAGEN ${sceneIndex + 1}] Iniciando generación...`);
    console.log(`   📝 Prompt: "${prompt}"`);
    console.log(`   📏 Dimensiones: ${width}x${height}`);
    console.log(`   🎯 Estilo: ${style}`);

    try {
      // Asegurarse de que el directorio temp existe
      await fs.mkdir(this.tempDir, { recursive: true });
      console.log(`   📁 Directorio temp confirmado: ${this.tempDir}`);
      
      // Por ahora usar solo placeholders para evitar problemas
      console.log('   📄 Usando generador placeholder (modo seguro)');
      const imagePath = await this.generatePlaceholderImage(prompt, sceneIndex, width, height);
      console.log(`   ✅ Placeholder generado: ${imagePath}`);
      return imagePath;

      // TODO: Reactivar IA cuando esté estable
      /*
      // Mejorar el prompt para mejores resultados
      const enhancedPrompt = this.enhancePrompt(prompt, style);

      // Intentar con DALL-E si está disponible
      if (openai) {
        return await this.generateWithDALLE(enhancedPrompt, sceneIndex);
      }
      
      // Fallback: intentar con servicio gratuito (Unsplash)
      return await this.generateFromUnsplash(prompt, sceneIndex, { width, height });
      */
      
    } catch (error) {
      console.error(`   ❌ Error generando imagen: ${error.message}`);
      console.error(`   ❌ Stack: ${error.stack}`);
      throw error;
    }
  }

  /**
   * Mejora el prompt para mejores resultados
   */
  enhancePrompt(originalPrompt, style = 'digital art') {
    const stylePrompts = {
      'digital art': 'digital art, high quality, 4k, cinematic lighting',
      'photography': 'professional photography, sharp focus, natural lighting',
      'illustration': 'detailed illustration, vibrant colors, artistic style',
      'cartoon': 'cartoon style, colorful, cheerful, animated'
    };

    const baseStyle = stylePrompts[style] || stylePrompts['digital art'];
    return `${originalPrompt}, ${baseStyle}, vertical orientation, 9:16 aspect ratio`;
  }

  /**
   * Genera imagen usando DALL-E
   */
  async generateWithDALLE(prompt, sceneIndex) {
    try {
      console.log('🤖 Generando con DALL-E...');
      
      const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1024x1792', // Vertical para videos
        quality: 'standard'
      });

      const imageUrl = response.data[0].url;
      return await this.downloadImage(imageUrl);
      
    } catch (error) {
      console.error('Error con DALL-E:', error.message);
      throw error;
    }
  }

  /**
   * Genera imagen desde Unsplash (gratuito)
   */
  async generateFromUnsplash(prompt, sceneIndex, settings = {}) {
    try {
      console.log('🖼️  Buscando en Unsplash...');
      
      // Extraer palabras clave del prompt
      const keywords = this.extractKeywords(prompt);
      const query = keywords.join(',');
      
      const unsplashUrl = `https://source.unsplash.com/1080x1920/?${encodeURIComponent(query)}`;
      
      return await this.downloadImage(unsplashUrl);
      
    } catch (error) {
      console.error('Error con Unsplash:', error.message);
      throw error;
    }
  }

  /**
   * Extrae palabras clave relevantes del prompt
   */
  extractKeywords(prompt) {
    // Palabras comunes a filtrar
    const stopWords = ['el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'es', 'se', 'no', 'te', 'lo', 'le', 'da', 'su', 'por', 'son', 'con', 'para', 'una', 'sobre', 'muy', 'más', 'del', 'las', 'al', 'como', 'pero', 'sus', 'cuando', 'desde', 'entre', 'hasta', 'donde', 'sobre', 'estilo', 'imagen', 'visual'];
    
    const words = prompt.toLowerCase()
      .replace(/[^a-záéíóúñ\s]/g, '') // Remover puntuación
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.includes(word))
      .slice(0, 3); // Tomar solo las 3 más relevantes
    
    return words.length > 0 ? words : ['abstract', 'colorful', 'modern'];
  }

  /**
   * Genera imágenes para todas las escenas
   */
  async generateSceneImages(scenes, settings = {}) {
    const imageFiles = [];

    console.log(`📋 Iniciando generación de ${scenes.length} imágenes...`);

    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      console.log(`\n📸 [${i + 1}/${scenes.length}] Generando imagen para escena ${i + 1}...`);

      try {
        const prompt = scene.imagePrompt || scene.text || scene.narration || `Escena ${i + 1}`;
        console.log(`🎯 Prompt: "${prompt.substring(0, 80)}..."`);
        
        const imagePath = await this.generateImageFromPrompt(prompt, i, settings);

        if (!imagePath) {
          throw new Error('No se generó ruta de imagen');
        }

        imageFiles.push({
          sceneIndex: i,
          imagePath,
          prompt
        });
        
        console.log(`✅ Imagen ${i + 1} completada: ${imagePath}`);
        
      } catch (error) {
        console.error(`❌ Error en escena ${i + 1}:`, error.message);
        
        // Intentar generar imagen de respaldo
        try {
          console.log(`🔄 Generando imagen de respaldo para escena ${i + 1}...`);
          const fallbackPath = await this.generatePlaceholderImage(
            `Escena ${i + 1}: Error en generación`, 
            i, 
            settings.width || 1080, 
            settings.height || 1920
          );
          
          imageFiles.push({
            sceneIndex: i,
            imagePath: fallbackPath,
            prompt: `Fallback para escena ${i + 1}`
          });
          
          console.log(`🆘 Imagen de respaldo generada para escena ${i + 1}`);
          
        } catch (fallbackError) {
          console.error(`💥 Error crítico en escena ${i + 1}:`, fallbackError.message);
          throw new Error(`No se pudo generar imagen para escena ${i + 1}: ${error.message}`);
        }
      }
    }

    console.log(`\n🎊 Generación de imágenes completada: ${imageFiles.length}/${scenes.length} exitosas`);
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
