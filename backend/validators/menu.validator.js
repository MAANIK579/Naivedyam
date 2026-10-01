const Joi = require('joi');

const createMenuItemSchema = Joi.object({
  name:          Joi.string().trim().min(2).max(100).required(),
  description:   Joi.string().allow('').max(500).optional(),
  price:         Joi.number().min(0).required(),
  category:      Joi.string().required(),
  emoji:         Joi.string().max(10).default('🍽️'),
  image_url:     Joi.string().uri().allow('').optional(),
  is_veg:        Joi.boolean().default(true),
  is_available:  Joi.boolean().default(true),
  cuisine_type:  Joi.string().valid('haryanvi','north_indian','mughlai','street_food','dessert','beverages').default('haryanvi'),
  tags:          Joi.array().items(Joi.string().max(30)).max(10).optional(),
  preparation_time_mins: Joi.number().integer().min(1).max(120).default(20),
});

const createCategorySchema = Joi.object({
  name:       Joi.string().trim().min(2).max(50).required(),
  emoji:      Joi.string().max(10).required(),
  slug:       Joi.string().lowercase().max(50).optional(),
  sort_order: Joi.number().integer().default(0),
  is_active:  Joi.boolean().default(true),
});

module.exports = { createMenuItemSchema, createCategorySchema };
