import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import objectRoutes from './src/routes/objects.routes.js';
import autenticacionRoutes from './src/routes/autenticacion.routes.js';
import healthRoutes from './src/routes/health.routes.js';
import { errorHandler } from './src/middlewares/error.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const frontendPath = path.join(__dirname, "../frontend/dist");

app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-user-id", "x-user-role"],
  }),
);
app.use(express.json());
app.use(morgan("dev"));

app.use('/api/autenticacion', autenticacionRoutes);
app.use('/api/objects', objectRoutes);
app.use('/api/health', healthRoutes);

app.use(express.static(frontendPath));

app.get("/{*splat}", (req, res, next) => {
  if (req.path.startsWith("/api")) {
    return next();
  }

  res.sendFile(path.join(frontendPath, "index.html"));
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
