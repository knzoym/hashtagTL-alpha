import React, { useState, useRef, useEffect, useMemo, memo } from 'react';
import { dateToYearDecimal, yearDecimalToDateStr, getTicks } from '../utils/timelineUtils';
import { LANE_HEIGHT, TOP_MARGIN, getEventTop } from '../utils/laneUtils';
import EventModal from '../components/EventModal';

const API_BASE_URL = 'http://localhost:3001';

const EventCard = memo(({ event, x, top, highlightTag, isDragging, onDragStart, onEdit }) => {
  const isHighlighted = highlightTag && event.tags?.some(tag => tag.includes(highlightTag));
  const isDimmed = highlightTag && !isHighlighted;

  return (
    <div 
      draggable
      onDragStart={onDragStart}
      onDoubleClick={onEdit}
      style={{
        position: 'absolute',
        transform: `translate3d(${x}px, ${top}px, 0) translateX(-50%)`,
        willChange: 'transform',
        width: '170px',
        backgroundColor: '#fff',
        border: isHighlighted ? '3px solid #ff4444' : '2px solid #000',
        borderRadius: '4px',
        zIndex: isDragging ? 1000 : 20,
        opacity: isDragging ? 0.5 : (isDimmed ? 0.15 : 1),
        transition: isDragging ? 'none' : 'opacity 0.2s',
        cursor: 'grab',
        overflow: 'hidden'
      }}
    >
      {event.image && <img src={`${API_BASE_URL}${event.image}`} style={{ width: '100%', height: '95px', objectFit: 'cover', pointerEvents: 'none' }} />}
      <div style={{ padding: '8px', pointerEvents: 'none' }}>
        <div style={{ fontWeight: 'bold', fontSize: '11px' }}>{event.title || '(無題)'}</div>
      </div>
    </div>
  );
});

