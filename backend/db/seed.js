require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config');
const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');
const User = require('../models/User');
const Coupon = require('../models/Coupon');

const seedCategories = [
  { name: 'Thali',       emoji: '🍱', slug: 'thali',     sort_order: 1 },
  { name: 'Dal & Sabzi', emoji: '🥘', slug: 'dal-sabzi', sort_order: 2 },
  { name: 'Roti & Rice', emoji: '🫓', slug: 'roti',      sort_order: 3 },
  { name: 'Non-Veg',     emoji: '🍗', slug: 'nonveg',    sort_order: 4 },
  { name: 'Snacks',      emoji: '🥙', slug: 'snacks',    sort_order: 5 },
  { name: 'Desserts',    emoji: '🍮', slug: 'dessert',   sort_order: 6 },
];

async function seed() {
  await mongoose.connect(config.mongoUri);
  console.log('Connected to MongoDB for seeding...');

  // Seed categories
  const catCount = await Category.countDocuments();
  if (catCount === 0) {
    const cats = await Category.insertMany(seedCategories);
    console.log(`✅ Seeded ${cats.length} categories`);

    // Build slug -> _id map
    const catMap = {};
    cats.forEach(c => { catMap[c.slug] = c._id; });

    const seedItems = [
      { name:'Haryanvi Thali',   emoji:'🍱', image_url:'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=800&q=80', price:180, category:catMap['thali'],     is_veg:true, description:'Dal, sabzi, roti, rice, achaar & chaach — complete meal from Haryana\'s heart.', cuisine_type:'haryanvi', tags:['bestseller','thali'], preparation_time_mins:25 },
      { name:'Special Thali',    emoji:'🎁', image_url:'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80', price:220, category:catMap['thali'],     is_veg:true, description:'Haryanvi Thali plus paneer sabzi, kheer & papad. A royal spread!', cuisine_type:'haryanvi', tags:['premium','thali'], preparation_time_mins:30 },
      { name:'Dal Makhani',      emoji:'🫕', image_url:'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=800&q=80', price:140, category:catMap['dal-sabzi'], is_veg:true, description:'Slow-cooked black lentils in creamy tomato gravy, simmered for 8 hours.', cuisine_type:'north_indian', tags:['bestseller','creamy'], preparation_time_mins:15 },
      { name:'Chana Masala',     emoji:'🥘', image_url:'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80', price:110, category:catMap['dal-sabzi'], is_veg:true, description:'Tangy, spiced chickpeas in a bold masala — a Bhiwani breakfast favourite.', cuisine_type:'haryanvi', tags:['spicy'], preparation_time_mins:15 },
      { name:'Aloo Methi',       emoji:'🥬', image_url:'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80', price:100, category:catMap['dal-sabzi'], is_veg:true, description:'Fresh fenugreek leaves stir-fried with potatoes and desi ghee.', cuisine_type:'haryanvi', tags:['healthy'], preparation_time_mins:15 },
      { name:'Sarson da Saag',   emoji:'🥗', image_url:'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80', price:130, category:catMap['dal-sabzi'], is_veg:true, description:'Classic mustard greens cooked low and slow, served with white butter.', cuisine_type:'haryanvi', tags:['seasonal','bestseller'], preparation_time_mins:20 },
      { name:'Makke di Roti',    emoji:'🫓', image_url:'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&q=80', price:40,  category:catMap['roti'],      is_veg:true, description:'Traditional yellow corn flatbread, best paired with sarson da saag.', cuisine_type:'haryanvi', tags:['traditional'], preparation_time_mins:10 },
      { name:'Butter Naan',      emoji:'🍞', image_url:'https://images.unsplash.com/photo-1601050690187-5421df843702?auto=format&fit=crop&w=800&q=80', price:35,  category:catMap['roti'],      is_veg:true, description:'Soft oven-baked naan slathered with homemade white butter.', cuisine_type:'north_indian', tags:['bread'], preparation_time_mins:8 },
      { name:'Jeera Rice',       emoji:'🍚', image_url:'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80', price:80,  category:catMap['roti'],      is_veg:true, description:'Fragrant basmati rice tempered with cumin seeds and desi ghee.', cuisine_type:'north_indian', tags:['rice'], preparation_time_mins:12 },
      { name:'Chicken Curry',    emoji:'🍗', image_url:'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=800&q=80', price:200, category:catMap['nonveg'],    is_veg:false, description:'Desi-style chicken in a thick, aromatic gravy — slow-cooked perfection.', cuisine_type:'haryanvi', tags:['bestseller','spicy'], preparation_time_mins:25 },
      { name:'Mutton Rogan Josh',emoji:'🥩', image_url:'https://images.unsplash.com/photo-1545247181-516773ca83e3?auto=format&fit=crop&w=800&q=80', price:280, category:catMap['nonveg'],    is_veg:false, description:'Slow-braised mutton in a rich Haryanvi spice blend — weekend special.', cuisine_type:'mughlai', tags:['premium','weekend'], preparation_time_mins:35 },
      { name:'Egg Bhurji',       emoji:'🍳', image_url:'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80', price:90,  category:catMap['nonveg'],    is_veg:false, description:'Desi masala scrambled eggs with onion, tomato & green chillies.', cuisine_type:'street_food', tags:['quick'], preparation_time_mins:10 },
      { name:'Samosa (2 pcs)',   emoji:'🥙', image_url:'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80', price:30,  category:catMap['snacks'],    is_veg:true, description:'Crispy golden pastry filled with spiced potatoes & peas.', cuisine_type:'street_food', tags:['snack','bestseller'], preparation_time_mins:5 },
      { name:'Pakoda Platter',   emoji:'🧆', image_url:'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=800&q=80', price:70,  category:catMap['snacks'],    is_veg:true, description:'Assorted fritters — onion, paneer & palak — fried to crisp perfection.', cuisine_type:'street_food', tags:['snack','fried'], preparation_time_mins:10 },
      { name:'Lassi',            emoji:'🥛', image_url:'https://images.unsplash.com/photo-1571006682878-1a5e174092d5?auto=format&fit=crop&w=800&q=80', price:50,  category:catMap['snacks'],     is_veg:true, description:'Thick churned yoghurt, lightly sweetened. The real Haryanvi refresher.', cuisine_type:'beverages', tags:['drink','cold'], preparation_time_mins:5 },
      { name:'Gulab Jamun',      emoji:'🍮', image_url:'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80', price:60,  category:catMap['dessert'],   is_veg:true, description:'Soft milk-solid dumplings soaked in rose-flavoured sugar syrup.', cuisine_type:'dessert', tags:['sweet','bestseller'], preparation_time_mins:5 },
      { name:'Kheer',            emoji:'🍚', image_url:'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80', price:70,  category:catMap['dessert'],   is_veg:true, description:'Creamy rice pudding with cardamom, saffron & crushed pistachios.', cuisine_type:'dessert', tags:['sweet','traditional'], preparation_time_mins:5 },
    ];

    const items = await MenuItem.insertMany(seedItems);
    console.log(`✅ Seeded ${items.length} menu items`);
  } else {
    console.log('Categories already exist, skipping category/item seed.');
  }

  // Seed admin user
  const adminExists = await User.findOne({ role: 'admin' });
  if (!adminExists) {
    await User.create({
      name: 'Admin',
      phone: '9999999999',
      password: config.adminDefaultPassword,
      role: 'admin',
    });
    console.log('✅ Default admin created (phone: 9999999999)');
  } else {
    console.log('Admin user already exists, skipping.');
  }

  // Seed sample coupons
  const couponCount = await Coupon.countDocuments();
  if (couponCount === 0) {
    await Coupon.insertMany([
      {
        code: 'WELCOME50',
        description: 'Get ₹50 off on your first order',
        discount_type: 'flat',
        discount_value: 50,
        min_order_amount: 199,
        usage_limit: 1000,
        per_user_limit: 1,
        valid_from: new Date(),
        valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
      {
        code: 'NAVEDYAM20',
        description: '20% off up to ₹100',
        discount_type: 'percentage',
        discount_value: 20,
        min_order_amount: 299,
        max_discount: 100,
        usage_limit: 500,
        per_user_limit: 3,
        valid_from: new Date(),
        valid_until: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      },
      {
        code: 'FREEDELIVERY',
        description: 'Free delivery on orders above ₹199',
        discount_type: 'flat',
        discount_value: 30,
        min_order_amount: 199,
        usage_limit: 2000,
        per_user_limit: 5,
        valid_from: new Date(),
        valid_until: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
    ]);
    console.log('✅ Seeded 3 sample coupons');
  }

  await mongoose.disconnect();
  console.log('🎉 Seeding complete! Database disconnected.');
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
