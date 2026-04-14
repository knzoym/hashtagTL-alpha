import React, { useState, useEffect, useMemo } from "react";
import { useAppStore } from '../store/useAppStore';
import { getTicks, dateToYearDecimal } from "../utils/timelineUtils";
import { TOP_MARGIN, calculateLayouts, CARD_CONFIG, isEventInTimeline } from "../utils/laneUtils";
import TimelineTicks from "../components/TimelineTicks";
import { LaneBackground, LaneCenterLines, LaneTitles } from "../components/TimelineLanes";
import EventModal from "../components/EventModal";
import TimelineStage from "../components/TimelineStage";
import InfoPanel from "../components/InfoPanel";
import { usePanZoom } from "../hooks/usePanZoom";
import { useDragAndDrop } from "../hooks/useDragAndDrop";

const VIRTUAL_HEIGHT = 5000;

export default function TimelineTab() {
  const { currentFileId, events, files, cardSize, focusedLaneId, setFocusedLaneId, updateLane, deleteLane } = useAppStore();
  const currentFile = files.find(f => f.id === currentFileId);
  const timelines = currentFile?.timelines || [];
  const displayEvents = currentFileId ? events.filter(e => e.fileId === currentFileId) : events;

  const [hoveredEventId, setHoveredEventId] = useState(null);
  const [highlightedTag, setHighlightedTag] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [containerSize, setContainerSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [editingLaneConfig, setEditingLaneConfig] = useState(null); 
  const [previewCondition, setPreviewCondition] = useState(null);
  const [verticalAnchorY, setVerticalAnchorY] = useState(0);

  const handleFocusClick = (laneId) => {
    setFocusedLaneId(laneId);
    if (!laneId) setHighlightedTag(null);
  };

  const handleOpenSettings = (timeline) => {
    setFocusedLaneId(null); 
    setEditingLaneConfig(timeline);
    setPreviewCondition(timeline.condition);
  };

  useEffect(() => {
    const handleResize = () => setContainerSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const visibleEvents = useMemo(() => {
    if (!focusedLaneId) return displayEvents;
    const tl = timelines.find(t => t.id === focusedLaneId);
    return tl ? displayEvents.filter(e => isEventInTimeline(e, tl)) : displayEvents;
  }, [displayEvents, focusedLaneId, timelines]);

  const {
    viewState, setViewState, containerRef, stageXRef, stageEventsXRef, stageYRef, bgRef,
    handleMouseDown, handleMouseMove, handleMouseUp,
  } = usePanZoom({ 
    minLaneHeight: (CARD_CONFIG[cardSize]?.height || 75) * 3, 
    focusedLaneId, 
    containerHeight: containerSize.height,
    verticalAnchorY 
  });

  const activePanY = focusedLaneId ? viewState.focusPanY : viewState.panY;
  const verticalScale = focusedLaneId ? (viewState.focusLaneHeight / VIRTUAL_HEIGHT) : 1;
  const yearToX = (y) => (y - viewState.centerX) * viewState.zoom + containerSize.width / 2;

  useEffect(() => {
    if (focusedLaneId && visibleEvents.length > 0) {
      const years = visibleEvents.map(e => dateToYearDecimal(e.date));
      const minYear = Math.min(...years);
      const maxYear = Math.max(...years);
      const span = Math.max(maxYear - minYear, 2); 
      const center = (minYear + maxYear) / 2;
      const newZoom = containerSize.width / (span * 1.4); 

      setViewState({
        centerX: center,
        zoom: newZoom,
        focusPanY: containerSize.height * 0.1, 
        focusLaneHeight: containerSize.height * 0.8 
      });
    }
  }, [focusedLaneId]); 

  const { layoutMap, laneChips, laneRanges, laneRowMap } = useMemo(() => {
    const baseLaneHeight = focusedLaneId ? VIRTUAL_HEIGHT : viewState.laneHeight;
    const yearToXFunc = (y) => (y - viewState.centerX) * viewState.zoom + containerSize.width / 2;
    return calculateLayouts(visibleEvents, timelines, cardSize, yearToXFunc, baseLaneHeight, focusedLaneId, containerSize.height);
  }, [visibleEvents, timelines, cardSize, viewState.centerX, viewState.zoom, containerSize.width, viewState.laneHeight, focusedLaneId, containerSize.height]);

  useEffect(() => {
    if (!focusedLaneId || visibleEvents.length === 0) return;
    
    const tops = visibleEvents.map(e => {
      const layout = layoutMap[`${e.id}-${focusedLaneId}`];
      return layout ? layout.top : null;
    }).filter(t => t !== null);
    
    if (tops.length > 0) {
      const minTop = Math.min(...tops);
      const maxTop = Math.max(...tops);
      setVerticalAnchorY((minTop + maxTop) / 2);
    }
  }, [focusedLaneId, visibleEvents, layoutMap]);

  const { draggingData, dragPos, dropTarget, handleDragStart, handleDragMove, handleDragEnd } = useDragAndDrop(containerRef, viewState, timelines, laneRowMap, laneRanges);

  // ★ 背景ダブルクリックでイベント新規作成
  const handleDoubleClick = (e) => {
    if (draggingData) return;
    const rect = containerRef.current.getBoundingClientRect();
    const cursorX = e.clientX - rect.left;
    // クリックしたX座標から年を逆算
    const year = Math.floor(viewState.centerX + (cursorX - rect.width / 2) / viewState.zoom);
    setEditingEvent({ title: "", date: `${year}-01-01`, tags: [] }); // 新規イベントとしてモーダルを開く
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={(e) => { if (!draggingData) handleMouseDown(e, !!draggingData?.eventId); }}
      onMouseMove={(e) => { if (draggingData) handleDragMove(e); else handleMouseMove(e); }}
      onMouseUp={(e) => { if (draggingData) handleDragEnd(); else handleMouseUp(e); }}
      onMouseLeave={(e) => { if (draggingData) handleDragEnd(); else handleMouseUp(e); }}
      onDoubleClick={handleDoubleClick} // ★ イベントを紐付け
      style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", backgroundColor: "#d9d9d9", cursor: draggingData ? "grabbing" : "grab" }}
    >
      <style>{`.is-zooming *, .is-panning * { transition: none !important; }`}</style>
      <div ref={bgRef} style={{ width: "100%", height: "100%", position: "absolute", zIndex: 1, transform: `translate3d(0, ${focusedLaneId ? 0 : viewState.panY}px, 0)` }}>
        <LaneBackground timelines={timelines} laneHeight={viewState.laneHeight} focusedLaneId={focusedLaneId} containerHeight={containerSize.height} laneRowMap={laneRowMap} dropTarget={dropTarget} laneRanges={laneRanges} yearToX={yearToX} />
      </div>
      <div ref={stageXRef} style={{ width: "100%", height: "100%", position: "absolute", zIndex: 2 }}>
        <TimelineTicks ticks={getTicks(viewState, containerSize.width + 4000)} yearToX={yearToX} />
      </div>
      <div ref={stageYRef} style={{ width: "100%", height: "100%", position: "absolute", zIndex: 3, transform: `translate3d(0, ${activePanY}px, 0)` }}>
        <div ref={stageEventsXRef} style={{ width: "100%", height: "100%", position: "absolute", zIndex: 10 }}>
          <LaneCenterLines timelines={timelines} laneHeight={viewState.laneHeight} focusedLaneId={focusedLaneId} laneRanges={laneRanges} yearToX={yearToX} laneRowMap={laneRowMap} />
          <TimelineStage 
            events={displayEvents} timelines={timelines} layoutMap={layoutMap} laneChips={laneChips} yearToX={yearToX} 
            focusedLaneId={focusedLaneId} highlightedTag={highlightedTag} setEditingEvent={setEditingEvent}
            hoveredEventId={hoveredEventId} setHoveredEventId={setHoveredEventId}
            draggingData={draggingData} handleDragStart={handleDragStart} verticalScale={verticalScale}
            setHighlightedTag={setHighlightedTag} previewCondition={previewCondition} 
          />
          <LaneTitles timelines={timelines} laneHeight={viewState.laneHeight} focusedLaneId={focusedLaneId} laneRanges={laneRanges} yearToX={yearToX} laneRowMap={laneRowMap} onFocusClick={handleFocusClick} onEditClick={handleOpenSettings} editingLaneConfig={editingLaneConfig} onChangeEdit={(condition) => setPreviewCondition(condition)} onSaveEdit={(laneId, updates) => { updateLane(laneId, updates); setEditingLaneConfig(null); setPreviewCondition(null); }} onCancelEdit={() => { setEditingLaneConfig(null); setPreviewCondition(null); }} onDeleteLane={(laneId) => { deleteLane(laneId); setEditingLaneConfig(null); setPreviewCondition(null); }} />
        </div>
      </div>
      {focusedLaneId && (
        <InfoPanel timeline={timelines.find(t => t.id === focusedLaneId)} visibleEvents={visibleEvents} highlightedTag={highlightedTag} setHighlightedTag={setHighlightedTag} onClose={() => handleFocusClick(null)} />
      )}
      {editingEvent && <EventModal event={editingEvent} onClose={() => setEditingEvent(null)} />}
      {draggingData && (
        <div style={{ position: 'fixed', left: dragPos.x - draggingData.offsetX, top: dragPos.y - draggingData.offsetY, width: draggingData.actualConfig.width, height: draggingData.actualConfig.height, pointerEvents: 'none', zIndex: 9999, opacity: 0.9, transform: 'scale(1.05)', transition: 'transform 0.1s', boxShadow: '0 10px 25px rgba(0,0,0,0.3)', borderRadius: '4px', border: '2px solid #1a365d', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', boxSizing: 'border-box' }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{draggingData.event.title || "(無題)"}</div>
          {dropTarget && (
            <div style={{ position: 'absolute', top: '-35px', left: '50%', transform: 'translateX(-50%)', backgroundColor: dropTarget.laneId === 'INBOX' ? '#7f8c8d' : '#2ecc71', color: '#fff', padding: '6px 12px', borderRadius: '16px', fontSize: '13px', fontWeight: 'bold', whiteSpace: 'nowrap', boxShadow: '0 4px 10px rgba(0,0,0,0.2)', border: '2px solid #fff' }}>{dropTarget.actionText}</div>
          )}
        </div>
      )}
    </div>
  );
}