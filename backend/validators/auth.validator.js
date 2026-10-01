const Joi = require('joi');

const phoneRegex = /^[6-9]\d{9}$/;

const registerSchema = Joi.object({
  name:     Joi.string().trim().min(2).max(100).required(),
  phone:    Joi.string().trim().pattern(phoneRegex).required().messages({
    'string.pattern.base': 'Phone must be a valid 10-digit Indian mobile number',
  }),
  password: Joi.string().min(6).max(128).required(),
  address:  Joi.string().allow('').max(500).optional(),
  email:    Joi.string().email().allow('').optional(),
});

const loginSchema = Joi.object({
  phone:    Joi.string().trim().required(),
  password: Joi.string().required(),
});

const updateProfileSchema = Joi.object({
  name:    Joi.string().trim().min(2).max(100).optional(),
  address: Joi.string().allow('').max(500).optional(),
  email:   Joi.string().email().allow('').optional(),
});

module.exports = { registerSchema, loginSchema, updateProfileSchema };
