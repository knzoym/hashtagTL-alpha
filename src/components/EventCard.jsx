import React, { memo } from "react";
import { API_BASE_URL } from "../config";

const EventCard = memo(
  ({
    event, x, top, laneCenterY, timelineColor, actualConfig,
    isDragging, isHovered, isPinned, isSearchHighlighted, isDimmed, showConnector,
    onDragStart, onEdit, onMouseEnter, onMouseLeave,
  }) => {
    const dims = actualConfig || { width: 120, height: 75, padding: "4px", fontSize: "10px", border: "1px", noImage: true };

    const borderColor = isSearchHighlighted ? "#ff4444" : isHovered ? "#1a365d" : "#000";
    const borderWidth = isSearchHighlighted || isHovered ? "3px" : `${dims.border} solid`;
    const boxShadow = isHovered ? "0 2px 8px rgba(26, 54, 93, 0.4)" : "none";

    const cardHeight = dims.height;
    const isOffset = laneCenterY !== undefined && laneCenterY !== top;
    const offsetDistance = Math.abs(top - laneCenterY);
    const lineLength = Math.max(0, offsetDistance - cardHeight / 2);
    
    const baseZIndex = laneCenterY === undefined ? 30 : Math.max(10, 30 - Math.floor(offsetDistance / 10));
    const finalZIndex = isSearchHighlighted || isHovered ? 90 : (isDragging ? 95 : baseZIndex);

    return (
      <div
        // ★ draggable={true} などを削除し、マウスの押し込みで発火
        onMouseDown={onDragStart}
        onDoubleClick={(e) => { e.stopPropagation(); onEdit(); }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        style={{
          position: "absolute",
          left: `${x}px`,
          top: `${top}px`,
          transform: `translate(-50%, -50%)`,
          willChange: "left, top",
          width: `${dims.width}px`,
          height: `${cardHeight}px`,
          zIndex: finalZIndex,
          opacity: isDragging ? 0.3 : (isDimmed ? 0.15 : 1), // 元のカードは半透明の抜け殻になる
          transition: isDragging ? "none" : "top 0.5s ease, opacity 0.2s, box-shadow 0.2s, border 0.2s",
          cursor: isDragging ? "grabbing" : "grab",
        }}
      >
        {showConnector && isOffset && timelineColor && lineLength > 0 && (
          <div style={{
            position: 'absolute', left: '50%', width: '2px', backgroundColor: timelineColor, zIndex: 0, pointerEvents: 'none', height: `${lineLength}px`,
            ...(laneCenterY < top ? { top: 0, transform: 'translateX(-50%) translateY(-100%)' } : { top: '100%', transform: 'translateX(-50%)' })
          }} />
        )}

        <div style={{ position: "relative", zIndex: 1, width: "100%", height: "100%", backgroundColor: "#fff", border: `${borderWidth} ${borderColor}`, boxShadow: boxShadow, borderRadius: "4px", overflow: "hidden", transition: isDragging ? "none" : "box-shadow 0.2s, border 0.2s" }}>
          {!dims.noImage && event.image && (
            <img src={`${API_BASE_URL}${event.image}`} style={{ width: "100%", height: dims.imgHeight, objectFit: "cover", pointerEvents: "none" }} alt="" />
          )}
          <div style={{ padding: dims.padding, pointerEvents: "none" }}>
            <div style={{ fontWeight: "bold", fontSize: dims.fontSize, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {isPinned && <span style={{ marginRight: "2px" }}>📌</span>}
              {event.title || "(無題)"}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default EventCard;