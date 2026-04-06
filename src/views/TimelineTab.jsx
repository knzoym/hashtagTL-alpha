import React, { useState, useEffect, useMemo } from "react";
import { dateToYearDecimal, getTicks } from "../utils/timelineUtils";
import { TOP_MARGIN, calculateLayouts, CARD_CONFIG, isEventInTimeline } from "../utils/laneUtils";
import EventCard from "../components/EventCard";
import TimelineTicks from "../components/TimelineTicks";
import { LaneBackground, LaneTitles } from "../components/TimelineLanes";
import EventModal from "../components/EventModal";
import { usePanZoom } from "../hooks/usePanZoom";
import { useDragAndDrop } from "../hooks/useDragAndDrop";
import RestoreEventModal from "../components/RestoreEventModal";

export default function TimelineTab({ currentFileId, events = [], timelines = [], searchTags = [], searchLogic = 'OR', searchInput = '', cardSize = 'medium', onUpdateLane, onDeleteLane, onSaveEvent, onDeleteEvent, onMoveEvent, onRestoreEvent }) {
  // 1. 全ての useState を最初に宣言する
  const [hoveredEventId, setHoveredEventId] = useState(null);
  const [restoreLaneId, setRestoreLaneId] = useState(null);
  const [editingTimeline, setEditingTimeline] = useState(null);
  const [focusedLaneId, setFocusedLaneId] = useState(null); // 追加したステート
  const [containerSize, setContainerSize] = useState({
    width: window.innerWidth || 1200,
    height: window.innerHeight || 800,
  });
  const [editingEvent, setEditingEvent] = useState(null);

  // 2. 定数とカスタムフック
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

  const { draggingData, handleDragStart } = useDragAndDrop(containerRef, viewState, timelines, onMoveEvent);

  // 3. useEffect
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

  // 4. イベントハンドラ（containerSize等に依存）
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

  // 5. 算出値と calculateLayouts
  const yearToX = (year) =>
    (year - viewState.centerX) * viewState.zoom + containerSize.width / 2;

  const ticks = useMemo(() => {
    return getTicks(viewState, containerSize.width + 4000);
  }, [viewState, containerSize.width]);

  const visibleEvents = useMemo(() => {
    if (!focusedLaneId) return events;
    const focusedTimeline = timelines.find(tl => tl.id === focusedLaneId);
    if (!focusedTimeline) return events;
    return events.filter(e => isEventInTimeline(e, focusedTimeline));
  }, [events, focusedLaneId, timelines]);

  // ★修正: viewState.laneHeight が無効な値でもNaNにならないよう安全に計算
  const currentLaneHeight = Number(viewState.laneHeight) || 0;
  const safeLaneHeight = Math.max(currentLaneHeight, minLaneHeight);

  const effectiveLaneHeight = focusedLaneId 
    ? containerSize.height 
    : safeLaneHeight;

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
      <div
        ref={stageXRef}
        style={{
          width: "100%",
          height: "100%",
          willChange: "transform",
          position: "absolute",
          top: 0,
          left: 0,
        }}
      >
        <TimelineTicks ticks={ticks} yearToX={yearToX} />
      </div>

      <div
        ref={stageYRef}
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          top: 0,
          left: 0,
          willChange: "transform",
          transform: `translate3d(0, ${viewState.panY}px, 0)`,
        }}
      >
        <LaneBackground 
          timelines={timelines} 
          laneHeight={effectiveLaneHeight} 
          focusedLaneId={focusedLaneId} 
          containerHeight={containerSize.height} 
        />
        <div
          style={{
            position: "absolute",
            top: TOP_MARGIN - 1,
            left: 0,
            width: "100%",
            borderBottom: "1px solid #ccc",
            pointerEvents: "none",
          }}
        />

        <div
          ref={stageEventsXRef}
          style={{
            width: "100%",
            height: "100%",
            willChange: "transform",
            position: "absolute",
            top: 0,
            left: 0,
          }}
        >
          {events.map((event) => {
            const targetLanes = Object.keys(layoutMap)
              .filter((key) => key.startsWith(`${event.id}-`))
              .map((key) => key.replace(`${event.id}-`, ""));

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
                  searchTags={searchTags}
                  searchLogic={searchLogic}
                  searchInput={searchInput}
                  actualConfig={layout.actualConfig}
                  isDragging={draggingData.eventId === event.id}
                  isHovered={hoveredEventId === event.id}
                  isPinned={isPinned}
                  onDragStart={() => {
                    setHoveredEventId(null);
                    handleDragStart(
                      event.id,
                      laneId === "INBOX" ? null : laneId,
                    );
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
        </div>

        <LaneTitles 
          timelines={timelines} 
          laneHeight={effectiveLaneHeight} 
          onRestoreClick={(tlId) => setRestoreLaneId(tlId)} 
          onTitleClick={(tl) => setEditingTimeline(tl)}
          focusedLaneId={focusedLaneId}
          containerHeight={containerSize.height}
          onFocusClick={setFocusedLaneId}
        />
      </div>

      {/* 年表編集モーダル */}
      {editingTimeline && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px' }}>年表の設定</h3>
            
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>タイトル</label>
            <input 
              type="text" 
              value={editingTimeline.title}
              onChange={(e) => setEditingTimeline({...editingTimeline, title: e.target.value})}
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '20px', boxSizing: 'border-box' }}
            />

            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>条件 (タグ)</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
              {editingTimeline.condition.tags.map((tag, i) => (
                <span key={i} style={{ background: '#eee', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  {i > 0 && (
                    <button 
                      onClick={() => {
                        const newTags = [...editingTimeline.condition.tags];
                        newTags[i].logic = newTags[i].logic === 'OR' ? 'AND' : 'OR';
                        setEditingTimeline({...editingTimeline, condition: { tags: newTags }});
                      }}
                      style={{ border: 'none', background: '#ccc', fontSize: '9px', padding: '2px 4px', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      {tag.logic}
                    </button>
                  )}
                  {tag.text}
                </span>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
              <button 
                onClick={() => {
                  if(window.confirm("この年表を削除しますか？")) {
                    onDeleteLane(editingTimeline.id);
                    setEditingTimeline(null);
                  }
                }}
                style={{ padding: '8px 16px', background: '#fff', color: '#ff4444', border: '1px solid #ff4444', borderRadius: '6px', cursor: 'pointer' }}
              >
                削除
              </button>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setEditingTimeline(null)} style={{ padding: '8px 16px', border: 'none', background: '#eee', borderRadius: '6px', cursor: 'pointer' }}>キャンセル</button>
                <button 
                  onClick={() => {
                    onUpdateLane(editingTimeline.id, editingTimeline);
                    setEditingTimeline(null);
                  }}
                  style={{ padding: '8px 20px', background: '#000', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingEvent && (
        <EventModal
          event={editingEvent}
          isNew={!events.some((e) => e.id === editingEvent.id)}
          onSave={(d) => {
            onSaveEvent(d);
            setEditingEvent(null);
          }}
          onDelete={(id) => {
            onDeleteEvent(id);
            setEditingEvent(null);
          }}
          onCancel={() => setEditingEvent(null)}
          onClose={() => setEditingEvent(null)}
        />
      )}
      <RestoreEventModal
        restoreLaneId={restoreLaneId}
        setRestoreLaneId={setRestoreLaneId}
        timelines={timelines}
        events={events}
        onRestoreEvent={onRestoreEvent}
      />
    </div>
  );
}