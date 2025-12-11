/**
 * @fileoverview Servicio de Inteligencia Artificial para análisis de comentarios
 * @description Integración con Ollama para embeddings (nomic-embed-text) y generación de resúmenes (phi3.1:mini)
 * @version 1.0.0
 */

const axios = require('axios');

// ======================================
// CONFIGURACIÓN
// ======================================

const IA_CONFIG = {
  // URL base de Ollama
  OLLAMA_BASE_URL: process.env.OLLAMA_URL || 'http://localhost:11434',
  
  // Modelos
  EMBEDDING_MODEL: process.env.EMBEDDING_MODEL || 'nomic-embed-text:latest',
  GENERATIVE_MODEL: process.env.GENERATIVE_MODEL || 'phi3:mini',
  
  // Timeouts - reducidos para mejor experiencia
  EMBEDDING_TIMEOUT: 15000, // 15 segundos
  GENERATION_TIMEOUT: 60000, // 1 minuto
  
  // Límites - reducidos para respuestas más rápidas
  MAX_COMMENTS_FOR_IA: 10, // Solo usar IA con pocos comentarios
  MAX_TOKENS_RESPONSE: 512, // Respuestas más cortas
  
  // Umbrales de polaridad
  POSITIVE_THRESHOLD: 0.6,
  NEGATIVE_THRESHOLD: 0.4,
  
  // Usar solo fallback (clasificación por palabras clave) - más rápido
  USE_ONLY_FALLBACK: true,
};

// ======================================
// CLIENTE OLLAMA
// ======================================

