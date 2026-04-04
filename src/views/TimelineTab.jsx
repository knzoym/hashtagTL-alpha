import React, { useState, useEffect, useMemo } from 'react';
import { dateToYearDecimal, getTicks } from '../utils/timelineUtils';
import { TOP_MARGIN, calculateLayouts, CARD_CONFIG } from '../utils/laneUtils';
import EventCard from '../components/EventCard';
import TimelineTicks from '../components/TimelineTicks';
import { LaneBackground, LaneTitles } from '../components/TimelineLanes';
import EventModal from '../components/EventModal';
import { usePanZoom } from '../hooks/usePanZoom';
import { useDragAndDrop } from '../hooks/useDragAndDrop';

export default function TimelineTab({ events = [], activeTags = [], searchTag = '', cardSize = 'medium', onSaveEvent, onDeleteEvent, onRemoveLane }) {
  const [isAltPressed, setIsAltPressed] = useState(false);
  const [hoveredEventId, setHoveredEventId] = useState(null);
  
  const activeConfig = CARD_CONFIG[cardSize] || CARD_CONFIG.medium;
  const minLaneHeight = activeConfig.height + 36; 

  const { 
    viewState, containerRef, stageXRef, stageEventsXRef, stageYRef, isPanning, 
    handleMouseDown, handleMouseMove, handleMouseUp 
  } = usePanZoom({ minLaneHeight });

  const { laneHeight } = viewState;

  useEffect(() => {
    const handleKeyChange = (e) => setIsAltPressed(e.altKey);
    window.addEventListener('keydown', handleKeyChange);
    window.addEventListener('keyup', handleKeyChange);
    return () => {
      window.removeEventListener('keydown', handleKeyChange);
      window.removeEventListener('keyup', handleKeyChange);
    };
  }, []);

  const handleDoubleClick = (e) => {
    if (e.target.closest('.event-card-element')) return; 

    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickedYear = Math.floor((clickX - containerSize.width / 2) / viewState.zoom + viewState.centerX);
    
    const clickY = e.clientY - rect.top;
    const stageY = clickY - viewState.panY;
    let clickedTag = null;
    if (stageY > TOP_MARGIN) {
      const laneIndex = Math.floor((stageY - TOP_MARGIN) / laneHeight);
      if (laneIndex >= 0 && laneIndex < activeTags.length) {
        clickedTag = activeTags[laneIndex];
      }
    }

    setEditingEvent({
      title: '',
      date: `${clickedYear}-01-01`,
      description: clickedTag ? `#${clickedTag} ` : '',
      tags: clickedTag ? [clickedTag] : [],
      image: ''
    });
  };

  const { draggingData, handleDragStart, handleDrop } = useDragAndDrop(containerRef, events, activeTags, onSaveEvent, viewState.panY, laneHeight);

  const [containerSize, setContainerSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [editingEvent, setEditingEvent] = useState(null);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setContainerSize({ width: containerRef.current.offsetWidth, height: containerRef.current.offsetHeight });
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const yearToX = (year) => (year - viewState.centerX) * viewState.zoom + containerSize.width / 2;

  const ticks = useMemo(() => {
    return getTicks(viewState, containerSize.width + 4000);
  }, [viewState, containerSize.width]);

  const handleDragOver = (e) => {
    e.preventDefault();
    if (isAltPressed !== e.altKey) setIsAltPressed(e.altKey);
  };

  const DragHintOverlay = () => {
    if (!draggingData.eventId) return null;
    return (
      <div style={{ position: 'absolute', bottom: '20px', right: '25px', background: 'rgba(0, 0, 0, 0.85)', color: '#fff', padding: '16px 20px', borderRadius: '12px', boxShadow: '0 6px 16px rgba(0,0,0,0.3)', zIndex: 2500, pointerEvents: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontFamily: 'sans-serif', fontSize: '14px', fontWeight: 'bold' }}>
        <div style={{ opacity: isAltPressed ? 0.4 : 1, transition: 'opacity 0.2s' }}>ドラッグでレーンを移動(タグの付け替え)</div>
        <div style={{ opacity: isAltPressed ? 1 : 0.4, transition: 'opacity 0.2s', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ background: isAltPressed ? '#ff4444' : '#555', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>Alt</span>
          + ドラッグで元のレーンにも残して複製
        </div>
      </div>
    );
  };

  const { layoutMap, laneChips } = calculateLayouts(events, activeTags, cardSize, yearToX, laneHeight);

  return (
    <div 
      ref={containerRef}
      onMouseDown={(e) => {
        setHoveredEventId(null); // パン開始時に残像を消す
        handleMouseDown(e, !!draggingData.eventId);
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={(e) => {
        setHoveredEventId(null);
        handleMouseDown(e, !!draggingData.eventId);
      }}
      onTouchMove={handleMouseMove}
      onTouchEnd={handleMouseUp}
      onTouchCancel={handleMouseUp}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDoubleClick={handleDoubleClick}
      style={{ width: '100%', height: '100%', backgroundColor: '#e6e6e6', position: 'relative', overflow: 'hidden', cursor: isPanning.current ? 'grabbing' : 'grab' }}
    >
      <div ref={stageXRef} style={{ width: '100%', height: '100%', willChange: 'transform', position: 'absolute', top: 0, left: 0 }}>
        <TimelineTicks ticks={ticks} yearToX={yearToX} />
      </div>

      <div ref={stageYRef} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, willChange: 'transform', transform: `translate3d(0, ${viewState.panY}px, 0)` }}>
        <LaneBackground activeTags={activeTags} laneHeight={laneHeight} />
        <div style={{ position: 'absolute', top: TOP_MARGIN - 1, left: 0, width: '100%', borderBottom: '1px solid #ccc', pointerEvents: 'none' }} />
        
        <div ref={stageEventsXRef} style={{ width: '100%', height: '100%', willChange: 'transform', position: 'absolute', top: 0, left: 0 }}>
          {events.map(event => {
            const lanes = activeTags.filter(tag => event.tags?.includes(tag));
            const xPos = yearToX(dateToYearDecimal(event.date));
            const targetLanes = lanes.length > 0 ? lanes : ['INBOX'];

            return targetLanes.map(tag => {
              const layout = layoutMap[`${event.id}-${tag}`];
              if (!layout || layout.isOverflow) return null;

              return (
                <EventCard 
                  key={`${event.id}-${tag}`}
                  event={event}
                  x={xPos}
                  top={layout.top}
                  searchTag={searchTag}
                  actualConfig={layout.actualConfig}
                  isDragging={draggingData.eventId === event.id}
                  isHovered={hoveredEventId === event.id}
                  onDragStart={() => {
                    setHoveredEventId(null); // ドラッグ開始時に残像を消す
                    handleDragStart(event.id, tag === 'INBOX' ? null : tag);
                  }}
                  onEdit={() => setEditingEvent(event)}
                  onMouseEnter={() => setHoveredEventId(event.id)}
                  onMouseLeave={() => setHoveredEventId(null)}
                />
              );
            });
          })}

          {/* INBOXを処理から外し、activeTagsのみ描画 */}
          {activeTags.map(tag => {
            if (!laneChips[tag]) return null;
            return laneChips[tag].map((chip, index) => (
              <div 
                key={`chip-${tag}-${index}`}
                style={{
                  position: 'absolute',
                  transform: `translate3d(${chip.x}px, ${chip.top}px, 0) translate(-50%, -50%)`,
                  padding: '4px 10px',
                  background: '#1a365d',
                  color: '#fff', 
                  borderRadius: '6px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: 'bold',
                  zIndex: 30,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  pointerEvents: 'none'
                }}
              >
                {chip.count}件
              </div>
            ));
          })}
        </div>

        <LaneTitles activeTags={activeTags} laneHeight={laneHeight} onRemoveLane={onRemoveLane} />
      </div>

      <DragHintOverlay />

      {editingEvent && (
        <EventModal
          event={editingEvent}
          isNew={!events.some(e => e.id === editingEvent.id)}
          onSave={(d) => { onSaveEvent(d); setEditingEvent(null); }}
          onDelete={(id) => { onDeleteEvent(id); setEditingEvent(null); }}
          onCancel={() => setEditingEvent(null)}
          onClose={() => setEditingEvent(null)} 
        />
      )}
    </div>
  );
}