import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { prisma } from './prisma';
import LawyerRouter from './routes/lawyer.routes';
import RegisterRouter from './routes/register.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/', LawyerRouter)
app.use(RegisterRouter)

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
