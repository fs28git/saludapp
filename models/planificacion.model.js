const mongoose = require('mongoose');

const planificacionSchema = new mongoose.Schema({
  usuarioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true,
  },
  recetas: [{
    recetaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Receta',
      required: true,
    },
    fecha: {
      type: Date,
      default: Date.now,
    },
    diaSemana: {
      type: String,
      enum: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
      required: true,
    },
  }],
}, { timestamps: true });

module.exports = mongoose.model('Planificacion', planificacionSchema);