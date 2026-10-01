const Joi = require('joi');

const createCouponSchema = Joi.object({
  code:             Joi.string().trim().uppercase().max(30).required(),
  description:      Joi.string().max(200).optional(),
  discount_type:    Joi.string().valid('percentage', 'flat').required(),
  discount_value:   Joi.number().min(1).required(),
  min_order_amount: Joi.number().min(0).default(0),
  max_discount:     Joi.number().min(0).default(0),
  usage_limit:      Joi.number().integer().min(1).default(100),
  per_user_limit:   Joi.number().integer().min(1).default(1),
  valid_from:       Joi.date().required(),
  valid_until:      Joi.date().greater(Joi.ref('valid_from')).required(),
  is_active:        Joi.boolean().default(true),
});

const validateCouponSchema = Joi.object({
  code:       Joi.string().trim().uppercase().required(),
  cart_total: Joi.number().min(0).required(),
});

module.exports = { createCouponSchema, validateCouponSchema };
