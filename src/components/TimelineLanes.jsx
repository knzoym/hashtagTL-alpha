import React from 'react';
import { TOP_MARGIN } from '../utils/laneUtils';

export const LaneBackground = ({ timelines, laneHeight, focusedLaneId, containerHeight }) => (
  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
    {timelines.map((tl, index) => {
      const isFocused = focusedLaneId === tl.id;
      const isAbove = focusedLaneId && index < timelines.findIndex(t => t.id === focusedLaneId);
      
      const top = focusedLaneId 
        ? (isFocused ? 0 : (isAbove ? -containerHeight : containerHeight * 2))
        : TOP_MARGIN + index * laneHeight;
      const height = isFocused ? containerHeight : laneHeight;
      const opacity = focusedLaneId && !isFocused ? 0 : 1;

      const color = tl.color || '#666';
      
      return (
        <div key={`lane-bg-${tl.id}`} style={{ 
          position: 'absolute', top, left: 0, width: '100%', height, 
          transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)', opacity 
        }}>
          <div style={{
            position: 'absolute', top: '50%', left: 0, width: '100%', height: '6px',
            backgroundColor: color,
            transform: 'translateY(-50%)'
          }} />
        </div>
      );
    })}
  </div>
);

export const LaneTitles = ({ timelines, laneHeight, onRestoreClick, onTitleClick, focusedLaneId, containerHeight, onFocusClick }) => (
  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 100 }}>
    <div style={{ position: 'absolute', top: 0, left: 0, height: TOP_MARGIN, padding: '10px 20px', transition: 'opacity 0.5s', opacity: focusedLaneId ? 0 : 1 }}>
      <span style={{ fontSize: '10px', color: '#999', fontWeight: 'bold' }}>INBOX</span>
    </div>
    {timelines.map((tl, index) => {
      const isFocused = focusedLaneId === tl.id;
      const isAbove = focusedLaneId && index < timelines.findIndex(t => t.id === focusedLaneId);
      
      const top = focusedLaneId 
        ? (isFocused ? 0 : (isAbove ? -containerHeight : containerHeight * 2))
        : TOP_MARGIN + index * laneHeight;
      const height = isFocused ? containerHeight : laneHeight;
      const opacity = focusedLaneId && !isFocused ? 0 : 1;
      const color = tl.color || '#666';
      
      return (
        <div key={`title-${tl.id}`} style={{ 
          position: 'absolute', top, left: 0, height, 
          padding: '0 20px', display: 'flex', alignItems: 'center', gap: '10px',
          transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)', opacity 
        }}>
          {isFocused && (
            <button onClick={() => onFocusClick(null)} style={{ padding: '4px 12px', borderRadius: '20px', border: '1px solid #ccc', background: '#fff', cursor: 'pointer', pointerEvents: 'auto' }}>
              ← 戻る
            </button>
          )}
          <button 
            onClick={() => onTitleClick(tl)}
            style={{ 
              background: '#fff', color: '#000', border: `4px solid ${color}`,
              padding: '4px 16px', fontSize: '12px', borderRadius: '20px', 
              fontWeight: 'bold', pointerEvents: 'auto', display: 'flex', 
              alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', cursor: 'pointer'
            }}
          >
            {tl.title}
          </button>
          {!isFocused && (
            <button onClick={() => onFocusClick(tl.id)} style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', background: '#eee', fontSize: '11px', cursor: 'pointer', pointerEvents: 'auto' }}>
              🔍 詳細
            </button>
          )}
        </div>
      );
    })}
  </div>
);