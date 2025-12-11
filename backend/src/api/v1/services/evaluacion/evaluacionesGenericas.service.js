// src/api/v1/services/evaluacion/evaluacionesGenericas.service.js
const EvaluacionesGenericasModel = require('../../models/evaluacion/evaluacionesGenericas.model');
const { getSecurityPool } = require('../../../../db');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

const createBulk = async (data) => {
  try {
    const result = await EvaluacionesGenericasModel.createBulk(data);
    return result;
  } catch (error) {
    throw error;
  }
};

const getByEstudianteAndConfiguracion = async (documentoEstudiante, configuracionId) => {
  try {
    const evaluaciones = await EvaluacionesGenericasModel.getByEstudianteAndConfiguracion(documentoEstudiante, configuracionId);
    return evaluaciones;
  } catch (error) {
    throw error;
  }
};

const getDetalleById = async (evaluacionGenericaId) => {
  try {
    const detalle = await EvaluacionesGenericasModel.getDetalleById(evaluacionGenericaId);
    return detalle;
  } catch (error) {
    throw error;
  }
};

const getAllEvaluaciones = async () => {
  try {
    const evaluaciones = await EvaluacionesGenericasModel.getAllEvaluaciones();
    
    // Obtener los nombres de los estudiantes desde la base de datos de seguridad
    if (evaluaciones.length > 0) {
      const securityPool = getSecurityPool();
      const documentos = [...new Set(evaluaciones.map(e => e.DOCUMENTO_ESTUDIANTE))];
      
      if (documentos.length > 0) {
        const [estudiantes] = await securityPool.query(
          `SELECT user_id, user_name FROM datalogin WHERE user_id IN (?)`,
          [documentos]
        );
        
        // Crear un mapa de documento -> nombre
        const estudiantesMap = {};
        estudiantes.forEach(est => {
          estudiantesMap[est.user_id] = est.user_name;
        });
        
        // Agregar el nombre del estudiante a cada evaluación
        evaluaciones.forEach(ev => {
          ev.NOMBRE_ESTUDIANTE = estudiantesMap[ev.DOCUMENTO_ESTUDIANTE] || 'No encontrado';
        });
      }
    }
    
    return evaluaciones;
  } catch (error) {
    console.error('Error en getAllEvaluaciones service:', error);
    throw error;
  }
};

const generarInformePDF = async (evaluacionGenericaId) => {
  try {
    const detalle = await EvaluacionesGenericasModel.getDetalleById(evaluacionGenericaId);
    
    if (!detalle) {
      throw new Error('Evaluación no encontrada');
    }

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });
      doc.on('error', reject);

      // Encabezado
      doc.fontSize(20).text('Informe de Evaluación Genérica', { align: 'center' });
      doc.moveDown();
      
      // Información general
      doc.fontSize(14).text('Información General', { underline: true });
      doc.fontSize(11);
      doc.text(`ID de Evaluación: ${detalle.evaluacion.ID}`);
      doc.text(`Estudiante: ${detalle.evaluacion.DOCUMENTO_ESTUDIANTE}`);
      doc.text(`Configuración ID: ${detalle.evaluacion.CONFIGURACION_ID}`);
      doc.text(`Fecha: ${new Date(detalle.evaluacion.FECHA_EVALUACION).toLocaleString('es-ES')}`);
      doc.text(`Estado: ${detalle.evaluacion.ESTADO}`);
      doc.moveDown();

      // Comentario general
      if (detalle.evaluacion.COMENTARIO_GENERAL) {
        doc.fontSize(14).text('Comentario General', { underline: true });
        doc.fontSize(11).text(detalle.evaluacion.COMENTARIO_GENERAL);
        doc.moveDown();
      }

      // Aspectos evaluados
      if (detalle.aspectos && detalle.aspectos.length > 0) {
        doc.fontSize(14).text('Aspectos Evaluados', { underline: true });
        doc.fontSize(11);
        detalle.aspectos.forEach((aspecto, index) => {
          doc.text(`${index + 1}. Aspecto ID: ${aspecto.ASPECTO_ID} - Valoración ID: ${aspecto.VALORACION_ID}`);
          if (aspecto.COMENTARIO) {
            doc.text(`   Comentario: ${aspecto.COMENTARIO}`);
          }
        });
        doc.moveDown();
      }

      // Respuestas a preguntas
      if (detalle.respuestas && detalle.respuestas.length > 0) {
        doc.fontSize(14).text('Respuestas a Preguntas', { underline: true });
        doc.fontSize(11);
        detalle.respuestas.forEach((respuesta, index) => {
          doc.text(`${index + 1}. Pregunta ID: ${respuesta.PREGUNTA_ID}`);
          doc.text(`   Respuesta: ${respuesta.RESPUESTA}`);
          doc.moveDown(0.5);
        });
      }

      // Pie de página
      const pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(9).text(
          `Página ${i + 1} de ${pages.count}`,
          50,
          doc.page.height - 50,
          { align: 'center' }
        );
      }

      doc.end();
    });
  } catch (error) {
    throw error;
  }
};

