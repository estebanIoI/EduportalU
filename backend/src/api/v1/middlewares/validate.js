// src/api/v1/middlewares/validate.js
const validate = (schema) => {
  return (req, res, next) => {
    console.log('🔍 Validando request body:', JSON.stringify(req.body, null, 2));
    const { error, value } = schema.validate(req.body, { 
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: false 
    });
    if (error) {
      console.log('❌ Error de validación:', error.details);
      return res.status(400).json({ success: false, message: error.details[0].message });
    }
    console.log('✅ Validación exitosa');
    next();
  };
};

module.exports = validate;
