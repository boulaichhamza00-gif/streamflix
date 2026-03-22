const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  subscriptionStatus: {
    type: String,
    enum: ['none', 'basic', 'premium', 'expired'],
    default: 'none'
  },
  subscriptionExpiry: {
    type: Date,
    default: null
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  watchHistory: [{
    channel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Channel'
    },
    watchedAt: {
      type: Date,
      default: Date.now
    }
  }],
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel'
  }]
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check if subscription is valid
userSchema.methods.hasValidSubscription = function() {
  if (this.subscriptionStatus === 'none' || this.subscriptionStatus === 'expired') {
    return false;
  }
  if (this.subscriptionExpiry && new Date() > this.subscriptionExpiry) {
    return false;
  }
  return true;
};

module.exports = mongoose.model('User', userSchema);
