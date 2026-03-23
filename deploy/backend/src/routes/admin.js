const express = require('express');
const router = express.Router();
const { User, Channel, Playlist } = require('../models');
const { authenticate, requireAdmin } = require('../middleware');
const { upload, handleUploadError } = require('../middleware/upload');
const { parseM3UFile, parseM3UFileCustom, cleanupFile } = require('../utils/m3uParser');

// All routes in this file require admin authentication
router.use(authenticate);
router.use(requireAdmin);

// ==================== USER MANAGEMENT ====================

// @route   GET /api/admin/users
// @desc    Get all users with pagination and filters
// @access  Admin
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, subscriptionStatus } = req.query;
    
    const query = {};
    
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (subscriptionStatus) {
      query.subscriptionStatus = subscriptionStatus;
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching users'
    });
  }
});

// @route   PUT /api/admin/users/:id/subscription
// @desc    Update user subscription status
// @access  Admin
router.put('/users/:id/subscription', async (req, res) => {
  try {
    const { subscriptionStatus, subscriptionExpiry } = req.body;
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent modifying other admins (optional security measure)
    if (user.isAdmin && user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Cannot modify another admin user'
      });
    }

    user.subscriptionStatus = subscriptionStatus || user.subscriptionStatus;
    if (subscriptionExpiry) {
      user.subscriptionExpiry = new Date(subscriptionExpiry);
    }
    
    await user.save();

    res.json({
      success: true,
      message: 'Subscription updated successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          subscriptionStatus: user.subscriptionStatus,
          subscriptionExpiry: user.subscriptionExpiry
        }
      }
    });
  } catch (error) {
    console.error('Update subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating subscription'
    });
  }
});

// @route   PUT /api/admin/users/:id/revoke
// @desc    Revoke user access (deactivate account)
// @access  Admin
router.put('/users/:id/revoke', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deactivating other admins
    if (user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Cannot revoke admin access'
      });
    }

    user.isActive = false;
    user.subscriptionStatus = 'expired';
    await user.save();

    res.json({
      success: true,
      message: 'User access revoked successfully'
    });
  } catch (error) {
    console.error('Revoke access error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error revoking access'
    });
  }
});

// @route   PUT /api/admin/users/:id/restore
// @desc    Restore user access (reactivate account)
// @access  Admin
router.put('/users/:id/restore', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = true;
    await user.save();

    res.json({
      success: true,
      message: 'User access restored successfully'
    });
  } catch (error) {
    console.error('Restore access error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error restoring access'
    });
  }
});

// ==================== CHANNEL MANAGEMENT ====================

// @route   GET /api/admin/channels
// @desc    Get all channels (including inactive)
// @access  Admin
router.get('/channels', async (req, res) => {
  try {
    const { page = 1, limit = 50, category, search } = req.query;
    
    const query = {};
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (search) {
      query.$text = { $search: search };
    }

    const channels = await Channel.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('addedBy', 'name email');

    const total = await Channel.countDocuments(query);
    const categories = await Channel.distinct('category');

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
    console.error('Admin get channels error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching channels'
    });
  }
});

// @route   POST /api/admin/channels
// @desc    Create a new channel
// @access  Admin
router.post('/channels', async (req, res) => {
  try {
    const { name, streamUrl, category, logo, description, groupTitle, tvgId, tvgName, country, language } = req.body;

    const channel = new Channel({
      name,
      streamUrl,
      category: category || 'Uncategorized',
      logo,
      description,
      groupTitle: groupTitle || category,
      tvgId,
      tvgName,
      country,
      language,
      addedBy: req.user._id,
      isActive: true
    });

    await channel.save();

    res.status(201).json({
      success: true,
      message: 'Channel created successfully',
      data: { channel }
    });
  } catch (error) {
    console.error('Create channel error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating channel'
    });
  }
});

