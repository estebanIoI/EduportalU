// src/api/v1/middlewares/pagination.js
module.exports = (req, _res, next) => {
  const MAX       = 100;              // tope duro para evitar DOS
  const perPage   = Math.min(+req.query.perPage || 10, MAX);
  const page      = Math.max(+req.query.page || 1, 1);

  req.pag = { page, perPage, offset: (page - 1) * perPage };
  next();
};
