const Joi = require('joi');

const placeOrderSchema = Joi.object({
  items: Joi.array().items(
    Joi.object({
      item_id:  Joi.string().required(),
      quantity: Joi.number().integer().min(1).required(),
    })
  ).min(1).required(),
  address:        Joi.alternatives().try(
    Joi.string().min(5),
    Joi.object({
      label:        Joi.string().allow('').optional(),
      full_address: Joi.string().min(5).required(),
      landmark:     Joi.string().allow('').optional(),
      lat:          Joi.number().optional(),
      lng:          Joi.number().optional(),
    })
  ).required(),
  notes:          Joi.string().allow('').max(500).optional(),
  coupon_code:    Joi.string().allow('').max(50).optional(),
  payment_method: Joi.string().valid('cod', 'razorpay').default('cod'),
});

module.exports = { placeOrderSchema };