// @route   PUT /api/admin/channels/:id
// @desc    Update a channel
// @access  Admin
router.put('/channels/:id', async (req, res) => {
  try {
    const updates = req.body;
    delete updates.addedBy; // Prevent changing the creator

    const channel = await Channel.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found'
      });
    }

    res.json({
      success: true,
      message: 'Channel updated successfully',
      data: { channel }
    });
  } catch (error) {
    console.error('Update channel error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating channel'
    });
  }
});

// @route   DELETE /api/admin/channels/:id
// @desc    Delete a channel
// @access  Admin
router.delete('/channels/:id', async (req, res) => {
  try {
    const channel = await Channel.findByIdAndDelete(req.params.id);

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found'
      });
    }

    // Remove channel from all playlists
    await Playlist.updateMany(
      { channels: req.params.id },
      { $pull: { channels: req.params.id } }
    );

    res.json({
      success: true,
      message: 'Channel deleted successfully'
    });
  } catch (error) {
    console.error('Delete channel error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting channel'
    });
  }
});

// @route   PUT /api/admin/channels/:id/toggle
// @desc    Toggle channel active status
// @access  Admin
router.put('/channels/:id/toggle', async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id);

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found'
      });
    }

    channel.isActive = !channel.isActive;
    await channel.save();

    res.json({
      success: true,
      message: `Channel ${channel.isActive ? 'activated' : 'deactivated'} successfully`,
      data: { channel }
    });
  } catch (error) {
    console.error('Toggle channel error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error toggling channel'
    });
  }
});

// ==================== M3U UPLOAD & PARSING ====================

// @route   POST /api/admin/m3u/parse
// @desc    Upload and parse M3U file
// @access  Admin
router.post('/m3u/parse', upload.single('m3uFile'), handleUploadError, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const filePath = req.file.path;
    
    // Try parsing with library first, fallback to custom parser
    let parseResult = parseM3UFile(filePath);
    
    // If library parser fails or returns few results, try custom parser
    if (!parseResult.success || parseResult.validChannels < 5) {
      const customResult = parseM3UFileCustom(filePath);
      if (customResult.success && customResult.validChannels > parseResult.validChannels) {
        parseResult = customResult;
      }
    }

    // Clean up uploaded file
    cleanupFile(filePath);

    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to parse M3U file',
        error: parseResult.error
      });
    }

    res.json({
      success: true,
      message: 'M3U file parsed successfully',
      data: {
        channels: parseResult.channels,
        totalFound: parseResult.totalFound,
        validChannels: parseResult.validChannels,
        categories: parseResult.categories
      }
    });
  } catch (error) {
    console.error('M3U parse error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error parsing M3U file'
    });
  }
});

// @route   POST /api/admin/m3u/import
// @desc    Import selected channels from parsed M3U
// @access  Admin
router.post('/m3u/import', async (req, res) => {
  try {
    const { channels } = req.body;

    if (!channels || !Array.isArray(channels) || channels.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No channels provided for import'
      });
    }

    const importedChannels = [];
    const errors = [];

    for (const channelData of channels) {
      try {
        // Check if channel with same name and streamUrl already exists
        const existingChannel = await Channel.findOne({
          name: channelData.name,
          streamUrl: channelData.streamUrl
        });

        if (existingChannel) {
          errors.push({
            name: channelData.name,
            error: 'Channel already exists'
          });
          continue;
        }

        const channel = new Channel({
          name: channelData.name,
          streamUrl: channelData.streamUrl,
          category: channelData.category || 'Uncategorized',
          logo: channelData.logo,
          groupTitle: channelData.groupTitle || channelData.category,
          tvgId: channelData.tvgId,
          tvgName: channelData.tvgName,
          country: channelData.country,
          language: channelData.language,
          addedBy: req.user._id,
          isActive: true
        });

        await channel.save();
        importedChannels.push(channel);
      } catch (err) {
        errors.push({
          name: channelData.name,
          error: err.message
        });
      }
    }

    res.json({
      success: true,
      message: `Imported ${importedChannels.length} channels successfully`,
      data: {
        imported: importedChannels.length,
        failed: errors.length,
        errors: errors.length > 0 ? errors : undefined
      }
    });
  } catch (error) {
    console.error('M3U import error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error importing channels'
    });
  }
});

