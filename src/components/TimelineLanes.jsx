import React from 'react';
import { LANE_HEIGHT, TOP_MARGIN } from '../utils/laneUtils';

export const LaneBackground = ({ activeTags }) => (
  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>

    <div style={{ position: 'absolute', top: TOP_MARGIN, left: 0, width: '100%' }}>
      {activeTags.map((tag) => (
        <div key={`lane-bg-${tag}`} style={{ height: LANE_HEIGHT, borderBottom: '1px solid #000', backgroundColor: 'rgba(255,255,255,0.7)' }} />
      ))}
    </div>
  </div>
);

export const LaneTitles = ({ activeTags }) => (
  <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', pointerEvents: 'none' }}>
    <div style={{ height: TOP_MARGIN, padding: '10px 20px' }}>
      <span style={{ fontSize: '10px', color: '#999' }}>INBOX</span>
    </div>
    {activeTags.map((tag) => (
      <div key={`title-${tag}`} style={{ height: LANE_HEIGHT, padding: '10px 20px', display: 'flex', alignItems: 'flex-start' }}>
        <span style={{ 
          background: '#000', color: '#fff', padding: '4px 12px', 
          fontSize: '12px', borderRadius: '20px', fontWeight: 'bold', 
          pointerEvents: 'auto' 
        }}>
          #{tag}
        </span>
      </div>
    ))}
  </div>
);