// app.js (BACKEND) - VERSIÓN CORREGIDA
require('dotenv').config(); 
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); 
const path = require('path');
const helmet = require('helmet'); // Agregado para seguridad
const rateLimit = require('express-rate-limit'); // Agregado para rate limiting

// Importar todas las rutas
const recetasRouter = require('./routes/receta.routes');
const comunidadRouter = require('./routes/comunidad.routes');
const nutricionistasRouter = require('./routes/nutricionista.routes');
const usuarioRouter = require('./routes/usuario.routes');
const planificadorRouter = require('./routes/planificador.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// ==========================================
// CONFIGURACIÓN DE SEGURIDAD
// ==========================================

// Helmet para headers de seguridad
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// Rate limiting - protección contra ataques de fuerza bruta
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // límite por IP
  message: {
    error: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.',
    retryAfter: '15 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting más estricto para rutas de autenticación
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'production' ? 5 : 50, // máximo 5 intentos en producción
  message: {
    error: 'Demasiados intentos de login, intenta de nuevo más tarde.',
    retryAfter: '15 minutos'
  }
});

// ==========================================
// MIDDLEWARE GENERAL
// ==========================================

// Aplicar rate limiting
app.use('/api/', limiter);
app.use('/api/usuarios/login', authLimiter);
app.use('/api/usuarios/registro', authLimiter);

// CORS configurado de manera más específica
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requests sin origen (mobile apps, postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001', 
      'http://localhost:5000',
      process.env.FRONTEND_URL
    ].filter(Boolean); // Filtrar valores undefined
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`🚫 CORS blocked origin: ${origin}`);
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Body parsing con límites de tamaño
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : '0' // Cache en producción
}));

// ==========================================
// CONFIGURACIÓN DE BASE DE DATOS
// ==========================================

// Verificar que la URI de MongoDB se está cargando
console.log('🔍 Verificando MONGODB_URI:', process.env.MONGODB_URI ? 'Definida' : 'No definida');

// Conexión a MongoDB con configuración mejorada (CORREGIDA)
const MONGODB_URI = process.env.MONGODB_URI || 
                   process.env.MONGO_URI || 
                   'mongodb+srv://admin:1234@cluster0.plvtpgk.mongodb.net/saludapp?retryWrites=true&w=majority';

// Opciones corregidas - removidas las opciones problemáticas
const mongooseOptions = {
  maxPoolSize: 10, // Mantener hasta 10 conexiones socket
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  family: 4 // Use IPv4, skip trying IPv6
  // Removidas bufferCommands y bufferMaxEntries de aquí
};

// Configurar opciones de Mongoose antes de conectar
mongoose.set('bufferCommands', false);

mongoose.connect(MONGODB_URI, mongooseOptions)
  .then(() => {
    console.log('✅ Conectado a MongoDB');
    console.log(`📊 Base de datos: ${mongoose.connection.name}`);
  })
  .catch(err => {
    console.error('❌ Error en MongoDB:', err);
    process.exit(1); // Salir si no se puede conectar a la DB
  });

// Manejar eventos de la conexión
mongoose.connection.on('error', err => {
  console.error('❌ Error de conexión MongoDB:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB desconectado');
});

// Cerrar conexión cuando la app se cierre
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('🔒 Conexión MongoDB cerrada');
  process.exit(0);
});

// ==========================================
// MIDDLEWARE DE LOGGING
// ==========================================

// Logging de requests (solo en desarrollo)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// ==========================================
// RUTAS API
// ==========================================

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Rutas principales de la API
app.use('/api/recetas', recetasRouter);
app.use('/api/usuarios', usuarioRouter);
app.use('/api/nutricionistas', nutricionistasRouter);
app.use('/api/planificador', planificadorRouter);
app.use('/api/comunidad', comunidadRouter);

// ==========================================
// MANEJO DE ERRORES Y RUTAS NO ENCONTRADAS
// ==========================================

// Middleware para manejar errores 404 de API
app.use('/api/*', (req, res) => {
  console.warn(`🔍 Endpoint no encontrado: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    success: false,
    error: 'Endpoint no encontrado',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Ruta para servir el frontend en la raíz
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error sirviendo index.html:', err);
      res.status(404).send('Página no encontrada');
    }
  });
});

// Middleware global de manejo de errores
app.use((err, req, res, next) => {
  console.error('💥 Error del servidor:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  
  // No enviar stack trace en producción
  const errorResponse = {
    success: false,
    error: 'Error interno del servidor',
    timestamp: new Date().toISOString()
  };
  
  if (process.env.NODE_ENV === 'development') {
    errorResponse.message = err.message;
    errorResponse.stack = err.stack;
  }
  
  res.status(err.status || 500).json(errorResponse);
});

// Manejar rutas no encontradas para SPA
app.get('*', (req, res) => {
  // Si es una ruta de API, devolver 404
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      error: 'API endpoint no encontrado'
    });
  }
  
  // Para todas las demás rutas, servir el index.html (SPA routing)
  const indexPath = path.join(__dirname, 'public', 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(404).send('Página no encontrada');
    }
  });
});

// ==========================================
// ARRANQUE DEL SERVIDOR
// ==========================================

const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📁 Archivos estáticos desde: ${path.join(__dirname, 'public')}`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 CORS configurado para: ${corsOptions.origin ? 'orígenes específicos' : 'todos los orígenes'}`);
});

// Manejo graceful de cierre del servidor
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM recibido, cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado');
  });
});

module.exports = app;