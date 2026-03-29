import { useState } from 'react';
import eventsData from './data/events.json';
import timelinesData from './data/timelines.json';
import TimelineTab from './views/TimelineTab';
import TableTab from './views/TableTab';

function App() {
  const [activeTab, setActiveTab] = useState('timeline');
  const [events, setEvents] = useState(eventsData);

  const saveEvent = (updatedEvent) => {
    setEvents(prev => {
      const index = prev.findIndex(e => e.id === updatedEvent.id);
      if (index !== -1) {
        const newEvents = [...prev];
        newEvents[index] = updatedEvent;
        return newEvents;
      }
      return [...prev, updatedEvent];
    });
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1 style={{ borderBottom: '2px solid #000' }}>hashtagTLα</h1>
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button 
          onClick={() => setActiveTab('timeline')}
          style={{ padding: '10px 20px', cursor: 'pointer', background: activeTab === 'timeline' ? '#000' : '#fff', color: activeTab === 'timeline' ? '#fff' : '#000' }}
        >年表タブ</button>
        <button 
          onClick={() => setActiveTab('table')}
          style={{ padding: '10px 20px', cursor: 'pointer', background: activeTab === 'table' ? '#000' : '#fff', color: activeTab === 'table' ? '#fff' : '#000' }}
        >テーブルタブ</button>
      </div>

      {activeTab === 'timeline' ? (
        <TimelineTab events={events} timelines={timelinesData} onSaveEvent={saveEvent} />
      ) : (
        <TableTab events={events} />
      )}
    </div>
  );
}

export default App;