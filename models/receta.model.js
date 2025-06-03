const mongoose = require('mongoose');

const recetaSchema = new mongoose.Schema({
  titulo: { 
    type: String, 
    required: true, 
    trim: true 
  },
  descripcion: { 
    type: String, 
    required: true 
  },
  ingredientes: [{ 
    type: String, 
    required: true 
  }],
  pasos: [{ 
    type: String, 
    required: true 
  }],
  restricciones: [{
    type: String,
    enum: ['sin gluten', 'sin lactosa', 'vegetariano', 'vegano', 'diabético']
  }],
  objetivo: {
    type: String,
    enum: ['perder peso', 'aumentar masa', 'mantener', 'vegano', 'fitness'], // Corregido: 'vegana' -> 'vegano'
    required: false
  },
  tiempoPreparacion: { 
    type: Number, // minutos
    min: 1
  },
  dificultad: { 
    type: String, 
    enum: ['fácil', 'media', 'difícil'], 
    default: 'fácil' 
  },
  imagenUrl: { 
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+/.test(v); // Validar URL si existe
      },
      message: 'La URL de la imagen debe ser válida'
    }
  }
}, {
  timestamps: true
});

// Índices para mejorar rendimiento en consultas
recetaSchema.index({ objetivo: 1 });
recetaSchema.index({ restricciones: 1 });
recetaSchema.index({ dificultad: 1 });

// CORRECCIÓN IMPORTANTE: Solo exportar una vez
module.exports = mongoose.model('Receta', recetaSchema);