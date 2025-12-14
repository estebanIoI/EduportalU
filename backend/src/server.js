// src/server.js
require('dotenv').config();

console.log('🔧 1. Cargando configuración...');
console.log('   PORT:', process.env.PORT);
console.log('   NODE_ENV:', process.env.NODE_ENV);

console.log('🔧 2. Importando app...');
const app = require('./app');
console.log('   App importado:', typeof app);
console.log('   Es función?:', typeof app === 'function');

console.log('🔧 3. Cargando jobs...');
require('../src/api/v1/jobs/evaluacion/actualizarActivoConfiguracion.job');
console.log('   Jobs cargados');

const PORT = process.env.PORT;

// Función para imprimir mensajes de inicio
const printStartupMessages = () => {
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
  
  // NUEVO: Listar rutas registradas
  console.log('📋 Verificando rutas registradas:');
  let routeCount = 0;
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      routeCount++;
      console.log(`   ✓ ${Object.keys(middleware.route.methods).join(', ').toUpperCase()} ${middleware.route.path}`);
    } else if (middleware.name === 'router') {
      routeCount++;
      console.log(`   ✓ Router montado en:`, middleware.regexp);
    }
  });
  console.log(`   Total: ${routeCount} rutas/routers registrados\n`);
};

console.log('🔧 4. Iniciando servidor...');
const server = app.listen(PORT, () => {
  printStartupMessages();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('\n❌ ERROR: Rechazo de promesa no manejado');
  console.log('⚠️  El servidor se está apagando...');
  console.error('📝 Detalles del error:', err);
  console.error('📝 Stack:', err.stack);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log('\n❌ ERROR: Excepción no capturada');
  console.log('⚠️  El servidor se está apagando...');
  console.error('📝 Detalles del error:', err);
  console.error('📝 Stack:', err.stack);
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