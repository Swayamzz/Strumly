const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const prisma = require('./src/utils/prismaClient');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost:5177'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static File Serving
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Health Check Route
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Strumly API is running',
    timestamp: new Date().toISOString()
  });
});

// Database Connection Test Route
app.get('/api/db-test', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const userCount = await prisma.user.count();
    const bandCount = await prisma.band.count();

    res.json({
      success: true,
      message: 'Database connection successful',
      data: {
        users: userCount,
        bands: bandCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// Import Routes (with error handling)
let authRoutes, userRoutes, bandRoutes, postRoutes, messageRoutes;
const followRoutes = require('./src/routes/followRoutes');

try {
  authRoutes = require('./src/routes/authRoutes');
  console.log('✅ Auth routes loaded');
} catch (error) {
  console.error('❌ Error loading auth routes:', error.message);
}

try {
  userRoutes = require('./src/routes/userRoutes');
  console.log('✅ User routes loaded');
} catch (error) {
  console.error('❌ Error loading user routes:', error.message);
}

try {
  bandRoutes = require('./src/routes/bandRoutes');
  console.log('✅ Band routes loaded');
} catch (error) {
  console.error('❌ Error loading band routes:', error.message);
}

try {
  postRoutes = require('./src/routes/postRoutes');
  console.log('✅ Post routes loaded');
} catch (error) {
  console.error('❌ Error loading post routes:', error.message);
}

try {
  messageRoutes = require('./src/routes/messageRoutes');
  console.log('✅ Message routes loaded');
} catch (error) {
  console.error('❌ Error loading message routes:', error.message);
}

let adminRoutes;
try {
  adminRoutes = require('./src/routes/adminRoutes');
  console.log('✅ Admin routes loaded');
} catch (error) {
  console.error('❌ Error loading admin routes:', error.message);
}

let listingRoutes;
try {
  listingRoutes = require('./src/routes/listingRoutes');
  console.log('✅ Listing routes loaded');
} catch (error) {
  console.error('❌ Error loading listing routes:', error.message);
}

let notificationRoutes;
try {
  notificationRoutes = require('./src/routes/notificationRoutes');
  console.log('✅ Notification routes loaded');
} catch (error) {
  console.error('❌ Error loading notification routes:', error.message);
}

// Use Routes (only if they loaded successfully)
if (authRoutes)    app.use('/api/auth',     authRoutes);
if (userRoutes)    app.use('/api/users',    userRoutes);
if (bandRoutes)    app.use('/api/bands',    bandRoutes);
if (postRoutes)    app.use('/api/posts',    postRoutes);
app.use('/api/follow', followRoutes);
if (messageRoutes) app.use('/api/messages', messageRoutes);
if (adminRoutes)   app.use('/api/admin',    adminRoutes);
if (listingRoutes)      app.use('/api/listings',      listingRoutes);
if (notificationRoutes) app.use('/api/notifications', notificationRoutes);

// Error Handler Middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
  console.log(`\n📍 Available Routes:`);
  console.log(`   GET  http://localhost:${PORT}/api/health`);
  console.log(`   GET  http://localhost:${PORT}/api/db-test`);
  if (authRoutes) {
    console.log(`   POST http://localhost:${PORT}/api/auth/register`);
    console.log(`   POST http://localhost:${PORT}/api/auth/login`);
    console.log(`   GET  http://localhost:${PORT}/api/auth/me`);
  }
  if (userRoutes) {
    console.log(`   GET  http://localhost:${PORT}/api/users`);
  }
  if (bandRoutes) {
    console.log(`   GET  http://localhost:${PORT}/api/bands`);
  }
  if (postRoutes) {
    console.log(`   GET  http://localhost:${PORT}/api/posts`);
  }
  console.log('');
});

// Graceful Shutdown
process.on('SIGTERM', async () => {
  console.log('\nSIGTERM signal received: closing HTTP server');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\nSIGINT signal received: closing HTTP server');
  await prisma.$disconnect();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
  process.exit(1);
});