const prisma = require('../utils/prismaClient');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, unique + path.extname(file.originalname));
  },
});
const fileFilter = (req, file, cb) => {
  if (/jpeg|jpg|png|gif|webp/.test(path.extname(file.originalname).toLowerCase())) cb(null, true);
  else cb(new Error('Only images allowed'));
};
const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });

const sellerSelect = {
  id: true, username: true, firstName: true, lastName: true,
  profilePicture: true, location: true
};

// GET /api/listings — browse with filters
const getListings = async (req, res) => {
  try {
    const { search, category, condition, location, minPrice, maxPrice, status = 'AVAILABLE' } = req.query;
    const where = { status };
    if (search)    where.title = { contains: search, mode: 'insensitive' };
    if (category)  where.category = category;
    if (condition) where.condition = condition;
    if (location)  where.location = { contains: location, mode: 'insensitive' };
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    const listings = await prisma.listing.findMany({
      where,
      include: { seller: { select: sellerSelect } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, count: listings.length, data: listings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/listings/my — current user's listings
const getMyListings = async (req, res) => {
  try {
    const listings = await prisma.listing.findMany({
      where: { sellerId: req.user.id },
      include: { seller: { select: sellerSelect } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: listings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/listings/:id — single listing
const getListingById = async (req, res) => {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: req.params.id },
      include: { seller: { select: sellerSelect } },
    });
    if (!listing) return res.status(404).json({ success: false, message: 'Listing not found' });
    res.json({ success: true, data: listing });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/listings — create listing (with up to 4 images)
const createListing = async (req, res) => {
  try {
    const { title, description, price, condition, category, location } = req.body;
    if (!title?.trim())    return res.status(400).json({ success: false, message: 'Title is required' });
    if (!price)            return res.status(400).json({ success: false, message: 'Price is required' });
    if (!condition)        return res.status(400).json({ success: false, message: 'Condition is required' });
    if (!category)         return res.status(400).json({ success: false, message: 'Category is required' });

    const images = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];

    const listing = await prisma.listing.create({
      data: {
        title: title.trim(), description, price: parseFloat(price),
        condition, category, location, images,
        sellerId: req.user.id,
      },
      include: { seller: { select: sellerSelect } },
    });
    res.status(201).json({ success: true, data: listing });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/listings/:id — update listing (seller only)
const updateListing = async (req, res) => {
  try {
    const listing = await prisma.listing.findUnique({ where: { id: req.params.id } });
    if (!listing) return res.status(404).json({ success: false, message: 'Listing not found' });
    if (listing.sellerId !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });

    const { title, description, price, condition, category, location, status } = req.body;
    const updated = await prisma.listing.update({
      where: { id: req.params.id },
      data: { title, description, price: price ? parseFloat(price) : undefined, condition, category, location, status },
      include: { seller: { select: sellerSelect } },
    });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/listings/:id — delete listing (seller only)
const deleteListing = async (req, res) => {
  try {
    const listing = await prisma.listing.findUnique({ where: { id: req.params.id } });
    if (!listing) return res.status(404).json({ success: false, message: 'Listing not found' });
    if (listing.sellerId !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });
    await prisma.listing.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Listing deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/listings/:id/status — mark as sold/reserved/available
const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['AVAILABLE', 'RESERVED', 'SOLD'].includes(status))
      return res.status(400).json({ success: false, message: 'Invalid status' });
    const listing = await prisma.listing.findUnique({ where: { id: req.params.id } });
    if (!listing) return res.status(404).json({ success: false, message: 'Listing not found' });
    if (listing.sellerId !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });
    const updated = await prisma.listing.update({
      where: { id: req.params.id },
      data: { status },
      include: { seller: { select: sellerSelect } },
    });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { upload, getListings, getMyListings, getListingById, createListing, updateListing, deleteListing, updateStatus };
