import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import objectRoutes from './src/routes/objects.routes.js';
import {
  updateObject,
  getApprovedObjects,
  getAllPendingObjects,
  getPendingObjectsByUser,
  approveObject,
  getObjectOptions,
  deletePendingObject
} from "./src/controllers/object.controller.js";
import { approveLog, manualRejectLog } from "./src/controllers/log.controller.js";
import { devAuthMiddleware } from "./src/middlewares/dev-auth.middleware.js";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const frontendPath = path.join(__dirname, "../frontend/dist");

app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "x-user-id", "x-user-role"],
  }),
);
app.use(express.json());
app.use(morgan("dev"));

app.use('/api/objects', objectRoutes);

app.get('/api/health', (req, res) => {
  res.json({ message: 'Backend funcionando' });
});

app.patch(
  '/api/objects/:id',
  devAuthMiddleware,
  updateObject
);
app.patch("/api/objects/:id/approve", devAuthMiddleware, approveObject);

app.post("/api/objects/:objetoId/approve", devAuthMiddleware, approveLog);
app.post("/api/objects/:objetoId/reject", devAuthMiddleware, manualRejectLog);

app.get('/api/objects', getApprovedObjects);
app.get('/api/objects/pending', devAuthMiddleware, getAllPendingObjects);
app.get('/api/objects/pending/user', devAuthMiddleware, getPendingObjectsByUser);
app.get("/api/objects/options", getObjectOptions);

app.delete("/api/objects/:id", devAuthMiddleware, deletePendingObject);

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
