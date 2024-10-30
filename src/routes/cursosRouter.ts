import express from 'express';
import { consultarTodos, consultarUno, insertar, modificar, eliminar, validarCurso } from '../controllers/CursoController';
import { AppDataSource } from '../db/conexion';
import { Profesor } from '../models/profesorModel';

const router = express.Router();

// Listar todos los cursos
router.get('/listarCursos', consultarTodos);

// Renderizar formulario de creación de curso
router.get('/creaCursos', async (req, res) => {
    // consultamos lo nombres de los profesores
    const profesorRepository = AppDataSource.getRepository(Profesor);
    const profesores = await profesorRepository.find();
    
    res.render('creaCursos', {
        pagina: 'Crear Curso',
        profesores
    });
});

// Insertar un nuevo curso
router.post('/',validarCurso(), insertar);

// Renderizar formulario para modificar un curso
router.get('/modificaCurso/:id', async (req, res) => {
    try {
        const curso = await consultarUno(req, res);
        if (!curso) {
            return res.status(404).send('Curso no encontrado');
        }
        const profesorRepository = AppDataSource.getRepository(Profesor);
        const profesores = await profesorRepository.find();

        res.render('modificaCurso', {
            curso,      
            profesores  // la necesito para hacer el menu desplegable
        });
    } catch (err) {
        if (err instanceof Error) {
            res.status(500).send(err.message);
        }
    }
});
// Modificar un curso por ID
router.put('/:id', modificar);

// Eliminar un curso por ID
router.delete('/:id', eliminar);

export default router;