export default function TimelineTab({ events = [], activeTags = [], highlightTag = '', onSaveEvent, onRemoveLane }) {
  const containerRef = useRef(null);
  const stageRef = useRef(null);

  const [viewState, setViewState] = useState({ centerX: 1950, zoom: 15 });
  const [containerSize, setContainerSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [editingEvent, setEditingEvent] = useState(null);
  const [draggingData, setDraggingData] = useState({ eventId: null, fromTag: null });

  const dragOffset = useRef(0);
  const isPanning = useRef(false);
  const startMouseX = useRef(0);

  useEffect(() => {
    const handleResize = () => setContainerSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMouseDown = (e) => {
    if (e.button !== 0 || draggingData.eventId) return;
    isPanning.current = true;
    startMouseX.current = e.clientX;
    dragOffset.current = 0;
    if (stageRef.current) stageRef.current.style.transition = 'none';
  };

  const handleMouseMove = (e) => {
    if (!isPanning.current) return;
    const dx = e.clientX - startMouseX.current;
    dragOffset.current = dx;
    if (stageRef.current) {
      stageRef.current.style.transform = `translate3d(${dx}px, 0, 0)`;
    }
  };

  const handleMouseUp = () => {
    if (!isPanning.current) return;
    isPanning.current = false;
    const deltaYear = dragOffset.current / viewState.zoom;
    setViewState(prev => ({ ...prev, centerX: prev.centerX - deltaYear }));
    if (stageRef.current) {
      stageRef.current.style.transform = `translate3d(0, 0, 0)`;
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (!draggingData.eventId) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const droppedYear = (x - containerSize.width / 2) / viewState.zoom + viewState.centerX;
    const newDateStr = yearDecimalToDateStr(droppedYear);

    const relativeY = y - TOP_MARGIN;
    const laneIndex = Math.floor(relativeY / LANE_HEIGHT);
    
    const targetEvent = events.find(ev => ev.id === draggingData.eventId);
    if (!targetEvent) return;

    let newTags = [...(targetEvent.tags || [])];

    if (relativeY < 0) {
      // INBOX領域にドロップされた場合：すべての activeTags を削除
      newTags = newTags.filter(t => !activeTags.includes(t));
    } else if (laneIndex >= 0 && laneIndex < activeTags.length) {
      // 特定のレーンにドロップされた場合
      const newTag = activeTags[laneIndex];
      if (draggingData.fromTag) {
        // 既存のタグを新しいタグに置き換え
        newTags = newTags.map(t => t === draggingData.fromTag ? newTag : t);
      } else {
        // INBOXから来た場合はタグを追加
        if (!newTags.includes(newTag)) newTags.push(newTag);
      }
    }

    onSaveEvent({
      ...targetEvent,
      date: newDateStr,
      tags: newTags
    });

    setDraggingData({ eventId: null, fromTag: null });
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleWheel = (e) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      setViewState(prev => ({ ...prev, zoom: Math.min(Math.max(prev.zoom * factor, 0.1), 3000) }));
    };
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  const yearToX = (year) => (year - viewState.centerX) * viewState.zoom + containerSize.width / 2;

  // パン操作中の空白を防ぐため、画面幅より広い範囲（左右に+2000pxなど）のTicksを計算する
  const ticks = useMemo(() => {
    const bufferWidth = containerSize.width + 4000; 
    return getTicks(viewState, bufferWidth);
  }, [viewState, containerSize.width]);

  return (
    <div 
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      style={{ width: '100vw', height: '100vh', backgroundColor: '#f0f0f0', position: 'fixed', overflow: 'hidden', cursor: isPanning.current ? 'grabbing' : 'grab' }}
    >
      {/* 1. 固定背景レイヤー（年表レーンの横線）: 動かさないので空白が出ない */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        <div style={{ height: TOP_MARGIN, backgroundColor: 'rgba(0,0,0,0.04)', borderBottom: '1px solid #ccc' }} />
        {activeTags.map((tag) => (
          <div key={`lane-bg-${tag}`} style={{ height: LANE_HEIGHT, borderBottom: '1px solid #000', backgroundColor: 'rgba(255,255,255,0.7)' }} />
        ))}
      </div>

      {/* 2. 動くステージレイヤー（年号の縦線 + イベントカード） */}
      <div ref={stageRef} style={{ width: '100%', height: '100%', willChange: 'transform', position: 'absolute', top: 0, left: 0 }}>
        {/* 年号の縦線 (Ticks) */}
        {ticks.map((tick, i) => (
          <div key={`tick-${i}`} style={{ 
            position: 'absolute', 
            left: yearToX(dateToYearDecimal(tick.date)), 
            bottom: 0, 
            borderLeft: tick.isMajor ? '1px solid #bbb' : '1px solid #eee', 
            height: '100%', 
            pointerEvents: 'none' 
          }}>
            <span style={{ fontSize: '9px', color: '#888', paddingLeft: '5px' }}>{tick.label}</span>
          </div>
        ))}

        {/* イベントカード */}
        {events.map(event => {
          const lanes = activeTags.filter(tag => event.tags.includes(tag));
          if (lanes.length === 0) {
            return (
              <EventCard 
                key={`${event.id}-inbox`}
                event={event}
                x={yearToX(dateToYearDecimal(event.date))}
                top={65}
                highlightTag={highlightTag}
                isDragging={draggingData.eventId === event.id}
                onDragStart={() => setDraggingData({ eventId: event.id, fromTag: null })}
                onEdit={() => setEditingEvent(event)}
              />
            );
          }
          return lanes.map(tag => (
            <EventCard 
              key={`${event.id}-${tag}`}
              event={event}
              x={yearToX(dateToYearDecimal(event.date))}
              top={activeTags.indexOf(tag) * LANE_HEIGHT + TOP_MARGIN + 50}
              highlightTag={highlightTag}
              isDragging={draggingData.eventId === event.id}
              onDragStart={() => setDraggingData({ eventId: event.id, fromTag: tag })}
              onEdit={() => setEditingEvent(event)}
            />
          ));
        })}
      </div>

      {/* 3. 左固定タイトルレイヤー（タグ表示）: 最前面で固定 */}
      <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', pointerEvents: 'none' }}>
        <div style={{ height: TOP_MARGIN, padding: '10px 20px' }}>
          <span style={{ fontSize: '10px', color: '#999' }}>INBOX</span>
        </div>
        {activeTags.map((tag) => (
          <div key={`title-${tag}`} style={{ height: LANE_HEIGHT, padding: '10px 20px', display: 'flex', alignItems: 'flex-start' }}>
            <span style={{ 
              background: '#000', 
              color: '#fff', 
              padding: '4px 12px', 
              fontSize: '12px', 
              borderRadius: '20px', 
              fontWeight: 'bold',
              pointerEvents: 'auto'
            }}>
              #{tag}
            </span>
          </div>
        ))}
      </div>

      {editingEvent && <EventModal event={editingEvent} onSave={(d) => { onSaveEvent(d); setEditingEvent(null); }} onCancel={() => setEditingEvent(null)} />}
    </div>
  );
}