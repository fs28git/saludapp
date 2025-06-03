const mongoose = require('mongoose');
const { recetas } = require('./recetas');
const Receta = require('./models/recetaModel');

async function conectarYGuardar() {
  try {
    // Conectar a MongoDB (ajusta la URL con tu configuración)
    await mongoose.connect('mongodb://localhost:27017/mi_base_de_datos', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Conectado a MongoDB');

    // Eliminar todas las recetas existentes para evitar duplicados
    await Receta.deleteMany({});
    console.log('Colección recetas limpiada');

    // Insertar las recetas desde recetas.js
    await Receta.insertMany(recetas);
    console.log('Recetas insertadas correctamente');

  } catch (error) {
    console.error('Error en la conexión o inserción:', error);
  } finally {
    // Cerrar la conexión
    await mongoose.disconnect();
    console.log('Desconectado de MongoDB');
  }
}

// Ejecutar la función
conectarYGuardar();
