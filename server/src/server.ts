import dotenv from "dotenv";
dotenv.config();
import { env } from "./config/env";
import express, { Request, Response } from 'express';
import { prisma} from './config/prisma'; // Import your separate client instance
import authRoutes from './routes/auth.routes'
import cors from 'cors';
import roomRoutes from './routes/room.routes'

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const localOrigins = ["http://localhost:5173", "http://127.0.0.1:5173"];
const allowedOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors((req, callback) => {
  const origin = req.header("Origin");
  const requestOrigin = `${req.protocol}://${req.get("host")}`;
  const origins = process.env.NODE_ENV === "production"
    ? allowedOrigins
    : [...allowedOrigins, ...localOrigins];

  if (!origin || origin === requestOrigin || origins.includes(origin)) {
    return callback(null, { origin: true, credentials: true });
  }

  return callback(new Error("Not allowed by CORS"));
}));



app.use('/api/auth', authRoutes);
app.use('/api', roomRoutes);

// Health Check Route
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Express + TypeScript server is running smoothly!' });
});


app.listen(PORT, () => {
  console.log(`🚀 Server is listening at http://localhost:${PORT}`);
});
