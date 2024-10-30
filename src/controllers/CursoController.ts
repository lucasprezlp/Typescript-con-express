import { Request, Response } from 'express';
import { check, validationResult } from 'express-validator';
import { AppDataSource } from '../db/conexion';
import { Curso } from '../models/cursoModel';
import { Profesor } from '../models/profesorModel';

// Middleware de validación
export const validarCurso = () => [
    check('nombre')
        .notEmpty().withMessage('El nombre es obligatorio')
        .isLength({ min: 3 }).withMessage('El nombre debe tener al menos 3 caracteres'),
    check('descripcion').notEmpty().withMessage('La descripción es obligatoria'),
    check('profesor_id').notEmpty().withMessage('El profesor es obligatorio'),
    (req: Request, res: Response, next: Function) => {
        const errores = validationResult(req);
        if (!errores.isEmpty()) {
            return res.render('listarCursos', {
                pagina: 'Lista de Cursos', 
                errores: errores.array()
             });
        }
        next();
    }
];

// Consultar todos los cursos
export const consultarTodos = async (req: Request, res: Response) => {
    try {
        const cursoRepository = AppDataSource.getRepository(Curso);
        const cursos = await cursoRepository.find({ relations: ['profesor'] });
        res.render('listarCursos', {
            pagina: 'Lista de Cursos',
            cursos

        });
    } catch (err: unknown) {
        if (err instanceof Error) {
            res.status(500).send(err.message);
        }
    }
};

// Consultar un curso por ID
export const consultarUno = async (req: Request, res: Response): Promise<Curso | null> => {
    const { id } = req.params;
    try {
        const cursoRepository = AppDataSource.getRepository(Curso);
        const curso = await cursoRepository.findOne({
            where: { id: parseInt(id, 10) },
            relations: ['profesor']
        });
        if (curso) {
            return curso;
        } else {

            return null;
        }
    } catch (err: unknown) {
        if (err instanceof Error) {
            throw err;
        } else {
            throw new Error('Error desconocido');
        }
    }
};

// Insertar un nuevo curso
export const insertar = async (req: Request, res: Response) => {
    const errores = validationResult(req);
     console.log(errores)
    if (!errores.isEmpty()) {
        return res.render('listarCursos', {
            pagina: 'Lista de Cursos',
            errores: errores.array()
        });
    }

    const { nombre, descripcion, profesor_id } = req.body;

    try {
        await AppDataSource.transaction(async transactionalEntityManager => {
            const cursoRepository = transactionalEntityManager.getRepository(Curso);
            const profesorRepository = transactionalEntityManager.getRepository(Profesor);
            // vemos si existe el curso
            const existeCurso = await cursoRepository.findOne({ where: { nombre } });
            if (existeCurso) {
                return res.status(400).json({ mensaje: 'El Curso ya existe' });
            }
            // vemos si existe el profesor, pero no es necesario porque lo ingresamos con un comobox
            const profesor = await profesorRepository.findOne({ where: { id: profesor_id } });
            if (!profesor) {
                return res.status(404).json({ mensaje: 'Profesor no encontrado' });
            }

            const nuevoCurso = cursoRepository.create({
                nombre,
                descripcion,
                profesor, // Asignar la relación con el profesor
            });

            await cursoRepository.save(nuevoCurso);
        });

        const cursos = await AppDataSource.getRepository(Curso).find();
        res.render('listarCursos', {
            pagina: 'Lista de Cursos',
            cursos
        });
    } catch (err: unknown) {
        if (err instanceof Error) {
            res.status(500).send(err.message);
        }
    }
};


// Modificar un curso existente
export const modificar = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { nombre, descripcion, profesor_id } = req.body;

    try {
        await AppDataSource.transaction(async transactionalEntityManager => {
            const profesor = await transactionalEntityManager.findOne(Profesor, { where: { id: profesor_id } });
            if (!profesor) {
                return res.status(400).json({ mensaje: 'El profesor no existe' });
            }

            const curso = await transactionalEntityManager.findOne(Curso, { where: { id: parseInt(id, 10) } });
            if (!curso) {
                return res.status(404).json({ mensaje: 'El curso no existe' });
            }

            transactionalEntityManager.merge(Curso, curso, {
                nombre,
                descripcion,
                profesor,
            });

            const cursoActualizado = await transactionalEntityManager.save(curso);
            // res.status(200).json({ curso: cursoActualizado });
            return res.redirect('/cursos/listarCursos');
        });
    } catch (err: unknown) {
        if (err instanceof Error) {
            res.status(500).send(err.message);
        }
    }
};

// Eliminar un curso
export const eliminar = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        // Iniciar una transacción para el proceso de eliminación
        await AppDataSource.transaction(async transactionalEntityManager => {
            const cursoRepository = transactionalEntityManager.getRepository(Curso);

            // Buscar el curso por ID
            const curso = await cursoRepository.findOne({ where: { id: parseInt(id, 10) } });

            // Verificar si el curso existe
            if (!curso) {
                return res.status(404).json({ mensaje: 'El curso no existe' });
            }

            // Eliminar el curso
            await cursoRepository.remove(curso);

            // Responder con un mensaje de éxito
            res.status(200).json({ mensaje: 'Curso eliminado correctamente' });
        });
    } catch (err: unknown) {
        if (err instanceof Error) {
            console.error('Error al eliminar el curso:', err); // Para registro en consola
            res.status(500).json({ mensaje: 'Error al eliminar el curso' });
        }
    }
};

