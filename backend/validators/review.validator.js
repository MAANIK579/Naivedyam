const Joi = require('joi');

const objectId = Joi.string().length(24).hex();

const reviewSchema = Joi.object({
  order_id: objectId.required(),
  menu_item_id: objectId.optional(),
  menu_item: objectId.optional(),
  type: Joi.string().valid('item', 'order').optional(),
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().allow('').max(500).optional(),
}).custom((value, helpers) => {
  const hasMenuItem = Boolean(value.menu_item_id || value.menu_item);
  if (!hasMenuItem && value.type !== 'order') {
    return helpers.error('any.custom', { message: 'menu_item_id is required for item reviews' });
  }
  return value;
}, 'review payload validation').messages({
  'any.custom': '{{#message}}',
});

module.exports = { reviewSchema };
