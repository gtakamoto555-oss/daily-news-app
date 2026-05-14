import { useState, useEffect } from 'react';
import './index.css';

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [newKeyword, setNewKeyword] = useState('');

  // ログイン処理
  const handleLogin = async () => {
    setMessage({ text: '', type: '' });
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
      } else {
        setMessage({ text: data.error || 'ログイン失敗', type: 'error' });
      }
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setConfig(null);
  };

  // ログインしたら設定を読み込む
  useEffect(() => {
    if (token) {
      setLoading(true);
      // 今回は簡易的にトークン検証なしで最初のユーザーを返すAPIを使いますが、
      // 実際は headers: { 'Authorization': `Bearer ${token}` } を送ります
      fetch('/api/config')
        .then(res => res.json())
        .then(data => {
          setConfig(data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setMessage({ text: '設定の読み込みに失敗しました。', type: 'error' });
          setLoading(false);
        });
    }
  }, [token]);

  const handleSave = async () => {
    setSaving(true);
    setMessage({ text: '', type: '' });
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (res.ok) {
        setMessage({ text: '設定を保存しました。', type: 'success' });
      } else {
        throw new Error('保存に失敗しました');
      }
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    }
    setSaving(false);
  };

  const handleManualRun = async () => {
    setRunning(true);
    setMessage({ text: 'テスト実行中...（ニュース取得と要約を行っています）', type: 'success' });
    try {
      const res = await fetch('/api/run', { method: 'POST' });
      if (res.ok) {
        setMessage({ text: '手動実行が完了しました！メールが届いているか確認してください。', type: 'success' });
      } else {
        throw new Error('実行に失敗しました');
      }
    } catch (err) {
      setMessage({ text: '手動実行の開始に失敗しました。', type: 'error' });
    }
    setRunning(false);
  };

  const addKeyword = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newKeyword.trim()) {
      e.preventDefault();
      if (!config.news.keywords.includes(newKeyword.trim())) {
        setConfig({ ...config, news: { ...config.news, keywords: [...config.news.keywords, newKeyword.trim()] } });
      }
      setNewKeyword('');
    }
  };

  const removeKeyword = (kw: string) => {
    setConfig({
      ...config,
      news: { ...config.news, keywords: config.news.keywords.filter((k: string) => k !== kw) }
    });
  };

  const updateSource = (index: number, field: string, value: string) => {
    const newSources = [...config.news.sources];
    newSources[index][field] = value;
    setConfig({ ...config, news: { ...config.news, sources: newSources } });
  };

  const addSource = () => {
    setConfig({
      ...config,
      news: { ...config.news, sources: [...config.news.sources, { name: '', url: '' }] }
    });
  };

  const removeSource = (index: number) => {
    const newSources = [...config.news.sources];
    newSources.splice(index, 1);
    setConfig({ ...config, news: { ...config.news, sources: newSources } });
  };

  // ログイン画面の表示
  if (!token) {
    return (
      <div className="app-container" style={{ maxWidth: '400px', marginTop: '10vh' }}>
        <header>
          <h1>Daily News AI</h1>
          <p>クラウド版ログイン</p>
        </header>
        {message.text && <div className={`notification ${message.type}`}>{message.text}</div>}
        <div className="card">
          <div className="form-group">
            <label>メールアドレス</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="例: you@example.com" />
          </div>
          <div className="form-group">
            <label>パスワード</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button onClick={handleLogin} style={{ width: '100%', marginTop: '1rem' }}>ログイン</button>
        </div>
      </div>
    );
  }

  if (loading || !config) return <div className="app-container"><p>読み込み中...</p></div>;

  return (
    <div className="app-container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Daily News AI (Cloud)</h1>
          <p>あなたのための毎朝ニュース要約システム</p>
        </div>
        <button onClick={handleLogout} className="secondary" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}>ログアウト</button>
      </header>

      <div className="card">
        <h2>🤖 AI モデルの選択</h2>
        <div className="form-group">
          <label>要約に使用するAIプロバイダを選択</label>
          <select 
            value={config.aiProvider || 'gemini'} 
            onChange={e => setConfig({...config, aiProvider: e.target.value})}
            style={{ width: '100%', padding: '0.8rem', borderRadius: '4px', border: '1px solid #ccc', marginBottom: '1rem' }}
          >
            <option value="gemini">Google Gemini (無料・高速でおすすめ)</option>
            <option value="chatgpt">OpenAI ChatGPT (gpt-4o-mini)</option>
            <option value="claude">Anthropic Claude (Claude 3 Haiku)</option>
          </select>
        </div>

        {config.aiProvider === 'gemini' && (
          <div className="form-group">
            <label>Google Gemini API キー</label>
            <input 
              type="password" 
              value={config.geminiApiKey} 
              onChange={e => setConfig({...config, geminiApiKey: e.target.value})} 
              placeholder="AIzaSy..."
            />
          </div>
        )}

        {config.aiProvider === 'chatgpt' && (
          <div className="form-group">
            <label>OpenAI (ChatGPT) API キー</label>
            <input 
              type="password" 
              value={config.chatGptApiKey} 
              onChange={e => setConfig({...config, chatGptApiKey: e.target.value})} 
              placeholder="sk-proj-..."
            />
          </div>
        )}

        {config.aiProvider === 'claude' && (
          <div className="form-group">
            <label>Anthropic (Claude) API キー</label>
            <input 
              type="password" 
              value={config.claudeApiKey} 
              onChange={e => setConfig({...config, claudeApiKey: e.target.value})} 
              placeholder="sk-ant-..."
            />
          </div>
        )}
      </div>

      <div className="card">
        <h2>📰 ニュース取得設定</h2>
        <div className="form-group">
          <label>興味のあるキーワード (Enterで追加)</label>
          <div className="tags-input">
            {config.news.keywords.map((kw: string) => (
              <span key={kw} className="tag">
                {kw} <button type="button" onClick={() => removeKeyword(kw)}>×</button>
              </span>
            ))}
          </div>
          <input 
            type="text" 
            placeholder="例: AI, 教育, SNSマーケティング..." 
            value={newKeyword}
            onChange={e => setNewKeyword(e.target.value)}
            onKeyDown={addKeyword}
          />
        </div>

        <div className="form-group">
          <label>RSS フィード (取得元サイト)</label>
          {config.news.sources.map((src: any, i: number) => (
            <div key={i} className="rss-item">
              <input 
                type="text" 
                placeholder="サイト名" 
                value={src.name} 
                onChange={e => updateSource(i, 'name', e.target.value)} 
                style={{ flex: 0.3 }}
              />
              <input 
                type="text" 
                placeholder="RSS URL" 
                value={src.url} 
                onChange={e => updateSource(i, 'url', e.target.value)} 
              />
              <button type="button" className="secondary" onClick={() => removeSource(i)}>削除</button>
            </div>
          ))}
          <button type="button" className="secondary" onClick={addSource} style={{ width: 'fit-content', marginTop: '0.5rem' }}>+ RSSを追加</button>
        </div>
      </div>

      <div className="card">
        <h2>⏰ 配信スケジュール設定</h2>
        <div className="form-group">
          <label>毎日の配信時間</label>
          <input 
            type="time" 
            value={config.schedule.time} 
            onChange={e => setConfig({...config, schedule: {...config.schedule, time: e.target.value}})} 
            style={{ width: 'fit-content' }}
          />
        </div>
      </div>

      {message.text && (
        <div className={`notification ${message.type}`} style={{ marginBottom: '1rem' }}>
          {message.text}
        </div>
      )}

      <div className="button-group">
        <button type="button" onClick={handleSave} disabled={saving || running} style={{ flex: 1 }}>
          {saving ? '保存中...' : 'クラウドへ設定を保存'}
        </button>
        <button type="button" onClick={handleManualRun} disabled={saving || running} className="secondary" style={{ flex: 1 }}>
          {running ? '実行中...' : '▶ 今すぐテスト実行'}
        </button>
      </div>

    </div>
  );
}

export default App;
