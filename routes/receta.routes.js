const express = require('express');
const router = express.Router();
const mongoose = require('mongoose'); // ADD THIS LINE
const Receta = require('../models/receta.model');
const Usuario = require('../models/usuario.model');
const { verificarToken } = require('../server/middleware/auth.js');
const bcrypt = require('bcryptjs');
// Obtener todas las recetas (sin filtro) - RUTA PÚBLICA
router.get('/', async (req, res) => {
  try {
    console.log('🔍 Obteniendo todas las recetas...');
    
    // Agregar paginación opcional
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const recetas = await Receta.find()
      .sort({ createdAt: -1 }) // Ordenar por más recientes
      .skip(skip)
      .limit(limit);
    
    const total = await Receta.countDocuments();
    
    console.log(`✅ Encontradas ${recetas.length} recetas de ${total} total`);
    
    res.json({
      success: true,
      count: recetas.length,
      total: total,
      page: page,
      totalPages: Math.ceil(total / limit),
      data: recetas
    });

  } catch (error) {
    console.error('❌ Error al obtener recetas:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener recetas',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor'
    });
  }
});

// Obtener recetas filtradas por usuario - RUTA CON AUTENTICACIÓN
router.get('/filtradas', verificarToken, async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario._id);
    
    if (!usuario) {
      return res.status(404).json({ 
        success: false,
        message: 'Usuario no encontrado' 
      });
    }

    const filtros = { $and: [] };

    // Filtrar por objetivo si existe
    if (usuario.objetivo) {
      filtros.$and.push({ 
        $or: [
          { objetivo: usuario.objetivo },
          { objetivo: { $exists: false } },
          { objetivo: null }
        ]
      });
    }

    // CORRECCIÓN: Filtrar por restricciones de manera correcta
    // Excluir recetas que contengan restricciones que el usuario NO puede consumir
    if (usuario.restricciones?.length > 0) {
      // Si el usuario tiene restricciones, excluir recetas que contengan ingredientes que no puede consumir
      filtros.$and.push({
        $or: [
          { restricciones: { $exists: false } },
          { restricciones: { $size: 0 } },
          { restricciones: { $not: { $elemMatch: { $nin: usuario.restricciones } } } }
        ]
      });
    }

    const query = filtros.$and.length > 0 ? filtros : {};
    console.log('Filtros aplicados:', JSON.stringify(query, null, 2));
    
    const recetas = await Receta.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: recetas.length,
      filtros: {
        objetivo: usuario.objetivo,
        restricciones: usuario.restricciones
      },
      data: recetas
    });

  } catch (error) {
    console.error('Error al obtener recetas filtradas:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor'
    });
  }
});

// Obtener una receta por ID
router.get('/:id', async (req, res) => {
  try {
    // Validar que el ID sea válido
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de receta inválido'
      });
    }

    const receta = await Receta.findById(req.params.id);
    
    if (!receta) {
      return res.status(404).json({ 
        success: false,
        message: 'Receta no encontrada' 
      });
    }
    
    res.json({
      success: true,
      data: receta
    });
    
  } catch (error) {
    console.error('Error al obtener receta:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener receta',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor'
    });
  }
});

// POST - Crear nueva receta (requiere autenticación)
router.post('/', verificarToken, async (req, res) => {
  try {
    // Validaciones adicionales
    const { titulo, descripcion, ingredientes, pasos } = req.body;
    
    if (!titulo || !descripcion || !ingredientes || !pasos) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos obligatorios: titulo, descripcion, ingredientes, pasos'
      });
    }

    if (!Array.isArray(ingredientes) || ingredientes.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere al menos un ingrediente'
      });
    }

    if (!Array.isArray(pasos) || pasos.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere al menos un paso'
      });
    }

    const nuevaReceta = new Receta(req.body);
    const recetaGuardada = await nuevaReceta.save();
    
    res.status(201).json({
      success: true,
      message: 'Receta creada exitosamente',
      data: recetaGuardada
    });
    
  } catch (error) {
    console.error('Error al crear receta:', error);
    
    // Manejar errores de validación de Mongoose
    if (error.name === 'ValidationError') {
      const errores = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errores: errores
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Error al crear receta',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor'
    });
  }
});

// PUT - Actualizar receta existente
router.put('/:id', verificarToken, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de receta inválido'
      });
    }

    const recetaActualizada = await Receta.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!recetaActualizada) {
      return res.status(404).json({
        success: false,
        message: 'Receta no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Receta actualizada exitosamente',
      data: recetaActualizada
    });

  } catch (error) {
    console.error('Error al actualizar receta:', error);
    
    if (error.name === 'ValidationError') {
      const errores = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errores: errores
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error al actualizar receta',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor'
    });
  }
});

// DELETE - Eliminar receta
router.delete('/:id', verificarToken, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de receta inválido'
      });
    }

    const recetaEliminada = await Receta.findByIdAndDelete(req.params.id);

    if (!recetaEliminada) {
      return res.status(404).json({
        success: false,
        message: 'Receta no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Receta eliminada exitosamente',
      data: recetaEliminada
    });

  } catch (error) {
    console.error('Error al eliminar receta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar receta',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor'
    });
  }
});

module.exports = router;
