import React, { useState, useEffect, useMemo } from 'react';
import { dateToYearDecimal, getTicks } from '../utils/timelineUtils';
import { LANE_HEIGHT, TOP_MARGIN, getEventTop } from '../utils/laneUtils';
import EventCard from '../components/EventCard';
import TimelineTicks from '../components/TimelineTicks';
import { LaneBackground, LaneTitles } from '../components/TimelineLanes';
import EventModal from '../components/EventModal';
import { usePanZoom } from '../hooks/usePanZoom';
import { useDragAndDrop } from '../hooks/useDragAndDrop';

export default function TimelineTab({ events = [], activeTags = [], searchTag = '', onSaveEvent, onRemoveLane }) {
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

  const handleDoubleClick = (e) => {
    // イベントカード上のダブルクリック（編集）と被らないようにする
    if (e.target.closest('.event-card-element')) return; 

    const rect = containerRef.current.getBoundingClientRect();
    
    // X座標から年を計算
    const clickX = e.clientX - rect.left;
    const clickedYear = Math.floor((clickX - containerSize.width / 2) / viewState.zoom + viewState.centerX);
    
    // Y座標からレーン（タグ）を判定
    const clickY = e.clientY - rect.top;
    const stageY = clickY - viewState.panY;
    let clickedTag = null;
    if (stageY > TOP_MARGIN) {
      const laneIndex = Math.floor((stageY - TOP_MARGIN) / LANE_HEIGHT);
      if (laneIndex >= 0 && laneIndex < activeTags.length) {
        clickedTag = activeTags[laneIndex];
      }
    }

    // 新規イベントの雛形をセットしてモーダルを開く
    setEditingEvent({
      id: `ev_${Date.now()}`,
      title: '',
      date: `${clickedYear}-01-01`,
      description: clickedTag ? `#${clickedTag} ` : '',
      tags: clickedTag ? [clickedTag] : [],
      image: ''
    });
  };

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
        position: 'absolute', bottom: '20px', right: '25px',
        background: 'rgba(0, 0, 0, 0.85)', color: '#fff', padding: '16px 20px',
        borderRadius: '12px', boxShadow: '0 6px 16px rgba(0,0,0,0.3)',
        zIndex: 2500, pointerEvents: 'none', display: 'flex', flexDirection: 'column',
        gap: '8px', fontFamily: 'sans-serif', fontSize: '14px', fontWeight: 'bold'
      }}>
        <div style={{ opacity: isAltPressed ? 0.4 : 1, transition: 'opacity 0.2s' }}>
          ドラッグでレーンを移動(タグの付け替え)
        </div>
        <div style={{ opacity: isAltPressed ? 1 : 0.4, transition: 'opacity 0.2s', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ background: isAltPressed ? '#ff4444' : '#555', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>Alt</span>
          + ドラッグで元のレーンにも残して複製
        </div>
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
      onDoubleClick={handleDoubleClick}
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
                  searchTag={searchTag}
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
                searchTag={searchTag}
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