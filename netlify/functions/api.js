import serverless from 'serverless-http';
import express from 'express';
import cors from 'cors';
import { loadEnv } from '../../server/env.js';
import { registerRoutes } from '../../server/routes.js';

// Load environment variables
loadEnv();

const app = express();

// Configure CORS for production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://gymseven.netlify.app',
        'https://main--gymseven.netlify.app',
        'https://deploy-preview--gymseven.netlify.app'
      ]
    : ['http://localhost:3000', 'http://localhost:8888'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add request logging
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on("finish", () => {
    const duration = Date.now() - start;
    const logLine = `${req.method} ${req.path} ${res.statusCode} in ${duration}ms`;
    console.log(logLine);
  });

  next();
});

// Initialize routes without server instance (for serverless)
async function initializeApp() {
  try {
    await registerRoutes(app, false); // Don't create server instance for serverless
    console.log('✅ Serverless function initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize serverless function:', error);
  }
}

// Initialize the app
await initializeApp();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'GymSeven API is running on Netlify Functions',
    timestamp: new Date().toISOString()
  });
});

// Export the serverless handler
export const handler = serverless(app);