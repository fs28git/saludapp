const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const usuarioSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true,
    minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
    maxlength: [50, 'El nombre no puede exceder 50 caracteres']
  },
  email: {
    type: String,
    required: [true, 'El email es requerido'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Formato de email inválido']
  },
  contraseña: {
    type: String,
    required: [true, 'La contraseña es requerida'],
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres']
  },
  objetivo: {
    type: String,
    required: [true, 'El objetivo es requerido'],
    enum: {
      values: ['perder_peso', 'ganar_peso', 'mantener_peso', 'ganar_musculo', 'mejorar_salud'],
      message: 'Objetivo no válido'
    }
  },
  restricciones: [{
    type: String,
    trim: true
  }],
  fechaUltimoAcceso: {
    type: Date,
    default: Date.now
  },
  activo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true // Crea automáticamente createdAt y updatedAt
});

// Middleware para hashear la contraseña antes de guardar
usuarioSchema.pre('save', async function(next) {
  // Solo hashear si la contraseña fue modificada
  if (!this.isModified('contraseña')) return next();
  
  try {
    // Generar salt y hashear la contraseña
    const salt = await bcrypt.genSalt(12);
    this.contraseña = await bcrypt.hash(this.contraseña, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar contraseñas
usuarioSchema.methods.compararContraseña = async function(contraseñaIngresada) {
  try {
    return await bcrypt.compare(contraseñaIngresada, this.contraseña);
  } catch (error) {
    throw new Error('Error al comparar contraseñas');
  }
};

// Método para obtener datos públicos del usuario
usuarioSchema.methods.toJSON = function() {
  const usuario = this.toObject();
  delete usuario.contraseña;
  return usuario;
};

// Índices para mejorar rendimiento
usuarioSchema.index({ email: 1 });
usuarioSchema.index({ activo: 1 });

module.exports = mongoose.model('Usuario', usuarioSchema);
