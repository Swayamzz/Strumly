const prisma = require('../utils/prismaClient');

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        instruments: true,
        genres: true,
        skillLevel: true,
        location: true,
        profilePicture: true,
        createdAt: true
      }
    });
    
    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error:  error.message
    });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await prisma. user.findUnique({
      where: { id },
      include: {
        bands: {
          include: {
            band:  true
          }
        },
        mediaFiles: true
      }
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
};

// Create new user
const createUser = async (req, res) => {
  try {
    const {
      email,
      password,
      username,
      firstName,
      lastName,
      instruments,
      genres,
      skillLevel,
      location
    } = req.body;
    
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });
    
    if (existingUser) {
      return res. status(400).json({
        success: false,
        message: 'User with this email or username already exists'
      });
    }
    
    // Create user (Note: In production, hash the password!)
    const user = await prisma.user.create({
      data: {
        email,
        password, 
        username,
        firstName,
        lastName,
        instruments:  instruments || [],
        genres: genres || [],
        skillLevel,
        location
      }
    });
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: userWithoutPassword
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error:  error.message
    });
  }
};

// Search users with filters
const searchUsers = async (req, res) => {
  try {
    const { instrument, genre, skillLevel, location } = req.query;
    
    const where = {};
    
    if (instrument) {
      where.instruments = { has: instrument };
    }
    
    if (genre) {
      where.genres = { has: genre };
    }
    
    if (skillLevel) {
      where.skillLevel = skillLevel;
    }
    
    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }
    
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        instruments: true,
        genres: true,
        skillLevel: true,
        location:  true,
        profilePicture: true
      }
    });
    
    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error searching users',
      error: error.message
    });
  }
};

// Get user stats (followers, following, posts count)
const getUserStats = async (req, res) => {
  try {
    const { id } = req.params;
    const [followers, following, posts] = await Promise.all([
      prisma.follow.count({ where: { followingId: id, status: 'ACCEPTED' } }),
      prisma.follow.count({ where: { followerId: id, status: 'ACCEPTED' } }),
      prisma.post.count({ where: { authorId: id } }),
    ]);
    res.json({ success: true, data: { followers, following, posts } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching user stats', error: error.message });
  }
};

// Search users by username or name
const searchByUsername = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2)
      return res.status(400).json({ success: false, message: 'Query must be at least 2 characters' });

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: q, mode: 'insensitive' } },
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { id: true, username: true, firstName: true, lastName: true, profilePicture: true, instruments: true, skillLevel: true },
      take: 20,
    });
    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error searching users', error: error.message });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  searchUsers,
  getUserStats,
  searchByUsername,
};