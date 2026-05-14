import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import { runNewsJobForUser, runAllScheduledJobs } from './cronJob.js';
import { getConfig } from './configManager.js'; // 古い設定のお引越し用

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// データベース接続
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB Cloud!');
    
    // 最初の1回目の起動時：ローカルのconfig.jsonからクラウドにお引越しする
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('No users found in database. Migrating from local config.json...');
      const oldConfig = await getConfig();
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      const firstUser = new User({
        email: oldConfig.email.to || 'test@example.com',
        password: hashedPassword,
        settings: {
          news: oldConfig.news,
          schedule: oldConfig.schedule,
          ai: {
            provider: 'gemini',
            geminiApiKey: oldConfig.geminiApiKey,
            chatGptApiKey: '',
            claudeApiKey: ''
          }
        }
      });
      await firstUser.save();
      console.log('Migration completed successfully!');
    }
  })
  .catch(err => console.error('MongoDB connection error:', err));


// --- APIエンドポイント ---
import jwt from 'jsonwebtoken';

// ログイン機能
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'ユーザーが見つかりません' });
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'パスワードが違います' });
    
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.json({ token, user: { email: user.email } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 外部アラーム（cron-job.org等）から毎分叩かれるエンドポイント
app.post('/api/cron', async (req, res) => {
  // 現在の時刻を HH:MM 形式で取得 (日本時間)
  const now = new Date();
  const jstTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
  const currentHourMinute = `${String(jstTime.getUTCHours()).padStart(2, '0')}:${String(jstTime.getUTCMinutes()).padStart(2, '0')}`;
  
  // 非同期で処理を開始（レスポンスはすぐに返す）
  runAllScheduledJobs(currentHourMinute);
  res.json({ success: true, message: `Cron triggered for time: ${currentHourMinute}` });
});

// フロントエンドとの一時的な通信用（あとでログイン機能に差し替えます）
app.get('/api/config', async (req, res) => {
  try {
    const user = await User.findOne(); // 最初に見つかったユーザー（自分）のデータを返す
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({
      geminiApiKey: user.settings.ai.geminiApiKey,
      chatGptApiKey: user.settings.ai.chatGptApiKey,
      claudeApiKey: user.settings.ai.claudeApiKey,
      aiProvider: user.settings.ai.provider,
      news: user.settings.news,
      schedule: user.settings.schedule
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/config', async (req, res) => {
  try {
    const user = await User.findOne();
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // UIからの更新データを保存
    if (req.body.geminiApiKey !== undefined) user.settings.ai.geminiApiKey = req.body.geminiApiKey;
    if (req.body.news) user.settings.news = req.body.news;
    if (req.body.schedule) user.settings.schedule = req.body.schedule;
    
    // AIプロバイダ等の更新（あとでUIに追加します）
    if (req.body.aiProvider) user.settings.ai.provider = req.body.aiProvider;
    if (req.body.chatGptApiKey !== undefined) user.settings.ai.chatGptApiKey = req.body.chatGptApiKey;
    if (req.body.claudeApiKey !== undefined) user.settings.ai.claudeApiKey = req.body.claudeApiKey;

    await user.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/run', async (req, res) => {
  try {
    const user = await User.findOne();
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    await runNewsJobForUser(user);
    res.json({ success: true, message: 'Job finished successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Reactフロントエンドの配信（本番環境用） ---
app.use(express.static(path.join(__dirname, '../frontend/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
