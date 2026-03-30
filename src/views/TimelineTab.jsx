import React, { useState, useEffect, useMemo } from 'react';
import { dateToYearDecimal, getTicks } from '../utils/timelineUtils';
import { LANE_HEIGHT, TOP_MARGIN, getEventTop } from '../utils/laneUtils';
import EventCard from '../components/EventCard';
import TimelineTicks from '../components/TimelineTicks';
import { LaneBackground, LaneTitles } from '../components/TimelineLanes';
import EventModal from '../components/EventModal';
import { usePanZoom } from '../hooks/usePanZoom';
import { useDragAndDrop } from '../hooks/useDragAndDrop';

export default function TimelineTab({ events = [], activeTags = [], highlightTag = '', onSaveEvent, onRemoveLane }) {
  const [isAltPressed, setIsAltPressed] = useState(false);
  
  useEffect(() => {
    const handleKeyChange = (e) => {
      setIsAltPressed(e.altKey);
    };
    window.addEventListener('keydown', handleKeyChange);
    window.addEventListener('keyup', handleKeyChange);
    return () => {
      window.removeEventListener('keydown', handleKeyChange);
      window.removeEventListener('keyup', handleKeyChange);
    };
  }, []);

  const { 
    viewState, containerRef, stageXRef, stageEventsXRef, stageYRef, isPanning, 
    handleMouseDown, handleMouseMove, handleMouseUp 
  } = usePanZoom();

  const { draggingData, handleDragStart, handleDrop } = useDragAndDrop(containerRef, events, activeTags, onSaveEvent, viewState.panY);

  const [containerSize, setContainerSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [editingEvent, setEditingEvent] = useState(null);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setContainerSize({ 
          width: containerRef.current.offsetWidth, 
          height: containerRef.current.offsetHeight 
        });
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const yearToX = (year) => (year - viewState.centerX) * viewState.zoom + containerSize.width / 2;

  const ticks = useMemo(() => {
    const bufferWidth = containerSize.width + 4000; 
    return getTicks(viewState, bufferWidth);
  }, [viewState, containerSize.width]);

  // ドラッグ中にもAltキーの判定を行うための処理
  const handleDragOver = (e) => {
    e.preventDefault();
    if (isAltPressed !== e.altKey) {
      setIsAltPressed(e.altKey);
    }
  };

  const DragHintOverlay = () => {
    if (!draggingData.eventId) return null;

    return (
      <div style={{
        position: 'absolute',
        bottom: '20px',
        right: '25px',
        background: 'rgba(0, 0, 0, 0.85)',
        color: '#fff',
        padding: '16px 20px',
        borderRadius: '12px',
        boxShadow: '0 6px 16px rgba(0,0,0,0.3)',
        zIndex: 2500,
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontFamily: 'sans-serif',
        fontSize: '14px',
        fontWeight: 'bold',
        transition: 'opacity 0.2s',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          borderRight: '1px solid rgba(255,255,255,0.3)',
          paddingRight: '12px'
        }}>
          <div style={{
            background: isAltPressed ? '#ff4444' : '#fff',
            color: isAltPressed ? '#fff' : '#000',
            padding: '6px 10px',
            borderRadius: '6px',
            fontSize: '12px',
            textTransform: 'uppercase',
            transition: 'background 0.1s'
          }}>Alt</div>
          <span style={{ color: isAltPressed ? '#ff8888' : '#fff' }}>を長押し:</span>
        </div>

        {isAltPressed ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>+</span>
            <span>ドロップ: 元のレーンにも残して追加 (コピー)</span>
          </div>
        ) : (
          <div style={{ opacity: 0.7 }}>通常のドロップ: 移動先タグに置換 (移動)</div>
        )}
      </div>
    );
  };

  return (
    <div 
      ref={containerRef}
      onMouseDown={(e) => handleMouseDown(e, !!draggingData.eventId)}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDragOver={handleDragOver} // 修正: handleDragOverを使用
      onDrop={handleDrop}
      style={{ 
        width: '100%', 
        height: '100%', 
        backgroundColor: '#e6e6e6', 
        position: 'relative', 
        overflow: 'hidden', 
        cursor: isPanning.current ? 'grabbing' : 'grab' 
      }}
    >
      {/* 1. 時間軸・目盛り（横方向のみ動く、縦は画面に固定） */}
      <div ref={stageXRef} style={{ width: '100%', height: '100%', willChange: 'transform', position: 'absolute', top: 0, left: 0 }}>
        <TimelineTicks ticks={ticks} yearToX={yearToX} />
      </div>

      {/* 2. 縦方向に動く全体ラッパー（レーン、INBOX、イベント） */}
      <div 
        ref={stageYRef} 
        style={{ 
          width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, 
          willChange: 'transform', transform: `translate3d(0, ${viewState.panY}px, 0)` 
        }}
      >
        <LaneBackground activeTags={activeTags} />
        <div style={{ position: 'absolute', top: TOP_MARGIN - 1, left: 0, width: '100%', borderBottom: '1px solid #ccc', pointerEvents: 'none' }} />
        
        {/*先にイベントのステージを描画する */}
        <div ref={stageEventsXRef} style={{ width: '100%', height: '100%', willChange: 'transform', position: 'absolute', top: 0, left: 0 }}>
          {events.map(event => {
            const lanes = activeTags.filter(tag => event.tags?.includes(tag));
            if (lanes.length === 0) {
              return (
                <EventCard 
                  key={`${event.id}-inbox`}
                  event={event}
                  x={yearToX(dateToYearDecimal(event.date))}
                  top={getEventTop(event, activeTags)}
                  highlightTag={highlightTag}
                  isDragging={draggingData.eventId === event.id}
                  onDragStart={() => handleDragStart(event.id, null)}
                  onEdit={() => setEditingEvent(event)}
                />
              );
            }
            return lanes.map(tag => (
              <EventCard 
                key={`${event.id}-${tag}`}
                event={event}
                x={yearToX(dateToYearDecimal(event.date))}
                top={getEventTop({ ...event, tags: [tag] }, activeTags)}
                highlightTag={highlightTag}
                isDragging={draggingData.eventId === event.id}
                onDragStart={() => handleDragStart(event.id, tag)}
                onEdit={() => setEditingEvent(event)}
              />
            ));
          })}
        </div>

        <LaneTitles activeTags={activeTags} onRemoveLane={onRemoveLane} />

      </div>

      <DragHintOverlay />

      {editingEvent && <EventModal event={editingEvent} onSave={(d) => { onSaveEvent(d); setEditingEvent(null); }} onCancel={() => setEditingEvent(null)} />}
    </div>
  );
}