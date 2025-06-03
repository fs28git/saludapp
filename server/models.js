const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

///////////////////////////
// Esquema de Recetas
///////////////////////////
const RecetaSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  descripcion: { type: String, required: true },
  ingredientes: [{ 
    nombre: { type: String, required: true },
    cantidad: String,
    unidad: String 
  }],
  instrucciones: [{ type: String, required: true }],
  tiempoPreparacion: { type: Number, required: true }, // en minutos
  dificultad: { 
    type: String, 
    enum: ['Fácil', 'Media', 'Difícil'], 
    required: true 
  },
  etiquetas: {
    type: [{ type: String }],
    validate: {
      validator: etiquetas => etiquetas.length > 0,
      message: 'Debe incluir al menos una etiqueta'
    }
  },
  informacionNutricional: {
    calorias: { type: Number, required: true },
    proteinas: Number,
    carbohidratos: Number,
    grasas: Number,
    fibra: Number
  },
  imagen: String,
  creador: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
  valoraciones: [{
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    puntuacion: { type: Number, min: 1, max: 5, required: true },
    comentario: String,
    fecha: { type: Date, default: Date.now }
  }],
  promedioValoracion: { type: Number, default: 0 },
  fechaCreacion: { type: Date, default: Date.now }
});

// Método para calcular el promedio de valoraciones
RecetaSchema.methods.calcularPromedio = function() {
  if (this.valoraciones.length === 0) return 0;
  const suma = this.valoraciones.reduce((acc, val) => acc + val.puntuacion, 0);
  this.promedioValoracion = Math.round((suma / this.valoraciones.length) * 10) / 10;
  return this.promedioValoracion;
};

///////////////////////////
// Esquema de Usuario
///////////////////////////
const UsuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  objetivo: { 
    type: String, 
    enum: ['perder peso', 'aumentar masa', 'mantener', 'vegana', 'fitness'],
    required: true
  },
  restricciones: [{ type: String }],
  preferencias: [{ type: String }],
  historialComidas: [{
    receta: { type: mongoose.Schema.Types.ObjectId, ref: 'Receta' },
    fecha: { type: Date, default: Date.now },
    porciones: Number,
    notas: String
  }],
  planSemanal: [{
    dia: { type: String, enum: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'], required: true },
    comida: { type: String, enum: ['Desayuno', 'Almuerzo', 'Cena', 'Snack'], required: true },
    receta: { type: mongoose.Schema.Types.ObjectId, ref: 'Receta', required: true }
  }],
  puntos: { type: Number, default: 0 },
  esNutricionista: { type: Boolean, default: false },
  pacientes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' }],
  fechaRegistro: { type: Date, default: Date.now },
  resetPasswordToken: String,
  resetPasswordExpires: Date
});

// Hash de la contraseña antes de guardar
UsuarioSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Método para comparar contraseñas
UsuarioSchema.methods.comparePassword = function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

///////////////////////////
// Esquema de Comunidad
///////////////////////////
const ComunidadSchema = new mongoose.Schema({
  tipo: { type: String, enum: ['foro', 'grupo', 'reto'], required: true },
  titulo: { type: String, required: true },
  descripcion: { type: String, required: true },
  creador: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  miembros: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' }],
  publicaciones: [{
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    contenido: { type: String, required: true },
    fecha: { type: Date, default: Date.now },
    comentarios: [{
      usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
      contenido: { type: String, required: true },
      fecha: { type: Date, default: Date.now }
    }]
  }],
  fechaCreacion: { type: Date, default: Date.now },
  fechaFin: Date,
  estado: { type: String, enum: ['activo', 'inactivo', 'completado'], default: 'activo' }
});

///////////////////////////
// Esquema de ListaCompra
///////////////////////////
const ListaCompraSchema = new mongoose.Schema({
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  ingredientes: [{
    nombre: { type: String, required: true },
    cantidad: { type: String, required: true },
    comprado: { type: Boolean, default: false }
  }],
  fechaCreacion: { type: Date, default: Date.now },
  fechaActualizacion: Date
});

///////////////////////////
// Exportación de modelos
///////////////////////////
const Receta = mongoose.model('Receta', RecetaSchema);
const Usuario = mongoose.model('Usuario', UsuarioSchema);
const Comunidad = mongoose.model('Comunidad', ComunidadSchema);
const ListaCompra = mongoose.model('ListaCompra', ListaCompraSchema);

module.exports = { Receta, Usuario, Comunidad, ListaCompra };
