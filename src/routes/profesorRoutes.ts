import express from 'express';
import {
    consultarTodos,
    consultarUno,
    insertar,
    modificar,
    eliminar
} from '../controllers/ProfesoresController';

const router = express.Router();

// Listar todos los profesores
router.get('/listarProfesores', consultarTodos);

// Renderizar formulario de creación de profesor
router.get('/creaProfesores', (req, res) => {
    res.render('creaProfesores', {
        pagina: 'Crear Profesor',
    });
});

// Insertar un nuevo profesor
router.post('/', insertar);

// Renderizar formulario para modificar un profesor
router.get('/modificaProfesor/:id', async (req, res) => {
    try {
        const profesor = await consultarUno(req, res);
        if (!profesor) {
            return res.status(404).send('Profesor no encontrado');
        }
        res.render('modificaProfesor', {
            profesor, // Pasar el objeto profesor a la vista
        });
    } catch (err: unknown) {
        if (err instanceof Error) {
            res.status(500).send(err.message);
        }
    }
});

// Modificar un profesor por ID
router.put('/:id', modificar);

// Eliminar un profesor por ID
router.delete('/:id', eliminar);

export default router;
