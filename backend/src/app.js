import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import apiRouter from './routes/index.js';
import { errorHandler } from './middlewares/error.middleware.js';

const app = express();

// Middlewares globales
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Montaje de rutas con prefijo /api
app.use('/api', apiRouter);

// Manejo de rutas inexistentes (404 Not Found)
app.use((req, res) => {
  res.status(404).json({
    error: `Ruta no encontrada: [${req.method}] ${req.originalUrl}`
  });
});

// Middleware global de manejo de errores
app.use(errorHandler);

export default app;
