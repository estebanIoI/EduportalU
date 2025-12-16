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

const app = express();

// CORS permisivo
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

app.options('*', cors());

// Helmet
app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false,
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logger
app.use(morgan('combined'));

// Logging middleware
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.originalUrl} - Origin: ${req.get('origin') || 'No origin'}`);
  next();
});

// Initialize database
initializeDatabase()
  .then(() => console.log('✅ Base de datos inicializada correctamente'))
  .catch((error) => console.error('❌ Error DB:', error.message));

// Health check
app.get('/health', async (req, res) => {
  try {
    const pool = require('./db').getPool();
    await pool.query('SELECT 1');
    res.json({ 
      success: true,
      status: 'UP',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({ 
      success: false,
      status: 'DOWN',
      error: error.message
    });
  }
});

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Backend API funcionando',
    timestamp: new Date().toISOString()
  });
});

// IMPORTANTE: Montar rutas directamente en raíz
// Porque Digital Ocean ya maneja /api/v1 y lo quita
app.use('/', routes);
app.use('/dashboard', dashboardRoutes);

console.log('🚀 Montando rutas en: / (raíz)');

// Swagger
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// 404
app.use((req, res) => {
  console.log(`❌ 404: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `No encontrado: ${req.method} ${req.originalUrl}`
  });
});

// Error handler
app.use(errorHandler);

module.exports = app;
