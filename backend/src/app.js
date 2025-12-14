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

// Configuración de CORS
const corsOptions = {
  origin: function (origin, callback) {
    // Lista de orígenes permitidos
    const allowedOrigins = [
      'https://clownfish-app-hnngr.ondigitalocean.app',
      'http://clownfish-app-hnngr.ondigitalocean.app',
      'http://62.146.231.110',
      'https://62.146.231.110',
      'http://62.146.231.110:3000',
      'https://62.146.231.110:3000',
      'http://localhost:3000', // Para desarrollo
      'http://localhost:5000'  // Para testing
    ];
    
    // Permitir requests sin origin (como mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(`CORS blocked origin: ${origin}`);
      callback(null, true); // Permitir todos los orígenes en producción por ahora
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400 // 24 horas
};

app.use(cors(corsOptions));

// Manejar preflight requests explícitamente
app.options('*', cors(corsOptions));

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "unsafe-none" },
  contentSecurityPolicy: false, // Desactivar CSP para permitir requests cross-origin
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Initialize database connection
initializeDatabase()
  .then(() => {
    console.log('✅ Base de datos inicializada correctamente');
    
    // Solo mostrar configuración detallada en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.log('\n🔒 CORS activado con las siguientes configuraciones:');
      console.log('════════════════════════════════════════════════════════════════════════════');
      console.log('   • Origen: Configurado para producción');
      console.log('   • Métodos: GET, POST, PUT, DELETE, PATCH, OPTIONS');
      console.log('   • Headers: Content-Type, Authorization');
      console.log('   • Credenciales: Habilitadas');
      console.log('   • Tiempo de caché: 24 horas');
      console.log('════════════════════════════════════════════════════════════════════════════\n');
    }
  })
  .catch((error) => {
    console.error('\n❌ Error al iniciar el servidor:');
    console.error(`📝 Detalles: ${error.message}`);
    process.exit(1);
  });

// Health check endpoints
app.get('/health', async (req, res) => {
  try {
    // Verificar conexión a base de datos local
    const pool = require('./db').getPool();
    const [rows] = await pool.query('SELECT 1 as health');
    
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
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      }
    });
  }
});

app.get('/api/v1/health', async (req, res) => {
  try {
    // Verificar conexión a base de datos local
    const pool = require('./db').getPool();
    const [rows] = await pool.query('SELECT 1 as health');
    
    res.status(200).json({ 
      success: true,
      message: 'API funcionando correctamente',
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
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0'
      }
    });
  }
});

// API routes
app.use('/api/v1', routes);
app.use('/api/dashboard', dashboardRoutes);

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Verificar conexión a base de datos local
    const pool = require('./db').getPool();
    const [rows] = await pool.query('SELECT 1 as health');
    
    res.status(200).json({ 
      status: 'UP', 
      message: 'Servidor funcionando correctamente',
      database: 'Connected',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'DOWN', 
      message: 'Error en el servidor',
      database: 'Disconnected',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Recurso no encontrado'
  });
});

// Error handling middleware
app.use(errorHandler);

module.exports = app;