const ollamaClient = axios.create({
  baseURL: IA_CONFIG.OLLAMA_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Verifica si Ollama está disponible
 */
const checkOllamaHealth = async () => {
  try {
    const response = await ollamaClient.get('/api/tags', { timeout: 5000 });
    const models = response.data?.models || [];
    return {
      available: true,
      models: models.map(m => m.name),
      hasEmbeddingModel: models.some(m => m.name.includes(IA_CONFIG.EMBEDDING_MODEL)),
      hasGenerativeModel: models.some(m => m.name.includes(IA_CONFIG.GENERATIVE_MODEL))
    };
  } catch (error) {
    console.error('Ollama no disponible:', error.message);
    return {
      available: false,
      models: [],
      error: error.message
    };
  }
};

// ======================================
// GENERACIÓN DE EMBEDDINGS
// ======================================

/**
 * Genera embedding para un texto usando nomic-embed-text
 * @param {string} text - Texto a procesar
 * @returns {Promise<number[]>} - Vector de embedding
 */
const generateEmbedding = async (text) => {
  try {
    const response = await ollamaClient.post('/api/embeddings', {
      model: IA_CONFIG.EMBEDDING_MODEL,
      prompt: text
    }, { timeout: IA_CONFIG.EMBEDDING_TIMEOUT });
    
    return response.data.embedding;
  } catch (error) {
    console.error('Error generando embedding:', error.message);
    return null;
  }
};

/**
 * Genera embeddings para múltiples textos
 * @param {string[]} texts - Array de textos
 * @returns {Promise<Array<{text: string, embedding: number[]}>>}
 */
const generateBatchEmbeddings = async (texts) => {
  const results = [];
  
  // Procesar en lotes para evitar sobrecarga
  const batches = [];
  for (let i = 0; i < texts.length; i += IA_CONFIG.MAX_COMMENTS_PER_BATCH) {
    batches.push(texts.slice(i, i + IA_CONFIG.MAX_COMMENTS_PER_BATCH));
  }
  
  for (const batch of batches) {
    const batchPromises = batch.map(async (text) => {
      const embedding = await generateEmbedding(text);
      return { text, embedding };
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }
  
  return results;
};

// ======================================
// ANÁLISIS DE POLARIDAD
// ======================================

/**
 * Clasifica un comentario como positivo, negativo o neutro usando IA
 * @param {string} text - Comentario a clasificar
 * @returns {Promise<{polaridad: string, confianza: number}>}
 */
const classifyPolarity = async (text) => {
  try {
    const prompt = `Analiza el siguiente comentario de evaluación docente y clasifícalo.
Responde SOLO con un JSON en este formato exacto: {"polaridad": "POSITIVO|NEGATIVO|NEUTRO", "confianza": 0.0-1.0}

Comentario: "${text}"

Respuesta JSON:`;

    const response = await ollamaClient.post('/api/generate', {
      model: IA_CONFIG.GENERATIVE_MODEL,
      prompt: prompt,
      stream: false,
      options: {
        temperature: 0.1,
        num_predict: 100
      }
    }, { timeout: IA_CONFIG.GENERATION_TIMEOUT });
    
    // Intentar parsear la respuesta JSON
    const responseText = response.data.response.trim();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        polaridad: parsed.polaridad?.toUpperCase() || 'NEUTRO',
        confianza: parseFloat(parsed.confianza) || 0.5
      };
    }
    
    // Fallback: análisis por palabras clave
    return fallbackPolarityAnalysis(text);
  } catch (error) {
    console.error('Error clasificando polaridad:', error.message);
    return fallbackPolarityAnalysis(text);
  }
};

/**
 * Análisis de polaridad por palabras clave (fallback)
 */
const fallbackPolarityAnalysis = (text) => {
  const textLower = text.toLowerCase();
  
  const palabrasPositivas = [
    'excelente', 'bueno', 'muy bien', 'genial', 'perfecto', 'claro',
    'comprensible', 'dominio', 'puntual', 'organizado', 'motivador',
    'paciente', 'dedicado', 'profesional', 'preparado', 'recomendado'
  ];
  
  const palabrasNegativas = [
    'malo', 'deficiente', 'mejorar', 'no entiende', 'confuso', 'desorganizado',
    'impuntual', 'aburrido', 'lento', 'difícil', 'complicado', 'no explica',
    'falta', 'nunca', 'rápido', 'no llega', 'no prepara'
  ];
  
  let scorePositivo = 0;
  let scoreNegativo = 0;
  
  palabrasPositivas.forEach(palabra => {
    if (textLower.includes(palabra)) scorePositivo++;
  });
  
  palabrasNegativas.forEach(palabra => {
    if (textLower.includes(palabra)) scoreNegativo++;
  });
  
  const total = scorePositivo + scoreNegativo;
  if (total === 0) {
    return { polaridad: 'NEUTRO', confianza: 0.5 };
  }
  
  const ratio = scorePositivo / total;
  
  if (ratio >= IA_CONFIG.POSITIVE_THRESHOLD) {
    return { polaridad: 'POSITIVO', confianza: ratio };
  } else if (ratio <= IA_CONFIG.NEGATIVE_THRESHOLD) {
    return { polaridad: 'NEGATIVO', confianza: 1 - ratio };
  } else {
    return { polaridad: 'NEUTRO', confianza: 0.5 };
  }
};

/**
 * Clasifica múltiples comentarios - OPTIMIZADO
 * Usa fallback rápido por palabras clave para clasificación masiva
 * Solo usa IA para casos ambiguos o cuando hay pocos comentarios
 */
const classifyBatchPolarity = async (texts) => {
  const results = [];
  
  // Si hay muchos comentarios, usar solo fallback para mayor velocidad
  const useOnlyFallback = texts.length > 10;
  
  for (const text of texts) {
    let classification;
    
    if (useOnlyFallback) {
      // Usar clasificación rápida por palabras clave
      classification = fallbackPolarityAnalysis(text);
    } else {
      // Para pocos comentarios, intentar con IA
      classification = await classifyPolarity(text);
    }
    
    results.push({ text, ...classification });
  }
  
  return results;
};

// ======================================
// GENERACIÓN DE RESÚMENES
// ======================================

/**
 * Genera un resumen de fortalezas y aspectos de mejora
 * @param {string[]} comentarios - Array de comentarios
 * @param {string} contexto - Contexto adicional (docente, materia, etc.)
 * @returns {Promise<Object>} - Resumen estructurado
 */
const generateResumen = async (comentarios, contexto = '') => {
  if (!comentarios || comentarios.length === 0) {
    return {
      fortalezas: [],
      aspectos_mejora: [],
      frases_representativas: { positivas: [], negativas: [] },
      resumen_ejecutivo: 'No hay comentarios suficientes para generar un resumen.'
    };
  }

  // Si está habilitado USE_ONLY_FALLBACK o hay muchos comentarios, usar clasificación rápida
  if (IA_CONFIG.USE_ONLY_FALLBACK || comentarios.length > IA_CONFIG.MAX_COMMENTS_FOR_IA) {
    console.log(`📊 Usando análisis rápido por palabras clave para ${comentarios.length} comentarios`);
    return fallbackResumen(comentarios);
  }

  try {
    // Usar solo los primeros 5 comentarios para el resumen
    const comentariosMuestra = comentarios.slice(0, 5).map(c => c.substring(0, 80)).join('; ');
    
    const prompt = `Resume estas opiniones sobre ${contexto || 'un docente'} en 2 oraciones: ${comentariosMuestra}`;

    const response = await ollamaClient.post('/api/generate', {
      model: IA_CONFIG.GENERATIVE_MODEL,
      prompt: prompt,
      stream: false,
      options: {
        temperature: 0.3,
        num_predict: IA_CONFIG.MAX_TOKENS_RESPONSE
      }
    }, { timeout: IA_CONFIG.GENERATION_TIMEOUT });
    
    const resumenTexto = response.data.response.trim();
    
    // Combinar resumen de IA con clasificación por palabras clave
    const fallback = fallbackResumen(comentarios);
    
    return {
      ...fallback,
      resumen_ejecutivo: resumenTexto || fallback.resumen_ejecutivo,
      procesado_con_ia: true,
      modelo_usado: IA_CONFIG.GENERATIVE_MODEL
    };
  } catch (error) {
    console.error('Error generando resumen con IA:', error.message);
    return fallbackResumen(comentarios);
  }
};

/**
 * Genera resumen usando análisis simple (fallback) - MUY RÁPIDO
 */
const fallbackResumen = (comentarios) => {
  const clasificados = comentarios.map(c => {
    const classification = fallbackPolarityAnalysis(c);
    return { texto: c, ...classification };
  });
  
  const positivos = clasificados.filter(c => c.polaridad === 'POSITIVO');
  const negativos = clasificados.filter(c => c.polaridad === 'NEGATIVO');
  const neutros = clasificados.filter(c => c.polaridad === 'NEUTRO');
  
  // Extraer fortalezas basadas en palabras clave encontradas
  const fortalezasSet = new Set();
  const mejoraSugerenciasSet = new Set();
  
  const mapeoFortalezas = {
    'excelente': 'Excelencia en la enseñanza',
    'bueno': 'Buen desempeño general',
    'claro': 'Claridad en las explicaciones',
    'didáctico': 'Metodología didáctica efectiva',
    'puntual': 'Puntualidad y responsabilidad',
    'organizado': 'Buena organización',
    'profesional': 'Profesionalismo',
    'domina': 'Dominio del tema',
    'paciente': 'Paciencia con los estudiantes',
    'motivador': 'Capacidad de motivación'
  };
  
  const mapeoMejoras = {
    'mejorar': 'Áreas generales de mejora identificadas',
    'confuso': 'Mejorar claridad en explicaciones',
    'desorganizado': 'Mejorar organización',
    'impuntual': 'Mejorar puntualidad',
    'difícil': 'Hacer el contenido más accesible',
    'rápido': 'Ajustar ritmo de clase',
    'falta': 'Completar aspectos faltantes'
  };
  
  positivos.forEach(c => {
    const texto = c.texto.toLowerCase();
    Object.entries(mapeoFortalezas).forEach(([palabra, fortaleza]) => {
      if (texto.includes(palabra)) fortalezasSet.add(fortaleza);
    });
  });
  
  negativos.forEach(c => {
    const texto = c.texto.toLowerCase();
    Object.entries(mapeoMejoras).forEach(([palabra, mejora]) => {
      if (texto.includes(palabra)) mejoraSugerenciasSet.add(mejora);
    });
  });
  
  // Si no encontró fortalezas específicas pero hay comentarios positivos
  if (fortalezasSet.size === 0 && positivos.length > 0) {
    fortalezasSet.add('Percepción general positiva de los estudiantes');
  }
  
  // Si no encontró mejoras específicas pero hay comentarios negativos
  if (mejoraSugerenciasSet.size === 0 && negativos.length > 0) {
    mejoraSugerenciasSet.add('Aspectos a revisar según retroalimentación estudiantil');
  }
  
  const total = comentarios.length;
  const pctPositivo = total > 0 ? Math.round((positivos.length / total) * 100) : 0;
  const pctNegativo = total > 0 ? Math.round((negativos.length / total) * 100) : 0;
  
  let valoracionGeneral = 'mixta';
  if (pctPositivo >= 70) valoracionGeneral = 'muy positiva';
  else if (pctPositivo >= 50) valoracionGeneral = 'positiva';
  else if (pctNegativo >= 50) valoracionGeneral = 'con áreas de mejora';
  
  return {
    fortalezas: Array.from(fortalezasSet).slice(0, 5),
    aspectos_mejora: Array.from(mejoraSugerenciasSet).slice(0, 5),
    frases_representativas: {
      positivas: positivos.slice(0, 3).map(c => c.texto.substring(0, 120)),
      negativas: negativos.slice(0, 3).map(c => c.texto.substring(0, 120))
    },
    resumen_ejecutivo: `Se analizaron ${total} comentarios con una percepción ${valoracionGeneral}: ${positivos.length} positivos (${pctPositivo}%), ${negativos.length} negativos (${pctNegativo}%) y ${neutros.length} neutros.`,
    estadisticas: {
      total: total,
      positivos: positivos.length,
      negativos: negativos.length,
      neutros: neutros.length,
      porcentaje_positivo: pctPositivo
    }
  };
};

/**
 * Genera resumen para un docente específico por materia
 */
const generateResumenDocenteMateria = async (comentariosData) => {
  const { documento_docente, codigo_materia, textos_para_analisis, comentarios_por_aspecto } = comentariosData;
  
  // Clasificar todos los comentarios
  const clasificaciones = await classifyBatchPolarity(textos_para_analisis);
  
  const positivos = clasificaciones.filter(c => c.polaridad === 'POSITIVO');
  const negativos = clasificaciones.filter(c => c.polaridad === 'NEGATIVO');
  const neutros = clasificaciones.filter(c => c.polaridad === 'NEUTRO');
  
  // Generar resumen con contexto
  const contexto = `el docente ${documento_docente} en la materia ${codigo_materia}`;
  const resumen = await generateResumen(textos_para_analisis, contexto);
  
  return {
    materia: codigo_materia,
    fortalezas: resumen.fortalezas,
    aspectos_mejora: resumen.aspectos_mejora,
    frases_representativas: resumen.frases_representativas,
    resumen_ejecutivo: resumen.resumen_ejecutivo,
    estadisticas: {
      total_comentarios: textos_para_analisis.length,
      positivos: positivos.length,
      negativos: negativos.length,
      neutros: neutros.length,
      porcentaje_positivos: textos_para_analisis.length > 0 
        ? ((positivos.length / textos_para_analisis.length) * 100).toFixed(1) 
        : 0
    }
  };
};

/**
 * Genera resumen consolidado para un programa
 */
const generateResumenPrograma = async (comentarios, programaNombre) => {
  const contexto = `el programa de ${programaNombre}`;
  return await generateResumen(comentarios, contexto);
};

/**
 * Genera resumen institucional con tendencias
 */
const generateResumenInstitucional = async (comentariosPorFacultad) => {
  const todosLosComentarios = [];
  Object.values(comentariosPorFacultad).forEach(facultad => {
    todosLosComentarios.push(...facultad.comentarios);
  });
  
  // Generar resumen general
  const resumenGeneral = await generateResumen(todosLosComentarios, 'la institución');
  
  // Identificar tendencias
  const tendencias = await generateTendencias(comentariosPorFacultad);
  
  return {
    ...resumenGeneral,
    tendencias
  };
};

/**
 * Identifica tendencias institucionales
 */
const generateTendencias = async (comentariosPorFacultad) => {
  try {
    const facultadesResumen = {};
    
    for (const [facultad, data] of Object.entries(comentariosPorFacultad)) {
      const clasificaciones = await classifyBatchPolarity(data.comentarios.slice(0, 20));
      facultadesResumen[facultad] = {
        total: data.comentarios.length,
        positivos: clasificaciones.filter(c => c.polaridad === 'POSITIVO').length,
        negativos: clasificaciones.filter(c => c.polaridad === 'NEGATIVO').length
      };
    }
    
    const prompt = `Analiza las siguientes estadísticas de evaluaciones por facultad e identifica tendencias:

${JSON.stringify(facultadesResumen, null, 2)}

Responde con un JSON: {"tendencias": ["tendencia1", "tendencia2", "tendencia3"]}`;

    const response = await ollamaClient.post('/api/generate', {
      model: IA_CONFIG.GENERATIVE_MODEL,
      prompt: prompt,
      stream: false,
      options: {
        temperature: 0.3,
        num_predict: 500
      }
    }, { timeout: IA_CONFIG.GENERATION_TIMEOUT });
    
    const responseText = response.data.response.trim();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]).tendencias || [];
    }
    
    return [];
  } catch (error) {
    console.error('Error generando tendencias:', error.message);
    return [];
  }
};

