import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },
    password: {
      type: String,
      required: false,
      trim: true
    },
    status: {
      type: Boolean,
      default: true
    },
    token: {
      type: String,
      default: null
    },
    emailConfirmed: {
      type: Boolean,
      default: false
    },
    avatarUrl: {
      type: String,
      default: null
    },
    avatarPublicId: {
      type: String,
      default: null
    },
    pushToken: {
      type: String,
      default: null
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    preferences: {
      theme: {
        type: String,
        enum: ['light', 'dark', 'system'],
        default: 'system'
      },
      accent: {
        type: String,
        default: 'white'
      },
      wallpaperUrl: {
        type: String,
        default: null
      },
      wallpaperPublicId: {
        type: String,
        default: null
      },
      phoneWallpaperUrl: {
        type: String,
        default: null
      },
      phoneWallpaperPublicId: {
        type: String,
        default: null
      }
    },

    savedDesktops: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  {
    timestamps: true
  }
);

userSchema.index({ name: 'text', email: 'text' });

userSchema.methods.encryptPassword = async function(password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

userSchema.methods.matchPassword = async function(password) {
  if (!this.password) return false;
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.createToken = function() {
  const generatedToken = Math.random().toString(36).slice(2);
  this.token = generatedToken;
  return generatedToken;
};

export default mongoose.model('User', userSchema);
