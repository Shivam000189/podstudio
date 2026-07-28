import dotenv from "dotenv";
dotenv.config();
import { env } from "./config/env";
import express, { Request, Response } from 'express';
import { prisma} from './config/prisma'; // Import your separate client instance
import authRoutes from './routes/auth.routes'

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use('/api/auth', authRoutes);

// Health Check Route
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Express + TypeScript server is running smoothly!' });
});


app.listen(PORT, () => {
  console.log(`🚀 Server is listening at http://localhost:${PORT}`);
});
