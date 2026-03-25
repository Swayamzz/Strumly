const prisma = require('../utils/prismaClient');

// Get all bands
const getAllBands = async (req, res) => {
  try {
    const bands = await prisma.band. findMany({
      include: {
        members: {
          include: {
            user:  {
              select: {
                id: true,
                username:  true,
                firstName: true,
                lastName: true,
                profilePicture: true
              }
            }
          }
        }
      }
    });
    
    res.json({
      success: true,
      count: bands.length,
      data: bands
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching bands',
      error: error.message
    });
  }
};

// Create new band
const createBand = async (req, res) => {
  try {
    const {
      name,
      description,
      genre,
      location,
      lookingFor,
      leaderId
    } = req.body;
    
    // Create band with leader as first member
    const band = await prisma.band.create({
      data: {
        name,
        description,
        genre:  genre || [],
        location,
        lookingFor: lookingFor || [],
        members: {
          create: {
            userId: leaderId,
            role:  'LEADER'
          }
        }
      },
      include: {
        members: {
          include: {
            user: true
          }
        }
      }
    });
    
    res.status(201).json({
      success: true,
      message: 'Band created successfully',
      data: band
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating band',
      error: error. message
    });
  }
};

module.exports = {
  getAllBands,
  createBand
};