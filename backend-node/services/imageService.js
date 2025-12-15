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
   * Genera una imagen visual abstracta (placeholder mejorado)
   * Crea diseños visuales basados en colores y formas geométricas
   */
  async generatePlaceholderImage(text, sceneIndex, width = 1080, height = 1920) {
    console.log(`     🖼️ Creando placeholder visual ${sceneIndex + 1}...`);
    console.log(`     📏 Canvas: ${width}x${height}`);

    const filename = `image_${uuidv4()}.png`;
    const filepath = path.join(this.tempDir, filename);
    console.log(`     💾 Archivo destino: ${filepath}`);

    try {
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');
      console.log(`     🎨 Canvas creado exitosamente`);

      // Paletas de colores para diferentes escenas
      const colorPalettes = [
        { bg1: '#FF6B6B', bg2: '#4ECDC4', accent1: '#FFE66D', accent2: '#95E1D3' },
        { bg1: '#667eea', bg2: '#764ba2', accent1: '#f093fb', accent2: '#4facfe' },
        { bg1: '#FA8BFF', bg2: '#2BD2FF', accent1: '#2BFF88', accent2: '#FDBB2D' },
        { bg1: '#4158D0', bg2: '#C850C0', accent1: '#FFCC70', accent2: '#FD1D1D' },
        { bg1: '#0093E9', bg2: '#80D0C7', accent1: '#13547a', accent2: '#80d0c7' },
        { bg1: '#8EC5FC', bg2: '#E0C3FC', accent1: '#f093fb', accent2: '#4facfe' },
      ];

      const palette = colorPalettes[sceneIndex % colorPalettes.length];

      // Fondo con degradado diagonal
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, palette.bg1);
      gradient.addColorStop(1, palette.bg2);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Agregar formas geométricas decorativas
      ctx.globalAlpha = 0.3;

      // Círculos decorativos
      for (let i = 0; i < 3; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const radius = 100 + Math.random() * 200;

        ctx.fillStyle = i % 2 === 0 ? palette.accent1 : palette.accent2;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Rectángulos rotados
      for (let i = 0; i < 2; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const w = 200 + Math.random() * 300;
        const h = 200 + Math.random() * 300;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(Math.random() * Math.PI / 4);
        ctx.fillStyle = palette.accent1;
        ctx.fillRect(-w/2, -h/2, w, h);
        ctx.restore();
      }

      ctx.globalAlpha = 1.0;

      // Capa semi-transparente para mejorar contraste del texto
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(0, height / 4, width, height / 2);

      // Número de escena con estilo
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 80px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 3;

      ctx.fillText(`ESCENA ${sceneIndex + 1}`, width / 2, height / 2 - 100);

      // Línea decorativa
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(width / 2 - 150, height / 2 - 40);
      ctx.lineTo(width / 2 + 150, height / 2 - 40);
      ctx.stroke();

      // Palabras clave del prompt (primeras 3 palabras importantes)
      ctx.font = '36px Arial';
      ctx.shadowBlur = 8;
      const keywords = this.extractKeywords(text).slice(0, 3).join(' • ').toUpperCase();
      ctx.fillText(keywords || 'ESCENA VISUAL', width / 2, height / 2 + 50);

      // Reset shadow
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      // Guardar imagen
      console.log(`     💾 Generando buffer PNG...`);
      const buffer = canvas.toBuffer('image/png');

      console.log(`     💾 Escribiendo archivo...`);
      await fs.writeFile(filepath, buffer);

      console.log(`     ✅ Imagen placeholder visual guardada: ${filename}`);
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
    const {
      width = 1080,
      height = 1920,
      style = 'digital art',
      imageGenerationMethod = 'placeholder' // 'dalle', 'unsplash', 'placeholder'
    } = settings;

    console.log(`\n🎨 [IMAGEN ${sceneIndex + 1}] Iniciando generación...`);
    console.log(`   📝 Prompt: "${prompt}"`);
    console.log(`   📏 Dimensiones: ${width}x${height}`);
    console.log(`   🎯 Estilo: ${style}`);
    console.log(`   🔧 Método: ${imageGenerationMethod}`);

    try {
      // Asegurarse de que el directorio temp existe
      await fs.mkdir(this.tempDir, { recursive: true });
      console.log(`   📁 Directorio temp confirmado: ${this.tempDir}`);

      // Mejorar el prompt para mejores resultados
      const enhancedPrompt = this.enhancePrompt(prompt, style);

      // Generar según el método seleccionado
      switch (imageGenerationMethod) {
        case 'dalle':
          if (openai) {
            console.log('   🤖 Usando DALL-E para generación de imagen...');
            return await this.generateWithDALLE(enhancedPrompt, sceneIndex);
          } else {
            console.log('   ⚠️  DALL-E seleccionado pero API key no configurada');
            console.log('   🔄 Cambiando a placeholder...');
            return await this.generatePlaceholderImage(prompt, sceneIndex, width, height);
          }

        case 'unsplash':
          console.log('   📸 Usando Unsplash para obtener imagen...');
          return await this.generateFromUnsplash(prompt, sceneIndex, { width, height });

        case 'placeholder':
        default:
          console.log('   🎨 Generando placeholder visual...');
          return await this.generatePlaceholderImage(prompt, sceneIndex, width, height);
      }

    } catch (error) {
      console.error(`   ❌ Error generando imagen: ${error.message}`);
      console.error(`   ❌ Stack: ${error.stack}`);

      // Fallback a placeholder en caso de error
      console.log('   🔄 Intentando generar placeholder como respaldo...');
      try {
        return await this.generatePlaceholderImage(prompt, sceneIndex, width, height);
      } catch (fallbackError) {
        console.error(`   💥 Error en fallback: ${fallbackError.message}`);
        throw error; // Lanzar el error original
      }
    }
  }

  /**
   * Mejora el prompt para mejores resultados
   */
  enhancePrompt(originalPrompt, style = 'digital art') {
    const stylePrompts = {
      'digital art': 'high quality digital art, cinematic lighting, professional, 4k resolution',
      'photography': 'professional photography, sharp focus, natural lighting, realistic',
      'illustration': 'detailed illustration, vibrant colors, artistic style, beautiful composition',
      'cartoon': 'cartoon style, colorful, cheerful, animated, fun'
    };

    const baseStyle = stylePrompts[style] || stylePrompts['digital art'];

    // Agregar instrucciones específicas para formato vertical
    const formatInstructions = 'vertical composition, portrait orientation';

    return `${originalPrompt}, ${baseStyle}, ${formatInstructions}`;
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
