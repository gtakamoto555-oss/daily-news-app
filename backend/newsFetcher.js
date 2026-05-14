import Parser from 'rss-parser';

const parser = new Parser();

export async function fetchNews(sources, keywords) {
  let allArticles = [];

  for (const source of sources) {
    try {
      const feed = await parser.parseURL(source.url);
      
      feed.items.forEach(item => {
        allArticles.push({
          title: item.title,
          link: item.link,
          content: item.contentSnippet || item.content || '内容なし',
          pubDate: item.pubDate,
          source: source.name
        });
      });
    } catch (error) {
      console.error(`Failed to fetch RSS from ${source.url}:`, error.message);
    }
  }

  // 重複を削除し、日付が新しい順（最新順）にソート
  allArticles = allArticles.filter((v, i, a) => a.findIndex(t => (t.title === v.title)) === i);
  allArticles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

  // キーワードが設定されていない場合は単純に最新15件を返す
  if (keywords.length === 0) {
    return allArticles.slice(0, 15);
  }

  let finalArticles = [];
  const usedTitles = new Set();

  // 各キーワードごとに最新の記事を最大3件ずつピックアップ
  keywords.forEach(kw => {
    let count = 0;
    for (const article of allArticles) {
      if (count >= 3) break; // すでに3件見つけたら次のキーワードへ
      
      const contentToSearch = `${article.title} ${article.content}`.toLowerCase();
      // キーワードが含まれていて、かつ他のキーワード枠でまだ選ばれていない記事
      if (contentToSearch.includes(kw.toLowerCase()) && !usedTitles.has(article.title)) {
        finalArticles.push(article);
        usedTitles.add(article.title);
        count++;
      }
    }
    
    // もし1件も見つからなかった場合は「ありません」という記事を追加する
    if (count === 0) {
      finalArticles.push({
        title: `【${kw}】に関するニュース`,
        link: 'なし',
        content: `本日は「${kw}」に関連する記事がありませんでした。`,
        pubDate: new Date().toISOString(),
        source: 'システム'
      });
    }
  });

  return finalArticles;
}
