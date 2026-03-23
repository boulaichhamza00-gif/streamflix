const mongoose = require('mongoose');

const channelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  streamUrl: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    index: true
  },
  logo: {
    type: String,
    default: null
  },
  description: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  groupTitle: {
    type: String,
    default: ''
  },
  tvgId: {
    type: String,
    default: null
  },
  tvgName: {
    type: String,
    default: null
  },
  country: {
    type: String,
    default: ''
  },
  language: {
    type: String,
    default: ''
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  viewCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for search
channelSchema.index({ name: 'text', category: 'text', description: 'text' });

module.exports = mongoose.model('Channel', channelSchema);