// ======================================
// CLUSTERING DE COMENTARIOS
// ======================================

/**
 * Calcula similitud coseno entre dos vectores
 */
const cosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * Agrupa comentarios similares usando embeddings
 */
const clusterComentarios = async (comentarios, numClusters = 5) => {
  // Generar embeddings
  const embeddings = await generateBatchEmbeddings(comentarios);
  const validEmbeddings = embeddings.filter(e => e.embedding !== null);
  
  if (validEmbeddings.length < numClusters) {
    return validEmbeddings.map(e => ({ ...e, cluster: 0 }));
  }
  
  // K-means simplificado
  // Inicializar centroides aleatorios
  const centroids = [];
  const indices = new Set();
  while (indices.size < numClusters) {
    indices.add(Math.floor(Math.random() * validEmbeddings.length));
  }
  indices.forEach(i => centroids.push([...validEmbeddings[i].embedding]));
  
  // Asignar clusters
  const clustered = validEmbeddings.map(item => {
    let maxSimilarity = -1;
    let cluster = 0;
    
    centroids.forEach((centroid, idx) => {
      const similarity = cosineSimilarity(item.embedding, centroid);
      if (similarity > maxSimilarity) {
        maxSimilarity = similarity;
        cluster = idx;
      }
    });
    
    return { ...item, cluster, similarity: maxSimilarity };
  });
  
  // Agrupar por cluster
  const grupos = {};
  clustered.forEach(item => {
    if (!grupos[item.cluster]) {
      grupos[item.cluster] = [];
    }
    grupos[item.cluster].push(item);
  });
  
  return {
    items: clustered,
    grupos,
    numClusters: Object.keys(grupos).length
  };
};

