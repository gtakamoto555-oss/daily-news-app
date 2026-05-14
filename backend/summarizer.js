import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

export async function summarizeArticles(articles, aiConfig) {
  const { provider, geminiApiKey, chatGptApiKey, claudeApiKey } = aiConfig;
  
  if (articles.length === 0) {
    return '本日は設定されたキーワードに一致するニュースがありませんでした。';
  }

  let prompt = '以下のニュース記事を読みやすく要約してください。各記事の要約は必ず【150字以内】で簡潔にまとめ、要約の後には必ずその記事の「URL」を記載してください。\n\n';
  articles.forEach((article, index) => {
    prompt += `【${index + 1}】${article.title} (${article.source})\n`;
    prompt += `URL: ${article.link}\n`;
    prompt += `内容: ${article.content}\n\n`;
  });
  prompt += '\n全体のまとめとして、今日のニュースの傾向や特に注目すべきポイントを最後に数行で追記してください。';

  try {
    if (provider === 'chatgpt') {
      if (!chatGptApiKey) throw new Error('ChatGPT API Key is not set.');
      const openai = new OpenAI({ apiKey: chatGptApiKey });
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }]
      });
      return response.choices[0].message.content;
      
    } else if (provider === 'claude') {
      if (!claudeApiKey) throw new Error('Claude API Key is not set.');
      const anthropic = new Anthropic({ apiKey: claudeApiKey });
      const msg = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      });
      return msg.content[0].text;
      
    } else {
      // Default to Gemini
      if (!geminiApiKey) throw new Error('Gemini API Key is not set.');
      const ai = new GoogleGenAI({ apiKey: geminiApiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      return response.text;
    }
  } catch (error) {
    console.error(`[${provider}] API Error:`, error.message || error);
    return '要約の生成中にエラーが発生しました。\n\n記事一覧:\n' + articles.map(a => `- ${a.title} (${a.link})`).join('\n');
  }
}
