import React, { memo } from 'react';

const API_BASE_URL = 'http://localhost:3001';

const EventCard = memo(({ event, x, top, searchTag, isDragging, onDragStart, onEdit }) => {
  const keyword = (searchTag || '').toLowerCase();
  
  const isHighlighted = keyword && (
    (event.title?.toLowerCase().includes(keyword)) ||
    (event.description?.toLowerCase().includes(keyword)) ||
    (event.tags?.some(tag => tag.toLowerCase().includes(keyword)))
  );
  
  const isDimmed = keyword && !isHighlighted;

  return (
    <div 
      draggable
      onDragStart={onDragStart}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onEdit();
      }}
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        transform: `translate3d(${x}px, ${top}px, 0) translate(-50%, -50%)`,
        willChange: 'transform',
        width: '120px', // 170px から 120px に縮小
        backgroundColor: '#fff',
        border: isHighlighted ? '3px solid #ff4444' : '1px solid #000', // 枠線も少し細く調整
        borderRadius: '4px',
        zIndex: isHighlighted ? 100 : (isDragging ? 1000 : 20),
        opacity: isDragging ? 0.5 : (isDimmed ? 0.15 : 1),
        transition: isDragging ? 'none' : 'opacity 0.2s',
        cursor: 'grab',
        overflow: 'hidden'
      }}
    >
      {event.image && (
        <img 
          src={`${API_BASE_URL}${event.image}`} 
          style={{ width: '100%', height: '50px', objectFit: 'cover', pointerEvents: 'none' }} // 95px から 50px に縮小
          alt="" 
        />
      )}
      <div style={{ padding: '4px', pointerEvents: 'none' }}> {/* 余白を 8px から 4px に縮小 */}
        <div style={{ fontWeight: 'bold', fontSize: '10px', lineHeight: '1.2' }}> {/* 11px から 10px に縮小 */}
          {event.title || '(無題)'}
        </div>
      </div>
    </div>
  );
});

export default EventCard;