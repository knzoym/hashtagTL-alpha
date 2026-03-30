import { useState, useEffect } from 'react';
import TimelineTab from './views/TimelineTab';
import TableTab from './views/TableTab';
import MyPage from './views/MyPage';

const API_BASE_URL = 'http://localhost:3001';

function App() {
  const [events, setEvents] = useState([]);
  // 1. 初期化時に localStorage から読み込む
  const [activeTags, setActiveTags] = useState(() => {
    const saved = localStorage.getItem('hashtagTL_activeTags');
    return saved ? JSON.parse(saved) : [];
  });
  const [highlightTag, setHighlightTag] = useState('');
  const [viewMode, setViewMode] = useState('timeline');
  const [currentFileId, setCurrentFileId] = useState(null);

  // 2. activeTags が更新されるたびに localStorage に保存する
  useEffect(() => {
    localStorage.setItem('hashtagTL_activeTags', JSON.stringify(activeTags));
  }, [activeTags]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/events`).then(res => res.json()).then(data => setEvents(data || []));
  }, []);

  const saveEvent = async (updatedEvent) => {
    const isNew = !events.find(e => e.id === updatedEvent.id);
    const method = isNew ? 'POST' : 'PUT';
    const url = isNew ? `${API_BASE_URL}/events` : `${API_BASE_URL}/events/${updatedEvent.id}`;
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedEvent)
    });
    if (res.ok) {
      const saved = await res.json();
      setEvents(prev => isNew ? [...prev, saved] : prev.map(e => e.id === saved.id ? saved : e));
    }
  };

  const addLane = () => {
    const tag = highlightTag.trim().replace('#', '');
    if (tag && !activeTags.includes(tag)) {
      setActiveTags([...activeTags, tag]);
      setHighlightTag('');
      setViewMode('timeline'); // 年表作成時は自動で年表タブへ
    }
  };

  const handleOpenFile = (fileId) => {
    setCurrentFileId(fileId);
    setViewMode('timeline');
    // TODO: ここで選択されたファイルのデータをAPIからフェッチする
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', display: 'flex', flexDirection: 'column' }}>

      {viewMode !== 'mypage' && (
        <div style={{ position: 'absolute', top: '20px', left: '25px', zIndex: 2000, pointerEvents: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '10px' }}>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '900', letterSpacing: '-1px' }}>hashtagTLα</h1>
            
            <div style={{ display: 'flex', background: '#eee', padding: '3px', borderRadius: '8px', border: '1px solid #000' }}>
              <button 
                onClick={() => setViewMode('mypage')}
                style={{ padding: '5px 15px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', background: 'transparent' }}
              >マイページ</button>
              {/* タブ切り替えボタン */}
              <div style={{ display: 'flex', background: '#eee', padding: '3px', borderRadius: '8px', border: '1px solid #000' }}>
                <button 
                  onClick={() => setViewMode('timeline')}
                  style={{ padding: '5px 15px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', background: viewMode === 'timeline' ? '#000' : 'transparent', color: viewMode === 'timeline' ? '#fff' : '#000' }}
                >年表</button>
                <button 
                  onClick={() => setViewMode('table')}
                  style={{ padding: '5px 15px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', background: viewMode === 'table' ? '#000' : 'transparent', color: viewMode === 'table' ? '#fff' : '#000' }}
                >テーブル</button>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="text" 
            placeholder="タグでハイライト / Enterで年表作成" 
            value={highlightTag}
            onChange={(e) => setHighlightTag(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addLane()}
            style={{ padding: '10px 18px', border: '2px solid #000', borderRadius: '30px', width: '240px', outline: 'none', fontSize: '14px' }}
          />
          {highlightTag && (
            <button onClick={addLane} style={{ padding: '8px 16px', background: '#000', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', border: 'none' }}>年表を作成</button>
          )}
        </div>
        </div>
      )}

      {/* コンテンツエリア */}
      {viewMode === 'mypage' && <MyPage onOpenFile={handleOpenFile} />}
      {viewMode === 'timeline' && <TimelineTab 
          events={events} 
          activeTags={activeTags} 
          highlightTag={highlightTag}
          onSaveEvent={saveEvent} 
          onRemoveLane={(t) => setActiveTags(activeTags.filter(tag => tag !== t))}
          onTagClick={(t) => !activeTags.includes(t) && setActiveTags([...activeTags, t])}
        />}
      {viewMode === 'table' && <TableTab 
          events={events}
          onSaveEvent={saveEvent}
        />}
    </div>
  );
}

export default App;