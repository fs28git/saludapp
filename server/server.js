const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const app = require('../app');  // <-- aquí la ruta relativa correcta

dotenv.config();

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/saludapp';

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Conectado a MongoDB');
  app.listen(PORT, () => {
    console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
  });
})
.catch((err) => {
  console.error('❌ Error al conectar a MongoDB:', err.message);
});
