import express from 'express';
import { insertar, modificar, eliminar, validar, consultarUno, consultarTodos, consultarApellido } from '../controllers/EstudianteController';

const router = express.Router();

router.get('/listarEstudiantes', consultarTodos);


router.get('/buscaEstudiante/', async (req, res) => {
    res.render('buscaEstudiante'), {
        pagina: 'Buscar Estudiante',
    }
});

router.get('/buscaEstudiante/:apellido', async (req, res) => {
    try {
        const estudiante = await consultarApellido(req, res);
        if (!estudiante) {
            return res.status(404).send('Estudiante no encontrado');
        }
        res.render('buscaEstudiante', {
            estudiante,
        });
    } catch (err: unknown) {
        if (err instanceof Error) {
            res.status(500).send(err.message);
        }
    }
});

//insertar
router.get('/creaEstudiantes', (req, res) => {
    res.render('creaEstudiantes', {
        pagina: 'Crear Estudiante'
    });
});

router.post('/', validar(), insertar); // funcion que se ejecuta cuando se carga un estdiante

//modificar
router.get('/modificaEstudiante/:id', async (req, res) => {
    try {
        const estudiante = await consultarUno(req, res);
        if (!estudiante) {
            return res.status(404).send('Estudiante no encontrado');
        }
        res.render('modificaEstudiante', {estudiante});
    } catch (err: unknown) {
        if (err instanceof Error) {
            res.status(500).send(err.message);
        }
    }
});

router.put('/:id', modificar);

//eliminar
router.delete('/:id', eliminar);

export default router;
