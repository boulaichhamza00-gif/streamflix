const express = require('express');
const router = express.Router();
const { Channel } = require('../models');
const { authenticate, requireSubscription } = require('../middleware/auth');

// @route   GET /api/channels
// @desc    Get all channels (with optional filters)
// @access  Private (requires subscription)
router.get('/', authenticate, requireSubscription, async (req, res) => {
  try {
    const { category, search, page = 1, limit = 50 } = req.query;
    
    // Build query
    const query = { isActive: true };
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (search) {
      query.$text = { $search: search };
    }

    // Execute query with pagination
    const channels = await Channel.find(query)
      .sort({ category: 1, name: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Channel.countDocuments(query);

    // Get unique categories
    const categories = await Channel.distinct('category', { isActive: true });

    res.json({
      success: true,
      data: {
        channels,
        categories,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get channels error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching channels'
    });
  }
});

// @route   GET /api/channels/categories
// @desc    Get all channel categories
// @access  Private (requires subscription)
router.get('/categories', authenticate, requireSubscription, async (req, res) => {
  try {
    const categories = await Channel.aggregate([
      { $match: { isActive: true } },
      { $group: { 
        _id: '$category', 
        count: { $sum: 1 },
        channels: { $push: { id: '$_id', name: '$name', logo: '$logo' } }
      }},
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching categories'
    });
  }
});

// @route   GET /api/channels/:id
// @desc    Get single channel by ID
// @access  Private (requires subscription)
router.get('/:id', authenticate, requireSubscription, async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id);
    
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found'
      });
    }

    // Increment view count
    channel.viewCount += 1;
    await channel.save();

    res.json({
      success: true,
      data: { channel }
    });
  } catch (error) {
    console.error('Get channel error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching channel'
    });
  }
});

// @route   GET /api/channels/:id/stream
// @desc    Get stream URL for a channel
// @access  Private (requires subscription)
router.get('/:id/stream', authenticate, requireSubscription, async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id);
    
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found'
      });
    }

    if (!channel.isActive) {
      return res.status(403).json({
        success: false,
        message: 'This channel is currently unavailable'
      });
    }

    res.json({
      success: true,
      data: {
        streamUrl: channel.streamUrl,
        name: channel.name,
        logo: channel.logo
      }
    });
  } catch (error) {
    console.error('Get stream error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching stream'
    });
  }
});

module.exports = router;
