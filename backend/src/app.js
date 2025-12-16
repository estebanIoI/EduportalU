// src/app.js
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger_config');
const { initializeDatabase } = require('./db');
const routes = require('./api/v1/routes');
const dashboardRoutes = require('./api/v1/routes/reportes/dashboard.routes');
const errorHandler = require('./api/v1/middlewares/errorHandler');

// Initialize express app
const app = express();

// Configuración de CORS - Mismo dominio
const allowedOrigins = [
  // Producción - Mismo dominio
  'https://clownfish-app-hnngr.ondigitalocean.app',
  'http://clownfish-app-hnngr.ondigitalocean.app',
  
  // Desarrollo local
  'http://localhost:3000',
  'http://localhost:5000',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5000'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requests sin origin (mismo dominio, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }
    
    // Verificar si está en la lista
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Log para debugging
    console.log(`⚠️ CORS: Origen no listado: ${origin}`);
    
    // En producción, permitir mismo dominio aunque no esté listado
    if (origin && origin.includes('clownfish-app-hnngr.ondigitalocean.app')) {
      return callback(null, true);
    }
    
    // Permitir en desarrollo
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    callback(new Error('No permitido por CORS'), false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  credentials: true,
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// CORS debe ir PRIMERO
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Configuración de Helmet más permisiva
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false,
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logger
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Middleware de debugging
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.originalUrl} - Origin: ${req.get('origin') || 'Sin origin'}`);
  next();
});

// Initialize database
initializeDatabase()
  .then(() => {
    console.log('✅ Base de datos inicializada correctamente');
  })
  .catch((error) => {
    console.error('\n❌ Error al iniciar el servidor:');
    console.error(`📝 Detalles: ${error.message}`);
    process.exit(1);
  });

// Health check endpoint (raíz)
app.get('/health', async (req, res) => {
  try {
    const pool = require('./db').getPool();
    await pool.query('SELECT 1 as health');
    
    res.status(200).json({ 
      success: true,
      message: 'Servidor funcionando correctamente',
      data: {
        status: 'UP',
        database: 'Connected',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      }
    });
  } catch (error) {
    res.status(503).json({ 
      success: false,
      message: 'Error en el servidor',
      data: {
        status: 'DOWN',
        database: 'Disconnected',
        error: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Health check en /v1/health (para Digital Ocean health check)
app.get('/v1/health', async (req, res) => {
  try {
    const pool = require('./db').getPool();
    await pool.query('SELECT 1 as health');
    
    res.status(200).json({ 
      success: true,
      message: 'API v1 funcionando correctamente',
      data: {
        status: 'UP',
        database: 'Connected',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0'
      }
    });
  } catch (error) {
    res.status(503).json({ 
      success: false,
      message: 'Error en la API',
      data: {
        status: 'DOWN',
        database: 'Disconnected',
        error: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Backend API funcionando',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// API routes - Configuración para Digital Ocean
// DO tiene path prefix "/api", las rutas llegan como /v1/...
// Por eso montamos las rutas en '/v1'
const API_PREFIX = process.env.API_PREFIX || '/v1';
console.log(`🚀 Montando rutas en: ${API_PREFIX}`);
app.use(API_PREFIX, routes);
app.use('/dashboard', dashboardRoutes);

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// 404 handler
app.use((req, res) => {
  console.log(`❌ 404 - Ruta no encontrada: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `Recurso no encontrado: ${req.method} ${req.originalUrl}`,
    availableEndpoints: [
      'GET /api/',
      'GET /api/health',
      'GET /api/v1/...',
      'POST /api/v1/auth/login'
    ]
  });
});

// Error handling middleware
app.use(errorHandler);

module.exports = app;
