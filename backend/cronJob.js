import User from './models/User.js';
import { fetchNews } from './newsFetcher.js';
import { summarizeArticles } from './summarizer.js';
import { sendEmail } from './mailer.js';

export async function runNewsJobForUser(user) {
  console.log(`Starting news job for user: ${user.email}`);
  try {
    const articles = await fetchNews(user.settings.news.sources, user.settings.news.keywords);
    console.log(`[${user.email}] Fetched ${articles.length} articles.`);
    
    const summary = await summarizeArticles(articles, user.settings.ai);
    console.log(`[${user.email}] Summarization complete.`);
    
    await sendEmail(user.email, summary, articles);
    console.log(`[${user.email}] Email sent successfully.`);
  } catch (error) {
    console.error(`[${user.email}] Error running news job:`, error);
    throw error;
  }
}

export async function runAllScheduledJobs(currentHourMinute) {
  console.log(`Checking scheduled jobs for time: ${currentHourMinute}`);
  try {
    // DBから「今」が設定時刻になっているユーザーを全員探す
    const users = await User.find({ 'settings.schedule.time': currentHourMinute });
    console.log(`Found ${users.length} users scheduled for ${currentHourMinute}.`);
    
    // 全員のニュース取得と送信を並行して実行
    const promises = users.map(user => runNewsJobForUser(user).catch(e => console.error(e)));
    await Promise.all(promises);
    
    console.log('All scheduled jobs completed for this minute.');
  } catch (error) {
    console.error('Error running scheduled jobs:', error);
  }
}
