// middleware/auth.js
const jwt = require('jsonwebtoken');
const Usuario = require('../../models/usuario.model');

/**
 * Middleware para verificar tokens JWT
 * Verifica si el usuario está autenticado y agrega la info del usuario a req.usuario
 */
const verificarToken = async (req, res, next) => {
  try {
    // Obtener el token del header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Token de acceso requerido'
      });
    }

    // Extraer el token (formato: "Bearer TOKEN")
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de acceso requerido'
      });
    }

    // Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar el usuario en la base de datos
    const usuario = await Usuario.findById(decoded.id).select('-password');
    
    if (!usuario) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido - Usuario no encontrado'
      });
    }

    // Agregar usuario a la request
    req.usuario = usuario;
    next();

  } catch (error) {
    console.error('Error en verificarToken:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Error del servidor al verificar token'
    });
  }
};

/**
 * Middleware opcional - verifica token si existe, pero no es obligatorio
 */
const verificarTokenOpcional = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return next(); // Continuar sin usuario
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return next(); // Continuar sin usuario
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const usuario = await Usuario.findById(decoded.id).select('-password');
    
    if (usuario) {
      req.usuario = usuario;
    }
    
    next();

  } catch (error) {
    // Si hay error con el token, simplemente continuar sin usuario
    console.warn('Token opcional inválido:', error.message);
    next();
  }
};

/**
 * Middleware para verificar roles específicos
 * @param {Array} roles - Array de roles permitidos
 */
const verificarRol = (roles = []) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({
        success: false,
        message: 'Acceso no autorizado'
      });
    }

    if (roles.length && !roles.includes(req.usuario.rol)) {
      return res.status(403).json({
        success: false,
        message: 'Permisos insuficientes'
      });
    }

    next();
  };
};

/**
 * Middleware específico para administradores
 */
const verificarAdmin = (req, res, next) => {
  if (!req.usuario) {
    return res.status(401).json({
      success: false,
      message: 'Acceso no autorizado'
    });
  }

  if (req.usuario.rol !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acceso restringido a administradores'
    });
  }

  next();
};

/**
 * Generar token JWT
 * @param {Object} payload - Datos a incluir en el token
 * @param {String} expiresIn - Tiempo de expiración (default: 24h)
 */
const generarToken = (payload, expiresIn = '24h') => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

module.exports = {
  verificarToken,
  verificarTokenOpcional,
  verificarRol,
  verificarAdmin,
  generarToken
};