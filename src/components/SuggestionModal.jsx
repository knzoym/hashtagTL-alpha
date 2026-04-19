import React from 'react';
import { useAppStore } from '../store/useAppStore';

export default function SuggestionModal({ suggestions, onClose, isGenerating }) {
  const { addLane, updateLane } = useAppStore();

  const handleCreate = (sug) => {
    // 1. レーン（年表）を新規作成
    addLane(sug.tags, sug.title);
    
    // 2. 作成された直後のレーンを特定して理由とIDを紐付ける
    setTimeout(() => {
      const state = useAppStore.getState();
      const currentFile = state.files.find(f => f.id === state.currentFileId);
      const newLane = currentFile?.timelines.slice(-1)[0];
      if (newLane) {
        updateLane(newLane.id, { 
          description: sug.reason,
          includedEventIds: sug.eventIds 
        });
      }
      onClose();
    }, 100);
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: '#fff', width: '550px', maxHeight: '85vh', borderRadius: '16px', padding: '30px', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold' }}>✨ AIからの切り口提案</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#999' }}>×</button>
        </div>

        {isGenerating ? (
          <div style={{ padding: '60px 0', textAlign: 'center' }}>
            <div style={{ fontSize: '30px', marginBottom: '20px' }}>🧠</div>
            <p style={{ color: '#666', fontWeight: 'bold' }}>イベント間の客観的な事実を照合中...</p>
          </div>
        ) : (
          <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {suggestions.map((sug, i) => (
              <div key={i} style={{ border: '2px solid #eee', borderRadius: '12px', padding: '15px', transition: 'border-color 0.2s' }}>
                <h3 style={{ margin: '0 0 10px', fontSize: '16px', color: '#1a365d' }}>{sug.title}</h3>
                <p style={{ fontSize: '13px', color: '#444', lineHeight: 1.6, marginBottom: '15px' }}>{sug.reason}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {sug.tags.map(t => <span key={t.text} style={{ fontSize: '11px', background: '#f0f0f0', padding: '2px 8px', borderRadius: '10px' }}>#{t.text}</span>)}
                  </div>
                  <button onClick={() => handleCreate(sug)} style={{ background: '#000', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>＋ 年表を作成</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}