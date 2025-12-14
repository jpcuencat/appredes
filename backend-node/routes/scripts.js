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
        const prompt = `Genera un guion para un video corto de ${duration || 30} segundos sobre "${topic}". El estilo debe ser ${style || 'informativo y entretenido'}. 

Estructura el guion en 3-5 escenas cortas. Para cada escena proporciona:
1. Texto de narración (máximo 20 palabras por escena)
2. Descripción visual para generar imagen

Formato de respuesta JSON:
{
  "title": "Título del video",
  "scenes": [
    {
      "text": "Texto de narración",
      "imagePrompt": "Descripción visual detallada",
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

        generatedScript = JSON.parse(response.choices[0].message.content);
      } catch (aiError) {
        console.log('Error con IA, usando generador local:', aiError.message);
        generatedScript = generateLocalScript(topic, style, duration);
      }
    } else {
      // Generador local si no hay API key
      generatedScript = generateLocalScript(topic, style, duration);
    }

    res.json({
      success: true,
      data: generatedScript
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
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
      text: `Bienvenidos a un viaje fascinante donde exploraremos los secretos más increíbles sobre ${topic}. Prepárense para descubrir información que cambiará completamente su perspectiva y les dará una nueva comprensión del mundo.`,
      imagePrompt: `Escena de apertura cinematográfica sobre ${topic}, con elementos visuales llamativos, colores vibrantes, composición dinámica, iluminación dramática, estilo digital art moderno`
    },
    {
      text: `Aquí están los datos más sorprendentes y fundamentales que necesitan conocer sobre ${topic}. Esta información es crucial y les ayudará a entender por qué este tema es tan relevante en nuestro mundo actual.`,
      imagePrompt: `Infografía visual impactante mostrando datos clave sobre ${topic}, gráficos coloridos, estadísticas visuales, diseño moderno y profesional, elementos informativos claros`
    },
    {
      text: `Prepárense para la revelación más impactante: el aspecto más extraordinario de ${topic} que la mayoría de las personas desconoce por completo. Esto les sorprenderá y les hará reflexionar profundamente.`,
      imagePrompt: `Imagen misteriosa y fascinante sobre los aspectos ocultos de ${topic}, ambiente dramático, efectos visuales impactantes, colores intensos, composición artística sorprendente`
    },
    {
      text: `La pregunta que todos se hacen: ¿por qué ${topic} tiene un impacto tan profundo en nuestras vidas diarias? Descubran las conexiones ocultas y las razones fundamentales que explican su importancia absoluta.`,
      imagePrompt: `Visualización conceptual del impacto de ${topic} en la vida cotidiana, conexiones visuales, elementos simbólicos, representación artística de influencia y relevancia`
    },
    {
      text: `Ahora poseen un conocimiento completo y transformador sobre ${topic}. Utilicen esta sabiduría para mejorar sus vidas, tomar mejores decisiones y compartir este valioso aprendizaje con las personas que los rodean.`,
      imagePrompt: `Imagen inspiradora de conclusión sobre ${topic}, sensación de logro y conocimiento, elementos visuales positivos, colores cálidos y motivadores, composición que inspire acción`
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
