const express = require('express');
const jwt = require('jsonwebtoken'); // Asegúrate que jwt esté importado
const { Receta, Usuario, Comunidad, ListaCompra } = require('./models');
const authenticate = require('./middleware/auth');
const router = express.Router();

// Ruta raíz para evitar "Cannot GET /"
router.get('/', (req, res) => {
  res.send('Bienvenido a SaludApp API');
});

// Rutas de autenticación
router.post('/usuarios', async (req, res) => {
  try {
    const user = new Usuario(req.body);
    await user.save();
    const token = await user.generateAuthToken();
    res.status(201).send({ user, token });
  } catch (err) {
    res.status(400).send(err);
  }
});

router.post('/usuarios/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await Usuario.findOne({ email });
    
    if (!user) {
      return res.status(400).send({ error: 'Credenciales inválidas' });
    }

    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(400).send({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
    res.send({ user, token });
  } catch (err) {
    res.status(400).send(err);
  }
});

// Rutas de usuario
router.get('/usuarios/me', authenticate, async (req, res) => {
  res.send(req.user);
});

router.patch('/usuarios/me', authenticate, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['nombre', 'email', 'password', 'objetivo', 'restricciones', 'preferencias'];
  const isValidOperation = updates.every(update => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).send({ error: 'Actualizaciones no válidas' });
  }

  try {
    updates.forEach(update => req.user[update] = req.body[update]);
    await req.user.save();
    res.send(req.user);
  } catch (err) {
    res.status(400).send(err);
  }
});

// Rutas de recetas
router.get('/recetas', async (req, res) => {
  try {
    const { search, diet, time, ids } = req.query;
    const filters = {};
    
    if (search) {
      filters.$or = [
        { titulo: { $regex: search, $options: 'i' } },
        { descripcion: { $regex: search, $options: 'i' } },
        { 'ingredientes.nombre': { $regex: search, $options: 'i' } }
      ];
    }
    
    if (diet) {
      filters.etiquetas = diet;
    }
    
    if (time) {
      filters.tiempoPreparacion = { $lte: parseInt(time) };
    }
    
    if (ids) {
      filters._id = { $in: ids.split(',') };
    }
    
    const recetas = await Receta.find(filters).populate('creador', 'nombre');
    res.send(recetas);
  } catch (err) {
    res.status(500).send(err);
  }
});

router.get('/recetas/:id', async (req, res) => {
  try {
    const receta = await Receta.findById(req.params.id)
      .populate('creador', 'nombre')
      .populate('valoraciones.usuario', 'nombre');
    
    if (!receta) {
      return res.status(404).send();
    }
    
    res.send(receta);
  } catch (err) {
    res.status(500).send(err);
  }
});

router.post('/recetas', authenticate, async (req, res) => {
  try {
    const receta = new Receta({
      ...req.body,
      creador: req.user._id
    });
    
    await receta.save();
    res.status(201).send(receta);
  } catch (err) {
    res.status(400).send(err);
  }
});

router.post('/recetas/:id/valoraciones', authenticate, async (req, res) => {
  try {
    const receta = await Receta.findById(req.params.id);
    
    if (!receta) {
      return res.status(404).send();
    }
    
    const valoracion = {
      usuario: req.user._id,
      puntuacion: req.body.puntuacion,
      comentario: req.body.comentario
    };
    
    receta.valoraciones.push(valoracion);
    receta.calcularPromedio();
    await receta.save();
    
    res.send(receta);
  } catch (err) {
    res.status(400).send(err);
  }
});

// Rutas de planificador
router.get('/planificador', authenticate, async (req, res) => {
  try {
    const plan = await Usuario.findById(req.user._id)
      .select('planSemanal')
      .populate('planSemanal.receta');
    
    res.send(plan.planSemanal);
  } catch (err) {
    res.status(500).send(err);
  }
});

router.post('/planificador/generar', authenticate, async (req, res) => {
  try {
    const { objetivo, restricciones } = req.body;
    
    const filters = {};
    
    if (objetivo === 'perder peso') {
      filters['informacionNutricional.calorias'] = { $lte: 400 };
    } else if (objetivo === 'aumentar masa') {
      filters['informacionNutricional.calorias'] = { $gte: 500 };
      filters['informacionNutricional.proteinas'] = { $gte: 30 };
    } else if (objetivo === 'vegana') {
      filters.etiquetas = 'vegana';
    }
    
    if (restricciones && restricciones.length > 0) {
      filters.etiquetas = { $all: restricciones };
    }
    
    const recetas = await Receta.find(filters);
    
    if (recetas.length < 7) {
      return res.status(400).send({ error: 'No hay suficientes recetas que coincidan con tus criterios' });
    }
    
    const selectedRecipes = [];
    const usedIndexes = new Set();
    
    while (selectedRecipes.length < 7) {
      const randomIndex = Math.floor(Math.random() * recetas.length);
      if (!usedIndexes.has(randomIndex)) {
        selectedRecipes.push(recetas[randomIndex]);
        usedIndexes.add(randomIndex);
      }
    }
    
    const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const planSemanal = dias.map((dia, i) => ({
      dia,
      comida: 'Almuerzo',
      receta: selectedRecipes[i]._id
    }));
    
    res.send(planSemanal);
  } catch (err) {
    res.status(500).send(err);
  }
});

