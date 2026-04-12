import React from 'react';
import { dateToYearDecimal } from '../utils/timelineUtils';

export default function TimelineTicks({ ticks, yearToX }) {
  return (
    <>
      {ticks.map((tick, i) => (
        <div key={`tick-${i}`} style={{ 
          position: 'absolute', 
          left: yearToX(dateToYearDecimal(tick.date)), 
          top: 0, 
          borderLeft: tick.isMajor ? '1px solid #bbb' : '1px solid #eee', 
          height: '100%', 
          pointerEvents: 'none' 
        }}>
          {/* 上部の年号 */}
          <span style={{ 
            position: 'absolute', top: '10px', fontSize: '10px', 
            color: '#888', paddingLeft: '5px', fontWeight: tick.isMajor ? 'bold' : 'normal'
          }}>
            {tick.label}
          </span>
          {/* ★ 変更: 下部にも常に年号を表示 */}
          <span style={{ 
            position: 'absolute', bottom: '10px', fontSize: '10px', 
            color: '#888', paddingLeft: '5px', fontWeight: tick.isMajor ? 'bold' : 'normal'
          }}>
            {tick.label}
          </span>
        </div>
      ))}
    </>
  );
}