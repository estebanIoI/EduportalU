// src/middleware/errorHandler.js

const errorHandler = (err, req, res, next) => {
  // Log del error con más contexto
  console.error('\n❌ Error en la aplicación:');
  console.error(`📍 Ruta: ${req.method} ${req.originalUrl}`);
  console.error(`📝 Detalles: ${err.message}`);
  console.error(`📊 Status Code: ${err.statusCode || 500}`);
  
  // Solo mostrar stack trace en desarrollo
  if (process.env.NODE_ENV === 'development') {
    console.error(`🔍 Stack: ${err.stack}`);
  }

  // Determinar el status code
  let statusCode = err.statusCode || 500;
  let message = err.message;

  // Manejo específico de errores comunes
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Datos de entrada inválidos';
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'ID inválido';
  } else if (err.code === 11000) {
    statusCode = 409;
    message = 'Recurso duplicado';
  } else if (!err.statusCode && err.message) {
    // Si no tiene statusCode pero tiene mensaje, probablemente es un error controlado
    statusCode = 400;
  } else if (!err.statusCode && !err.message) {
    // Error completamente desconocido
    message = 'Error interno del servidor';
  }

  // Respuesta al cliente
  const response = {
    success: false,
    message: message,
    timestamp: new Date().toISOString(),
    path: req.originalUrl
  };

  res.status(statusCode).json(response);
};

module.exports = errorHandler;