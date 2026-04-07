import React from 'react';
import { useAppStore } from '../store/useAppStore';

export default function LaneEditModal({ editingTimeline, setEditingTimeline }) {
  const updateLane = useAppStore(state => state.updateLane);
  const deleteLane = useAppStore(state => state.deleteLane);

  if (!editingTimeline) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px' }}>年表の設定</h3>
        
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>タイトル</label>
        <input 
          type="text" 
          value={editingTimeline.title}
          onChange={(e) => setEditingTimeline({...editingTimeline, title: e.target.value})}
          style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '20px', boxSizing: 'border-box' }}
        />

        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>条件 (タグ)</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
          {editingTimeline.condition.tags.map((tag, i) => (
            <span key={i} style={{ background: '#eee', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              {i > 0 && (
                <button 
                  onClick={() => {
                    const newTags = [...editingTimeline.condition.tags];
                    newTags[i].logic = newTags[i].logic === 'OR' ? 'AND' : 'OR';
                    setEditingTimeline({...editingTimeline, condition: { tags: newTags }});
                  }}
                  style={{ border: 'none', background: '#ccc', fontSize: '9px', padding: '2px 4px', borderRadius: '4px', cursor: 'pointer' }}
                >
                  {tag.logic}
                </button>
              )}
              {tag.text}
            </span>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
          <button 
            onClick={() => {
              if(window.confirm("この年表を削除しますか？")) {
                deleteLane(editingTimeline.id);
                setEditingTimeline(null);
              }
            }}
            style={{ padding: '8px 16px', background: '#fff', color: '#ff4444', border: '1px solid #ff4444', borderRadius: '6px', cursor: 'pointer' }}
          >
            削除
          </button>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setEditingTimeline(null)} style={{ padding: '8px 16px', border: 'none', background: '#eee', borderRadius: '6px', cursor: 'pointer' }}>キャンセル</button>
            <button 
              onClick={() => {
                updateLane(editingTimeline.id, editingTimeline);
                setEditingTimeline(null);
              }}
              style={{ padding: '8px 20px', background: '#000', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}