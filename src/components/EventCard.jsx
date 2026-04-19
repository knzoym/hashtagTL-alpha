import React, { memo, useState } from "react";
import { API_BASE_URL } from "../config";
import { useAppStore } from "../store/useAppStore";

const EventCard = memo(
  ({
    event, x, top, laneCenterY, timelineColor, actualConfig,
    isDragging, isHovered, isPinned, isSearchHighlighted, isDimmed, showConnector,
    onDragStart, onEdit, onMouseEnter, onMouseLeave,
  }) => {
    const [mouseDownPos, setMouseDownPos] = useState(null);
    
    // ★ 検索状態をストアから取得
    const searchTags = useAppStore(state => state.searchTags);
    const setSearchTags = useAppStore(state => state.setSearchTags);
    const searchLogic = useAppStore(state => state.searchLogic);

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

    // ★ タグクリック時に検索条件へ追加する処理
    const handleTagClick = (e, tagName) => {
      e.stopPropagation(); // カード編集モーダルが開くのを防ぐ
      const cleanTag = tagName.replace(/^#|^\[|\]$/g, '');
      if (cleanTag && !searchTags.find(t => t.text === cleanTag)) {
        setSearchTags([...searchTags, { text: cleanTag, logic: searchLogic || 'OR' }]);
      }
    };

    // ★ 説明文内のタグをリンク風に装飾する関数
    const renderDescription = (text) => {
      if (!text) return null;
      // [タグ] または #タグ でテキストを分割
      const parts = text.split(/(\[.*?\]|#[^\s#\[\]]+)/g);
      
      return parts.map((part, i) => {
        if (part.startsWith('[') && part.endsWith(']')) {
          const tagName = part.slice(1, -1);
          return (
            <span 
              key={i} 
              onMouseDown={(e) => e.stopPropagation()} // ドラッグ開始を防ぐ
              onClick={(e) => handleTagClick(e, tagName)}
              style={{ color: '#3182ce', fontWeight: 'bold', cursor: 'pointer', pointerEvents: 'auto', borderBottom: '1px solid #3182ce' }}
              title={`「${tagName}」で検索`}
            >
              {tagName}
            </span>
          );
        }
        if (part.startsWith('#')) {
          const tagName = part.replace('#', '');
          return (
            <span 
              key={i} 
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => handleTagClick(e, tagName)}
              style={{ color: '#3182ce', cursor: 'pointer', pointerEvents: 'auto' }}
              title={`「${tagName}」で検索`}
            >
              {part}
            </span>
          );
        }
        // 通常のテキスト
        return <span key={i}>{part}</span>;
      });
    };

    return (
      <div
        onMouseDown={(e) => {
          setMouseDownPos({ x: e.clientX, y: e.clientY });
          onDragStart(e);
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (mouseDownPos) {
            const dx = Math.abs(e.clientX - mouseDownPos.x);
            const dy = Math.abs(e.clientY - mouseDownPos.y);
            if (dx > 3 || dy > 3) return;
          }
          onEdit();
        }}
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
          opacity: isDragging ? 0.3 : (isDimmed ? 0.15 : 1),
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
          
          {/* pointerEvents: none を親に設定しつつ、子(タグ)の auto でクリックを受け付ける */}
          <div style={{ padding: dims.padding, pointerEvents: "none", display: "flex", flexDirection: "column", height: "100%", boxSizing: "border-box" }}>
            
            <div style={{ fontWeight: "bold", fontSize: dims.fontSize, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flexShrink: 0 }}>
              {isPinned && <span style={{ marginRight: "2px" }}>📌</span>}
              {event.title || "(無題)"}
            </div>

            {/* カードの高さに余裕がある場合、説明文（とタグリンク）を表示 */}
            {event.description && dims.height > 40 && (
              <div style={{ 
                fontSize: `max(9px, calc(${dims.fontSize} - 2px))`, 
                color: '#666', 
                marginTop: '4px',
                lineHeight: '1.4',
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: dims.height > 100 ? 4 : 2, // サイズによって表示行数を調整
                WebkitBoxOrient: 'vertical',
                pointerEvents: 'none'
              }}>
                {renderDescription(event.description)}
              </div>
            )}

          </div>
        </div>
      </div>
    );
  }
);

export default EventCard;