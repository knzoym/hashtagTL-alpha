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
  focusedLaneId, highlightedTag
}) {
  const searchTags = useAppStore(state => state.searchTags);
  const searchLogic = useAppStore(state => state.searchLogic);
  const searchInput = useAppStore(state => state.searchInput);

  // タグ線のSVG描画
  const tagLines = useMemo(() => {
    if (!focusedLaneId) return null;

    const tagPoints = {};
    events.forEach(event => {
      const layout = layoutMap[`${event.id}-${focusedLaneId}`];
      if (!layout || layout.isOverflow) return;

      const x = yearToX(dateToYearDecimal(event.date));
      const y = layout.top;

      (event.tags || []).forEach(tag => {
        if (!tagPoints[tag]) tagPoints[tag] = [];
        tagPoints[tag].push({ x, y });
      });
    });

    const tagsToDraw = Object.keys(tagPoints).filter(t => tagPoints[t].length >= 2);
    // ハイライトされたタグが最後に描画される（最前面に来る）ようソート
    tagsToDraw.sort((a, b) => {
      if (a === highlightedTag) return 1;
      if (b === highlightedTag) return -1;
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

          const isHighlighted = tag === highlightedTag;
          const isDimmed = highlightedTag && !isHighlighted;
          
          return (
            <path 
              key={tag} 
              d={d} 
              stroke={isHighlighted ? '#ff4444' : getTagColor(tag)} 
              strokeWidth={isHighlighted ? "4" : "2"} 
              fill="none" 
              opacity={isHighlighted ? "1" : (isDimmed ? "0.1" : "0.5")} 
              style={{ transition: 'all 0.3s' }}
            />
          );
        })}
      </svg>
    );
  }, [focusedLaneId, events, layoutMap, yearToX, highlightedTag]);

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

        const { isSearchHighlighted, isDimmed: isSearchDimmed } = evaluateSearchMatch(event, searchTags, searchLogic, searchInput);
        const hasHighlightedTag = highlightedTag ? (event.tags || []).includes(highlightedTag) : false;
        const isTagDimmed = highlightedTag ? !hasHighlightedTag : false;

        const finalIsHighlighted = isSearchHighlighted || hasHighlightedTag;
        const finalIsDimmed = isSearchDimmed || isTagDimmed;

        return targetLanes.map((laneId) => {
          const layout = layoutMap[`${event.id}-${laneId}`];
          if (!layout || layout.isOverflow) return null;

          const isPinned = laneId !== 'INBOX' && timelines.find(tl => tl.id === laneId)?.includedEventIds.includes(event.id);
          const timeline = timelines.find(tl => tl.id === laneId);

          return (
            <EventCard
              key={`${event.id}-${laneId}`}
              event={event}
              x={yearToX(dateToYearDecimal(event.date))}
              top={layout.top}
              laneCenterY={layout.laneCenterY}
              timelineColor={timeline?.color || '#666'}
              actualConfig={layout.actualConfig}
              isDragging={draggingData.eventId === event.id}
              isHovered={hoveredEventId === event.id}
              isPinned={isPinned}
              isSearchHighlighted={finalIsHighlighted}
              isDimmed={finalIsDimmed}
              onDragStart={() => {
                setHoveredEventId(null);
                handleDragStart(event.id, laneId === "INBOX" ? null : laneId);
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
        if (!laneChips[laneId]) return null;
        return laneChips[laneId].map((chip, index) => (
          <div
            key={`chip-${laneId}-${index}`}
            style={{
              position: "absolute",
              transform: `translate3d(${chip.x}px, ${chip.top}px, 0) translate(-50%, -50%)`,
              padding: "4px 10px",
              background: "#1a365d",
              color: "#fff",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "11px",
              fontWeight: "bold",
              zIndex: 30,
              boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
              pointerEvents: "none",
            }}
          >
            {chip.count}件
          </div>
        ));
      })}
    </>
  );
}