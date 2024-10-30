import { Request, Response, NextFunction } from 'express';
import { check, validationResult } from 'express-validator';
import { AppDataSource } from '../db/conexion';
import { CursoEstudiante } from '../models/cursoEstudianteModel';
import { Estudiante } from '../models/estudianteModel';
import { Curso } from '../models/cursoModel';

// Middleware de validación para inscripciones
export const validarInscripcion = () => [
    check('estudiante_id').notEmpty().withMessage('El ID del estudiante es obligatorio'),
    check('curso_id').notEmpty().withMessage('El ID del curso es obligatorio'),
    (req: Request, res: Response, next: NextFunction) => {
        const errores = validationResult(req);
        if (!errores.isEmpty()) {
            return res.status(400).json({ errores: errores.array() });
        }
        next();
    }
];

// Consultar todas las inscripciones
export const consultarInscripciones = async (req: Request, res: Response) => {
    try {
        const cursoEstudianteRepository = AppDataSource.getRepository(CursoEstudiante);
        
        // Consulta con las relaciones de 'curso' y 'estudiante'
        const inscripciones = await cursoEstudianteRepository.find({
            relations: ['curso', 'estudiante']  // Incluye las relaciones para obtener los nombres
        });

        // Renderiza la vista con los datos recuperados
        res.render('listarInscripciones', {
            pagina: 'Lista de Inscripciones',
            varnav: 'listar',
            inscripciones // Pasa las inscripciones a la vista
        });

    } catch (err: unknown) {
        if (err instanceof Error) {
            res.status(500).send(err.message);
        }
    }
};


// Consultar inscripciones por estudiante
export const consultarUno = async (req: Request, res: Response): Promise<CursoEstudiante | null>  => {
    const { estudiante_id, curso_id } = req.params;
    const estudianteId = Number(estudiante_id);
    const cursoId = Number(curso_id);

    // Validación de los IDs
    if (isNaN(estudianteId)) {
        throw new Error('ID del estudiante inválido');
    }
    if (isNaN(cursoId)) {

        throw new Error('ID del curso inválido');
    }

    try {
        const cursoEstudianteRepository = AppDataSource.getRepository(CursoEstudiante);

        // Encuentra la inscripción y hace un join para obtener curso y estudiante
        const inscripciones = await cursoEstudianteRepository.findOne({
            where: {
                estudiante_id: estudianteId,
                curso_id: cursoId,
            }
        });
 
        if (inscripciones) {
            console.log(inscripciones)
            return inscripciones;
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


// Inscribir a un estudiante en un curso
export const inscribir = async (req: Request, res: Response) => {
    const { estudiante_id, curso_id } = req.body;

    try {
        await AppDataSource.transaction(async (transactionalEntityManager) => {
            const cursoEstudianteRepository = transactionalEntityManager.getRepository(CursoEstudiante);

            // Crear la inscripción sin verificar si estudiante y curso existen
            const nuevaInscripcion = cursoEstudianteRepository.create({
                estudiante: { id: estudiante_id },
                curso: { id: curso_id }
            });

            await cursoEstudianteRepository.save(nuevaInscripcion);

            // Obtener todas las inscripciones después de realizar la nueva inscripción
            const inscripciones = await cursoEstudianteRepository.find({
                relations: ['estudiante', 'curso'],
            });

            // Renderizar la vista de inscripciones con los datos actualizados
            res.render('listarInscripciones', {
                pagina: 'Lista de Inscripciones',
                inscripciones
            });
        });
    } catch (err: unknown) {
        if (err instanceof Error) {
            res.status(500).send(err.message);
        }
    }
};


// Cancelar inscripción
export const cancelarInscripcion = async (req: Request, res: Response) => {
    const { estudiante_id, curso_id } = req.params;
    const estudianteId = parseInt(estudiante_id, 10);
    const cursoId = parseInt(curso_id, 10);

    if (isNaN(estudianteId) || isNaN(cursoId)) {
        return res.status(400).json({ mensaje: 'ID inválido' });
    }

    try {
        await AppDataSource.transaction(async (transactionalEntityManager) => {
            const estudiante = await transactionalEntityManager.findOne(Estudiante, { where: { id: estudianteId } });
            const curso = await transactionalEntityManager.findOne(Curso, { where: { id: cursoId } });

            if (!estudiante) {
                return res.status(404).json({ mensaje: 'Estudiante no existe' });
            }
            if (!curso) {
                return res.status(404).json({ mensaje: 'Curso no existe' });
            }

            const inscripcion = await transactionalEntityManager.findOne(CursoEstudiante, {
                where: {
                    estudiante: { id: estudianteId },
                    curso: { id: cursoId }
                }
            });

            if (!inscripcion) {
                return res.status(404).json({ mensaje: 'La inscripción no existe' });
            }

            // Verificar si ya tiene nota
            if (inscripcion.nota && inscripcion.nota > 0) {
                return res.status(400).json({ mensaje: 'No se puede cancelar la inscripción porque el estudiante ya ha sido calificado' });
            }

            // Eliminar inscripción
            await transactionalEntityManager.remove(inscripcion);
            return res.status(200).json({ mensaje: 'Inscripción cancelada con éxito' });
        });
    } catch (err: unknown) {
        if (err instanceof Error) {
            console.error('Error cancelando inscripción:', err.message);
            return res.status(500).send('Error interno del servidor');
        }
    }
};


// Calificar estudiante en curso
export const calificar = async (req: Request, res: Response) => {
    const { estudiante_id, curso_id } = req.params;
    const { nota } = req.body;
    const estudianteId = parseInt(estudiante_id, 10);
    const cursoId = parseInt(curso_id, 10);
    
    // Verificación de ID
    if (isNaN(estudianteId) || isNaN(cursoId)) {
        return res.status(400).json({ mensaje: 'ID inválido' });
    }

    // Validación de nota
    if (nota == null || isNaN(nota) || nota < 0 || nota > 10) {
        return res.status(400).json({ mensaje: 'Nota inválida, debe ser un número entre 0 y 10' });
    }

    try {
        const cursoEstudianteRepository = AppDataSource.getRepository(CursoEstudiante);
        
        // Asegúrate de que esta consulta es correcta según tu modelo
        const inscripcion = await cursoEstudianteRepository.findOne({
            where: { estudiante: { id: estudianteId }, curso: { id: cursoId } }
        });

        if (!inscripcion) {
            return res.status(404).json({ mensaje: 'Inscripción no encontrada' });
        }

        // Asignar la nota y la fecha
        inscripcion.nota = nota;
        inscripcion.fecha = new Date();

        // Guardar los cambios en la base de datos
        await cursoEstudianteRepository.save(inscripcion);
        return res.status(200).json({ mensaje: 'Nota asignada correctamente', inscripcion });
        
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
        console.error('Error al asignar la nota:', errorMessage); // Registro del error en la consola
        return res.status(500).json({ mensaje: 'Error al asignar la nota', error: errorMessage });
    }
};




