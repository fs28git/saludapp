// models/publicacion.model.js
const mongoose = require('mongoose');

const publicacionSchema = new mongoose.Schema({
  contenido: { type: String, required: true },
  autor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' }],
  comentarios: [{
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
    contenido: String,
    fecha: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Publicacion', publicacionSchema);