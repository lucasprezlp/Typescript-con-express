import { Request, Response } from 'express';
import { Profesor } from '../models/profesorModel';
import { AppDataSource } from '../db/conexion';
import { Curso } from '../models/cursoModel';


var profesrores: Profesor[]

export const consultarTodos = async (req: Request, res: Response): Promise<void> => {
    try {
        const profesorRepository = AppDataSource.getRepository(Profesor);
        const profesores = await profesorRepository.find();
        // res.status(200).json(profesores);
        res.render('listarProfesores', {
            pagina: 'Lista de Profesores',
            varnav: 'listar',
            profesores
        });
    } catch (err: unknown) {
        if (err instanceof Error) {
            res.status(500).send(err.message);
        }
    }
};

export const consultarUno = async (req: Request, res: Response): Promise<Profesor | null> => {
    const { id } = req.params;
    try {
        const profesorRepository = AppDataSource.getRepository(Profesor);
        const profesor = await profesorRepository.findOne({ where: { id: Number(id) } });

        if (profesor) {
            return profesor;
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

export const insertar = async (req: Request, res: Response): Promise<void> => {

    //  FALTA LA VALIDACION /////////////////
    // const errores = validationResult(req);
    // if (!errores.isEmpty()) {
    //     return res.render('cargaEstudiantes', {
    //         pagina: 'Crear Estudiante',
    //         errores: errores.array()
    //     });
    // }

    const { dni, nombre, apellido, email, profesion, telefono } = req.body;
    try {
        await AppDataSource.transaction(async (transactionalEntityManager) => {
            const profesorRepository = transactionalEntityManager.getRepository(Profesor)
            const existeProfesor = await profesorRepository.findOne({
                where: [{ dni }]
            })
            if (existeProfesor) {
                throw new Error('El profesor ya existe')
            }
            const nuevoProfesor = profesorRepository.create({ dni, nombre, apellido, email, profesion, telefono });
            await profesorRepository.save(nuevoProfesor);
        });
        const profesores = await AppDataSource.getRepository(Profesor).find();
        res.render('listarProfesores', {
            pagina: 'Lista de Profesores',
            varnav: 'listar',
            profesores
        });
    } catch (err: unknown) {
        if (err instanceof Error) {
            res.status(500).send(err.message);
        }
    }
};

export const modificar = async (req: Request, res: Response) => {
    const { id } = req.params; // El ID del profesor a modificar
    const { dni, nombre, apellido, email, telefono } = req.body; // Datos a modificar, omitimos createAt y updateAt

    try {
        const profesorRepositorio = AppDataSource.getRepository(Profesor);
        const profesor = await profesorRepositorio.findOne({ where: { id: parseInt(id) } });

        if (!profesor) {
            return res.status(404).send('Profesor no encontrado'); // Profesor no encontrado
        }
        profesorRepositorio.merge(profesor, { dni, nombre, apellido, email, telefono });
        await profesorRepositorio.save(profesor);

        return res.status(200).send('Profesor modificado correctamente'); // Modificación exitosa
    } catch (error) {
        console.error('Error al modificar al profesor:', error);
        return res.status(500).send('Error del servidor'); // Error del servidor
    }
};

export const eliminar = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        await AppDataSource.transaction(async transactionalEntityManager => {
            const cursoRepository = transactionalEntityManager.getRepository(Curso);
            const profesorRepository = transactionalEntityManager.getRepository(Profesor);

            const cursosRelacionados = await cursoRepository.count({ where: { profesor: { id: Number(id) } } });

            if (cursosRelacionados > 0) {
                throw new Error('Profesor dictando materias, no se puede eliminar');
            }

            const deleteResult = await profesorRepository.delete(id);

            if (deleteResult.affected === 1) {
                res.status(200).json({ mensaje: 'Profesor eliminado' });
            } else {
                throw new Error('Profesor no encontrado');
            }
        });
    } catch (err: unknown) {
        if (err instanceof Error) {
            res.status(400).json({ mensaje: err.message });
        } else {
            res.status(400).json({ mensaje: 'Error' });
        }
    }
}
