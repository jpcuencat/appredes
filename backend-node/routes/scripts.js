const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');
const OpenAI = require('openai');

// Configurar OpenAI (opcional)
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

// Almacenamiento en memoria (en producción usar una base de datos)
let scripts = [];

// GET - Obtener todos los guiones
router.get('/', async (req, res) => {
  try {
    res.json({
      success: true,
      data: scripts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST - Generar guion con IA (DEBE IR ANTES QUE /:id)
router.post('/generate', async (req, res) => {
  console.log('🎯 Ruta /generate llamada con:', req.body);
  try {
    const { topic, style, duration } = req.body;
    
    if (!topic) {
      return res.status(400).json({
        success: false,
        error: 'El tema es requerido'
      });
    }

    let generatedScript;
    
    // Si hay OpenAI configurado, usarlo
    if (openai) {
      try {
        console.log('📝 Intentando generar guion con OpenAI...');
        const prompt = `Genera un guion para un video corto tipo TikTok/YouTube Shorts de ${duration || 30} segundos sobre "${topic}". El estilo debe ser ${style || 'informativo y entretenido'}.

IMPORTANTE: Este es un video CORTO, no un documental. Los textos deben ser BREVES y DIRECTOS.

Estructura el guion en 3-5 escenas MUY CORTAS. Para cada escena:
1. Texto de narración: MÁXIMO 8-10 palabras (frases cortas y directas)
2. Descripción visual: Detallada y específica para generar imagen con IA

Ejemplos de textos CORRECTOS (cortos):
- "Descubre el secreto de ${topic}"
- "Esto cambiará tu vida"
- "El dato más sorprendente"
- "Lo que nadie te dice"

Ejemplos de textos INCORRECTOS (demasiado largos):
- "En este video vamos a explorar todos los aspectos fascinantes de..."
- "Prepárate para descubrir información que cambiará completamente..."

Formato de respuesta JSON:
{
  "title": "Título del video (máximo 8 palabras)",
  "scenes": [
    {
      "text": "Texto corto y directo (8-10 palabras máximo)",
      "imagePrompt": "Descripción visual detallada para IA",
      "duration": 5
    }
  ]
}`;

        const response = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [{
            role: "user",
            content: prompt
          }],
          temperature: 0.8,
          max_tokens: 1000
        });

        const content = response.choices[0].message.content;
        console.log('✅ Respuesta de OpenAI recibida');
        
        // Intentar parsear la respuesta JSON
        generatedScript = JSON.parse(content);
        
        // Validar que la estructura sea correcta
        if (!generatedScript.title || !Array.isArray(generatedScript.scenes)) {
          throw new Error('Respuesta de OpenAI no tiene estructura válida');
        }
        
        console.log('✅ Guion generado con éxito por OpenAI');
      } catch (aiError) {
        console.error('❌ Error con OpenAI:', aiError.message);
        console.log('⚠️  Usando generador local como fallback');
        generatedScript = generateLocalScript(topic, style, duration);
      }
    } else {
      // Generador local si no hay API key
      console.log('ℹ️  No hay OPENAI_API_KEY configurada, usando generador local');
      generatedScript = generateLocalScript(topic, style, duration);
    }

    // Validar estructura final
    if (!generatedScript || !generatedScript.title || !generatedScript.scenes) {
      throw new Error('Estructura de guion inválida generada');
    }

    res.json({
      success: true,
      data: generatedScript
    });
  } catch (error) {
    console.error('❌ Error en ruta /generate:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error al generar el guion'
    });
  }
});

// GET - Obtener un guion específico
router.get('/:id', async (req, res) => {
  try {
    const script = scripts.find(s => s.id === req.params.id);
    if (!script) {
      return res.status(404).json({
        success: false,
        error: 'Guion no encontrado'
      });
    }
    res.json({
      success: true,
      data: script
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST - Crear un nuevo guion
router.post('/', async (req, res) => {
  try {
    const { title, scenes, settings } = req.body;

    if (!title || !scenes || !Array.isArray(scenes)) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos. Se requiere título y escenas'
      });
    }

    const script = {
      id: uuidv4(),
      title,
      scenes,
      settings: settings || {
        videoWidth: 1080,
        videoHeight: 1920,
        fps: 30,
        voice: 'es-ES',
        backgroundMusic: false
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    scripts.push(script);

    res.status(201).json({
      success: true,
      data: script
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PUT - Actualizar un guion
router.put('/:id', async (req, res) => {
  try {
    const index = scripts.findIndex(s => s.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: 'Guion no encontrado'
      });
    }

    const { title, scenes, settings } = req.body;
    scripts[index] = {
      ...scripts[index],
      title: title || scripts[index].title,
      scenes: scenes || scripts[index].scenes,
      settings: settings || scripts[index].settings,
      updatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      data: scripts[index]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE - Eliminar un guion
router.delete('/:id', async (req, res) => {
  try {
    const index = scripts.findIndex(s => s.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: 'Guion no encontrado'
      });
    }

    scripts.splice(index, 1);

    res.json({
      success: true,
      message: 'Guion eliminado correctamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Función para generar guiones localmente
function generateLocalScript(topic, style, duration) {
  const templates = {
    informativo: [
      "¿Sabías que {topic} puede cambiar tu perspectiva?",
      "Descubre los secretos detrás de {topic}",
      "La verdad sobre {topic} que nadie te cuenta",
      "Datos fascinantes sobre {topic}",
      "Lo que realmente significa {topic}"
    ],
    entretenido: [
      "¡Prepárate para conocer {topic} como nunca antes!",
      "La historia más loca sobre {topic}",
      "¿Qué pasaría si {topic} fuera diferente?",
      "El lado divertido de {topic}",
      "{topic}: más increíble de lo que imaginas"
    ],
    educativo: [
      "Aprende sobre {topic} en 30 segundos",
      "Todo sobre {topic} explicado simple",
      "Guía rápida: {topic} para principiantes",
      "Los fundamentos de {topic}",
      "Domina {topic} con estos consejos"
    ]
  };

  const selectedStyle = style?.toLowerCase() || 'informativo';
  const titleTemplates = templates[selectedStyle] || templates.informativo;
  const title = titleTemplates[Math.floor(Math.random() * titleTemplates.length)].replace('{topic}', topic);
  
  const sceneCount = Math.min(Math.max(Math.floor((duration || 30) / 8), 3), 5);
  const scenes = [];
  
  const sceneTemplates = [
    {
      text: `Descubre los secretos de ${topic}`,
      imagePrompt: `Escena de apertura cinematográfica sobre ${topic}, colores vibrantes, composición dinámica, iluminación dramática, estilo digital art moderno`
    },
    {
      text: `Los datos más sorprendentes sobre ${topic}`,
      imagePrompt: `Infografía visual impactante mostrando datos clave sobre ${topic}, gráficos coloridos, estadísticas visuales, diseño moderno`
    },
    {
      text: `Lo que no sabías de ${topic}`,
      imagePrompt: `Imagen misteriosa y fascinante sobre ${topic}, ambiente dramático, efectos visuales impactantes, colores intensos`
    },
    {
      text: `Por qué ${topic} es tan importante`,
      imagePrompt: `Visualización conceptual del impacto de ${topic}, conexiones visuales, elementos simbólicos, representación artística`
    },
    {
      text: `Ahora ya conoces todo sobre ${topic}`,
      imagePrompt: `Imagen inspiradora de conclusión sobre ${topic}, sensación de logro, elementos visuales positivos, colores cálidos`
    }
  ];

  for (let i = 0; i < sceneCount; i++) {
    const template = sceneTemplates[i % sceneTemplates.length];
    scenes.push({
      text: template.text,
      imagePrompt: template.imagePrompt,
      duration: Math.floor((duration || 30) / sceneCount)
    });
  }

  return {
    title,
    scenes
  };
}

module.exports = router;
