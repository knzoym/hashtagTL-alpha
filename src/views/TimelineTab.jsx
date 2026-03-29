import { useState, useRef, useEffect } from 'react';
import { dateToYearDecimal, yearDecimalToDateStr, getTicks } from '../utils/timelineUtils';
import EventModal from '../components/EventModal';

const API_BASE_URL = 'http://localhost:3001';

export default function TimelineTab({ events, timelines, onSaveEvent }) {
  const containerRef = useRef(null);
  const [viewState, setViewState] = useState({ centerX: 1950, zoom: 15 });
  const [containerWidth, setContainerWidth] = useState(window.innerWidth);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouseX, setLastMouseX] = useState(0);
  const [editingEvent, setEditingEvent] = useState(null);

  // リサイズ対応
  useEffect(() => {
    const handleResize = () => setContainerWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ズーム（パッシブイベント対策）
  useEffect(() => {
    const container = containerRef.current;
    const handleWheelNative = (e) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.15 : 0.85;
      setViewState(prev => {
        const newZoom = prev.zoom * factor;
        return (newZoom > 0.05 && newZoom < 60000) ? { ...prev, zoom: newZoom } : prev;
      });
    };
    container.addEventListener('wheel', handleWheelNative, { passive: false });
    return () => container.removeEventListener('wheel', handleWheelNative);
  }, []);

  const yearToX = (year) => (year - viewState.centerX) * viewState.zoom + containerWidth / 2;

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const deltaYear = (e.clientX - lastMouseX) / viewState.zoom;
    setViewState(prev => ({ ...prev, centerX: prev.centerX - deltaYear }));
    setLastMouseX(e.clientX);
  };

  const ticks = getTicks(viewState, containerWidth);

  return (
    <div 
      ref={containerRef}
      onMouseDown={(e) => { if(e.button === 0) { setIsDragging(true); setLastMouseX(e.clientX); } }}
      onMouseMove={handleMouseMove}
      onMouseUp={() => setIsDragging(true && setIsDragging(false))} // 安全策
      onMouseLeave={() => setIsDragging(false)}
      onDoubleClick={(e) => {
        if (e.target !== containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const yearDec = (e.clientX - rect.left - containerWidth / 2) / viewState.zoom + viewState.centerX;
        setEditingEvent({ id: Date.now().toString(), date: yearDecimalToDateStr(yearDec), title: '', description: '', tags: [], url: '', image: '' });
      }}
      style={{
        width: '100vw', height: '100vh', backgroundColor: '#f9f9f9',
        position: 'fixed', top: 0, left: 0, overflow: 'hidden', 
        cursor: isDragging ? 'grabbing' : 'grab', userSelect: 'none'
      }}
    >
      {/* ルーラー */}
      {ticks.map((tick, i) => {
        const x = yearToX(dateToYearDecimal(tick.date));
        return (
          <div key={i} style={{ position: 'absolute', left: x, bottom: 0, borderLeft: tick.isMajor ? '2px solid #888' : '1px solid #eee', height: '100%', paddingLeft: '5px' }}>
            <span style={{ fontSize: tick.isMajor ? '11px' : '9px', color: tick.isMajor ? '#333' : '#aaa', fontWeight: tick.isMajor ? 'bold' : 'normal' }}>{tick.label}</span>
          </div>
        );
      })}

      {/* イベント */}
      {events.map(event => (
        <div key={event.id} onDoubleClick={(e) => { e.stopPropagation(); setEditingEvent(event); }} style={{ position: 'absolute', left: yearToX(dateToYearDecimal(event.date)), top: '40%', width: '180px', backgroundColor: 'white', border: '2px solid #333', borderRadius: '4px', transform: 'translateX(-50%)', cursor: 'pointer', zIndex: 10, boxShadow: '0 4px 15px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          {event.image && <img src={`${API_BASE_URL}${event.image}`} alt={event.title} style={{ width: '100%', height: '120px', objectFit: 'cover' }} />}
          <div style={{ padding: '8px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{event.title}</div>
            <div style={{ fontSize: '9px', color: '#999' }}>{event.date}</div>
          </div>
        </div>
      ))}

      {editingEvent && <EventModal event={editingEvent} onSave={(data) => { onSaveEvent(data); setEditingEvent(null); }} onCancel={() => setEditingEvent(null)} />}
    </div>
  );
}