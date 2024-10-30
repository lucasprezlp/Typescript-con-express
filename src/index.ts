
import app from './app';

import { initializeDatabase } from './db/conexion';

const port =6505;

async function main(){
    try {
        await initializeDatabase(); 
        console.log('Base de datos conectada');

        app.listen(6505, () => {
            console.log(`Servidor activo en el puerto ${port}`);
        });

    } catch (err: unknown) {
        if (err instanceof Error) {
            console.log('Error al conectar con la base de datos:', err.message);
        }
    }
}

main();
