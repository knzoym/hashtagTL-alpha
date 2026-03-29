import { useState, useEffect } from 'react';
import timelinesData from './data/timelines.json';
import TimelineTab from './views/TimelineTab';
import TableTab from './views/TableTab';

function App() {
  const [activeTab, setActiveTab] = useState('timeline');
  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetch('http://localhost:3001/events')
      .then(res => res.json())
      .then(data => setEvents(data))
      .catch(err => console.error("Load Error:", err));
  }, []);

  const saveEvent = async (updatedEvent) => {
    const isNew = !events.find(e => e.id === updatedEvent.id);
    const url = isNew ? 'http://localhost:3001/events' : `http://localhost:3001/events/${updatedEvent.id}`;
    const method = isNew ? 'POST' : 'PUT';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedEvent)
    });
    if (res.ok) {
      const savedData = await res.json();
      setEvents(prev => isNew ? [...prev, savedData] : prev.map(e => e.id === savedData.id ? savedData : e));
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {/* タイトル：左上に固定 */}
      <div style={{ 
        position: 'absolute', top: '20px', left: '25px', zIndex: 1000, 
        pointerEvents: 'none', userSelect: 'none' 
      }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: '#000' }}>hashtagTLα</h1>
      </div>

      {/* タブボタン：右上に固定 */}
      <div style={{ 
        position: 'absolute', top: '20px', right: '25px', zIndex: 1000, 
        display: 'flex', gap: '10px' 
      }}>
        <button 
          onClick={() => setActiveTab('timeline')}
          style={{ 
            padding: '10px 20px', cursor: 'pointer', border: '2px solid #000', borderRadius: '6px',
            background: activeTab === 'timeline' ? '#000' : '#fff', 
            color: activeTab === 'timeline' ? '#fff' : '#000',
            fontWeight: 'bold', boxShadow: '0 4px 0 #000'
          }}
        >年表</button>
        <button 
          onClick={() => setActiveTab('table')}
          style={{ 
            padding: '10px 20px', cursor: 'pointer', border: '2px solid #000', borderRadius: '6px',
            background: activeTab === 'table' ? '#000' : '#fff', 
            color: activeTab === 'table' ? '#fff' : '#000',
            fontWeight: 'bold', boxShadow: '0 4px 0 #000'
          }}
        >テーブル</button>
      </div>

      {/* メインエリア */}
      {activeTab === 'timeline' ? (
        <TimelineTab events={events} timelines={timelinesData} onSaveEvent={saveEvent} />
      ) : (
        <div style={{ width: '100%', height: '100%', overflowY: 'auto', paddingTop: '80px' }}>
          <TableTab events={events} />
        </div>
      )}
    </div>
  );
}

export default App;