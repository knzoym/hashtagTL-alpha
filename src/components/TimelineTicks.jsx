import React from 'react';
import { dateToYearDecimal } from '../utils/timelineUtils';

export default function TimelineTicks({ ticks, yearToX }) {
  return (
    <>
      {ticks.map((tick, i) => (
        <div key={`tick-${i}`} style={{ 
          position: 'absolute', 
          left: yearToX(dateToYearDecimal(tick.date)), 
          top: 0, // bottom: 0 から変更 
          borderLeft: tick.isMajor ? '1px solid #bbb' : '1px solid #eee', 
          height: '100%', 
          pointerEvents: 'none' 
        }}>
          <span style={{ 
            position: 'absolute', // 追加
            top: '10px',          // 追加: 画面上部からの余白
            fontSize: '10px', 
            color: '#888', 
            paddingLeft: '5px',
            fontWeight: tick.isMajor ? 'bold' : 'normal'
          }}>
            {tick.label}
          </span>
        </div>
      ))}
    </>
  );
}