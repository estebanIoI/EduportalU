// src/api/v1/middlewares/pagination.js - Versión mejorada

/**
 * Middleware de paginación para endpoints que requieren listado de datos
 * @param {Object} options - Opciones de configuración
 * @param {number} options.defaultLimit - Límite por defecto (default: 10)
 * @param {number} options.maxLimit - Límite máximo permitido (default: 100)
 * @param {number} options.defaultPage - Página por defecto (default: 1)
 */
const pagination = (options = {}) => {
  const {
    defaultLimit = 10,
    maxLimit = 100,
    defaultPage = 1
  } = options;

  return (req, res, next) => {
    try {
      // Obtener parámetros de query
      let { page, limit, offset } = req.query;

      // Logging para debug
      console.log('Parámetros recibidos:', { page, limit, offset });

      // Parsear y validar página
      page = parseInt(page) || defaultPage;
      page = page < 1 ? defaultPage : page;

      // Parsear y validar límite
      limit = parseInt(limit) || defaultLimit;
      limit = limit < 1 ? defaultLimit : limit;
      limit = limit > maxLimit ? maxLimit : limit;

      // Calcular offset basado en la página (ignorar offset del query si existe)
      // Es mejor usar siempre page para evitar confusiones
      offset = (page - 1) * limit;

      // Validar que offset sea válido
      if (offset < 0) {
        offset = 0;
      }

      console.log('Parámetros procesados:', { page, limit, offset });

      // Agregar parámetros de paginación al request
      req.pagination = {
        page: parseInt(page),
        limit: parseInt(limit),
        offset: parseInt(offset)
      };

      // Función helper para formatear la respuesta paginada
      res.paginate = (data, totalCount) => {
        const totalPages = Math.ceil(totalCount / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        const paginationInfo = {
          currentPage: page,
          totalPages,
          totalItems: totalCount,
          itemsPerPage: limit,
          hasNextPage,
          hasPrevPage,
          nextPage: hasNextPage ? page + 1 : null,
          prevPage: hasPrevPage ? page - 1 : null
        };

        console.log('Información de paginación:', paginationInfo);

        return {
          data,
          pagination: paginationInfo
        };
      };

      next();
    } catch (error) {
      console.error('Error en middleware de paginación:', error);
      next(error);
    }
  };
};

module.exports = pagination;