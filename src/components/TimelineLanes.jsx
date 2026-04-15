import React, { useState, useEffect } from 'react';
import { TOP_MARGIN } from '../utils/laneUtils';

export const LaneBackground = ({ timelines, laneHeight, focusedLaneId, containerHeight, laneRowMap, dropTarget, laneRanges, yearToX }) => (
  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
    {/* 常に背景にINBOX用のベースレイヤーを敷く */}
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '20000px', backgroundColor: '#e6e6e6', zIndex: -1 }} />
    
    {timelines.map((tl, index) => {
      const isFocused = focusedLaneId === tl.id;
      const rowIndex = laneRowMap?.[tl.id] ?? index;
      
      // ★ 詳細モードでも上部(TOP_MARGIN)を空け、ヘッダー裏をドロップ領域(INBOX)として機能させる
      const top = focusedLaneId ? (isFocused ? TOP_MARGIN : (index < timelines.findIndex(t => t.id === focusedLaneId) ? -containerHeight * 2 : containerHeight * 2)) : TOP_MARGIN + rowIndex * laneHeight;
      const height = isFocused ? containerHeight - TOP_MARGIN : laneHeight;
      const color = tl.color || '#666';
      
      const isDropTarget = dropTarget?.laneId === tl.id;

      const range = laneRanges?.[tl.id];
      const startX = range && !focusedLaneId ? yearToX(range.minYear) - 180 : 0;
      const blockWidth = range && !focusedLaneId ? (yearToX(range.maxYear) + 120 - startX) : '100%';

      return (
        <div key={`lane-bg-${tl.id}`} style={{ 
          position: 'absolute', top, left: 0, width: '100%', height, 
          transition: 'top 0.5s cubic-bezier(0.4, 0, 0.2, 1), height 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          backgroundColor: isFocused ? '#fff' : 'transparent', 
          zIndex: isFocused ? 1 : 0 
        }}>
          {isDropTarget && !isFocused && (
            <div style={{
              position: 'absolute', top: '10px', left: startX, 
              width: typeof blockWidth === 'number' ? `${blockWidth}px` : blockWidth, 
              height: `calc(100% - 20px)`,
              backgroundColor: 'rgba(52, 152, 219, 0.15)', 
              borderRadius: '12px',
              transition: 'background-color 0.2s',
            }} />
          )}

          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '3px', backgroundColor: color, opacity: isFocused ? 1 : 0, transition: 'opacity 0.3s' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '3px', backgroundColor: color, opacity: isFocused ? 1 : 0, transition: 'opacity 0.3s' }} />
        </div>
      );
    })}
  </div>
);

