import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_PATH = path.join(__dirname, 'config.json');

const DEFAULT_CONFIG = {
  geminiApiKey: "",
  email: {
    host: "smtp-mail.outlook.com",
    port: 587,
    secure: false,
    user: "",
    pass: "",
    from: "",
    to: ""
  },
  news: {
    sources: [
      { url: "https://news.yahoo.co.jp/rss/topics/it.xml", name: "Yahoo IT" },
      { url: "https://news.yahoo.co.jp/rss/topics/business.xml", name: "Yahoo Business" }
    ],
    keywords: ["AI", "教育", "SNSマーケティング"]
  },
  schedule: {
    time: "07:00"
  }
};

export async function getConfig() {
  try {
    const data = await fs.readFile(CONFIG_PATH, 'utf-8');
    return { ...DEFAULT_CONFIG, ...JSON.parse(data) };
  } catch (error) {
    if (error.code === 'ENOENT') {
      await saveConfig(DEFAULT_CONFIG);
      return DEFAULT_CONFIG;
    }
    throw error;
  }
}

export async function saveConfig(config) {
  await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
}
