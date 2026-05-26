import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      default: null
    },
    type: {
      type: String,
      enum: ['folder', 'note', 'code', 'link', 'file'],
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    url: {
      type: String,
      default: null
    },
    fileFormat: {
      type: String,
      default: null
    },
    publicId: {
      type: String,
      default: null
    },
    content: {
      type: String,
      default: ''
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      default: null
    },
    position: {
      x: { type: Number, default: 100 },
      y: { type: Number, default: 100 }
    },
    guestPositions: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        x: Number,
        y: Number
      }
    ],
    sharedWith: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        permission: {
          type: String,
          enum: ['read', 'edit'],
          default: 'read'
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

itemSchema.index({ userId: 1, parentId: 1 });
itemSchema.index({ workspaceId: 1 });
itemSchema.index({ workspaceId: 1, parentId: 1 });
itemSchema.index({ 'sharedWith.userId': 1 });

export default mongoose.model('Item', itemSchema);
