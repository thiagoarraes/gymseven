import express from 'express';
import cors from 'cors';
import { setupRoutes } from './routes';
import { errorHandler } from './core/middleware/errorHandler';

// Example integration file for the refactored API
// This shows how to integrate the new architecture

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup routes
setupRoutes(app);

// Error handling middleware (should be last)
app.use(errorHandler);

const PORT = process.env.PORT || 3001;

// Only start if this file is run directly (not imported)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Refactored API server running on port ${PORT}`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/api/v2/health`);
  });
}

export default app;