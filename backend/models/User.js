import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  settings: {
    news: {
      sources: [
        {
          url: String,
          name: String
        }
      ],
      keywords: [String]
    },
    schedule: {
      time: {
        type: String,
        default: '07:00'
      }
    },
    ai: {
      provider: {
        type: String,
        enum: ['gemini', 'chatgpt', 'claude'],
        default: 'gemini'
      },
      geminiApiKey: {
        type: String,
        default: ''
      },
      chatGptApiKey: {
        type: String,
        default: ''
      },
      claudeApiKey: {
        type: String,
        default: ''
      }
    }
  }
});

export default mongoose.model('User', userSchema);
