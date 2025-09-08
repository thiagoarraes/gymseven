import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { loadEnv } from "./env";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

// Import new refactored API setup
import { setupRoutes as setupV2Routes } from "../apps/api/src/routes/index";

// Load environment variables from .env file first
loadEnv();

// Verify database configuration before starting server
function verifyDatabaseConfiguration() {
  if (!process.env.DATABASE_URL) {
    console.log('\n❌ CONFIGURAÇÃO DE BANCO DE DADOS NECESSÁRIA\n');
    console.log('Para usar este projeto, você precisa configurar a variável DATABASE_URL\n');
    console.log('🔧 COMO CONFIGURAR NO REPLIT:');
    console.log('1. Abra a aba "Secrets" no painel lateral');
    console.log('2. Adicione DATABASE_URL com sua string de conexão PostgreSQL');
    console.log('3. Reinicie o projeto após adicionar a credencial');
    console.log('\n⚠️  O servidor não será iniciado sem essa configuração.\n');
    process.exit(1);
  }
  console.log('✅ Configuração do banco de dados verificada com sucesso!');
}

// Verify configuration before proceeding
verifyDatabaseConfiguration();

const app = express();

// Enhanced CORS configuration for Replit
app.use(cors({
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Allow Replit domains and localhost
    const allowedOrigins = [
      /\.replit\.dev$/,
      /\.repl\.co$/,
      /localhost/,
      /127\.0\.0\.1/
    ];
    
    const isAllowed = allowedOrigins.some(pattern => 
      typeof pattern === 'string' ? origin === pattern : pattern.test(origin)
    );
    
    callback(null, isAllowed);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app, true);
  
  // Setup new refactored API routes (v2) alongside legacy routes
  try {
    setupV2Routes(app);
    console.log('✅ API v2 routes enabled successfully');
  } catch (error) {
    console.log('⚠️ API v2 routes failed to initialize:', error);
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    if (server) await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  if (server) {
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`serving on port ${port}`);
    });
  }
})();
