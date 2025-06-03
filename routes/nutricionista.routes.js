const express = require('express');
const router = express.Router();

// GET - Obtener todos los nutricionistas
router.get('/', (req, res) => {
    try {
        // Datos de ejemplo de nutricionistas
        const nutricionistas = [
            {
                id: 1,
                nombre: "Dra. María Elena Rodríguez",
                especialidad: "Nutrición Clínica",
                experiencia: "8 años",
                telefono: "+57 300 123 4567",
                email: "maria.rodriguez@nutricion.com",
                ubicacion: "Bogotá, Colombia",
                rating: 4.8,
                reviews: 125,
                disponibilidad: "Lunes a Viernes 8:00 AM - 6:00 PM",
                foto: "https://via.placeholder.com/150x150/4CAF50/white?text=MR",
                descripcion: "Especialista en nutrición clínica con enfoque en diabetes y obesidad. Más de 8 años ayudando a pacientes a mejorar su calidad de vida.",
                servicios: ["Consulta nutricional", "Planes alimentarios", "Seguimiento personalizado"]
            },
            {
                id: 2,
                nombre: "Dr. Carlos Andrés Gómez",
                especialidad: "Nutrición Deportiva",
                experiencia: "6 años",
                telefono: "+57 301 987 6543",
                email: "carlos.gomez@nutrideporte.com",
                ubicacion: "Medellín, Colombia",
                rating: 4.7,
                reviews: 89,
                disponibilidad: "Lunes a Sábado 7:00 AM - 8:00 PM",
                foto: "https://via.placeholder.com/150x150/2196F3/white?text=CG",
                descripcion: "Nutricionista deportivo especializado en atletas de alto rendimiento y personas activas físicamente.",
                servicios: ["Nutrición deportiva", "Suplementación", "Composición corporal"]
            },
            {
                id: 3,
                nombre: "Dra. Ana Sofía Herrera",
                especialidad: "Nutrición Pediátrica",
                experiencia: "10 años",
                telefono: "+57 302 456 7890",
                email: "ana.herrera@nutripediatria.com",
                ubicacion: "Cali, Colombia",
                rating: 4.9,
                reviews: 156,
                disponibilidad: "Lunes a Viernes 9:00 AM - 5:00 PM",
                foto: "https://via.placeholder.com/150x150/FF9800/white?text=AH",
                descripcion: "Especialista en nutrición infantil y adolescente. Experta en trastornos alimentarios en niños.",
                servicios: ["Nutrición infantil", "Trastornos alimentarios", "Educación nutricional"]
            },
            {
                id: 4,
                nombre: "Dr. Luis Fernando Vargas",
                especialidad: "Nutrición Geriátrica",
                experiencia: "12 años",
                telefono: "+57 304 321 0987",
                email: "luis.vargas@nutrigeriatria.com",
                ubicacion: "Barranquilla, Colombia",
                rating: 4.6,
                reviews: 78,
                disponibilidad: "Martes a Sábado 8:00 AM - 4:00 PM",
                foto: "https://via.placeholder.com/150x150/9C27B0/white?text=LV",
                descripcion: "Nutricionista especializado en adultos mayores, con enfoque en prevención de enfermedades crónicas.",
                servicios: ["Nutrición geriátrica", "Prevención", "Manejo de enfermedades crónicas"]
            }
        ];

        res.json({
            success: true,
            data: nutricionistas,
            message: "Nutricionistas obtenidos exitosamente",
            total: nutricionistas.length
        });
    } catch (error) {
        console.error('Error en GET /api/nutricionistas:', error);
        res.status(500).json({
            success: false,
            message: "Error interno del servidor",
            error: error.message,
            data: [] // Asegurar que siempre devuelva un array
        });
    }
});

// GET - Obtener un nutricionista por ID
router.get('/:id', (req, res) => {
    try {
        const { id } = req.params;
        // Aquí normalmente consultarías la base de datos
        const nutricionista = {
            id: parseInt(id),
            nombre: "Dr. Ejemplo",
            especialidad: "Nutrición General",
            experiencia: "5 años",
            telefono: "+57 300 000 0000",
            email: "ejemplo@nutricion.com",
            ubicacion: "Colombia",
            rating: 4.5,
            reviews: 50,
            disponibilidad: "Lunes a Viernes",
            foto: "https://via.placeholder.com/150x150/607D8B/white?text=EJ",
            descripcion: "Nutricionista ejemplo",
            servicios: ["Consulta general"]
        };

        res.json({
            success: true,
            data: nutricionista,
            message: "Nutricionista obtenido exitosamente"
        });
    } catch (error) {
        console.error('Error en GET /api/nutricionistas/:id:', error);
        res.status(500).json({
            success: false,
            message: "Error interno del servidor",
            error: error.message
        });
    }
});

// POST - Agendar cita con nutricionista
router.post('/:id/cita', (req, res) => {
    try {
        const { id } = req.params;
        const { fecha, hora, motivo, paciente } = req.body;

        if (!fecha || !hora || !motivo || !paciente) {
            return res.status(400).json({
                success: false,
                message: "Faltan campos requeridos: fecha, hora, motivo, paciente"
            });
        }

        const cita = {
            id: Date.now(),
            nutricionistaId: parseInt(id),
            fecha,
            hora,
            motivo,
            paciente,
            estado: "programada",
            fechaCreacion: new Date().toISOString()
        };

        res.status(201).json({
            success: true,
            data: cita,
            message: "Cita agendada exitosamente"
        });
    } catch (error) {
        console.error('Error en POST /api/nutricionistas/:id/cita:', error);
        res.status(500).json({
            success: false,
            message: "Error interno del servidor",
            error: error.message
        });
    }
});

// GET - Obtener nutricionistas por especialidad
router.get('/especialidad/:especialidad', (req, res) => {
    try {
        const { especialidad } = req.params;
        // Filtrar por especialidad (simulado)
        const nutricionistas = [
            {
                id: 1,
                nombre: `Dr. Especialista en ${especialidad}`,
                especialidad: especialidad,
                rating: 4.8,
                ubicacion: "Colombia"
            }
        ];

        res.json({
            success: true,
            data: nutricionistas,
            message: `Nutricionistas en ${especialidad} obtenidos exitosamente`
        });
    } catch (error) {
        console.error('Error en GET /api/nutricionistas/especialidad/:especialidad:', error);
        res.status(500).json({
            success: false,
            message: "Error interno del servidor",
            error: error.message,
            data: []
        });
    }
});

module.exports = router;