import { useState, useEffect } from 'react';
import { TOP_MARGIN } from '../utils/laneUtils';

export function useDragAndDrop(containerRef, viewState, timelines, onMoveEvent) {
  const [draggingData, setDraggingData] = useState({ eventId: null, sourceLaneId: null });

  const handleDragStart = (eventId, sourceLaneId) => {
    setDraggingData({ eventId, sourceLaneId });
  };

  useEffect(() => {
    if (!draggingData.eventId) return;

    const handleMouseUp = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      // スクロール（パン）を加味したY座標を計算
      const stageY = e.clientY - rect.top - viewState.panY;

      let targetLaneId = 'INBOX';
      if (stageY > TOP_MARGIN) {
        const laneIndex = Math.floor((stageY - TOP_MARGIN) / viewState.laneHeight);
        if (laneIndex >= 0 && laneIndex < timelines.length) {
          targetLaneId = timelines[laneIndex].id;
        }
      }

      onMoveEvent(draggingData.eventId, draggingData.sourceLaneId, targetLaneId);
      setDraggingData({ eventId: null, sourceLaneId: null });
    };

    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [draggingData, containerRef, viewState, timelines, onMoveEvent]);

  return { draggingData, handleDragStart };
}