const generarInformeConsolidado = async () => {
  try {
    const evaluaciones = await EvaluacionesGenericasModel.getAllEvaluacionesConDetalle();
    
    // Obtener los nombres de los estudiantes desde la base de datos de seguridad
    if (evaluaciones.length > 0) {
      const securityPool = getSecurityPool();
      const documentos = [...new Set(evaluaciones.map(e => e.DOCUMENTO_ESTUDIANTE))];
      
      if (documentos.length > 0) {
        const [estudiantes] = await securityPool.query(
          `SELECT user_id, user_name FROM datalogin WHERE user_id IN (?)`,
          [documentos]
        );
        
        // Crear un mapa de documento -> nombre
        const estudiantesMap = {};
        estudiantes.forEach(est => {
          estudiantesMap[est.user_id] = est.user_name;
        });
        
        // Agregar el nombre del estudiante a cada evaluación
        evaluaciones.forEach(ev => {
          ev.NOMBRE_ESTUDIANTE = estudiantesMap[ev.DOCUMENTO_ESTUDIANTE] || 'No encontrado';
        });
      }
    }
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Evaluaciones Genéricas');

    // Encabezados
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Estudiante', key: 'estudiante', width: 20 },
      { header: 'Configuración ID', key: 'configuracion', width: 15 },
      { header: 'Fecha', key: 'fecha', width: 20 },
      { header: 'Estado', key: 'estado', width: 15 },
      { header: 'Comentario General', key: 'comentario', width: 40 },
      { header: 'Aspectos Evaluados', key: 'aspectos', width: 30 },
      { header: 'Respuestas', key: 'respuestas', width: 40 }
    ];

    // Estilo de encabezados
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

    // Datos
    evaluaciones.forEach((ev) => {
      const aspectosTexto = ev.aspectos?.map(a => 
        `Aspecto ${a.ASPECTO_ID}: Valoración ${a.VALORACION_ID}${a.COMENTARIO ? ' - ' + a.COMENTARIO : ''}`
      ).join(' | ') || 'N/A';

      const respuestasTexto = ev.respuestas?.map(r => 
        `P${r.PREGUNTA_ID}: ${r.RESPUESTA}`
      ).join(' | ') || 'N/A';

      worksheet.addRow({
        id: ev.ID,
        estudiante: ev.NOMBRE_ESTUDIANTE || ev.DOCUMENTO_ESTUDIANTE,
        configuracion: ev.CONFIGURACION_ID,
        fecha: new Date(ev.FECHA_EVALUACION).toLocaleString('es-ES'),
        estado: ev.ESTADO,
        comentario: ev.COMENTARIO_GENERAL || 'N/A',
        aspectos: aspectosTexto,
        respuestas: respuestasTexto
      });
    });

    // Auto-filtro
    worksheet.autoFilter = {
      from: 'A1',
      to: 'H1'
    };

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  } catch (error) {
    throw error;
  }
};

const getCompletadasByEstudiantes = async (configuracionId, documentosEstudiantes) => {
  try {
    const completadas = await EvaluacionesGenericasModel.getCompletadasByEstudiantes(
      configuracionId, 
      documentosEstudiantes
    );
    return completadas;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createBulk,
  getByEstudianteAndConfiguracion,
  getDetalleById,
  getAllEvaluaciones,
  generarInformePDF,
  generarInformeConsolidado,
  getCompletadasByEstudiantes
};
