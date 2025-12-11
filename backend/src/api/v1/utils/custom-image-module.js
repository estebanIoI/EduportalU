/**
 * Módulo personalizado de imágenes para docxtemplater
 * Reemplazo del deprecated docxtemplater-image-module v3.1.0
 * que tiene bugs con loops anidados
 */

const { DOMParser, XMLSerializer } = require('xmldom');

class CustomImageModule {
  constructor(options) {
    this.name = 'CustomImageModule';
    this.options = options || {};
    this.imgManager = null;
  }

  optionsTransformer(options, docxtemplater) {
    this.fileTypeConfig = docxtemplater.fileTypeConfig;
    this.zip = docxtemplater.zip;
    return options;
  }

  set(options) {
    if (options.Lexer) {
      this.Lexer = options.Lexer;
    }
    if (options.zip) {
      this.zip = options.zip;
    }
  }

  parse(placeholderContent) {
    // Detectar tags de imagen que empiezan con %
    if (placeholderContent[0] === '%') {
      return {
        type: 'placeholder',
        value: placeholderContent.substr(1),
        module: this.name,
      };
    }
    return null;
  }

  postparse(parsed) {
    // No necesitamos post-procesamiento
    return parsed;
  }

  render(part, options) {
    try {
      // Solo procesar nuestros propios tags
      if (part.module !== this.name) {
        return null;
      }

      // Obtener el valor del scope de forma segura
      const scopeManager = options && options.scopeManager;
      if (!scopeManager) {
        console.warn(`⚠️  No scopeManager para: ${part.value}`);
        return { value: '' };
      }

      let imageData;
      try {
        imageData = scopeManager.getValue(part.value);
      } catch (error) {
        console.warn(`⚠️  Error obteniendo valor para ${part.value}:`, error.message);
        return { value: '' };
      }

      // Validar que sea un Buffer
      if (!imageData || !Buffer.isBuffer(imageData)) {
        return { value: '' };
      }

      // Obtener la imagen procesada
      const img = this.options.getImage ? this.options.getImage(imageData, part.value) : imageData;
      if (!img || !Buffer.isBuffer(img) || img.length === 0) {
        return { value: '' };
      }

      // Obtener el tamaño
      const size = this.options.getSize ? this.options.getSize(img, imageData, part.value) : [600, 400];
      if (!size || !Array.isArray(size) || size[0] <= 1 || size[1] <= 1) {
        // Imagen muy pequeña, no renderizar
        return { value: '' };
      }

      // Generar el XML para insertar la imagen
      const imageXml = this.getImageXml(img, size, part.value);
      
      return { value: imageXml };

    } catch (error) {
      console.error(`❌ Error renderizando imagen ${part.value}:`, error.message);
      return { value: '' };
    }
  }

  getImageXml(imageBuffer, size, imageName) {
    // Generar un ID único para la imagen
    const imageId = Math.floor(Math.random() * 10000000);
    const rId = `rId${imageId}`;
    
    // Guardar la imagen en el ZIP
    const imagePath = `word/media/image_${imageId}.png`;
    this.zip.file(imagePath, imageBuffer);

    // Registrar la relación en word/_rels/document.xml.rels
    this.addImageRelationship(rId, `media/image_${imageId}.png`);

    // Convertir tamaño de EMUs a pixeles para el XML
    const [width, height] = size;

    // Generar el XML de la imagen inline
    const xml = `<w:r>
      <w:drawing>
        <wp:inline distT="0" distB="0" distL="0" distR="0">
          <wp:extent cx="${width}" cy="${height}"/>
          <wp:effectExtent l="0" t="0" r="0" b="0"/>
          <wp:docPr id="${imageId}" name="${imageName || 'Image'}"/>
          <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
            <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
              <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
                <pic:nvPicPr>
                  <pic:cNvPr id="${imageId}" name="${imageName || 'Image'}"/>
                  <pic:cNvPicPr/>
                </pic:nvPicPr>
                <pic:blipFill>
                  <a:blip r:embed="${rId}"/>
                  <a:stretch><a:fillRect/></a:stretch>
                </pic:blipFill>
                <pic:spPr>
                  <a:xfrm>
                    <a:off x="0" y="0"/>
                    <a:ext cx="${width}" cy="${height}"/>
                  </a:xfrm>
                  <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
                </pic:spPr>
              </pic:pic>
            </a:graphicData>
          </a:graphic>
        </wp:inline>
      </w:drawing>
    </w:r>`;

    return xml;
  }

  addImageRelationship(rId, target) {
    // Acceder al archivo de relaciones
    const relsPath = 'word/_rels/document.xml.rels';
    let relsContent = this.zip.file(relsPath).asText();

    // Parsear el XML
    const parser = new DOMParser();
    const doc = parser.parseFromString(relsContent, 'text/xml');

    // Verificar si ya existe la relación
    const existingRel = doc.getElementsByTagName('Relationship');
    for (let i = 0; i < existingRel.length; i++) {
      if (existingRel[i].getAttribute('Id') === rId) {
        // Ya existe, no agregar
        return;
      }
    }

    // Crear nuevo nodo de relación
    const relationships = doc.getElementsByTagName('Relationships')[0];
    const newRel = doc.createElement('Relationship');
    newRel.setAttribute('Id', rId);
    newRel.setAttribute('Type', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image');
    newRel.setAttribute('Target', target);
    relationships.appendChild(newRel);

    // Serializar de vuelta
    const serializer = new XMLSerializer();
    const newRelsContent = serializer.serializeToString(doc);

    // Guardar en el ZIP
    this.zip.file(relsPath, newRelsContent);
  }
}

module.exports = CustomImageModule;
