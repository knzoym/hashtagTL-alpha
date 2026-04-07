import React, { useState, useEffect, useMemo } from "react";
import { useAppStore } from '../store/useAppStore';
import { getTicks } from "../utils/timelineUtils";
import { TOP_MARGIN, calculateLayouts, CARD_CONFIG, isEventInTimeline } from "../utils/laneUtils";
import TimelineTicks from "../components/TimelineTicks";
import { LaneBackground, LaneTitles } from "../components/TimelineLanes";
import EventModal from "../components/EventModal";
import RestoreEventModal from "../components/RestoreEventModal";
import LaneEditModal from "../components/LaneEditModal";
import TimelineStage from "../components/TimelineStage";
import { usePanZoom } from "../hooks/usePanZoom";
import { useDragAndDrop } from "../hooks/useDragAndDrop";

export default function TimelineTab() {
  const currentFileId = useAppStore(state => state.currentFileId);
  const events = useAppStore(state => state.events);
  const files = useAppStore(state => state.files);
  const cardSize = useAppStore(state => state.cardSize);
  const handleMoveEvent = useAppStore(state => state.handleMoveEvent);

  const currentFile = files.find(f => f.id === currentFileId);
  const timelines = currentFile?.timelines || [];
  const displayEvents = currentFileId ? events.filter(e => e.fileId === currentFileId) : events;

  const [hoveredEventId, setHoveredEventId] = useState(null);
  const [restoreLaneId, setRestoreLaneId] = useState(null);
  const [editingTimeline, setEditingTimeline] = useState(null);
  const [focusedLaneId, setFocusedLaneId] = useState(null);
  const [containerSize, setContainerSize] = useState({
    width: window.innerWidth || 1200,
    height: window.innerHeight || 800,
  });
  const [editingEvent, setEditingEvent] = useState(null);

  const activeConfig = CARD_CONFIG[cardSize] || CARD_CONFIG.medium;
  const minLaneHeight = (activeConfig.height + 6) * 3 + 20;

  const {
    viewState,
    containerRef,
    stageXRef,
    stageEventsXRef,
    stageYRef,
    isPanning,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  } = usePanZoom({ minLaneHeight });

  const { laneHeight } = viewState;
  const { draggingData, handleDragStart } = useDragAndDrop(containerRef, viewState, timelines, handleMoveEvent);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleDoubleClick = (e) => {
    if (e.target.closest(".event-card-element")) return;

    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickedYear = Math.floor(
      (clickX - containerSize.width / 2) / viewState.zoom + viewState.centerX,
    );

    const clickY = e.clientY - rect.top;
    const stageY = clickY - viewState.panY;
    let clickedTimeline = null;

    if (stageY > TOP_MARGIN) {
      const laneIndex = Math.floor((stageY - TOP_MARGIN) / laneHeight);
      if (laneIndex >= 0 && laneIndex < timelines.length) {
        clickedTimeline = timelines[laneIndex];
      }
    }

    setEditingEvent({
      fileId: currentFileId,
      title: '',
      date: `${clickedYear}-01-01`,
      description: clickedTimeline?.condition?.tags?.length ? `#${clickedTimeline.condition.tags[0].text} ` : '',
      tags: clickedTimeline?.condition?.tags ? [...clickedTimeline.condition.tags] : [],
      image: ''
    });
  };

  const yearToX = (year) =>
    (year - viewState.centerX) * viewState.zoom + containerSize.width / 2;

  const ticks = useMemo(() => {
    return getTicks(viewState, containerSize.width + 4000);
  }, [viewState, containerSize.width]);

  const visibleEvents = useMemo(() => {
    if (!focusedLaneId) return displayEvents;
    const focusedTimeline = timelines.find(tl => tl.id === focusedLaneId);
    if (!focusedTimeline) return displayEvents;
    return displayEvents.filter(e => isEventInTimeline(e, focusedTimeline));
  }, [displayEvents, focusedLaneId, timelines]);

  const currentLaneHeight = Number(viewState.laneHeight) || 0;
  const safeLaneHeight = Math.max(currentLaneHeight, minLaneHeight);
  const effectiveLaneHeight = focusedLaneId ? containerSize.height : safeLaneHeight;

  const { layoutMap, laneChips } = calculateLayouts(
    visibleEvents,
    timelines,
    cardSize,
    yearToX,
    effectiveLaneHeight
  );

  return (
    <div
      ref={containerRef}
      onMouseDown={(e) => {
        setHoveredEventId(null);
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
      onDragOver={(e) => e.preventDefault()}
      onDoubleClick={handleDoubleClick}
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#e6e6e6",
        position: "relative",
        overflow: "hidden",
        cursor: isPanning.current ? "grabbing" : "grab",
      }}
    >
      <div ref={stageXRef} style={{ width: "100%", height: "100%", willChange: "transform", position: "absolute", top: 0, left: 0 }}>
        <TimelineTicks ticks={ticks} yearToX={yearToX} />
      </div>

      <div ref={stageYRef} style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0, willChange: "transform", transform: `translate3d(0, ${viewState.panY}px, 0)` }}>
        <LaneBackground 
          timelines={timelines} 
          laneHeight={effectiveLaneHeight} 
          focusedLaneId={focusedLaneId} 
          containerHeight={containerSize.height} 
        />
        <div style={{ position: "absolute", top: TOP_MARGIN - 1, left: 0, width: "100%", borderBottom: "1px solid #ccc", pointerEvents: "none" }} />

        <div ref={stageEventsXRef} style={{ width: "100%", height: "100%", willChange: "transform", position: "absolute", top: 0, left: 0 }}>
          <TimelineStage
            events={displayEvents}
            timelines={timelines}
            layoutMap={layoutMap}
            laneChips={laneChips}
            yearToX={yearToX}
            draggingData={draggingData}
            hoveredEventId={hoveredEventId}
            setHoveredEventId={setHoveredEventId}
            handleDragStart={handleDragStart}
            setEditingEvent={setEditingEvent}
          />
        </div>

        <LaneTitles 
          timelines={timelines} 
          laneHeight={effectiveLaneHeight} 
          onRestoreClick={setRestoreLaneId} 
          onTitleClick={setEditingTimeline}
          focusedLaneId={focusedLaneId}
          containerHeight={containerSize.height}
          onFocusClick={setFocusedLaneId}
        />
      </div>

      <LaneEditModal 
        editingTimeline={editingTimeline} 
        setEditingTimeline={setEditingTimeline} 
      />

      {editingEvent && (
        <EventModal
          event={editingEvent}
          isNew={!events.some((e) => e.id === editingEvent.id)}
          onClose={() => setEditingEvent(null)}
        />
      )}
      
      <RestoreEventModal
        restoreLaneId={restoreLaneId}
        setRestoreLaneId={setRestoreLaneId}
      />
    </div>
  );
}