export const LaneCenterLines = ({ timelines, laneHeight, focusedLaneId, laneRanges, yearToX, laneRowMap }) => (
  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}>
    {timelines.map((tl, index) => {
      if (focusedLaneId || !laneRanges?.[tl.id]) return null;
      const range = laneRanges[tl.id];
      const rowIndex = laneRowMap?.[tl.id] ?? index;
      const top = TOP_MARGIN + rowIndex * laneHeight;
      const color = tl.color || '#666';
      const startX = yearToX(range.minYear);
      const endX = yearToX(range.maxYear);
      return (
        <div key={`lane-center-${tl.id}`} style={{ position: 'absolute', top, left: 0, width: '100%', height: laneHeight, transition: 'top 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }}>
          <div 
            title={tl.title}
            style={{ 
              position: 'absolute', top: '50%', left: startX, 
              width: `${Math.max(2, endX - startX)}px`, height: '20px', 
              transform: 'translateY(-50%)', 
              pointerEvents: 'auto', 
              display: 'flex', alignItems: 'center', cursor: 'default'
            }}
          >
            <div style={{ width: '100%', height: '2px', backgroundColor: color, opacity: 0.5 }} />
          </div>
        </div>
      );
    })}
  </div>
);

const InlineLaneEditor = ({ initialConfig, onSave, onCancel, onDelete, onChange, top, left }) => {
  const [title, setTitle] = useState(initialConfig.title || '');
  const [tags, setTags] = useState(initialConfig.condition?.tags || []);
  const [logic, setLogic] = useState(initialConfig.condition?.logic || 'OR');
  const [tagInput, setTagInput] = useState('');

  useEffect(() => { onChange({ tags, logic }); }, [tags, logic]);

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.find(t => t.text === trimmed)) setTags([...tags, { text: trimmed, logic }]);
    setTagInput('');
  };

  const handleRemoveTag = (tagTextToRemove) => setTags(tags.filter(t => t.text !== tagTextToRemove));
  const safeLeft = Math.max(20, left);

  return (
    <div style={{
      position: 'absolute', top: top + 15, left: safeLeft, background: '#fff', border: `3px solid ${initialConfig.color || '#666'}`,
      padding: '6px 12px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.2)', pointerEvents: 'auto', zIndex: 1000, whiteSpace: 'nowrap'
    }}>
      <input 
        value={title} onChange={e => setTitle(e.target.value)} placeholder="年表タイトル"
        style={{ width: '120px', padding: '4px 8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '13px', fontWeight: 'bold' }}
      />
      <div style={{ width: '1px', height: '20px', background: '#ccc' }} />
      <select value={logic} onChange={e => setLogic(e.target.value)} style={{ fontSize: '12px', border: 'none', background: '#eee', borderRadius: '4px', padding: '2px 4px', cursor: 'pointer', fontWeight: 'bold' }}>
        <option value="OR">OR</option>
        <option value="AND">AND</option>
      </select>
      <input 
        value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); handleAddTag(); } }}
        placeholder="タグを追加" style={{ width: '100px', padding: '4px 8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '13px' }}
      />
      {tagInput.trim() && <button onClick={handleAddTag} style={{ padding: '3px 8px', fontSize: '12px', background: '#eee', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>追加</button>}
      
      <div style={{ display: 'flex', gap: '4px', marginLeft: '4px' }}>
        {tags.map((tag, i) => (
          <span key={i} style={{ background: '#e0e0e0', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {tag.text}
            <button onClick={() => handleRemoveTag(tag.text)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, fontSize: '14px', color: '#666' }}>×</button>
          </span>
        ))}
      </div>

      <div style={{ width: '1px', height: '20px', background: '#ccc', marginLeft: '4px' }} />

      <button onClick={() => onSave(initialConfig.id, { title, condition: { tags, logic } })} disabled={!title.trim() || tags.length === 0} style={{ padding: '4px 12px', background: '#000', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', opacity: (!title.trim() || tags.length === 0) ? 0.5 : 1 }}>保存</button>
      <button onClick={onCancel} style={{ padding: '4px 12px', background: '#eee', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>取消</button>
      <button onClick={() => { if (window.confirm("この年表を削除しますか？")) onDelete(initialConfig.id); }} style={{ padding: '4px 12px', background: 'transparent', color: '#ff4444', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>削除</button>
    </div>
  );
};

export const LaneTitles = ({ timelines, laneHeight, focusedLaneId, laneRanges, yearToX, onFocusClick, laneRowMap, onEditClick, editingLaneConfig, onSaveEdit, onCancelEdit, onDeleteLane, onChangeEdit }) => (
  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 100 }}>
    {!focusedLaneId && timelines.map((tl, index) => {
      const rowIndex = laneRowMap?.[tl.id] ?? index;
      const top = TOP_MARGIN + rowIndex * laneHeight;
      const range = laneRanges?.[tl.id];
      const left = range ? yearToX(range.minYear) - 90 : 30;

      if (editingLaneConfig?.id === tl.id) {
        return (
          <InlineLaneEditor
            key={`edit-${tl.id}`} initialConfig={editingLaneConfig}
            onSave={onSaveEdit} onCancel={onCancelEdit} onDelete={onDeleteLane} onChange={onChangeEdit}
            top={top} left={left}
          />
        );
      }

      return (
        <div key={`title-${tl.id}`} style={{ 
          position: 'absolute', top, left, height: laneHeight, display: 'flex', alignItems: 'center', pointerEvents: 'auto', gap: '8px', 
          transform: range ? 'translateX(-100%)' : 'none', transition: 'top 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          <button 
            onClick={() => onFocusClick(tl.id)}
            style={{ background: '#fff', color: '#000', border: `3px solid ${tl.color || '#666'}`, padding: '5px 15px', fontSize: '12px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.08)', whiteSpace: 'nowrap' }}
          >
            {tl.title}
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onEditClick(tl); }}
            title="設定・編集"
            style={{ background: '#fff', border: `2px solid ${tl.color || '#ccc'}`, borderRadius: '50%', width: '26px', height: '26px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', fontSize: '12px', padding: 0 }}
          >
            ⚙️
          </button>
        </div>
      );
    })}
  </div>
);