// ======================================
// API PÚBLICA
// ======================================

/**
 * Procesa comentarios completos de un docente
 */
const processComentariosDocente = async (comentariosData) => {
  const health = await checkOllamaHealth();
  
  if (!health.available) {
    console.warn('Ollama no disponible, usando análisis fallback');
  }
  
  const resumen = await generateResumenDocenteMateria(comentariosData);
  
  return {
    ...resumen,
    procesado_con_ia: health.available,
    modelo_usado: health.available ? IA_CONFIG.GENERATIVE_MODEL : 'fallback'
  };
};

/**
 * Endpoint para procesar resumen bajo demanda
 */
const processResumenRequest = async ({ comentarios, tipo }) => {
  if (!comentarios || comentarios.length === 0) {
    return {
      success: false,
      message: 'No hay comentarios para procesar'
    };
  }
  
  const health = await checkOllamaHealth();
  
  switch (tipo) {
    case 'fortalezas_mejora':
      const resumen = await generateResumen(comentarios);
      return {
        success: true,
        data: resumen,
        procesado_con_ia: health.available
      };
      
    case 'polaridad':
      const polaridades = await classifyBatchPolarity(comentarios);
      return {
        success: true,
        data: polaridades,
        procesado_con_ia: health.available
      };
      
    case 'clustering':
      const clusters = await clusterComentarios(comentarios);
      return {
        success: true,
        data: clusters,
        procesado_con_ia: health.available
      };
      
    default:
      return {
        success: false,
        message: 'Tipo de procesamiento no válido'
      };
  }
};

