import React, { memo } from 'react';

const API_BASE_URL = 'http://localhost:3001';

const EventCard = memo(({ event, x, top, highlightTag, isDragging, onDragStart, onEdit }) => {
  const isHighlighted = highlightTag && event.tags?.some(tag => tag.includes(highlightTag));
  const isDimmed = highlightTag && !isHighlighted;

  return (
    <div 
      draggable
      onDragStart={onDragStart}
      onDoubleClick={onEdit}
      onMouseDown={(e) => e.stopPropagation()}
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
      {event.image && <img src={`${API_BASE_URL}${event.image}`} style={{ width: '100%', height: '95px', objectFit: 'cover', pointerEvents: 'none' }} alt="" />}
      <div style={{ padding: '8px', pointerEvents: 'none' }}>
        <div style={{ fontWeight: 'bold', fontSize: '11px' }}>{event.title || '(無題)'}</div>
      </div>
    </div>
  );
});

export default EventCard;