import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import objetoRoutes from './src/routes/objeto.routes.js';
import {
  editObject,
  getApprovedObjects,
  getPendingObjects,
  approveObject,
  getObjectOptions
} from "./src/controllers/object.controller.js";
import { devAuthMiddleware } from "./src/middlewares/dev-auth.middleware.js";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const frontendPath = path.join(__dirname, "../frontend/dist");

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use('/api/objects', objetoRoutes);

app.get('/api/health', (req, res) => {
  res.json({ message: 'Backend funcionando' });
});

app.patch(
  '/api/objetos/:id',
  devAuthMiddleware,
  editObject
);

app.get('/api/objects', getApprovedObjects);
app.get('/api/objects/pending', devAuthMiddleware, getPendingObjects);

app.patch("/api/objetos/:id/aprobar", devAuthMiddleware, approveObject);

app.get("/api/objetos/opciones", getObjectOptions);
app.get("/api/objects/pending", getPendingObjects);

app.use(express.static(frontendPath));

app.get("/{*splat}", (req, res, next) => {
  if (req.path.startsWith("/api")) {
    return next();
  }

  res.sendFile(path.join(frontendPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
