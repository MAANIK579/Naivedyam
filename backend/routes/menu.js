// routes/menu.js — Menu Categories & Items (MongoDB/Mongoose)
const express = require('express');
const mongoose = require('mongoose');
const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// GET /api/menu/categories
router.get(
  '/categories',
  asyncHandler(async (req, res) => {
    const categories = await Category.find({ is_active: true }).sort('sort_order');
    res.json({ categories });
  })
);

// GET /api/menu/items  ?category=thali&veg=1&search=paneer&minPrice=50&maxPrice=300&cuisine=haryanvi&sort=price_asc
router.get(
  '/items',
  asyncHandler(async (req, res) => {
    const { category, veg, search, minPrice, maxPrice, cuisine, sort } = req.query;

    const filter = { is_available: true };

    // Category filter — accept slug string or ObjectId
    if (category) {
      if (mongoose.Types.ObjectId.isValid(category)) {
        filter.category = category;
      } else {
        // Treat as slug
        const cat = await Category.findOne({ slug: category });
        if (cat) {
          filter.category = cat._id;
        } else {
          // No matching category — return empty
          return res.json({ items: [] });
        }
      }
    }

    // Veg filter
    if (veg !== undefined) {
      filter.is_veg = veg === '1' || veg === 'true';
    }

    // Price range
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Cuisine type
    if (cuisine) {
      filter.cuisine_type = cuisine;
    }

    // Text search
    if (search) {
      filter.$text = { $search: search };
    }

    // Sorting
    let sortOption = { category: 1, name: 1 }; // default
    if (sort === 'price_asc') sortOption = { price: 1 };
    else if (sort === 'price_desc') sortOption = { price: -1 };
    else if (sort === 'rating') sortOption = { avg_rating: -1 };
    else if (sort === 'newest') sortOption = { created_at: -1 };

    const items = await MenuItem.find(filter)
      .sort(sortOption)
      .populate('category', 'name slug emoji');

    res.json({ items });
  })
);

// GET /api/menu/items/:id
router.get(
  '/items/:id',
  asyncHandler(async (req, res) => {
    const item = await MenuItem.findById(req.params.id).populate('category', 'name slug emoji');
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json({ item });
  })
);

module.exports = router;
