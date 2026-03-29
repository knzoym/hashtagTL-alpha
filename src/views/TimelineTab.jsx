import { useState, useRef, useEffect } from 'react';
import { dateToYearDecimal, yearDecimalToDateStr, getTicks } from '../utils/timelineUtils';
import EventModal from '../components/EventModal';

export default function TimelineTab({ events, timelines, onSaveEvent }) {
  const containerRef = useRef(null);
  const [viewState, setViewState] = useState({ centerX: 2000, zoom: 15 });
  const [containerWidth, setContainerWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouseX, setLastMouseX] = useState(0);
  const [editingEvent, setEditingEvent] = useState(null);

  // コンテナサイズの監視
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) setContainerWidth(containerRef.current.offsetWidth);
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const yearToX = (year) => (year - viewState.centerX) * viewState.zoom + containerWidth / 2;

  // ハンドラ
  const handleWheel = (e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 0.85;
    const newZoom = viewState.zoom * factor;
    if (newZoom > 0.05 && newZoom < 60000) {
      setViewState(prev => ({ ...prev, zoom: newZoom }));
    }
  };

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setLastMouseX(e.clientX);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const deltaYear = (e.clientX - lastMouseX) / viewState.zoom;
    setViewState(prev => ({ ...prev, centerX: prev.centerX - deltaYear }));
    setLastMouseX(e.clientX);
  };

  const handleDoubleClick = (e) => {
    if (e.target !== containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const yearDecimal = (e.clientX - rect.left - containerWidth / 2) / viewState.zoom + viewState.centerX;
    setEditingEvent({
      id: Date.now().toString(),
      date: yearDecimalToDateStr(yearDecimal),
      title: '',
      description: '',
      tags: []
    });
  };

  const ticks = getTicks(viewState, containerWidth);

  return (
    <div 
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
      onDoubleClick={handleDoubleClick}
      style={{
        width: '100%', height: '650px', backgroundColor: '#f9f9f9',
        position: 'relative', overflow: 'hidden', cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none', border: '1px solid #ccc'
      }}
    >
      {/* ルーラー */}
      {ticks.map((tick, i) => {
        const x = yearToX(dateToYearDecimal(tick.date));
        if (x < -100 || x > containerWidth + 100) return null;
        return (
          <div key={i} style={{
            position: 'absolute', left: x, bottom: 0,
            borderLeft: tick.isMajor ? '2px solid #888' : '1px solid #eee',
            height: '100%', paddingLeft: '5px', pointerEvents: 'none'
          }}>
            <span style={{
              fontSize: tick.isMajor ? '11px' : '9px',
              color: tick.isMajor ? '#333' : '#aaa',
              fontWeight: tick.isMajor ? 'bold' : 'normal'
            }}>{tick.label}</span>
          </div>
        );
      })}

      {/* イベント */}
      {events.map(event => (
        <div 
          key={event.id}
          onDoubleClick={(e) => { e.stopPropagation(); setEditingEvent(event); }}
          style={{
            position: 'absolute', left: yearToX(dateToYearDecimal(event.date)),
            top: '40%', width: '140px', padding: '10px', backgroundColor: 'white',
            border: '2px solid #333', borderRadius: '4px', transform: 'translateX(-50%)',
            cursor: 'pointer', zIndex: 10, boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
          }}
        >
          <div style={{ fontSize: '9px', color: '#999' }}>{event.date}</div>
          <div style={{ fontWeight: 'bold', fontSize: '12px' }}>{event.title || '(無題)'}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginTop: '5px' }}>
            {event.tags?.map(tag => (
              <span key={tag} style={{ fontSize: '8px', background: '#eee', padding: '1px 3px' }}>#{tag}</span>
            ))}
          </div>
        </div>
      ))}

      {/* モーダル */}
      {editingEvent && (
        <EventModal 
          event={editingEvent} 
          onSave={(data) => { onSaveEvent(data); setEditingEvent(null); }}
          onCancel={() => setEditingEvent(null)}
        />
      )}

      {/* デバッグ情報 */}
      <div style={{ position: 'absolute', top: 10, left: 10, fontSize: '10px', background: '#fff', padding: '5px', opacity: 0.7 }}>
        中心: {viewState.centerX.toFixed(2)} | ズーム: {viewState.zoom.toFixed(1)}px/y
      </div>
    </div>
  );
}