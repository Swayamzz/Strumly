const prisma = require('../utils/prismaClient');
const { createNotification } = require('./notificationController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const bandUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random()*1e9)}${path.extname(file.originalname)}`),
  }),
  fileFilter: (req, file, cb) => {
    if (/jpeg|jpg|png|gif|webp/.test(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Only images allowed'));
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

const memberSelect = {
  id: true, username: true, firstName: true, lastName: true,
  profilePicture: true, instruments: true, skillLevel: true
};

// GET /api/bands — discover bands with optional filters
const getAllBands = async (req, res) => {
  try {
    const { search, genre, location, instrument } = req.query;
    const where = {};
    if (search)     where.name = { contains: search, mode: 'insensitive' };
    if (genre)      where.genre = { has: genre };
    if (location)   where.location = { contains: location, mode: 'insensitive' };
    if (instrument) where.lookingFor = { has: instrument };

    const bands = await prisma.band.findMany({
      where,
      include: {
        members: { include: { user: { select: memberSelect } } },
        _count: { select: { members: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, count: bands.length, data: bands });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/bands/my — bands the current user belongs to
const getMyBands = async (req, res) => {
  try {
    const userId = req.user.id;
    const memberships = await prisma.bandMember.findMany({
      where: { userId },
      include: {
        band: {
          include: {
            members: { include: { user: { select: memberSelect } } },
            _count: { select: { members: true } }
          }
        }
      }
    });
    const bands = memberships.map(m => ({ ...m.band, myRole: m.role }));
    res.json({ success: true, data: bands });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/bands/:id — single band profile
const getBandById = async (req, res) => {
  try {
    const band = await prisma.band.findUnique({
      where: { id: req.params.id },
      include: {
        members: {
          include: { user: { select: memberSelect } },
          orderBy: { joinedAt: 'asc' }
        },
        _count: { select: { members: true } }
      }
    });
    if (!band) return res.status(404).json({ success: false, message: 'Band not found' });
    res.json({ success: true, data: band });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/bands — create a band (current user becomes leader)
const createBand = async (req, res) => {
  try {
    const { name, description, genre, location, lookingFor } = req.body;
    if (!name?.trim()) return res.status(400).json({ success: false, message: 'Band name is required' });

    const band = await prisma.band.create({
      data: {
        name: name.trim(), description, location,
        genre: genre || [],
        lookingFor: lookingFor || [],
        profilePicture: req.file ? `/uploads/${req.file.filename}` : undefined,
        members: { create: { userId: req.user.id, role: 'LEADER' } }
      },
      include: { members: { include: { user: { select: memberSelect } } } }
    });
    res.status(201).json({ success: true, data: band });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/bands/:id — update band (leader only)
const updateBand = async (req, res) => {
  try {
    const userId = req.user.id;
    const member = await prisma.bandMember.findUnique({
      where: { userId_bandId: { userId, bandId: req.params.id } }
    });
    if (!member || member.role !== 'LEADER')
      return res.status(403).json({ success: false, message: 'Only the band leader can update band details' });

    const { name, description, genre, location, lookingFor } = req.body;
    const updateData = { name, description, location, genre, lookingFor };
    if (req.file) updateData.profilePicture = `/uploads/${req.file.filename}`;
    const band = await prisma.band.update({
      where: { id: req.params.id },
      data: updateData,
      include: { members: { include: { user: { select: memberSelect } } } }
    });
    res.json({ success: true, data: band });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/bands/:id — disband (leader only)
const deleteBand = async (req, res) => {
  try {
    const userId = req.user.id;
    const member = await prisma.bandMember.findUnique({
      where: { userId_bandId: { userId, bandId: req.params.id } }
    });
    if (!member || member.role !== 'LEADER')
      return res.status(403).json({ success: false, message: 'Only the band leader can disband' });
    await prisma.band.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Band disbanded' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/bands/:id/join — send join request
const sendJoinRequest = async (req, res) => {
  try {
    const senderId = req.user.id;
    const bandId = req.params.id;

    // Check already a member
    const existing = await prisma.bandMember.findUnique({
      where: { userId_bandId: { userId: senderId, bandId } }
    });
    if (existing) return res.status(400).json({ success: false, message: 'You are already a member of this band' });

    // Check already sent a request
    const pending = await prisma.collaborationRequest.findFirst({
      where: { senderId, bandId, status: 'PENDING' }
    });
    if (pending) return res.status(400).json({ success: false, message: 'You already have a pending request for this band' });

    const request = await prisma.collaborationRequest.create({
      data: { senderId, bandId, message: req.body.message || null },
      include: { sender: { select: memberSelect } }
    });
    res.status(201).json({ success: true, data: request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/bands/:id/requests — pending join requests (leader only)
const getJoinRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const member = await prisma.bandMember.findUnique({
      where: { userId_bandId: { userId, bandId: req.params.id } }
    });
    if (!member || member.role !== 'LEADER')
      return res.status(403).json({ success: false, message: 'Only the band leader can view requests' });

    const requests = await prisma.collaborationRequest.findMany({
      where: { bandId: req.params.id, status: 'PENDING' },
      include: { sender: { select: memberSelect } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: requests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/bands/:id/requests/:reqId/respond — accept or reject (leader only)
const respondToRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { action } = req.body; // 'accept' or 'reject'
    if (!['accept', 'reject'].includes(action))
      return res.status(400).json({ success: false, message: 'Action must be accept or reject' });

    const member = await prisma.bandMember.findUnique({
      where: { userId_bandId: { userId, bandId: req.params.id } }
    });
    if (!member || member.role !== 'LEADER')
      return res.status(403).json({ success: false, message: 'Only the band leader can respond to requests' });

    const request = await prisma.collaborationRequest.findUnique({ where: { id: req.params.reqId } });
    if (!request || request.bandId !== req.params.id)
      return res.status(404).json({ success: false, message: 'Request not found' });

    const status = action === 'accept' ? 'ACCEPTED' : 'REJECTED';
    await prisma.collaborationRequest.update({ where: { id: req.params.reqId }, data: { status } });

    if (action === 'accept') {
      await prisma.bandMember.create({ data: { userId: request.senderId, bandId: req.params.id, role: 'MEMBER' } });
      const band = await prisma.band.findUnique({ where: { id: req.params.id }, select: { name: true } });
      await createNotification({ recipientId: request.senderId, actorId: userId, type: 'BAND_REQUEST_ACCEPTED', message: `Your request to join ${band?.name} was accepted!`, bandId: req.params.id });
    } else {
      const band = await prisma.band.findUnique({ where: { id: req.params.id }, select: { name: true } });
      await createNotification({ recipientId: request.senderId, actorId: userId, type: 'BAND_REQUEST_REJECTED', message: `Your request to join ${band?.name} was not accepted`, bandId: req.params.id });
    }
    res.json({ success: true, message: `Request ${status.toLowerCase()}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/bands/:id/members/:userId — remove a member (leader only)
const removeMember = async (req, res) => {
  try {
    const leaderId = req.user.id;
    const leader = await prisma.bandMember.findUnique({
      where: { userId_bandId: { userId: leaderId, bandId: req.params.id } }
    });
    if (!leader || leader.role !== 'LEADER')
      return res.status(403).json({ success: false, message: 'Only the band leader can remove members' });
    if (req.params.userId === leaderId)
      return res.status(400).json({ success: false, message: 'Leader cannot remove themselves — disband the band instead' });

    await prisma.bandMember.delete({
      where: { userId_bandId: { userId: req.params.userId, bandId: req.params.id } }
    });
    res.json({ success: true, message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/bands/:id/leave — leave a band (member only)
const leaveBand = async (req, res) => {
  try {
    const userId = req.user.id;
    const member = await prisma.bandMember.findUnique({
      where: { userId_bandId: { userId, bandId: req.params.id } }
    });
    if (!member) return res.status(400).json({ success: false, message: 'You are not a member of this band' });
    if (member.role === 'LEADER') return res.status(400).json({ success: false, message: 'Leaders cannot leave — disband the band instead' });

    await prisma.bandMember.delete({ where: { userId_bandId: { userId, bandId: req.params.id } } });
    res.json({ success: true, message: 'Left the band' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/bands/requests/sent — join requests sent by current user
const getMySentRequests = async (req, res) => {
  try {
    const requests = await prisma.collaborationRequest.findMany({
      where: { senderId: req.user.id, bandId: { not: null } },
      include: { band: { select: { id: true, name: true, genre: true, location: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: requests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/bands/search?q=name&genre=Rock — search bands by name or genre
const searchBands = async (req, res) => {
  try {
    const { q, genre } = req.query;
    const where = {};

    if (q && q.trim().length > 0) {
      where.name = { contains: q.trim(), mode: 'insensitive' };
    }
    if (genre) {
      where.genre = { has: genre };
    }

    const bands = await prisma.band.findMany({
      where,
      include: {
        members: {
          include: { user: { select: { id: true, username: true, profilePicture: true } } },
        },
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    res.json({ success: true, count: bands.length, data: bands });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/bands/:id/invite/:userId — leader invites a user directly
const inviteUser = async (req, res) => {
  try {
    const leaderId = req.user.id;
    const { id: bandId, userId: inviteeId } = req.params;

    const leader = await prisma.bandMember.findUnique({
      where: { userId_bandId: { userId: leaderId, bandId } }
    });
    if (!leader || leader.role !== 'LEADER')
      return res.status(403).json({ success: false, message: 'Only the band leader can invite members' });

    const alreadyMember = await prisma.bandMember.findUnique({
      where: { userId_bandId: { userId: inviteeId, bandId } }
    });
    if (alreadyMember) return res.status(400).json({ success: false, message: 'User is already a member' });

    const band = await prisma.band.findUnique({ where: { id: bandId }, select: { name: true } });
    await createNotification({
      recipientId: inviteeId, actorId: leaderId,
      type: 'BAND_JOIN_REQUEST',
      message: `You have been invited to join ${band?.name}!`,
      bandId
    });

    res.json({ success: true, message: 'Invitation sent' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  bandUpload, getAllBands, getMyBands, getBandById, createBand, updateBand, deleteBand,
  sendJoinRequest, getJoinRequests, respondToRequest, removeMember, leaveBand,
  getMySentRequests, searchBands, inviteUser,
};
