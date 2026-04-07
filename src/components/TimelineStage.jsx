import React from 'react';
import { useAppStore } from '../store/useAppStore';
import EventCard from './EventCard';
import { dateToYearDecimal } from '../utils/timelineUtils';
import { evaluateSearchMatch } from '../utils/searchUtils';

export default function TimelineStage({
  events,
  timelines,
  layoutMap,
  laneChips,
  yearToX,
  draggingData,
  hoveredEventId,
  setHoveredEventId,
  handleDragStart,
  setEditingEvent,
}) {
  const searchTags = useAppStore(state => state.searchTags);
  const searchLogic = useAppStore(state => state.searchLogic);
  const searchInput = useAppStore(state => state.searchInput);

  return (
    <>
      {events.map((event) => {
        const targetLanes = Object.keys(layoutMap)
          .filter((key) => key.startsWith(`${event.id}-`))
          .map((key) => key.replace(`${event.id}-`, ""));

        // イベントごとの検索マッチ状況をここで事前計算
        const { isSearchHighlighted, isDimmed } = evaluateSearchMatch(event, searchTags, searchLogic, searchInput);

        return targetLanes.map((laneId) => {
          const layout = layoutMap[`${event.id}-${laneId}`];
          if (!layout || layout.isOverflow) return null;

          const isPinned = laneId !== 'INBOX' && timelines.find(tl => tl.id === laneId)?.includedEventIds.includes(event.id);
          const timeline = timelines.find(tl => tl.id === laneId);
          const timelineColor = timeline ? (timeline.color || '#666') : null;

          return (
            <EventCard
              key={`${event.id}-${laneId}`}
              event={event}
              x={yearToX(dateToYearDecimal(event.date))}
              top={layout.top}
              laneCenterY={layout.laneCenterY}
              timelineColor={timelineColor}
              actualConfig={layout.actualConfig}
              isDragging={draggingData.eventId === event.id}
              isHovered={hoveredEventId === event.id}
              isPinned={isPinned}
              isSearchHighlighted={isSearchHighlighted}
              isDimmed={isDimmed}
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

      {timelines.map((tl) => {
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