// ======================================
// ESTADÍSTICAS RÁPIDAS (Sin IA)
// ======================================

/**
 * Obtiene estadísticas de polaridad usando solo análisis de palabras clave
 * Muy rápido, sin llamadas a Ollama
 */
const getEstadisticasRapidas = (textos) => {
  let positivos = 0;
  let negativos = 0;
  let neutros = 0;
  
  for (const texto of textos) {
    const { polaridad } = fallbackPolarityAnalysis(texto);
    if (polaridad === 'POSITIVO') positivos++;
    else if (polaridad === 'NEGATIVO') negativos++;
    else neutros++;
  }
  
  return {
    positivos,
    negativos,
    neutros,
    porcentaje_positivos: textos.length > 0 
      ? ((positivos / textos.length) * 100).toFixed(1) 
      : 0
  };
};

// ======================================
// EXPORTACIÓN
// ======================================

module.exports = {
  // Health check
  checkOllamaHealth,
  
  // Embeddings
  generateEmbedding,
  generateBatchEmbeddings,
  
  // Polaridad
  classifyPolarity,
  classifyBatchPolarity,
  
  // Resúmenes
  generateResumen,
  generateResumenDocenteMateria,
  generateResumenPrograma,
  generateResumenInstitucional,
  
  // Clustering
  clusterComentarios,
  cosineSimilarity,
  
  // API
  processComentariosDocente,
  processResumenRequest,
  
  // Estadísticas rápidas
  getEstadisticasRapidas,
  fallbackPolarityAnalysis,
  
  // Config
  IA_CONFIG
};
