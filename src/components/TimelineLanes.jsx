import React from 'react';
import { TOP_MARGIN } from '../utils/laneUtils'; // LANE_HEIGHT の import を削除

// Props に laneHeight を追加
export const LaneBackground = ({ activeTags, laneHeight }) => (
  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
    <div style={{ position: 'absolute', top: TOP_MARGIN, left: 0, width: '100%' }}>
      {activeTags.map((tag) => (
        // height を laneHeight に変更
        <div key={`lane-bg-${tag}`} style={{ height: laneHeight, borderBottom: '1px solid #000', backgroundColor: 'rgba(255,255,255,0.7)' }} />
      ))}
    </div>
  </div>
);

// Props に laneHeight を追加
export const LaneTitles = ({ activeTags, laneHeight, onRemoveLane }) => (
  <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', pointerEvents: 'none', zIndex: 100 }}>
    <div style={{ height: TOP_MARGIN, padding: '10px 20px' }}>
      <span style={{ fontSize: '10px', color: '#999' }}>INBOX</span>
    </div>
    {activeTags.map((tag) => (
      // height を laneHeight に変更
      <div key={`title-${tag}`} style={{ height: laneHeight, padding: '10px 20px', display: 'flex', alignItems: 'flex-start' }}>
        <span style={{ 
          background: '#000', color: '#fff', padding: '4px 8px 4px 12px', 
          fontSize: '12px', borderRadius: '20px', fontWeight: 'bold', 
          pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          #{tag}
          <button 
            onMouseDown={(e) => {
              e.stopPropagation();
              onRemoveLane(tag);
            }}
            style={{ 
              background: 'none', border: 'none', color: '#999', 
              cursor: 'pointer', padding: '0 4px', fontSize: '14px',
              lineHeight: 1, pointerEvents: 'auto'
            }}
            onMouseEnter={(e) => e.target.style.color = '#fff'}
            onMouseLeave={(e) => e.target.style.color = '#999'}
          >
            ×
          </button>
        </span>
      </div>
    ))}
  </div>
);