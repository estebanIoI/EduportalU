const express = require('express');
const { 
  getVistaAcademica, 
  getVistaAcademicaById, 
  getPeriodos, 
  getSedes, 
  getProgramas, 
  getSemestres,  
  getGrupos, 
  getFiltrosDinamicos, 
  getOpcionesFiltros 
} = require('../../controllers/vista/vistaAcademica.controller');
const { verifyToken, checkRole } = require('../../middlewares/userAuth.middleware');

const router = express.Router();

// IMPORTANTE: Las rutas específicas deben ir ANTES de las rutas dinámicas (/:id)
router.get('/opciones-filtros', getOpcionesFiltros);
router.get('/periodos', getPeriodos);
router.get('/sedes', getSedes);
router.get('/programas', getProgramas);
router.get('/semestres', getSemestres);
router.get('/grupos', getGrupos);

// Ruta genérica - debe ir AL FINAL
router.get('/:id', getVistaAcademicaById);
router.get('/', getVistaAcademica);

module.exports = router;