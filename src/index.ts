import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import locationRoutes from './routes/locations';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Update CORS for production
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());
app.use('/api/locations', locationRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
