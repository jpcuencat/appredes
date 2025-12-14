const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');

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

module.exports = router;
