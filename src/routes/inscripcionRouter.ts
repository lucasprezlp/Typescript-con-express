import express from 'express';
import {
    consultarInscripciones,
    consultarUno,
    inscribir,
    cancelarInscripcion,
    calificar
} from '../controllers/InscripcionController';
import { Estudiante } from '../models/estudianteModel';
import { AppDataSource } from '../db/conexion';
import { Profesor } from '../models/profesorModel';
import { Curso } from '../models/cursoModel';

const router = express.Router();

// Consultar todas las inscripciones
router.get('/listarInscripciones', consultarInscripciones);

// Consultar inscripciones por alumno
// router.get('/listarInscripcionesAlumno/:id', consultarxAlumno);

// Consultar inscripciones por curso
// router.get('/listarInscripcionesCurso/:id', consultarxCurso);

router.get('/modificaInscripcion/:estudiante_id/:curso_id', async (req, res) => {
    try {
        const inscripciones = await consultarUno(req, res);
        // console.log("xxxxxxxxxxx")
        if (!inscripciones) {
            return res.status(404).send('Inscripciones no encontradas');
        }
        // Renderiza la vista si se encontraron inscripciones
        res.render('modificaInscripcion', { inscripciones });

    } catch (err: unknown) {
        if (err instanceof Error) {
            return res.status(500).send(err.message);
        }
    }
});




// Cancelar inscripción de un estudiante en un curso
router.delete('/:estudiante_id/:curso_id', cancelarInscripcion);

// Calificar a un estudiante en un curso
router.put('/calificar/:estudiante_id/:curso_id', calificar);



router.get('/creaInscripcion', async (req, res) => {
    const estudianteRepository = AppDataSource.getRepository(Estudiante);
    const estudiantes = await estudianteRepository.find(); // Obtener la lista de estudiantes
    
    const cursoRepository = AppDataSource.getRepository(Curso);
    const cursos = await cursoRepository.find(); // Obtener la lista de profesores

    res.render('creaInscripcion', {
        pagina: 'Crear Inscripción',
        estudiantes, // Pasar la lista de estudiantes a la vista
        cursos // Pasar la lista de profesores a la vista
    });
});


// router.post('/creaInscripcion', crearInscripcion);

// Inscribir un estudiante en un curso
router.post('/', inscribir);

export default router;