// ==================== PLAYLIST MANAGEMENT ====================

// @route   GET /api/admin/playlists
// @desc    Get all playlists
// @access  Admin
router.get('/playlists', async (req, res) => {
  try {
    const playlists = await Playlist.find()
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email')
      .populate('channels', 'name logo category isActive');

    res.json({
      success: true,
      data: { playlists }
    });
  } catch (error) {
    console.error('Get playlists error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching playlists'
    });
  }
});

// @route   POST /api/admin/playlists
// @desc    Create a new playlist
// @access  Admin
router.post('/playlists', async (req, res) => {
  try {
    const { name, description, category, channelIds, isPublic } = req.body;

    const playlist = new Playlist({
      name,
      description,
      category: category || 'General',
      channels: channelIds || [],
      createdBy: req.user._id,
      isPublic: isPublic || false
    });

    await playlist.save();

    res.status(201).json({
      success: true,
      message: 'Playlist created successfully',
      data: { playlist }
    });
  } catch (error) {
    console.error('Create playlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating playlist'
    });
  }
});

// @route   PUT /api/admin/playlists/:id
// @desc    Update a playlist
// @access  Admin
router.put('/playlists/:id', async (req, res) => {
  try {
    const updates = req.body;
    delete updates.createdBy;

    const playlist = await Playlist.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist not found'
      });
    }

    res.json({
      success: true,
      message: 'Playlist updated successfully',
      data: { playlist }
    });
  } catch (error) {
    console.error('Update playlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating playlist'
    });
  }
});

// @route   DELETE /api/admin/playlists/:id
// @desc    Delete a playlist
// @access  Admin
router.delete('/playlists/:id', async (req, res) => {
  try {
    const playlist = await Playlist.findByIdAndDelete(req.params.id);

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist not found'
      });
    }

    res.json({
      success: true,
      message: 'Playlist deleted successfully'
    });
  } catch (error) {
    console.error('Delete playlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting playlist'
    });
  }
});

// @route   PUT /api/admin/playlists/:id/channels
// @desc    Add/remove channels from playlist
// @access  Admin
router.put('/playlists/:id/channels', async (req, res) => {
  try {
    const { channelIds, action } = req.body; // action: 'add' or 'remove'

    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist not found'
      });
    }

    if (action === 'add') {
      // Add channels (avoid duplicates)
      channelIds.forEach(id => {
        if (!playlist.channels.includes(id)) {
          playlist.channels.push(id);
        }
      });
    } else if (action === 'remove') {
      // Remove channels
      playlist.channels = playlist.channels.filter(
        id => !channelIds.includes(id.toString())
      );
    }

    await playlist.save();

    res.json({
      success: true,
      message: 'Playlist channels updated successfully',
      data: { playlist }
    });
  } catch (error) {
    console.error('Update playlist channels error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating playlist channels'
    });
  }
});

// ==================== DASHBOARD STATS ====================

// @route   GET /api/admin/stats
// @desc    Get admin dashboard statistics
// @access  Admin
router.get('/stats', async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalChannels,
      activeChannels,
      totalPlaylists,
      subscriptionStats
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      Channel.countDocuments(),
      Channel.countDocuments({ isActive: true }),
      Playlist.countDocuments(),
      User.aggregate([
        { $group: { _id: '$subscriptionStatus', count: { $sum: 1 } } }
      ])
    ]);

    const subscriptionBreakdown = {
      none: 0,
      basic: 0,
      premium: 0,
      expired: 0
    };
    subscriptionStats.forEach(stat => {
      subscriptionBreakdown[stat._id] = stat.count;
    });

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers
        },
        channels: {
          total: totalChannels,
          active: activeChannels
        },
        playlists: totalPlaylists,
        subscriptions: subscriptionBreakdown
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching stats'
    });
  }
});

module.exports = router;
