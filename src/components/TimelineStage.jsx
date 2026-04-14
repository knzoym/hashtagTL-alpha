import React, { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import EventCard from './EventCard';
import { dateToYearDecimal } from '../utils/timelineUtils';
import { evaluateSearchMatch } from '../utils/searchUtils';

const getTagColor = (tag) => {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  return `hsl(${Math.abs(hash) % 360}, 60%, 50%)`;
};

export default function TimelineStage({
  events, timelines, layoutMap, laneChips, yearToX, draggingData,
  hoveredEventId, setHoveredEventId, handleDragStart, setEditingEvent, 
  focusedLaneId, highlightedTag, setHighlightedTag, previewCondition,
  verticalScale = 1
}) {
  const searchTags = useAppStore(state => state.searchTags);
  const searchLogic = useAppStore(state => state.searchLogic);
  const searchInput = useAppStore(state => state.searchInput);

  const isPreviewing = !!previewCondition;

  const tagLines = useMemo(() => {
    if (!focusedLaneId) return null;

    const tagPoints = {};
    events.forEach(event => {
      const layout = layoutMap[`${event.id}-${focusedLaneId}`];
      if (!layout || layout.isOverflow) return;

      const x = yearToX(dateToYearDecimal(event.date));
      const y = layout.top * verticalScale;

      (event.tags || []).forEach(tag => {
        if (!tagPoints[tag]) tagPoints[tag] = [];
        tagPoints[tag].push({ x, y });
      });
    });

    const tagsToDraw = Object.keys(tagPoints).filter(t => tagPoints[t].length >= 2);
    tagsToDraw.sort((a, b) => {
      const aMatch = highlightedTag && a.toLowerCase().includes(highlightedTag.toLowerCase());
      const bMatch = highlightedTag && b.toLowerCase().includes(highlightedTag.toLowerCase());
      if (aMatch && !bMatch) return 1;
      if (!aMatch && bMatch) return -1;
      return 0;
    });

    return (
      <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none', zIndex: 5 }}>
        {tagsToDraw.map((tag) => {
          const points = tagPoints[tag];
          points.sort((a, b) => a.x - b.x);

          const d = points.reduce((acc, point, i, arr) => {
            if (i === 0) return `M ${point.x} ${point.y}`;
            const prev = arr[i - 1];
            const cpX = (prev.x + point.x) / 2;
            return `${acc} C ${cpX} ${prev.y}, ${cpX} ${point.y}, ${point.x} ${point.y}`;
          }, "");

          const isHighlighted = highlightedTag && tag.toLowerCase().includes(highlightedTag.toLowerCase());
          const isDimmed = highlightedTag && !isHighlighted;
          
          return (
            <path 
              key={tag} d={d} 
              stroke={isHighlighted ? '#ff4444' : getTagColor(tag)} 
              strokeWidth={isHighlighted ? "4" : "2"} 
              fill="none" 
              opacity={isHighlighted ? "1" : (isDimmed ? "0.1" : "0.5")} 
              style={{ transition: 'all 0.3s', pointerEvents: 'stroke', cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation();
                if (setHighlightedTag) setHighlightedTag(isHighlighted ? null : tag);
              }}
            />
          );
        })}
      </svg>
    );
  }, [focusedLaneId, events, layoutMap, yearToX, highlightedTag, setHighlightedTag, verticalScale]);

  return (
    <>
      {tagLines}

      {events.map((event) => {
        let targetLanes = Object.keys(layoutMap)
          .filter((key) => key.startsWith(`${event.id}-`))
          .map((key) => key.replace(`${event.id}-`, ""));

        if (focusedLaneId) {
          targetLanes = targetLanes.filter(id => id === focusedLaneId);
        }

        let isPreviewMatch = false;
        if (isPreviewing && previewCondition.tags.length > 0) {
          const evTags = event.tags || [];
          const checkTag = (searchStr) => evTags.some(t => t.toLowerCase().includes(searchStr.toLowerCase()));
          if (previewCondition.logic === 'AND') {
            isPreviewMatch = previewCondition.tags.every(tag => checkTag(typeof tag === 'string' ? tag : tag.text));
          } else {
            isPreviewMatch = previewCondition.tags.some(tag => checkTag(typeof tag === 'string' ? tag : tag.text));
          }
        }

        const { isSearchHighlighted, isDimmed: isSearchDimmed } = evaluateSearchMatch(event, searchTags, searchLogic, searchInput, timelines);
        const hasHighlightedTag = highlightedTag ? (event.tags || []).some(t => t.toLowerCase().includes(highlightedTag.toLowerCase())) : false;
        const isTagDimmed = highlightedTag ? !hasHighlightedTag : false;

        const finalIsHighlighted = isPreviewing ? isPreviewMatch : (isSearchHighlighted || hasHighlightedTag);
        const finalIsDimmed = isPreviewing ? !isPreviewMatch : (isSearchDimmed || isTagDimmed);

        return targetLanes.map((laneId) => {
          const layout = layoutMap[`${event.id}-${laneId}`];
          if (!layout || layout.isOverflow) return null;

          const timeline = timelines.find(tl => tl.id === laneId);
          const isPinned = laneId !== 'INBOX' && timeline?.includedEventIds.includes(event.id);

          const actualTop = focusedLaneId ? layout.top * verticalScale : layout.top;
          const actualLaneCenterY = (focusedLaneId && layout.laneCenterY !== undefined) 
            ? layout.laneCenterY * verticalScale 
            : layout.laneCenterY;
            
          return (
            <EventCard
              key={`${event.id}-${laneId}`}
              event={event}
              x={yearToX(dateToYearDecimal(event.date))}
              top={actualTop}
              laneCenterY={actualLaneCenterY}
              timelineColor={timeline?.color || '#666'}
              actualConfig={layout.actualConfig}
              isDragging={draggingData?.eventId === event.id}
              isHovered={hoveredEventId === event.id}
              isPinned={isPinned}
              isSearchHighlighted={finalIsHighlighted}
              isDimmed={finalIsDimmed}
              showConnector={!focusedLaneId} // ★ 詳細モードの時はコネクタを表示しない
              onDragStart={(e) => {
                setHoveredEventId(null);
                handleDragStart(e, event, laneId === "INBOX" ? null : laneId);
              }}
              onEdit={() => setEditingEvent(event)}
              onMouseEnter={() => setHoveredEventId(event.id)}
              onMouseLeave={() => setHoveredEventId(null)}
            />
          );
        });
      })}

      {!focusedLaneId && timelines.map((tl) => {
        const laneId = tl.id;
        if (!laneChips || !laneChips[laneId]) return null;
        
        return laneChips[laneId].map((chip, index) => {
          let isChipDimmed = false;

          if (isPreviewing && previewCondition.tags.length > 0) {
            const hasMatch = chip.eventIds.some(eId => {
              const ev = events.find(e => e.id === eId);
              if (!ev) return false;
              const evTags = ev.tags || [];
              const checkTag = (searchStr) => evTags.some(t => t.toLowerCase().includes(searchStr.toLowerCase()));
              return previewCondition.logic === 'AND' 
                ? previewCondition.tags.every(tag => checkTag(typeof tag === 'string' ? tag : tag.text)) 
                : previewCondition.tags.some(tag => checkTag(typeof tag === 'string' ? tag : tag.text));
            });
            isChipDimmed = !hasMatch;
          } else {
            const isSearching = searchTags.length > 0 || searchInput.trim() !== '';
            if (isSearching || !!highlightedTag) {
              const hasMatch = chip.eventIds.some(eId => {
                const ev = events.find(e => e.id === eId);
                if (!ev) return false;
                const { isSearchHighlighted } = evaluateSearchMatch(ev, searchTags, searchLogic, searchInput, timelines);
                const hasTag = highlightedTag ? (ev.tags || []).some(t => t.toLowerCase().includes(highlightedTag.toLowerCase())) : false;
                return isSearchHighlighted || hasTag;
              });
              isChipDimmed = !hasMatch;
            }
          }

          return (
            <div
              key={`chip-${laneId}-${index}`}
              style={{
                position: "absolute", left: `${chip.x}px`, top: `${chip.top}px`, transform: `translate(-50%, -50%)`,
                padding: "4px 10px", background: isChipDimmed ? "#ccc" : (isPreviewing ? "#ff4444" : "#1a365d"),
                color: isChipDimmed ? "#777" : "#fff", borderRadius: "6px", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: "11px", fontWeight: "bold", zIndex: isChipDimmed ? 10 : 30,
                boxShadow: isChipDimmed ? "none" : "0 2px 4px rgba(0,0,0,0.2)", opacity: isChipDimmed ? 0.4 : 1,
                pointerEvents: "none", transition: "background 0.3s, opacity 0.3s"
              }}
            >
              {chip.count}件
            </div>
          );
        });
      })}
    </>
  );
}