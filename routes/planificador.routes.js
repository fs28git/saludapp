const express = require('express');
const router = express.Router();
const { verificarToken } = require('../server/middleware/auth');

// Datos de ejemplo para planificador
const planesEjemplo = [
  {
    id: 1,
    nombre: "Plan Pérdida de Peso",
    duracion: "4 semanas",
    objetivo: "perder_peso",
    calorias_diarias: 1500,
    comidas: [
      { tipo: "desayuno", nombre: "Avena con frutas", calorias: 300 },
      { tipo: "almuerzo", nombre: "Ensalada de pollo", calorias: 450 },
      { tipo: "cena", nombre: "Salmón con verduras", calorias: 400 },
      { tipo: "snacks", nombre: "Frutas y nueces", calorias: 350 }
    ]
  },
  {
    id: 2,
    nombre: "Plan Ganar Músculo",
    duracion: "6 semanas",
    objetivo: "ganar_musculo",
    calorias_diarias: 2200,
    comidas: [
      { tipo: "desayuno", nombre: "Batido proteico con avena", calorias: 450 },
      { tipo: "almuerzo", nombre: "Pollo con arroz integral", calorias: 600 },
      { tipo: "cena", nombre: "Carne magra con quinoa", calorias: 550 },
      { tipo: "snacks", nombre: "Yogurt griego con frutos secos", calorias: 600 }
    ]
  }
];

// Obtener planes disponibles
router.get('/planes', async (req, res) => {
  try {
    res.json({
      success: true,
      count: planesEjemplo.length,
      data: planesEjemplo
    });
  } catch (error) {
    console.error('Error al obtener planes:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error del servidor',
      error: error.message 
    });
  }
});

// Obtener plan personalizado (requiere autenticación)
router.get('/personalizado', verificarToken, async (req, res) => {
  try {
    const usuario = req.usuario;
    
    // Filtrar planes según el objetivo del usuario
    const planesRecomendados = planesEjemplo.filter(plan => 
      plan.objetivo === usuario.objetivo
    );
    
    res.json({
      success: true,
      mensaje: `Planes recomendados para ${usuario.nombre}`,
      objetivo: usuario.objetivo,
      count: planesRecomendados.length,
      data: planesRecomendados.length > 0 ? planesRecomendados : planesEjemplo
    });
  } catch (error) {
    console.error('Error al obtener plan personalizado:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error del servidor',
      error: error.message 
    });
  }
});

// Crear plan personalizado
router.post('/crear', verificarToken, async (req, res) => {
  try {
    const { nombre, duracion, objetivo, calorias_diarias, comidas } = req.body;
    
    const nuevoPlan = {
      id: Date.now(), // ID temporal
      nombre,
      duracion,
      objetivo,
      calorias_diarias,
      comidas,
      usuario_id: req.usuario._id,
      fecha_creacion: new Date()
    };
    
    res.status(201).json({
      success: true,
      mensaje: 'Plan creado exitosamente',
      data: nuevoPlan
    });
  } catch (error) {
    console.error('Error al crear plan:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error del servidor',
      error: error.message 
    });
  }
});

module.exports = router;