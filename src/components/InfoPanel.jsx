import React, { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';

export default function InfoPanel({ timeline, visibleEvents, highlightedTag, setHighlightedTag, onClose }) {
  const updateLane = useAppStore(state => state.updateLane);
  const deleteLane = useAppStore(state => state.deleteLane);
  
  const [isEditing, setIsEditing] = useState(false);
  const [tempTitle, setTempTitle] = useState("");
  const [tempDesc, setTempDesc] = useState("");

  // timelineが切り替わった時にステートを同期させる
  useEffect(() => {
    if (timeline) {
      setTempTitle(timeline.title || "");
      setTempDesc(timeline.description || "");
      setIsEditing(false); // 別の年表を開いたら編集モードを解除
    }
  }, [timeline]);

  const tagCounts = useMemo(() => {
    const counts = {};
    visibleEvents.forEach(ev => (ev.tags || []).forEach(tag => counts[tag] = (counts[tag] || 0) + 1));
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [visibleEvents]);

  // 万が一timelineが渡されていない場合はエラーを防ぐため非表示
  if (!timeline) return null;

  const handleSave = () => {
    updateLane(timeline.id, { title: tempTitle, description: tempDesc });
    setIsEditing(false);
  };

  return (
    <div style={{
      position: 'absolute', top: '90px', left: '20px', width: '280px', 
      background: '#fff', border: `4px solid ${timeline.color}`,
      borderRadius: '12px', padding: '20px', zIndex: 1000,
      boxShadow: '0 10px 30px rgba(0,0,0,0.2)', pointerEvents: 'auto',
      maxHeight: 'calc(100vh - 40px)', display: 'flex', flexDirection: 'column'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', flexShrink: 0 }}>
        <button onClick={onClose} style={{ border: 'none', background: '#eee', padding: '5px 12px', borderRadius: '15px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>← 戻る</button>
        <button onClick={() => isEditing ? handleSave() : setIsEditing(true)} style={{ border: 'none', background: '#000', color: '#fff', padding: '5px 12px', borderRadius: '15px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
          {isEditing ? '保存' : '編集'}
        </button>
      </div>

      <div style={{ overflowY: 'auto', paddingRight: '5px' }}>
        {isEditing ? (
          <>
            <input value={tempTitle} onChange={e => setTempTitle(e.target.value)} style={{ width: '100%', fontSize: '18px', fontWeight: 'bold', marginBottom: '10px', padding: '8px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px' }} />
            <textarea value={tempDesc} onChange={e => setTempDesc(e.target.value)} placeholder="年表の説明を入力..." style={{ width: '100%', height: '80px', fontSize: '12px', marginBottom: '15px', padding: '8px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px', resize: 'vertical' }} />
          </>
        ) : (
          <>
            <h2 style={{ margin: '0 0 10px', fontSize: '20px' }}>{timeline.title}</h2>
            <p style={{ fontSize: '12px', color: '#444', whiteSpace: 'pre-wrap', marginBottom: '20px', lineHeight: 1.5 }}>{timeline.description || "説明はありません。"}</p>
          </>
        )}

        <h3 style={{ fontSize: '12px', borderBottom: '1px solid #eee', paddingBottom: '5px', marginBottom: '10px' }}>含まれるタグ一覧</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {tagCounts.map(([tag, count]) => (
            <button
              key={tag}
              onClick={() => setHighlightedTag(highlightedTag === tag ? null : tag)}
              style={{
                display: 'flex', justifyContent: 'space-between', padding: '6px 10px', borderRadius: '6px',
                border: highlightedTag === tag ? '2px solid #ff4444' : '1px solid #eee',
                background: highlightedTag === tag ? '#fff5f5' : '#fff', cursor: 'pointer', fontSize: '11px',
                transition: 'all 0.2s', textAlign: 'left'
              }}
            >
              <span style={{ fontWeight: highlightedTag === tag ? 'bold' : 'normal', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>#{tag}</span>
              <span style={{ color: '#666', background: '#f5f5f5', padding: '2px 6px', borderRadius: '10px', fontSize: '10px' }}>{count}</span>
            </button>
          ))}
        </div>

        {isEditing && (
          <button 
            onClick={() => window.confirm("この年表を削除しますか？") && (deleteLane(timeline.id) || onClose())}
            style={{ width: '100%', marginTop: '30px', color: '#ff4444', background: 'none', border: '1px solid #ff4444', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}
          >
            年表を削除
          </button>
        )}
      </div>
    </div>
  );
}