import React from 'react';
import { TOP_MARGIN } from '../utils/laneUtils';

export const LaneBackground = ({ timelines, laneHeight, focusedLaneId, containerHeight }) => (
  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
    {timelines.map((tl, index) => {
      const isFocused = focusedLaneId === tl.id;
      const laneIdx = timelines.findIndex(t => t.id === focusedLaneId);
      const isAbove = focusedLaneId && index < laneIdx;
      const isBelow = focusedLaneId && index > laneIdx;
      
      // 詳細モード時は対象レーンを画面いっぱいに、他は画面外へ
      const top = focusedLaneId 
        ? (isFocused ? 0 : (isAbove ? -containerHeight : containerHeight))
        : TOP_MARGIN + index * laneHeight;
      
      const height = isFocused ? containerHeight : laneHeight;
      const color = tl.color || '#666';

      return (
        <div key={`lane-bg-${tl.id}`} style={{ 
          position: 'absolute', top, left: 0, width: '100%', height, 
          transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          backgroundColor: isFocused ? '#fff' : 'transparent',
          zIndex: isFocused ? 1 : 0
        }}>
          {/* 上部境界線 (固定) */}
          <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '3px',
            backgroundColor: color, opacity: isFocused ? 1 : 0, transition: 'opacity 0.3s'
          }} />
          
          {/* 中心から分割される線 (俯瞰時は1本に見える) */}
          <div style={{
            position: 'absolute', 
            top: isFocused ? '0px' : '50%', 
            left: 0, width: '100%', height: '3px',
            backgroundColor: color,
            transform: isFocused ? 'none' : 'translateY(-50%)',
            transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            opacity: isFocused ? 0 : 1
          }} />

          {/* 下部境界線 (固定) */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, width: '100%', height: '3px',
            backgroundColor: color, opacity: isFocused ? 1 : 0, transition: 'opacity 0.3s'
          }} />
        </div>
      );
    })}
  </div>
);

export const LaneTitles = ({ timelines, laneHeight, focusedLaneId, containerHeight, onFocusClick }) => (
  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 100 }}>
    {!focusedLaneId && timelines.map((tl, index) => {
      const top = TOP_MARGIN + index * laneHeight;
      return (
        <div key={`title-${tl.id}`} style={{ 
          position: 'absolute', top, left: 20, height: laneHeight, 
          display: 'flex', alignItems: 'center', pointerEvents: 'auto'
        }}>
          <button 
            onClick={() => onFocusClick(tl.id)}
            style={{ 
              background: '#fff', color: '#000', border: `4px solid ${tl.color || '#666'}`,
              padding: '6px 16px', fontSize: '13px', borderRadius: '20px', 
              fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            {tl.title} <span style={{ fontSize: '10px', marginLeft: '5px' }}>🔍 詳細</span>
          </button>
        </div>
      );
    })}
  </div>
);