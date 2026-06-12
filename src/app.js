import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { v2 as cloudinary } from 'cloudinary';
import fileUpload from 'express-fileupload';
import fs from 'fs';

import authRoutes from './routers/auth_routes.js';
import userRoutes from './routers/user_routes.js';
import itemRoutes from './routers/item_routes.js';
import aiRoutes from './routers/ai_routes.js';
import workspaceRoutes from './routers/workspace_routes.js';
import dashboardRoutes from './routers/dashboard_routes.js';
import executionRoutes from './routers/execution_routes.js';
import chatRoutes from './routers/chat_routes.js';

const app = express();
dotenv.config();

app.set('port', process.env.PORT || 3000);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

app.use(express.json());
app.use(cors());
const fileUploadMiddleware = fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/',
  createParentPath: true
});

app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/',
  createParentPath: true
}));

app.get('/', (req, res) => res.send('Server Geck-core on'));

if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/execute', executionRoutes);
app.use('/api/chat', chatRoutes);

app.use((req, res) => {
  console.log(`404 - Ruta no encontrada: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ msg: 'Endpoint no encontrado - 404' });
});

app.use((err, req, res, next) => {
  console.error('Error Crítico Interceptado por el Servidor:', err);
  res.status(500).json({ 
    ok: false, 
    msg: 'Hubo un problema procesando la petición antes de llegar a la ruta.',
    error: err.message
  });
});

export default app;
