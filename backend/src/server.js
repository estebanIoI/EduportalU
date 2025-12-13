// src/server.js
require('dotenv').config();
const app = require('./app');
require('../src/api/v1/jobs/evaluacion/actualizarActivoConfiguracion.job');

const PORT = process.env.PORT;

// Función para imprimir mensajes de inicio
const printStartupMessages = () => {
  console.clear();
  console.log('\n🚀 Sistema de Evaluación Docente - Backend');
  console.log('════════════════════════════════════════════════════════════════════════════');
  console.log(`📡 Puerto: ${PORT}`);
  
  if (process.env.NODE_ENV === 'production') {
    console.log(`🌐 API: https://clownfish-app-hnngr.ondigitalocean.app/api/v1`);
    console.log(`📚 Swagger: https://clownfish-app-hnngr.ondigitalocean.app/api-docs`);
  } else {
    console.log(`🌐 API: http://localhost:${PORT}/api/v1`);
    console.log(`📚 Swagger: http://localhost:${PORT}/api-docs`);
  }
  
  console.log(`⚙️  Modo: ${process.env.NODE_ENV || 'development'}`);
  console.log('════════════════════════════════════════════════════════════════════════════');
  console.log('💡 Para detener el servidor, presiona Ctrl+C\n');
};

const server = app.listen(PORT, () => {
  printStartupMessages();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('\n❌ ERROR: Rechazo de promesa no manejado');
  console.log('⚠️  El servidor se está apagando...');
  console.error('📝 Detalles del error:', err);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log('\n❌ ERROR: Excepción no capturada');
  console.log('⚠️  El servidor se está apagando...');
  console.error('📝 Detalles del error:', err);
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n👋 Señal SIGTERM recibida');
  console.log('🛑 Cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado exitosamente');
    process.exit(0);
  });
});