import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { config } from './config/config';
import { connectDB } from './utils/database';
import { startKeepAlive } from './utils/keep-alive';
import routes from './routes';
import errorHandler from './middleware/error.middleware';

const app = express();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://zemon.vercel.app',
    'https://zemon-df22.onrender.com'
  ],
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// Health check endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Routes
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});
app.use('/api', routes);

// Error handling
app.use(errorHandler);

// Start server
const start = async () => {
  try {
    await connectDB();
    app.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
      
      // Start keep-alive service in production
      if (config.env === 'production') {
        startKeepAlive();
      }
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
};

start(); 