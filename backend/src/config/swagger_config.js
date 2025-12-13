// src/config/swagger_config.js
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API',
      version: '1.0.0',
      description: 'API',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    servers: [
      {
        url: process.env.NODE_ENV === 'production' ? 'https://clownfish-app-hnngr.ondigitalocean.app/api/v1' : 'http://localhost:5000/api/v1',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
      },
    ],
  },
  apis: ['./src/api/v1/swagger/**/*.js'],
};

const specs = swaggerJsdoc(options);

module.exports = specs;