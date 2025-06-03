const express = require('express');
const router = express.Router();

// GET - Obtener todos los posts de la comunidad
router.get('/', (req, res) => {
    try {
        // Datos de ejemplo para la comunidad
        const posts = [
            {
                id: 1,
                autor: "María González",
                titulo: "Mi experiencia con la dieta mediterránea",
                contenido: "Después de 3 meses siguiendo la dieta mediterránea, he notado grandes mejoras en mi energía y digestión...",
                fecha: new Date().toISOString(),
                likes: 15,
                comentarios: 3,
                tags: ["dieta", "mediterránea", "salud"]
            },
            {
                id: 2,
                autor: "Carlos Ruiz",
                titulo: "Receta saludable: Quinoa con vegetales",
                contenido: "Quiero compartir una receta súper nutritiva y fácil de hacer. La quinoa es una excelente fuente de proteína...",
                fecha: new Date(Date.now() - 86400000).toISOString(), // 1 día atrás
                likes: 22,
                comentarios: 7,
                tags: ["receta", "quinoa", "vegetales"]
            },
            {
                id: 3,
                autor: "Ana Martínez",
                titulo: "Consejos para mantenerse hidratado",
                contenido: "La hidratación es clave para una buena salud. Aquí comparto algunos trucos que me han funcionado...",
                fecha: new Date(Date.now() - 172800000).toISOString(), // 2 días atrás
                likes: 18,
                comentarios: 5,
                tags: ["hidratación", "consejos", "salud"]
            }
        ];

        res.json({
            success: true,
            data: posts,
            message: "Posts de comunidad obtenidos exitosamente"
        });
    } catch (error) {
        console.error('Error en GET /api/comunidad:', error);
        res.status(500).json({
            success: false,
            message: "Error interno del servidor",
            error: error.message
        });
    }
});

// GET - Obtener un post específico por ID
router.get('/:id', (req, res) => {
    try {
        const { id } = req.params;
        // Aquí normalmente consultarías la base de datos
        res.json({
            success: true,
            data: {
                id: parseInt(id),
                autor: "Usuario Ejemplo",
                titulo: `Post ${id}`,
                contenido: "Contenido del post...",
                fecha: new Date().toISOString(),
                likes: 0,
                comentarios: 0
            },
            message: "Post obtenido exitosamente"
        });
    } catch (error) {
        console.error('Error en GET /api/comunidad/:id:', error);
        res.status(500).json({
            success: false,
            message: "Error interno del servidor",
            error: error.message
        });
    }
});

// POST - Crear un nuevo post
router.post('/', (req, res) => {
    try {
        const { autor, titulo, contenido, tags } = req.body;
        
        if (!autor || !titulo || !contenido) {
            return res.status(400).json({
                success: false,
                message: "Faltan campos requeridos: autor, titulo, contenido"
            });
        }

        const nuevoPost = {
            id: Date.now(),
            autor,
            titulo,
            contenido,
            fecha: new Date().toISOString(),
            likes: 0,
            comentarios: 0,
            tags: tags || []
        };

        res.status(201).json({
            success: true,
            data: nuevoPost,
            message: "Post creado exitosamente"
        });
    } catch (error) {
        console.error('Error en POST /api/comunidad:', error);
        res.status(500).json({
            success: false,
            message: "Error interno del servidor",
            error: error.message
        });
    }
});

// PUT - Dar like a un post
router.put('/:id/like', (req, res) => {
    try {
        const { id } = req.params;
        res.json({
            success: true,
            message: `Like agregado al post ${id}`,
            data: { id: parseInt(id), likes: Math.floor(Math.random() * 50) + 1 }
        });
    } catch (error) {
        console.error('Error en PUT /api/comunidad/:id/like:', error);
        res.status(500).json({
            success: false,
            message: "Error interno del servidor",
            error: error.message
        });
    }
});

// DELETE - Eliminar un post
router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;
        res.json({
            success: true,
            message: `Post ${id} eliminado exitosamente`
        });
    } catch (error) {
        console.error('Error en DELETE /api/comunidad/:id:', error);
        res.status(500).json({
            success: false,
            message: "Error interno del servidor",
            error: error.message
        });
    }
});

module.exports = router;