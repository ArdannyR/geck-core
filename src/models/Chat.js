import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema(
  {
    isGroup: {
      type: Boolean,
      default: false
    },
    participants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }],
    admins: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    groupName: {
      type: String
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    },
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace'
    },
    unreadCounts: {
      type: Map,
      of: Number,
      default: {}
    }
  },
  { timestamps: true }
);

chatSchema.index({ participants: 1 });
chatSchema.index({ updatedAt: -1 });

export default mongoose.model('Chat', chatSchema);
