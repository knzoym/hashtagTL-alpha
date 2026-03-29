import { useState, useEffect } from 'react';
import TimelineTab from './views/TimelineTab';

const API_BASE_URL = 'http://localhost:3001';

function App() {
  const [events, setEvents] = useState([]);
  const [activeTags, setActiveTags] = useState([]);
  const [highlightTag, setHighlightTag] = useState('');

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
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {/* 検索・ハイライト・レーン作成UI */}
      <div style={{ position: 'absolute', top: '20px', left: '25px', zIndex: 2000, pointerEvents: 'auto' }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '24px', fontWeight: '900', letterSpacing: '-1px' }}>hashtagTLα</h1>
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

      <TimelineTab 
        events={events} 
        activeTags={activeTags} 
        highlightTag={highlightTag}
        onSaveEvent={saveEvent} 
        onRemoveLane={(t) => setActiveTags(activeTags.filter(tag => tag !== t))}
        onTagClick={(t) => !activeTags.includes(t) && setActiveTags([...activeTags, t])}
      />
    </div>
  );
}

export default App;