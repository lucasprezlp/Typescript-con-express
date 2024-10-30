import express, {Request, Response }  from "express";
import cors from 'cors';
import morgan from "morgan";
import path from "path";
import estudianteRouter from'./routes/estudianteRouter';
import profesorRouter from './routes/profesorRoutes';
import inscripcionRouter from './routes/inscripcionRouter';
import cursoRouter from './routes/cursosRouter';
import methodOverride from 'method-override';

const app=express();

//habilitamos pug
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, '/views'));
//copiar la carpeta views en public
//la línea 15 la comentamos y ponemos la nueva ubicación, 
//ojo que nos falta modificar el _dirname, descomentar la línea 19
//app.set('views', path.join(__dirname, '.public/views'));

//carpeta pblica
app.use(express.static('public'));



app.use(methodOverride('_method'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(morgan('dev'));
app.use(cors());

app.get('/',(req:Request,res:Response)=>{
    console.log(__dirname);
    return res.render('index', {
        pagina: 'App Univerdsidad',
       // errores: errores.array()
    });
});
app.use('/estudiantes', estudianteRouter);
app.use('/profesores',profesorRouter );
app.use('/cursos',cursoRouter );
app.use('/inscripciones',inscripcionRouter);
app.use('/api', inscripcionRouter) // lo uso para ingresar las notas de los incripcion

export default app;

