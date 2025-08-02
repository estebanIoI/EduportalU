const { generarInformeDocentes } = require('../../services/descargas/informe.service');

const descargarInformeDocentes = async (req, res) => {
  try {
    const filtros = req.query; 
    const buffer = await generarInformeDocentes(filtros); 

    res.setHeader('Content-Disposition', 'attachment; filename=informe_docentes.docx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.send(buffer);
  } catch (err) {
    console.error('Error generando Word:', err);
    res.status(500).json({ 
      error: 'Error al generar el informe',
      details: err.message 
    });
  }
};

module.exports = {
  descargarInformeDocentes,
};