router.post('/planificador', authenticate, async (req, res) => {
  try {
    req.user.planSemanal = req.body;
    await req.user.save();
    res.send(req.user.planSemanal);
  } catch (err) {
    res.status(400).send(err);
  }
});

// Rutas de lista de compra
router.get('/lista-compra', authenticate, async (req, res) => {
  try {
    const lista = await ListaCompra.findOne({ usuario: req.user._id });
    res.send(lista || { ingredientes: [] });
  } catch (err) {
    res.status(500).send(err);
  }
});

router.post('/lista-compra', authenticate, async (req, res) => {
  try {
    let lista = await ListaCompra.findOne({ usuario: req.user._id });
    
    if (!lista) {
      lista = new ListaCompra({
        usuario: req.user._id,
        ingredientes: req.body.ingredientes
      });
    } else {
      lista.ingredientes = req.body.ingredientes;
      lista.fechaActualizacion = Date.now();
    }
    
    await lista.save();
    res.send(lista);
  } catch (err) {
    res.status(400).send(err);
  }
});

router.patch('/lista-compra/:id', authenticate, async (req, res) => {
  try {
    const lista = await ListaCompra.findOne({ usuario: req.user._id });
    
    if (!lista) {
      return res.status(404).send();
    }
    
    const ingrediente = lista.ingredientes.id(req.params.id);
    
    if (!ingrediente) {
      return res.status(404).send();
    }
    
    ingrediente.comprado = req.body.comprado;
    await lista.save();
    
    res.send(ingrediente);
  } catch (err) {
    res.status(400).send(err);
  }
});

// Rutas de comunidad
router.get('/comunidad/posts', async (req, res) => {
  try {
    const posts = await Comunidad.find({ tipo: 'foro' })
      .sort('-fechaCreacion')
      .populate('publicaciones.usuario', 'nombre')
      .populate('publicaciones.comentarios.usuario', 'nombre');
    
    res.send(posts);
  } catch (err) {
    res.status(500).send(err);
  }
});

router.post('/comunidad/posts', authenticate, async (req, res) => {
  try {
    let foro = await Comunidad.findOne({ tipo: 'foro' });
    
    if (!foro) {
      foro = new Comunidad({
        tipo: 'foro',
        titulo: 'Foro Principal',
        descripcion: 'Foro general de SaludApp',
        creador: req.user._id
      });
    }
    
    const publicacion = {
      usuario: req.user._id,
      contenido: req.body.contenido
    };
    
    foro.publicaciones.push(publicacion);
    await foro.save();
    
    res.status(201).send(publicacion);
  } catch (err) {
    res.status(400).send(err);
  }
});

router.post('/comunidad/posts/:id/like', authenticate, async (req, res) => {
  try {
    const foro = await Comunidad.findOne({ tipo: 'foro' });
    
    if (!foro) {
      return res.status(404).send();
    }
    
    const publicacion = foro.publicaciones.id(req.params.id);
    
    if (!publicacion) {
      return res.status(404).send();
    }
    
    // Aquí podrías implementar lógica de "me gusta"
    
    await foro.save();
    res.send(publicacion);
  } catch (err) {
    res.status(400).send(err);
  }
});

router.post('/comunidad/posts/:id/comentarios', authenticate, async (req, res) => {
  try {
    const foro = await Comunidad.findOne({ tipo: 'foro' });
    
    if (!foro) {
      return res.status(404).send();
    }
    
    const publicacion = foro.publicaciones.id(req.params.id);
    
    if (!publicacion) {
      return res.status(404).send();
    }
    
    const comentario = {
      usuario: req.user._id,
      contenido: req.body.contenido
    };
    
    publicacion.comentarios.push(comentario);
    await foro.save();
    
    res.status(201).send(comentario);
  } catch (err) {
    res.status(400).send(err);
  }
});

module.exports = router;
