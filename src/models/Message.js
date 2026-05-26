import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: function() { return this.type === 'text'; }
  },
  type: {
    type: String,
    enum: ['text', 'audio', 'file'],
    default: 'text'
  },
  fileUrl: {
    type: String
  },
  filePublicId: {
    type: String
  },
  duration: {
    type: Number
  },
  deliveredTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isEdited: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

export default mongoose.model('Message', MessageSchema);