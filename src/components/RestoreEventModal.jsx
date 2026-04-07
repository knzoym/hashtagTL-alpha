import React from 'react';
import { useAppStore } from '../store/useAppStore';

export default function RestoreEventModal({ restoreLaneId, setRestoreLaneId }) {
  const currentFileId = useAppStore(state => state.currentFileId);
  const files = useAppStore(state => state.files);
  const events = useAppStore(state => state.events);
  const handleRestoreEvent = useAppStore(state => state.handleRestoreEvent);

  if (!restoreLaneId || !currentFileId) return null;

  const currentFile = files.find(f => f.id === currentFileId);
  if (!currentFile) return null;

  const currentTl = currentFile.timelines?.find(tl => tl.id === restoreLaneId);
  if (!currentTl) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', width: '400px', maxHeight: '80vh', overflowY: 'auto' }}>
        <h3 style={{ marginTop: 0 }}>非表示イベントの復帰</h3>
        <p style={{ fontSize: '12px', color: '#666' }}>
          年表「{currentTl.title}」から手動で除外されたイベントです。
        </p>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {currentTl.excludedEventIds.map(eventId => {
            const ev = events.find(e => e.id === eventId);
            if (!ev) return null;
            return (
              <li key={eventId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #eee' }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{ev.title}</span>
                <button 
                  onClick={() => {
                    handleRestoreEvent(eventId, restoreLaneId);
                    if (currentTl.excludedEventIds.length <= 1) {
                      setRestoreLaneId(null);
                    }
                  }}
                  style={{ padding: '4px 12px', background: '#000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  復帰
                </button>
              </li>
            );
          })}
        </ul>
        <div style={{ marginTop: '20px', textAlign: 'right' }}>
          <button onClick={() => setRestoreLaneId(null)} style={{ padding: '6px 16px', cursor: 'pointer' }}>閉じる</button>
        </div>
      </div>
    </div>
  );
}