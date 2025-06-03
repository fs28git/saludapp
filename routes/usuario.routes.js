const express = require('express');
const router = express.Router();
const Usuario = require('../models/usuario.model');
const { verificarToken } = require('../server/middleware/auth');
const jwt = require('jsonwebtoken');

// Función reutilizable para generar tokens
const generarToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'tu_clave_secreta_aqui',
    { expiresIn: '7d' }
  );
};

// Registro de usuario
router.post('/registro', async (req, res) => {
  try {
    const { nombre, email, contraseña, objetivo, restricciones } = req.body;

    // Validaciones
    if (!nombre || !email || !contraseña || !objetivo) {
      return res.status(400).json({ exito: false, mensaje: 'Campos obligatorios faltantes' });
    }

    if (contraseña.length < 6) {
      return res.status(400).json({ exito: false, mensaje: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const usuarioExistente = await Usuario.findOne({ email: email.toLowerCase() });
    if (usuarioExistente) {
      return res.status(400).json({ exito: false, mensaje: 'El email ya está registrado' });
    }

    const nuevoUsuario = new Usuario({
      nombre: nombre.trim(),
      email: email.toLowerCase().trim(),
      contraseña,
      objetivo,
      restricciones: restricciones || [],
    });

    const usuarioGuardado = await nuevoUsuario.save();
    const token = generarToken(usuarioGuardado._id);

    res.status(201).json({
      exito: true,
      mensaje: 'Usuario registrado',
      token,
      usuario: {
        id: usuarioGuardado._id,
        nombre: usuarioGuardado.nombre,
        email: usuarioGuardado.email,
        objetivo: usuarioGuardado.objetivo,
        restricciones: usuarioGuardado.restricciones,
      },
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ exito: false, mensaje: 'Error del servidor' });
  }
});

// Login de usuario
router.post('/login', async (req, res) => {
  try {
    const { email, contraseña } = req.body;

    if (!email || !contraseña) {
      return res.status(400).json({ exito: false, mensaje: 'Email y contraseña requeridos' });
    }

    const usuario = await Usuario.findOne({ email: email.toLowerCase() });
    if (!usuario || !(await usuario.compararContraseña(contraseña))) {
      return res.status(401).json({ exito: false, mensaje: 'Credenciales inválidas' });
    }

    usuario.fechaUltimoAcceso = new Date();
    await usuario.save();

    const token = generarToken(usuario._id);

    res.json({
      exito: true,
      mensaje: 'Login exitoso',
      token,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        objetivo: usuario.objetivo,
        restricciones: usuario.restricciones,
      },
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ exito: false, mensaje: 'Error del servidor' });
  }
});

// Obtener perfil (protegido)
router.get('/perfil', verificarToken, async (req, res) => {
  try {
    res.json({
      exito: true,
      usuario: {
        id: req.usuario._id,
        nombre: req.usuario.nombre,
        email: req.usuario.email,
        objetivo: req.usuario.objetivo,
        restricciones: req.usuario.restricciones,
        fechaRegistro: req.usuario.createdAt,
        fechaUltimoAcceso: req.usuario.fechaUltimoAcceso,
      },
    });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ exito: false, mensaje: 'Error del servidor' });
  }
});

// Actualizar perfil (protegido)
router.put('/perfil', verificarToken, async (req, res) => {
  try {
    const { nombre, objetivo, restricciones } = req.body;
    const actualizaciones = {};

    if (nombre) actualizaciones.nombre = nombre.trim();
    if (objetivo) actualizaciones.objetivo = objetivo;
    if (restricciones !== undefined) actualizaciones.restricciones = restricciones;

    const usuarioActualizado = await Usuario.findByIdAndUpdate(
      req.usuario._id,
      actualizaciones,
      { new: true }
    ).select('-contraseña');

    res.json({
      exito: true,
      mensaje: 'Perfil actualizado',
      usuario: usuarioActualizado,
    });

  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ exito: false, mensaje: 'Error del servidor' });
  }
});

module.exports = router;