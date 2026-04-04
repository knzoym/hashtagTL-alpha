import React, { memo } from 'react';
import { API_BASE_URL } from '../config';

const EventCard = memo(({ event, x, top, searchTag, actualConfig, isDragging, isHovered, onDragStart, onEdit, onMouseEnter, onMouseLeave }) => {
  const keyword = (searchTag || '').toLowerCase();
  
  const isSearchHighlighted = keyword && (
    (event.title?.toLowerCase().includes(keyword)) ||
    (event.description?.toLowerCase().includes(keyword)) ||
    (event.tags?.some(tag => tag.toLowerCase().includes(keyword)))
  );
  
  const isDimmed = keyword && !isSearchHighlighted;
  const dims = actualConfig || { width: 120, padding: '4px', fontSize: '10px', border: '1px', noImage: true };

  // 👇 ハイライトの色を紺色(#1a365d)に変更
  const borderColor = isSearchHighlighted ? '#ff4444' : (isHovered ? '#1a365d' : '#000');
  const borderWidth = (isSearchHighlighted || isHovered) ? '3px' : `${dims.border} solid`;
  const boxShadow = isHovered ? '0 2px 8px rgba(26, 54, 93, 0.4)' : 'none';

  return (
    <div 
      draggable
      onDragStart={onDragStart}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onEdit();
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        position: 'absolute',
        transform: `translate3d(${x}px, ${top}px, 0) translate(-50%, -50%)`,
        willChange: 'transform',
        width: `${dims.width}px`,
        backgroundColor: '#fff',
        border: `${borderWidth} ${borderColor}`,
        boxShadow: boxShadow,
        borderRadius: '4px',
        zIndex: (isSearchHighlighted || isHovered) ? 100 : (isDragging ? 1000 : 20),
        opacity: isDragging ? 0.5 : (isDimmed ? 0.15 : 1),
        transition: isDragging ? 'none' : 'opacity 0.2s, box-shadow 0.2s, border 0.2s',
        cursor: 'grab',
        overflow: 'hidden'
      }}
    >
      {!dims.noImage && event.image && (
        <img 
          src={`${API_BASE_URL}${event.image}`} 
          style={{ width: '100%', height: dims.imgHeight, objectFit: 'cover', pointerEvents: 'none' }} 
          alt="" 
        />
      )}
      <div style={{ padding: dims.padding, pointerEvents: 'none' }}>
        <div style={{ 
          fontWeight: 'bold', 
          fontSize: dims.fontSize, 
          lineHeight: '1.2',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {event.title || '(無題)'}
        </div>
      </div>
    </div>
  );
});

export default EventCard;