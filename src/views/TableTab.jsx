import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import EventModal from '../components/EventModal';
import { isEventInTimeline } from '../utils/laneUtils';

export default function TableTab() {
  const { events, files, currentFileId, focusedLaneId } = useAppStore();
  const [editingEvent, setEditingEvent] = useState(null);

  const currentFile = files.find(f => f.id === currentFileId);
  const timelines = currentFile?.timelines || [];

  const displayEvents = useMemo(() => {
    let list = currentFileId ? events.filter(e => e.fileId === currentFileId) : events;
    if (focusedLaneId) {
      const tl = timelines.find(t => t.id === focusedLaneId);
      if (tl) list = list.filter(e => isEventInTimeline(e, tl));
    }
    return list.sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [events, currentFileId, focusedLaneId, timelines]);

  return (
    <div style={{ width: '100%', height: '100%', paddingTop: '120px', paddingLeft: '25px', paddingRight: '25px', boxSizing: 'border-box', backgroundColor: '#fff', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px' }}>
        <button onClick={() => setEditingEvent({ title: '', date: '', description: '', tags: [], fileId: currentFileId })} style={{ background: '#000', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '4px', fontSize: '14px', cursor: 'pointer', fontWeight: 'bold' }}>＋ イベントを追加</button>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #000', textAlign: 'left', fontSize: '12px' }}>
            <th style={{ padding: '10px' }}>日付</th>
            <th style={{ padding: '10px' }}>タイトル</th>
            <th style={{ padding: '10px' }}>タグ</th>
            <th style={{ padding: '10px' }}>操作</th>
          </tr>
        </thead>
        <tbody>
          {displayEvents.map(event => (
            <tr key={event.id} onDoubleClick={() => setEditingEvent(event)} style={{ borderBottom: '1px solid #eee', cursor: 'pointer' }}>
              <td style={{ padding: '12px 10px', fontSize: '14px' }}>{event.date}</td>
              <td style={{ padding: '12px 10px', fontSize: '14px', fontWeight: 'bold' }}>{event.title || '(無題)'}</td>
              <td style={{ padding: '12px 10px' }}>
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                  {event.tags?.map(tag => (<span key={tag} style={{ background: '#eee', padding: '2px 8px', borderRadius: '10px', fontSize: '10px' }}>#{tag}</span>))}
                </div>
              </td>
              <td style={{ padding: '12px 10px' }}>
                <button onClick={() => setEditingEvent(event)} style={{ background: '#000', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>編集</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {editingEvent && <EventModal event={editingEvent} isNew={!editingEvent.id} onClose={() => setEditingEvent(null)} />}
    </div>
  );
}