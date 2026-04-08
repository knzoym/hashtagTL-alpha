import React from 'react';
import { dateToYearDecimal } from '../utils/timelineUtils';

export default function TimelineTicks({ ticks, yearToX, focusedLaneId, containerHeight }) {
  return (
    <>
      {ticks.map((tick, i) => {
        const x = yearToX(dateToYearDecimal(tick.date));
        return (
          <div key={`tick-${i}`} style={{ 
            position: 'absolute', left: x, top: 0, height: '100%',
            borderLeft: tick.isMajor ? '1px solid #bbb' : '1px solid #eee',
            pointerEvents: 'none', zIndex: 2 // ボードの上、カードの下
          }}>
            {/* 上端ラベル */}
            <span style={{ 
              position: 'absolute', 
              top: focusedLaneId ? '10px' : '10px',
              fontSize: '10px', color: '#888', paddingLeft: '5px',
              fontWeight: tick.isMajor ? 'bold' : 'normal'
            }}>
              {tick.label}
            </span>
            {/* 詳細モード時のみ下端にもラベル表示 */}
            {focusedLaneId && (
              <span style={{ 
                position: 'absolute', 
                bottom: '10px',
                fontSize: '10px', color: '#888', paddingLeft: '5px',
                fontWeight: tick.isMajor ? 'bold' : 'normal'
              }}>
                {tick.label}
              </span>
            )}
          </div>
        );
      })}
    </>
  );
}